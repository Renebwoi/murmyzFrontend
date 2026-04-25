# Backend API Integration Requirements for Murmyz Hotel Frontend

The frontend has been built with the following authentication and admin panel system. This prompt details exactly what the backend needs to implement to sync with the frontend.

## Environment Setup

Create the following environment variable in your backend:
```
FRONTEND_URL=http://localhost:5173
```

The frontend expects the backend API to be at: `http://localhost:5000/api`

Configure CORS to allow requests from the frontend domain.

---

## Authentication System

### 1. Admin Login Endpoint
**Route:** `POST /api/auth/admin/login`

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "accessCode": "string"
}
```

**Response (Success - 200):**
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": "string (uuid or mongo id)",
    "username": "string",
    "email": "string",
    "role": "admin|worker",
    "accessCode": "string"
  }
}
```

**Response (Error - 401/400):**
```json
{
  "message": "Invalid credentials|Access code incorrect|User not found"
}
```

**Requirements:**
- All three fields (username, password, accessCode) are REQUIRED
- Return JWT token that will be stored in localStorage (key: `murmyz_auth_token`)
- Return user object with role only being "admin" or "worker"
- Use HTTP-only cookies with `credentials: 'include'` support
- Validate accessCode matches the user's assigned code

---

### 2. Token Verification Endpoint
**Route:** `GET /api/auth/admin/verify`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "admin|worker",
    "accessCode": "string"
  }
}
```

**Response (Error - 401):**
```json
{
  "message": "Unauthorized|Token expired"
}
```

**Requirements:**
- Used on app startup to verify stored tokens
- Should validate JWT integrity and expiration
- Clear response for expired tokens (return 401)

---

### 3. Logout Endpoint
**Route:** `POST /api/auth/admin/logout`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
{
  "message": "Logged out successfully"
}
```

**Requirements:**
- Invalidate the JWT token on the backend (blacklist or session management)
- Can be a simple endpoint, frontend also clears localStorage

---

## User Roles & Permissions

### Role Definitions:
- **admin**: Full access to all admin features including accounting
- **worker**: Access to accounting features (can view/manage accounting data)

### Protected Routes:
- `/admin` (dashboard): Requires authentication (both admin and worker)
- `/admin/accounting`: Requires authentication with role: admin OR worker

Route guards will prevent unauthorized access on the frontend, but backend should also enforce these permissions.

---

## User Management (Future Implementation)

The frontend references these user fields:
- `id`: Unique user identifier
- `username`: Login username
- `email`: User email address
- `role`: "admin" or "worker"
- `accessCode`: Special access code (separate from password for security)

Store and validate the `accessCode` separately from the password. This is an additional security layer.

---

## Accounting System (Stub for Future)

The frontend has a placeholder accounting page that expects:

**Future Endpoint Pattern:**
```
GET /api/accounting/transactions
POST /api/accounting/transactions
PUT /api/accounting/transactions/:id
DELETE /api/accounting/transactions/:id
```

Current transaction structure (for reference):
```typescript
{
  id: string,
  date: string,
  description: string,
  type: "income" | "expense",
  amount: number,
  category: string,
  status: "completed" | "pending"
}
```

---

## Error Handling

All endpoints should follow this error response format:
```json
{
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "ISO timestamp"
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad request (validation error)
- `401`: Unauthorized (invalid credentials, expired token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Server error

---

## Security Requirements

1. **JWT Tokens**: Use HS256 or RS256 signing
2. **Token Expiry**: Recommend 24 hours
3. **Password**: Hash using bcrypt (min 10 rounds) or similar
4. **Access Code**: Store securely (hash + salt)
5. **CORS**: Allow frontend origin only
6. **HTTPS**: Use HTTPS in production
7. **Rate Limiting**: Implement on login endpoint to prevent brute force

---

## Frontend Constants to Sync

The frontend uses these constants (from `src/constants/api.ts`):
```typescript
API_BASE_URL: http://localhost:5000/api
AUTH_ENDPOINTS = {
  LOGIN: /api/auth/admin/login,
  LOGOUT: /api/auth/admin/logout,
  VERIFY: /api/auth/admin/verify,
}
```

Update `VITE_API_URL` in `.env` file if your backend URL differs.

---

## Testing the Integration

1. Create test admin user:
   ```json
   {
     "username": "admin",
     "password": "password123",
     "email": "admin@murmyz.com",
     "role": "admin",
     "accessCode": "1234"
   }
   ```

2. Create test worker user:
   ```json
   {
     "username": "worker",
     "password": "password123",
     "email": "worker@murmyz.com",
     "role": "worker",
     "accessCode": "5678"
   }
   ```

3. Test flows:
   - Login with valid credentials → should return token
   - Login with invalid accessCode → should fail
   - Use token to verify → should return user
   - Use expired token → should fail
   - Access admin routes with worker token → should fail

---

## Next Steps

1. Implement the three authentication endpoints exactly as specified above
2. Create admin and worker user records in the database
3. Test the complete login flow
4. Add accounting transaction endpoints when ready

Once the backend is ready, the frontend will automatically sync and work seamlessly!
