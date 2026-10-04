import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { tableName } from "../config.js";
import { AppError } from "../errors.js";
import { logError } from "../utils/logger.js";

const document = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

function mapDbError(error) {
  logError("dynamodb request failed", error);
  const name = error?.name || "";
  if (
    name === "CredentialsProviderError" ||
    name === "UnrecognizedClientException" ||
    name === "ResourceNotFoundException" ||
    name === "AccessDeniedException"
  ) {
    return new AppError(
      503,
      "DATABASE_UNAVAILABLE",
      "DynamoDB is not reachable with the current credentials and TABLE_NAME. Sentiment was not stored.",
    );
  }
  return new AppError(503, "DATABASE_UNAVAILABLE", "The database request failed. Try again shortly.");
}

async function send(command) {
  try {
    return await document.send(command);
  } catch (error) {
    throw mapDbError(error);
  }
}

function productKey(id) {
  return { PK: `PRODUCT#${id}`, SK: "META" };
}

export async function putCatalogProduct(product) {
  const name = tableName();
  try {
    await document.send(
      new PutCommand({
      TableName: name,
      ConditionExpression: "attribute_not_exists(PK)",
      Item: {
        ...productKey(product.id),
        entity: "PRODUCT",
        gsi1pk: `CATEGORY#${product.category}`,
        gsi1sk: `PRODUCT#${product.name.toLowerCase()}#${product.id}`,
        gsi2pk: "ENTITY#PRODUCT",
        gsi2sk: `PRODUCT#${product.id}`,
        id: product.id,
        name: product.name,
        category: product.category,
        priceCents: product.priceCents,
        summary: product.summary,
        description: product.description,
        specs: product.specs,
        accent: product.accent,
        motif: product.motif,
        stock: product.stock,
        reviewCount: 0,
        ratingSum: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        mixedCount: 0,
        escalatedCount: 0,
      },
    }),
    );
    return "created";
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") return "exists";
    throw mapDbError(error);
  }
}

export async function ensureGlobalStats() {
  try {
    await document.send(
      new PutCommand({
        TableName: tableName(),
        ConditionExpression: "attribute_not_exists(PK)",
        Item: {
          PK: "STATS#GLOBAL",
          SK: "META",
          entity: "STATS",
          totalReviews: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
          mixed: 0,
          escalated: 0,
          totalOrders: 0,
        },
      }),
    );
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") return;
    throw mapDbError(error);
  }
}

export async function queryProducts({ category } = {}) {
  const name = tableName();
  if (category) {
    const result = await send(
      new QueryCommand({
        TableName: name,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :pk AND begins_with(gsi1sk, :sk)",
        ExpressionAttributeValues: {
          ":pk": `CATEGORY#${category}`,
          ":sk": "PRODUCT#",
        },
      }),
    );
    return result.Items || [];
  }
  const result = await send(
    new QueryCommand({
      TableName: name,
      IndexName: "gsi2",
      KeyConditionExpression: "gsi2pk = :pk",
      ExpressionAttributeValues: { ":pk": "ENTITY#PRODUCT" },
    }),
  );
  return result.Items || [];
}

export async function getProductItem(id) {
  const result = await send(
    new GetCommand({
      TableName: tableName(),
      Key: productKey(id),
    }),
  );
  return result.Item || null;
}

export async function queryProductReviews(productId) {
  const result = await send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `PRODUCT#${productId}`,
        ":sk": "REVIEW#",
      },
      ScanIndexForward: false,
    }),
  );
  return result.Items || [];
}

export async function findReview(productId, reviewId) {
  const reviews = await queryProductReviews(productId);
  return reviews.find((item) => item.reviewId === reviewId) || null;
}

export async function queryByUser(userId, prefix) {
  const result = await send(
    new QueryCommand({
      TableName: tableName(),
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :pk AND begins_with(gsi1sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": prefix,
      },
      ScanIndexForward: false,
    }),
  );
  return result.Items || [];
}

export async function getOrderItem(orderId) {
  const result = await send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: `ORDER#${orderId}`, SK: "META" },
    }),
  );
  return result.Item || null;
}

export async function getProfile(userId) {
  const result = await send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
    }),
  );
  return result.Item || null;
}

export async function saveProfile(user) {
  const existing = await getProfile(user.userId);
  const item = {
    PK: `USER#${user.userId}`,
    SK: "PROFILE",
    entity: "USER",
    userId: user.userId,
    email: user.email || existing?.email || "",
    displayName: user.displayName || existing?.displayName || user.email || "Customer",
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  await send(new PutCommand({ TableName: tableName(), Item: item }));
  return item;
}

export async function hasReviewed(userId, productId) {
  const result = await send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: `USER#${userId}`, SK: `REVIEWLOCK#${productId}` },
    }),
  );
  return Boolean(result.Item);
}

export async function userHasPurchased(userId, productId) {
  const orders = await queryByUser(userId, "ORDER#");
  return orders.some((order) => (order.items || []).some((item) => item.productId === productId));
}

export async function createOrderRecord({ orderId, userId, items, shipping, totalCents }) {
  const createdAt = new Date().toISOString();
  const name = tableName();
  const transactItems = [
    {
      Put: {
        TableName: name,
        Item: {
          PK: `ORDER#${orderId}`,
          SK: "META",
          entity: "ORDER",
          gsi1pk: `USER#${userId}`,
          gsi1sk: `ORDER#${createdAt}#${orderId}`,
          orderId,
          userId,
          items,
          shipping,
          totalCents,
          status: "PLACED",
          createdAt,
        },
        ConditionExpression: "attribute_not_exists(PK)",
      },
    },
    {
      Update: {
        TableName: name,
        Key: { PK: "STATS#GLOBAL", SK: "META" },
        UpdateExpression: "ADD totalOrders :one",
        ExpressionAttributeValues: { ":one": 1 },
      },
    },
  ];

  for (const item of items) {
    transactItems.push({
      Update: {
        TableName: name,
        Key: productKey(item.productId),
        UpdateExpression: "ADD stock :delta",
        ConditionExpression: "attribute_exists(PK) AND stock >= :qty",
        ExpressionAttributeValues: {
          ":delta": -item.quantity,
          ":qty": item.quantity,
        },
      },
    });
  }

  try {
    await document.send(new TransactWriteCommand({ TransactItems: transactItems }));
  } catch (error) {
    if (error.name === "TransactionCanceledException") {
      const reasons = error.CancellationReasons || [];
      if (reasons.some((reason) => reason.Code === "ConditionalCheckFailed")) {
        throw new AppError(409, "OUT_OF_STOCK", "One of the products does not have enough stock.");
      }
    }
    throw mapDbError(error);
  }

  return { orderId, userId, items, shipping, totalCents, status: "PLACED", createdAt };
}

export async function createReviewRecord(review) {
  const name = tableName();
  const counts = {
    ":one": 1,
    ":pos": review.sentiment === "POSITIVE" ? 1 : 0,
    ":neg": review.sentiment === "NEGATIVE" ? 1 : 0,
    ":neu": review.sentiment === "NEUTRAL" ? 1 : 0,
    ":mix": review.sentiment === "MIXED" ? 1 : 0,
    ":esc": review.escalationStatus === "ESCALATED" ? 1 : 0,
  };
  const productCounts = { ...counts, ":rating": review.rating };
  try {
    await document.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: name,
              Item: {
                PK: `USER#${review.userId}`,
                SK: `REVIEWLOCK#${review.productId}`,
                entity: "REVIEW_LOCK",
                reviewId: review.reviewId,
              },
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
          {
            Put: {
              TableName: name,
              Item: {
                PK: `PRODUCT#${review.productId}`,
                SK: `REVIEW#${review.createdAt}#${review.reviewId}`,
                entity: "REVIEW",
                gsi1pk: `USER#${review.userId}`,
                gsi1sk: `REVIEW#${review.createdAt}#${review.reviewId}`,
                gsi2pk: "ENTITY#REVIEW",
                gsi2sk: `${review.createdAt}#${review.reviewId}`,
                gsi3pk: `SENTIMENT#${review.sentiment}`,
                gsi3sk: `${review.createdAt}#${review.reviewId}`,
                ...review,
              },
            },
          },
          {
            Update: {
              TableName: name,
              Key: productKey(review.productId),
              UpdateExpression:
                "ADD reviewCount :one, ratingSum :rating, positiveCount :pos, negativeCount :neg, neutralCount :neu, mixedCount :mix, escalatedCount :esc",
              ConditionExpression: "attribute_exists(PK)",
              ExpressionAttributeValues: productCounts,
            },
          },
          {
            Update: {
              TableName: name,
              Key: { PK: "STATS#GLOBAL", SK: "META" },
              UpdateExpression:
                "ADD totalReviews :one, positive :pos, negative :neg, neutral :neu, mixed :mix, escalated :esc",
              ExpressionAttributeValues: counts,
            },
          },
        ],
      }),
    );
  } catch (error) {
    if (error.name === "TransactionCanceledException") {
      const reasons = error.CancellationReasons || [];
      if (reasons[0]?.Code === "ConditionalCheckFailed") {
        throw new AppError(409, "DUPLICATE_REVIEW", "You have already reviewed this product.");
      }
      if (reasons[2]?.Code === "ConditionalCheckFailed") {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "That product is no longer in the catalog.");
      }
    }
    throw mapDbError(error);
  }
}

export async function updateReviewStatus(review, { escalationStatus, priority }) {
  const nextStatus = escalationStatus || review.escalationStatus;
  const nextPriority = priority || review.priority;
  const delta = (nextStatus === "ESCALATED" ? 1 : 0) - (review.escalationStatus === "ESCALATED" ? 1 : 0);
  const now = new Date().toISOString();
  const name = tableName();
  const transactItems = [
    {
      Update: {
        TableName: name,
        Key: { PK: review.PK, SK: review.SK },
        UpdateExpression: "SET escalationStatus = :status, priority = :priority, updatedAt = :now",
        ExpressionAttributeValues: {
          ":status": nextStatus,
          ":priority": nextPriority,
          ":now": now,
        },
      },
    },
  ];
  if (delta !== 0) {
    transactItems.push(
      {
        Update: {
          TableName: name,
          Key: { PK: "STATS#GLOBAL", SK: "META" },
          UpdateExpression: "ADD escalated :delta",
          ExpressionAttributeValues: { ":delta": delta },
        },
      },
      {
        Update: {
          TableName: name,
          Key: productKey(review.productId),
          UpdateExpression: "ADD escalatedCount :delta",
          ExpressionAttributeValues: { ":delta": delta },
        },
      },
    );
  }
  try {
    await document.send(new TransactWriteCommand({ TransactItems: transactItems }));
  } catch (error) {
    throw mapDbError(error);
  }
  return { ...review, escalationStatus: nextStatus, priority: nextPriority, updatedAt: now };
}

export async function queryReviewIndex({ index, pk, filter, limit = 100 }) {
  const name = tableName();
  const pkName = index === "gsi3" ? "gsi3pk" : "gsi2pk";
  const items = [];
  let startKey;
  for (let page = 0; page < 6 && items.length < limit; page += 1) {
    const values = { ":pk": pk };
    let filterExpression;
    if (filter?.escalationStatus) {
      filterExpression = "escalationStatus = :status";
      values[":status"] = filter.escalationStatus;
    }
    const result = await send(
      new QueryCommand({
        TableName: name,
        IndexName: index,
        KeyConditionExpression: `${pkName} = :pk`,
        ExpressionAttributeValues: values,
        FilterExpression: filterExpression,
        ScanIndexForward: false,
        Limit: 80,
        ExclusiveStartKey: startKey,
      }),
    );
    items.push(...(result.Items || []));
    startKey = result.LastEvaluatedKey;
    if (!startKey) break;
  }
  return items.slice(0, limit);
}

export async function getGlobalStats() {
  const result = await send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: "STATS#GLOBAL", SK: "META" },
    }),
  );
  return (
    result.Item || {
      totalReviews: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
      escalated: 0,
      totalOrders: 0,
    }
  );
}
