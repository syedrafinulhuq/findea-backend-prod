# Payments Module

**Location:** `backend/src/payments/`

Handles payment processing via Flutterwave V3.

## Files

| File | Purpose |
|---|---|
| `payments.controller.ts` | HTTP route handlers |
| `payments.service.ts` | Flutterwave API calls + webhook handling |
| `payments.module.ts` | Module definition |
| `dto.ts` | Request DTOs |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments/initialize` | Customer | Start checkout for an order |
| POST | `/payments/verify` | Customer | Manually verify a transaction |
| POST | `/payments/flutterwave/webhook` | Public | Flutterwave webhook receiver |

## Flutterwave Integration

### Initialize Payment

Calls Flutterwave `POST /v3/payments` with:
- `tx_ref` — unique transaction reference (stored in `Payment.transactionRef`)
- `amount` — order total
- `currency` — `BDT`
- `customer` — name, email, phone from the order
- `redirect_url` — frontend URL to redirect after payment
- `meta` — orderNumber

Returns `checkoutUrl` — redirect the user to this URL to complete payment.

### Verify Payment

Calls Flutterwave `GET /v3/transactions/:id/verify` with the Flutterwave transaction ID.

Updates `Payment.status` and `Order.status` based on the response.

### Webhook

Flutterwave sends a `POST` to `/payments/flutterwave/webhook` after a payment attempt.

**Signature verification:**
```
Header: verif-hash
Expected: process.env.FLUTTERWAVE_WEBHOOK_HASH
Comparison: timingSafeEqual (prevents timing attacks)
```

On valid `charge.completed` event with `status: successful`:
1. Find `Payment` by `tx_ref`.
2. Verify with Flutterwave API.
3. Update `Payment.status → SUCCESS`.
4. Update `Order.status → PAID`.
5. Queue `payment-success` job.

## DTOs

### InitializePaymentDto
```typescript
{
  orderNumber: string;
}
```

### VerifyPaymentDto
```typescript
{
  transactionId: string;   // Flutterwave transaction ID (numeric string)
}
```

## Payment Record

Stored in the `Payment` table:

| Field | Value |
|---|---|
| `transactionRef` | Internal unique reference (e.g. `findea-ORD-xxx-timestamp`) |
| `flutterwaveTxId` | Flutterwave's numeric transaction ID |
| `checkoutUrl` | Payment page URL returned by Flutterwave |
| `rawResponse` | Full JSON response from Flutterwave (for audit) |
| `status` | `PENDING → SUCCESS / FAILED / CANCELLED` |

## Behavior Notes

- One payment record per order (enforced by unique constraint on `orderId`).
- `rawResponse` stores the complete Flutterwave response for debugging and audit purposes.
- Webhook verification uses `crypto.timingSafeEqual` to prevent timing-based attacks on the hash comparison.
- Both webhook and manual verify can update payment status — the system is idempotent on repeated successful verifications.

## Required Environment Variables

```
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_...
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST_ENCRYPTION_...
FLUTTERWAVE_WEBHOOK_HASH=your-webhook-hash
```

Configure the webhook URL in the Flutterwave dashboard:
```
https://api.findea.com/api/v1/payments/flutterwave/webhook
```
