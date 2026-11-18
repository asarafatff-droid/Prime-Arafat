# AS World Security Specification

## 1. Data Invariants

1. **Zero Self-Assigned Admin Privileges**: An ordinary customer in `/users/{userId}` can never grant themselves admin rights. Admin authorization is derived exclusively from `/admins/{uid}` or verified bootstrapped owner email.
2. **PII Isolation**: Customer profiles (`/users/{userId}`) and orders (`/orders/{orderId}`) contain PII (emails, phone numbers, delivery addresses). Only the owning user or an authorized admin can read/list them.
3. **Catalog Integrity**: Only authorized admins can create, edit, or delete products, categories, subcategories, banners, flash sales, discounts, and site settings. Customers can only decrement product stock atomically during checkout (`stock >= 0`) and update product rating aggregates alongside a verified purchase review.
4. **Order Integrity**: Orders must have `userId == request.auth.uid`, initial `status == 'Pending'`, server timestamps (`createdAt == request.time`, `updatedAt == request.time`), and positive totals. Customers can only cancel a `'Pending'` order; all other status transitions require an admin.
5. **Verified Purchase Reviews**: A customer can submit a review only if they own the referenced `orderId` AND `productId` is inside that order's `productIds`.
6. **Subcollection Master Gates**: `/users/{userId}/cart/{itemId}`, `/users/{userId}/wishlist/{productId}`, and `/orders/{orderId}/items/{itemId}` strictly enforce ownership via parent document checks or path UID matching.
7. **Strict Key & Size Boundaries**: Every write validates required/allowed keys (`hasAll` + `hasOnly`), string `.size()` limits, valid ID regex `^[a-zA-Z0-9_\\-]+$`, and bounded array lengths.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)

1. **Self-Promotion**: Customer writes `{ uid, email, name, role: "super_admin", active: true }` to `/admins/{theirUid}`.
2. **PII Cross-Read**: Customer A calls `get` or `list` on `/users/{customerB}` or `/orders/{orderBelongingToB}`.
3. **Shadow Ghost Field on Profile**: Customer A creates/updates `/users/{theirUid}` with an extra field `{ isAdmin: true }`.
4. **Fake Order Owner**: Customer A creates `/orders/order_1` with `userId: "customerB_uid"`.
5. **Order Status Shortcut**: Customer A creates an order with `status: "Delivered"` instead of `"Pending"`.
6. **Post-Confirmation Cancellation Tamper**: Customer A updates a `"Shipped"` order to `"Cancelled"` or `"Delivered"`.
7. **Client Timestamp Spoofing**: Customer creates an order with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`.
8. **Unverified Review Forgery**: Customer A posts a review for `product_1` referencing `order_99` that belongs to Customer B (or does not include `product_1`).
9. **Unauthorized Product Price Tampering**: Customer A updates `price: 0` on `/products/prod_1`.
10. **Stock Inflation Attack**: Customer A updates `stock: 99999` on `/products/prod_1` instead of decrementing.
11. **Oversized ID Poisoning**: Attacker writes to `/users/` or `/orders/` with a 1,500-character document ID containing invalid characters (`../admin`).
12. **Email Spoofing Admin Bypass**: User authenticates with `email: "primearafat456@gmail.com"` where `email_verified: false` and attempts admin writes.
