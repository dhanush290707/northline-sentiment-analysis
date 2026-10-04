# Database

One DynamoDB table, `AppTable` in the template. Billing is on-demand. The application reads the table name from `TABLE_NAME`.

Primary key: `PK` (partition), `SK` (sort).

| Index | Partition | Sort | Query |
| --- | --- | --- | --- |
| Table | `PK` | `SK` | One product. Reviews for one product, newest first. One order. One profile. One review lock. |
| `gsi1` | `gsi1pk` | `gsi1sk` | Products in a category. A customer's orders. A customer's reviews. |
| `gsi2` | `gsi2pk` | `gsi2sk` | The whole catalog (`ENTITY#PRODUCT`). Every review, newest first (`ENTITY#REVIEW`). |
| `gsi3` | `gsi3pk` | `gsi3sk` | Reviews for one sentiment, for example `SENTIMENT#NEGATIVE`. |

All three indexes project every attribute. Items that omit a GSI key stay out of that index.

## Items

Product

- `PK = PRODUCT#{id}`, `SK = META`
- `gsi1pk = CATEGORY#{category}`, `gsi1sk = PRODUCT#{name}#{id}`
- `gsi2pk = ENTITY#PRODUCT`
- Price is integer cents. `reviewCount`, `ratingSum`, and the four sentiment counters live on the product so the desk does not scan.

Review

- `PK = PRODUCT#{productId}`, `SK = REVIEW#{createdAt}#{reviewId}`
- `gsi1pk = USER#{userId}` so the profile can list that person's reviews
- `gsi2pk = ENTITY#REVIEW`
- `gsi3pk = SENTIMENT#{label}`
- Stored fields include the text, rating, language, sentiment, four scores, aspects, `escalationStatus`, and `priority`

Review lock

- `PK = USER#{userId}`, `SK = REVIEWLOCK#{productId}`
- Written in the same transaction as the review so a person reviews a product once

Order

- `PK = ORDER#{orderId}`, `SK = META`
- `gsi1pk = USER#{userId}`, `gsi1sk = ORDER#{createdAt}#{orderId}`
- Line items are embedded. A cart is not stored; it lives in the browser until checkout.

Profile

- `PK = USER#{userId}`, `SK = PROFILE`
- Display name and email. The admin decision is the Cognito group, not this item.

Counters

- `PK = STATS#GLOBAL`, `SK = META`
- `totalReviews`, `positive`, `negative`, `neutral`, `mixed`, `escalated`, `totalOrders`
- Updated with `ADD` in the same transaction as a new review or order

## Escalation listing

The escalated queue filters `ENTITY#REVIEW` on `escalationStatus`. DynamoDB applies that filter after the page read. The API walks a few pages so a small demo is not truncated. This is the wrong shape for a very large review history. A sparse index on escalation status would be the next change. It is not required for this catalog.

## Transactions

Creating a review writes the lock, the review, the product counters, and the global counters together. Creating an order writes the order, decrements stock with a condition, and increments `totalOrders`. Status changes that enter or leave `ESCALATED` adjust the escalated counters in one transaction.

Re-seeding uses `attribute_not_exists`, so a second seed does not wipe review counts or stock.
