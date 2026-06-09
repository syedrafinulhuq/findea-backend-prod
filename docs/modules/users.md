# Users Module

**Location:** `backend/src/users/`

Manages user profiles and shipping addresses.

## Files

| File | Purpose |
|---|---|
| `users.controller.ts` | HTTP route handlers |
| `users.service.ts` | Business logic |
| `users.module.ts` | Module definition |
| `dto.ts` | Request DTOs |

## Endpoints

All endpoints require `Authorization: Bearer <accessToken>`.

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update profile (name, phone) |
| PATCH | `/users/me/password` | Change password |
| POST | `/users/me/addresses` | Add shipping address |
| PATCH | `/users/me/addresses/:id` | Update address |
| DELETE | `/users/me/addresses/:id` | Delete address |
| PATCH | `/users/me/addresses/:id/default` | Set default address |

## DTOs

### UpdateProfileDto
```typescript
{
  firstName?: string;
  lastName?: string;
  phone?: string;
}
```

### ChangePasswordDto
```typescript
{
  currentPassword: string;
  newPassword: string;  // min 8 chars
}
```

### CreateAddressDto
```typescript
{
  label: string;         // e.g. "Home", "Office"
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;      // default: "Bangladesh"
  isDefault?: boolean;
}
```

### UpdateAddressDto

Same fields as `CreateAddressDto`, all optional.

## Behavior Notes

- `GET /users/me` returns the user with all addresses included.
- `PATCH /users/me/password` verifies the current password with Argon2 before updating.
- A user can have multiple addresses. Only one can be `isDefault = true` — setting a new default clears the old one.
- Deleting an address is permanent (no soft delete).
