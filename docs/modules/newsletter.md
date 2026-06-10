# Newsletter Module

**Location:** `backend/src/newsletter/`

Manages email newsletter subscriptions.

## Files

| File | Purpose |
|---|---|
| `newsletter.controller.ts` | HTTP route handlers |
| `newsletter.service.ts` | Business logic |
| `newsletter.module.ts` | Module definition |
| `newsletter.dto.ts` | Request DTOs |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/newsletter/subscribe` | Public | Subscribe an email address |
| POST | `/newsletter/unsubscribe/:token` | Public | Unsubscribe via emailed token |

## DTOs

### SubscribeDto
```typescript
{
  email: string;   // valid email
}
```

## Behavior Notes

- `NewsletterSubscriber.email` is unique — subscribing an already-subscribed email is idempotent (no duplicate row, no error leaking subscription status).
- On subscribe, a unique `unsubscribeToken` is generated and stored, and a `newsletter-welcome` email job is queued (see [Jobs & Queue](./jobs-queue.md)) containing an unsubscribe link with the token.
- `POST /newsletter/unsubscribe/:token` looks up the subscriber by `unsubscribeToken` and deletes the record. An invalid/unknown token returns `404`.
