# Auth API Contract — Frontend ↔ Backend

Purpose: document the authentication-related endpoints, request/response shapes, validation rules, and client-side expectations so frontend and backend stay aligned.

## Base URL

- Frontend expects auth endpoints under: `/api/auth` (example: `/api/auth/register`, `/api/auth/login`). If your gateway prefixes differ, please share the final paths.

## 1) Register (POST /api/auth/register)

- Description: create a new user and send a verification email.
- Request body (JSON):

  {
  "firstName": "string",
  "lastName": "string",
  "email": "string", // frontend validates general valid email addresses
  "password": "string",
  "confirmPassword": "string"
  }

- Frontend validation rules (must be enforced server-side as well):

  - `email`: required, valid email format; frontend validates general valid email addresses and backend SHOULD accept any valid email.
  - `password`: required, minimum 8 characters.
  - `confirmPassword`: required and must exactly match `password`.
  - `firstName` / `lastName`: optional but prefer trimming and max length (e.g. 50 chars).

- Success response (201 Created):

  {
  "message": "Registration successful. Verification email sent.",
  "userId": "<uuid>" // optional
  }

- Failure responses (examples):
  - 400 Bad Request — validation errors
    {
    "message": "Validation failed",
    "details": {
    "email": "Invalid email",
    "password": "Too short",
    "firstName": "Too long"
    }
    }
  - 409 Conflict — email already exists
    { "message": "Email already in use" }

## 2) Login (POST /api/auth/login)

- Description: authenticate a user and return a session token (JWT) or set a cookie.
- Request body (JSON):

  {
  "email": "string",
  "password": "string"
  }

- Frontend expectations:

  - Backend will return a JSON response containing either a `token` (JWT) or user object and the frontend will store token in local storage / context.
  - If using HttpOnly cookies, frontend will rely on cookie presence and not store token manually.

- Success response (200 OK):

  {
  "token": "<jwt-token>",
  "user": {
  "id": "<uuid>",
  "email": "user@example.com",
  "firstName": "...",
  "lastName": "..."
  }
  }

- Failure responses:
  - 401 Unauthorized
    { "message": "Invalid credentials" }
  - 403 Forbidden (unverified email)
    { "message": "Email not verified" }

## 3) Verify email (GET /api/auth/verify?token=...)

- Description: endpoint the user follows from email to verify their account.
- Success: 200 OK with message and redirect instructions.

## 4) Password reset (optional)

- Flow: request reset -> backend sends email with token -> frontend hits reset endpoint with new password.
- Reset request (POST /api/auth/forgot)
  - body: `{ "email": "..." }`
  - response: 200 OK (even if email not found, to avoid user enumeration).
- Reset confirm (POST /api/auth/reset)
  - body: `{ "token": "...", "password": "...", "confirmPassword": "..." }`
  - validation: password min length and confirm match.

## 5) Common validation rules (summary)

- `email`: required, valid email format. Frontend validates general valid email addresses; backend should accept any valid TLD.
- `password`: required, min 8 chars. Consider adding complexity rules (uppercase, number) if backend requires them; keep frontend consistent.
- `confirmPassword`: required and must equal `password` for register and reset.
- Fields should be trimmed of leading/trailing whitespace.

## 6) Error format (recommended)

- For consistency, frontend expects errors in one of these shapes:

  - Field-level errors (400):

    {
    "errors": {
    "email": "Invalid email",
    "password": "Password too short"
    }
    }

  - General error message:

    { "message": "Email already in use" }

Please keep error keys predictable so the frontend can show inline messages.

## 7) Authentication in requests

- Protected endpoints used by frontend should accept an `Authorization: Bearer <token>` header when not relying on cookies.
- If the backend uses HttpOnly cookies, note that frontend fetch calls should include `credentials: 'include'`.

## 8) Frontend behavior and expectations

- On successful registration: frontend shows a success message and navigates to login.
- On registration validation errors: show inline field errors (e.g. under the input) and an alert for general errors.
- On login success: frontend stores `token` in `localStorage` (or relies on cookie) and sets auth context.

## 9) Example requests (fetch)

- Register example:

  fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ firstName, lastName, email, password, confirmPassword })
  })

- Login example:

  fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
  })

## 10) Notes / Questions for backend

- Do auth endpoints live under `/api/auth` or another prefix? Please confirm.
- Does the backend restrict emails to `.com`? If not, frontend will loosen validation to accept any valid email.
- Will backend return JWT `token` in the login response, or use HttpOnly cookies? Which method should frontend implement?
- What shape are validation errors returned in (field map vs array)? Provide an example.

---

If you'd like, I can also:

- add inline error handling examples in `src/pages/Register.jsx` and `src/pages/Login.jsx`, or
- create Postman examples using the agreed shapes.

Please confirm preferences and I'll update the frontend accordingly.

API Endpoint Expected

GET /api/users/me (called via /api/users/me in  
 src/services/userApi.js:8)

Expected User Data Fields

The Profile page (Profile.jsx) expects the following fields
in the user object returned from the user-service:

1. firstName (string) - User's first name (Profile.jsx:65)
2. lastName (string) - User's last name (Profile.jsx:65)
3. email (string) - User's email address (Profile.jsx:68)
4. userId (string/number) - Unique user identifier  
   (Profile.jsx:71)
5. profileImageURL (string, optional) - URL to profile  
   image (Profile.jsx:59)


    - Falls back to placeholder if not provided

6. type (string, optional) - Account type (Profile.jsx:75)


    - Falls back to "User" if not provided

7. active (boolean) - Account status (Profile.jsx:81)
8. dateJoined (string/date) - Account creation date  
   (Profile.jsx:89)


    - Should be a valid date string


Authentication

The request to /api/users/me includes the JWT token from  
 localStorage (sent via the apiRequest function), so the  
 user-service needs to:

- Validate the JWT token
- Extract the user ID from the token
- Return the corresponding user's data  


Additional API (for future use)

There's also a PUT /api/users/profile endpoint defined  
 (userApi.js:24) for updating user profiles, though it's not
currently used by the Profile page.
