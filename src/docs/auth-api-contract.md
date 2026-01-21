This file consolidates FP-20 notes and the existing auth contract drafts into a single, actionable reference for frontend, gateway, and backend teams.

1) Overview (FP-20 context)
- FP-20 implemented frontend Register/Login UX, validation, styling, an `authApi` wrapper with a `VITE_MOCK_AUTH` mock toggle, and Vitest tests. The frontend consumes backend `details` maps for field errors and focuses the first invalid field.

2) Gateway mapping
- Frontend calls: `/api/auth/*`.
- Suggested proxy mappings:
  - `POST /api/auth/register` -> `POST /auth/register` on auth-service
  - `POST /api/auth/login` -> `POST /auth/login` on auth-service

3) Register — POST /api/auth/register
Purpose: create a new user and (optionally) send verification email.

Request (JSON):

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

Frontend validation (also expected server-side):
- `firstName`: required, trimmed, max ~50 chars (current frontend requires this).
- `lastName`: required, trimmed, max ~50 chars (current frontend requires this).
- `email`: required, valid-looking email.
- `password`: required, minimum 8 characters.
- `confirmPassword`: required and must equal `password`.

Success (recommended):
- HTTP 201 Created
```json
{ "message": "Registration successful. Verification email sent.", "userId": "<uuid>" }
```

Failure examples:
- 400 Bad Request (validation):
```json
{ "message": "Validation failed", "details": { "email": "Email is required." } }
```
- 409 Conflict (duplicate email):
```json
{ "message": "Email already exists", "details": { "email": "This email is already registered" } }
```

4) Login — POST /api/auth/login
Purpose: authenticate a user and establish a session.

Request (JSON):
```json
{ "email": "string", "password": "string" }
```

Success responses (choose one approach and document it):
- Token-in-body (simple): HTTP 200
```json
{ "token": "<jwt>", "user": { "id": "<uuid>", "email": "user@example.com", "firstName": "...", "lastName": "..." } }
```
- HttpOnly cookie (recommended for security): HTTP 200 with `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict` and a small JSON body `{ "message": "Logged in" }`. Client should call subsequent requests with `credentials: 'include'`.

Failure examples:
- 401 Unauthorized
```json
{ "message": "Invalid credentials" }
```
- 403 Forbidden (unverified email)
```json
{ "message": "Email not verified" }
```

5) Other endpoints (optional)
- Verify: `GET /api/auth/verify?token=...` — 200 OK with message/redirect.
- Password reset flow: `POST /api/auth/forgot` and `POST /api/auth/reset` (use `details` for validation errors).

6) Error format (recommended)
Prefer a stable shape so frontend can display inline messages.

- Field-level (preferred for 400/409):
```json
{ "message": "Validation failed", "details": { "email": "Invalid email", "password": "Too short" } }
```

- General error:
```json
{ "message": "Email already in use" }
```

Frontend behavior: when `details` is present, map keys to inputs and focus the first invalid field; otherwise show global message.

Note: to ease backend transitions, the frontend `authApi` wrapper will accept either a `details` object or an `errors` object and normalize it to `details` internally. However, the canonical shape we recommend and prefer is the top-level `message` plus `details` map.

7) Validation rules (summary)
- `email`: required, valid format.
- `password`: required, min 8 chars.
- `confirmPassword`: must match `password`.
- `firstName`/`lastName`: required by current frontend; trim and enforce max length.

8) Transport & CORS
- Responses must be JSON with `Content-Type: application/json`.
- If cookies are used, ensure CORS + credentials settings allow the frontend host. For local dev, use `VITE_MOCK_AUTH=true` to mock.

9) Examples (fetch)
- Register (cookie-aware):
```js
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ firstName, lastName, email, password, confirmPassword }),
  credentials: 'include'
})
```

- Login:
```js
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
  credentials: 'include'
})
```

10) FP-20 frontend notes
- `authApi` returns `{ ok, status, body }` and supports `VITE_MOCK_AUTH` for local dev and CI.
- Tests: `frontend/src/__tests__/Register.test.jsx` and `Login.test.jsx` exercise validation, error mapping, and success behavior.

11) Action items / Questions for backend
1. Confirm gateway proxy paths for auth endpoints (`/api/auth/*`).
2. Decide session approach (token in JSON vs HttpOnly cookie).
3. Confirm error format (`details` object preferred) and field names.
4. Share exact password policy if stronger than min-8 so frontend can match.

If you want, I can produce an OpenAPI fragment or Postman examples next.

***

## 12) Get Current User (GET /api/users/me)

- Description: fetch the currently authenticated user's profile information.
- Authentication: requires valid JWT token in `Authorization: Bearer <token>` header.
- Request: no body required; authentication is via header.

- Success response (200 OK):

```json
{
  "userId": "<uuid>",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "profileImageURL": "string (URL)",
  "type": "string",
  "active": boolean,
  "dateJoined": "string (ISO 8601 date)"
}
```

- Failure responses:
  - 401 Unauthorized: `{ "message": "Invalid or expired token" }`
  - 404 Not Found: `{ "message": "User not found" }`

- Frontend expectations:
  - This endpoint is called automatically after login and when refreshing user data on the Profile page.
  - The frontend expects all fields listed above to be present in the response.
  - If `profileImageURL` is null or empty, frontend will use a placeholder image.
  - The `dateJoined` field should be in ISO 8601 format (e.g., "2024-01-15T10:30:00Z") for proper date parsing.
