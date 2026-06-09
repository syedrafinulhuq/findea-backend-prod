# Authentication & Authorization

## Overview

Findea uses JWT (JSON Web Tokens) with a dual-token strategy:

- **Access token** — Short-lived (15 min), used to authenticate API requests via `Authorization: Bearer <token>` header.
- **Refresh token** — Long-lived (7 days), stored hashed in the database. Used to obtain a new access token without re-login.

Passwords are hashed with **Argon2** (not bcrypt).

---

## Roles

| Role | Description |
|---|---|
| `CUSTOMER` | Default role on registration. Can manage own orders, cart, wishlist, profile. |
| `ADMIN` | Full access to product CRUD, order management, admin stats, coupon management. |

---

## JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "CUSTOMER"
}
```

---

## Authentication Flow

### Registration

```
POST /api/v1/auth/register
Body: { email, password, firstName, lastName, phone? }

→ Hash password with Argon2
→ Create User record (role: CUSTOMER)
→ Queue welcome email
→ Return { accessToken, refreshToken, user }
```

### Login

```
POST /api/v1/auth/login
Body: { email, password }

→ Find user by email
→ Verify password with Argon2
→ Generate access + refresh tokens
→ Hash and store refreshToken in User.refreshTokenHash
→ Return { accessToken, refreshToken, user }
```

### Token Refresh

```
POST /api/v1/auth/refresh
Body: { refreshToken }

→ Decode token to extract userId
→ Load user and compare refreshToken against stored hash
→ If valid, generate new access + refresh tokens
→ Update User.refreshTokenHash
→ Return { accessToken, refreshToken }
```

### Logout

```
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>

→ Clear User.refreshTokenHash
→ Return 200
```

### Password Reset (OTP Flow)

```
Step 1: POST /api/v1/auth/forgot-password
Body: { email }
→ Generate 6-digit OTP using crypto.randomInt (CSPRNG)
→ Store hashed OTP + 10-min expiry in User
→ Queue password-reset-otp email
→ Return 200 (always, to prevent user enumeration)

Step 2: POST /api/v1/auth/reset-password-otp
Body: { email, otp, newPassword }
→ Find user, verify OTP hash and expiry
→ Hash new password with Argon2
→ Clear OTP fields, clear refreshTokenHash (invalidate all sessions)
→ Return 200
```

---

## Guards

### `JwtAuthGuard`

Applied to all protected routes. Validates the `Authorization: Bearer` header.

```typescript
@UseGuards(JwtAuthGuard)
```

### `RolesGuard`

Applied alongside `JwtAuthGuard` on admin-only routes. Reads the `@Roles()` decorator.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
```

---

## Decorators

### `@CurrentUser()`

Injects the JWT payload into a route handler parameter:

```typescript
@Get('me')
getMe(@CurrentUser() user: JwtUser) {
  return this.usersService.findMe(user.sub);
}
```

### `@Roles(...roles)`

Marks a route as requiring specific roles:

```typescript
@Roles(Role.ADMIN)
```

---

## Rate Limiting

Auth endpoints have stricter limits:

| Endpoint | Limit |
|---|---|
| POST /auth/register | 5 requests / minute |
| POST /auth/login | 5 requests / minute |
| POST /auth/forgot-password | 3 requests / minute |
| All other endpoints | 100 requests / minute |

---

## Security Notes

- Refresh tokens are stored **hashed** (Argon2) in the database — raw tokens are never persisted.
- OTP generation uses `crypto.randomInt` (cryptographically secure), not `Math.random`.
- Password reset does **not** use URL tokens — OTP is entered directly on the client side.
- All password reset operations invalidate existing sessions by clearing `refreshTokenHash`.
- The `forgot-password` endpoint always returns 200 to prevent email enumeration.
