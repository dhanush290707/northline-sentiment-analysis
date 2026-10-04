import { randomUUID } from "node:crypto";
import { AppError } from "../errors.js";
import { toOrder } from "../mappers.js";
import { requireUser } from "../services/auth.js";
import { createOrderRecord, getOrderItem, getProductItem, queryByUser } from "../services/dynamo.js";
import { json, parseBody } from "../utils/response.js";
import { validateOrderItems, validateShipping } from "../utils/validation.js";

export async function createOrder(event, user) {
  const current = requireUser(user);
  const body = parseBody(event);
  const requested = validateOrderItems(body.items);
  const shipping = validateShipping(body.shipping);

  const items = [];
  for (const requestedItem of requested) {
    const product = await getProductItem(requestedItem.productId);
    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", `Product ${requestedItem.productId} is not in the catalog.`);
    }
    items.push({
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      quantity: requestedItem.quantity,
    });
  }
  const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const order = await createOrderRecord({
    orderId: randomUUID(),
    userId: current.userId,
    items,
    shipping,
    totalCents,
  });
  return json(201, {
    order: toOrder(order),
    message: "Order placed. This demo checkout does not capture a card payment.",
  });
}

export async function listOrders(_event, user) {
  const current = requireUser(user);
  const orders = await queryByUser(current.userId, "ORDER#");
  return json(200, { orders: orders.map(toOrder) });
}

export async function getOrder(event, user) {
  const current = requireUser(user);
  const order = await getOrderItem(event.pathParameters.id);
  if (!order || order.userId !== current.userId) {
    throw new AppError(404, "ORDER_NOT_FOUND", "That order is not on your account.");
  }
  return json(200, { order: toOrder(order) });
}
