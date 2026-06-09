# Auth Module

**Location:** `backend/src/auth/`

Handles user registration, login, token refresh, logout, and password reset.

## Files

| File | Purpose |
|---|---|
| `auth.controller.ts` | HTTP route handlers |
| `auth.service.ts` | Business logic |
| `auth.module.ts` | Module definition |
| `dto.ts` | Request DTOs |
| `jwt-auth.guard.ts` | JWT route guard |
| `jwt.strategy.ts` | Passport JWT strategy |

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create customer account |
| POST | `/auth/login` | No | Authenticate user |
| POST | `/auth/refresh` | No | Exchange refresh token |
| POST | `/auth/logout` | Yes | Invalidate refresh token |
| POST | `/auth/forgot-password` | No | Send OTP to email |
| POST | `/auth/reset-password-otp` | No | Reset password with OTP |

## DTOs

### RegisterDto
```typescript
{
  email: string;        // valid email
  password: string;     // min 8 chars
  firstName: string;
  lastName: string;
  phone?: string;       // optional
}
```

### LoginDto
```typescript
{
  email: string;
  password: string;
}
```

### RefreshDto
```typescript
{
  refreshToken: string;
}
```

### ForgotPasswordDto
```typescript
{
  email: string;
}
```

### ResetPasswordOtpDto
```typescript
{
  email: string;
  otp: string;          // 6-digit OTP
  newPassword: string;  // min 8 chars
}
```

## Behavior Notes

- On registration, a welcome email is queued via BullMQ (not sent synchronously).
- `forgot-password` always returns `200` — no indication whether the email exists.
- OTP is a 6-digit number generated with `crypto.randomInt` (CSPRNG), valid for 10 minutes.
- After successful password reset, all existing sessions are invalidated.
- Refresh tokens are Argon2-hashed before storage — raw tokens are never stored.

## Security

See [Authentication](../authentication.md) for the full auth flow, JWT payload structure, and security notes.
