# Auth API Contract (frontend expectations)

This document describes the auth-related endpoints the frontend expects to call via the Gateway (`/api/auth`). Use this as a reference when coordinating with backend developers.

## Gateway mapping
- Frontend calls are made to the Gateway under `/api/auth` which proxies to the auth service.
- Body parsing is performed by the auth service; Gateway intentionally does not parse request bodies.

---

## POST /api/auth/register
Create a new user.

Request (Content-Type: application/json)
```
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "password": "hunter2"
}
```

Success Response
```
HTTP/1.1 201 Created
Content-Type: application/json
{
  "message": "Registration successful",
  "user_id": "<uuid>"
}
```

Client-side behavior
- Show success message and redirect to login page.

Error Responses (examples)
- Validation error (missing fields / invalid email / short password):
```
HTTP/1.1 400 Bad Request
Content-Type: application/json
{
  "error": "Validation failed",
  "details": {
    "email": "Email is required.",
    "password": "Password must be at least 8 characters."
  }
}
```
- Duplicate email:
```
HTTP/1.1 409 Conflict
Content-Type: application/json
{
  "error": "User with this email already exists"
}
```
- Server error:
```
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
{
  "error": "Internal server error",
  "status_code": 500
}
```

Notes for frontend
- Prefer parsing `details` to map field-level errors to inputs. If no `details` present, show `error` as a global alert.

---

## POST /api/auth/login
Authenticate a user and receive a JWT (or rely on httpOnly cookie set by the server).

Request (Content-Type: application/json)
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "hunter2"
}
```

Success Response (token in JSON)
```
HTTP/1.1 200 OK
Content-Type: application/json
{
  "token": "<JWT>",
  "user": {
    "id": "<uuid>",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com"
  }
}
```

Alternative (recommended secure) response — server sets HttpOnly cookie
```
HTTP/1.1 200 OK
Set-Cookie: token=<JWT>; HttpOnly; Secure; SameSite=Strict
Content-Type: application/json
{ "message": "Logged in" }
```

Error Responses
- Invalid credentials:
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json
{ "error": "Invalid email or password" }
```

Notes for frontend
- If the server returns `token` in JSON, frontend will store it (temporary approach) in `localStorage` (or `sessionStorage`) and set authenticated state.
- If the server sets an HttpOnly cookie, frontend should call requests with `credentials: 'include'` and not attempt to read the token client-side.

---

## Gateway error behavior
- If the Gateway itself cannot reach the auth service, it will return a standardized JSON error, e.g.:
```
HTTP/1.1 503 Service Unavailable
Content-Type: application/json
{
  "success": false,
  "error": {
    "message": "Auth service unavailable",
    "statusCode": 503,
    "timestamp": "2026-01-19T..."
  }
}
```
- Frontend should handle non-2xx statuses gracefully and display the returned `error` or a generic message.

---

## Frontend examples (fetch)
Register:
```js
const res = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ firstName, lastName, email, password }),
  credentials: 'include'
});
const body = await res.json();
if (res.status === 201) { /* success */ }
else { /* handle body.error and body.details */ }
```

Login:
```js
const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), credentials: 'include' });
const body = await res.json();
if (res.ok && body.token) { /* store token or rely on cookie */ }
```

*** End Patch