# Critical Bugs — Must Fix Before Production

These are bugs that cause incorrect behavior, data loss, or exploitable vulnerabilities right now.

---

## ✅ BUG-01 — Stock is Never Decremented on Order Creation

**File:** `src/orders/orders.service.ts` — `create()` method  
**Severity:** CRITICAL (data corruption, overselling)  
**Status: FIXED** — Stock is now decremented atomically inside a Prisma `$transaction` using `updateMany({ where: { stock: { gte: quantity } } })`. If stock is insufficient the transaction rolls back.

The service checks stock before creating an order but never decrements it. Every order placed against the same product will pass the stock check, and you can sell more units than you have.

```ts
// CURRENT (broken) — stock check only, no decrement
if (product.stock < item.quantity) throw new BadRequestException(...)
// product.stock is never updated after this
```

**Fix:** Decrement stock atomically inside the same Prisma transaction as the order creation.

```ts
await this.prisma.$transaction(async (tx) => {
  // check and decrement stock per item
  for (const item of items) {
    const updated = await tx.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (updated.count === 0) throw new BadRequestException(`${item.productId} is out of stock`);
  }
  // create order inside same transaction
  return tx.order.create({ ... });
});
```

---

## ✅ BUG-02 — Order Number Collision Risk

**File:** `src/orders/orders.service.ts` line 23  
**Severity:** HIGH (silent data corruption under load)  
**Status: FIXED** — Order number now includes a `randomBytes(3)` hex suffix: `FID-<timestamp>-<6 random hex chars>`.

```ts
orderNumber: `FID-${Date.now()}`
```

Two simultaneous orders in the same millisecond will both attempt to insert `FID-<same-timestamp>`, violating the unique constraint and throwing an unhandled DB error.

**Fix:** Use `nanoid` or `crypto.randomUUID()` as a suffix:
```ts
import { randomBytes } from 'crypto';
orderNumber: `FID-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`
```

---

## ✅ BUG-03 — Double `enableCors` Call, First One Is Dangerous

**File:** `src/main.ts` lines 12 and 24  
**Severity:** HIGH (security — accepts requests from any origin)  
**Status: FIXED** — The dangerous `enableCors({ origin: true })` call was removed. Only the correct allow-list config remains.

```ts
app.enableCors({ origin: true, credentials: true }); // line 12 — allows ALL origins
// ...
app.enableCors({                                      // line 24 — this one wins
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});
```

The second call overrides the first, so the behavior is currently correct — but this is a trap. Any developer who removes or reorders the second call silently opens the API to all origins. The first call must be deleted.

---

## ✅ BUG-04 — No Database Transaction for Order Creation

**File:** `src/orders/orders.service.ts`  
**Severity:** HIGH (race condition / partial writes)  
**Status: FIXED** — The entire order creation (stock decrement + order insert) is now wrapped in a single `$transaction`. Fixed together with BUG-01.

If the `order.create` succeeds but `queue.addEmailJob` throws, the order exists in DB but no confirmation email is sent. If the DB write partially fails, you get orphaned records. All multi-step writes must be wrapped in `this.prisma.$transaction(...)`.

---

## ✅ BUG-05 — Payment Processor Job Is Queued But Never Consumed

**File:** `src/payments/payments.service.ts` line 45, `src/queue/queue.module.ts`  
**Severity:** HIGH (silent failure — payment success actions never run)  
**Status: FIXED** — Created `src/queue/payment.processor.ts` with `@Processor('payment')` and registered it in `QueueModule`.

```ts
await this.queue.addPaymentJob('payment-success', { paymentId, orderId });
```

There is a `payment` BullMQ queue registered, but there is **no `@Processor('payment')` worker** anywhere in the codebase. Every `payment-success` job is queued and silently sits there — stock replenishment, status notifications, or any post-payment side effects you add later will never execute.

---

## ✅ BUG-06 — `forgotPassword` Leaks Account Existence (User Enumeration)

**File:** `src/auth/auth.service.ts` line 38  
**Severity:** HIGH (security — OWASP A07)  
**Status: FIXED** — `forgotPassword` now always returns the same generic message regardless of whether the email exists. The OTP flow runs silently only when the user is found.

```ts
if (!user) throw new NotFoundException('No account found with that email address.');
```

An attacker can probe which email addresses have accounts registered. Industry standard is to always return the same success response regardless of whether the account exists.

---

## ✅ BUG-07 — OTP Generated with `Math.random()` (Not Cryptographically Secure)

**File:** `src/auth/auth.service.ts` line 40  
**Severity:** HIGH (security — predictable OTP)  
**Status: FIXED** — OTP now uses `crypto.randomInt(100000, 999999)`.

```ts
const otp = Math.floor(100000 + Math.random() * 900000).toString();
```

`Math.random()` is not a CSPRNG. Attackers with partial timing information can narrow down the OTP value.

---

## ✅ BUG-08 — `resetPassword` (Token Flow) Does a Full Table Scan

**File:** `src/auth/auth.service.ts` lines 59–66  
**Severity:** MEDIUM (performance + timing side-channel)  
**Status: FIXED** — The entire `resetPassword` token flow has been removed. The OTP flow (`resetPasswordOtp`) is the sole reset path. `ResetPasswordDto` and the `POST /auth/reset-password` endpoint are gone.

```ts
const candidates = await this.prisma.user.findMany({
  where: { passwordResetExpires: { gt: new Date() }, passwordResetToken: { not: null } }
});
for (const candidate of candidates) {
  if (await argon2.verify(candidate.passwordResetToken, dto.token)) { ... }
}
```

This loads **all users with active reset tokens** into memory and argon2-verifies each one. Under any load this is O(N) expensive, and it creates a timing oracle (more candidates = more time). 

---

## ✅ BUG-09 — `verify` Payment Endpoint Is Publicly Accessible

**File:** `src/payments/payments.controller.ts` line 10  
**Severity:** MEDIUM (information disclosure)  
**Status: FIXED** — `POST /payments/verify` now requires `JwtAuthGuard`.

```ts
@Post('verify') verify(@Body() dto: VerifyPaymentDto) { return this.payments.verify(dto.transactionId); }
```

No authentication guard. Anyone who knows (or brute-forces) a Flutterwave transaction ID can query its status and retrieve order and payment details.

---

## ✅ BUG-10 — No Logout Endpoint — Refresh Token Cannot Be Invalidated

**File:** `src/auth/` — missing endpoint  
**Severity:** MEDIUM (security — stolen tokens cannot be revoked)  
**Status: FIXED** — `POST /auth/logout` added. It requires `JwtAuthGuard` and clears `refreshTokenHash` in the database.

There is no `POST /auth/logout` that clears `refreshTokenHash`. A stolen refresh token is valid for the full 7-day TTL with no way to revoke it.
