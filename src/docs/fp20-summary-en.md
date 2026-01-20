# FP-20: Frontend Changes and Backend Alignment Notes

## Overview
This FP-20 work implements frontend user authentication (Register / Login) UX, validation, styling, API wiring, and automated tests. The goal is for the frontend to be usable and testable locally/CI even when backend endpoints are not yet fully implemented, and to make contract mismatches visible early.

## Completed (Frontend)
- Validation:
  - Loosened email regex to accept common valid emails (reduce false negatives).
  - Increased password minimum length to 8 characters.
  - Basic client-side validation retained for improved UX.
- Field-level error display:
  - Frontend consumes backend `details` map (field -> message) and shows errors under corresponding inputs. Focus is moved to the first invalid field.
- UI / Styling:
  - Authentication pages converted to a centered card layout (`.auth-wrapper` / `.auth-card`).
  - Inline styles replaced with `frontend/src/styles/auth.css` and consolidated into `frontend/src/index.css`.
  - Fixed CSS loading on direct route navigation by importing styles at app entry (`main.jsx`).
- Robustness tweaks:
  - Added default `import React` for components to work under Vitest/jsdom.
  - Added `id` / `htmlFor` pairs on form controls to make them testable with Testing Library.
- API layer (frontend):
  - Added `frontend/src/services/authApi.js`:
    - Uniform return shape `{ ok, status, body }`.
    - Supports `VITE_MOCK_AUTH` env toggle to enable mock responses for local development and tests.
    - Mock responses include `details` structure and appropriate HTTP statuses (e.g., 409 for duplicate email).
- Automated tests:
  - Added Vitest + Testing Library config: `frontend/vitest.config.js` and `frontend/src/setupTests.js`.
  - Implemented tests:
    - `frontend/src/__tests__/Register.test.jsx` — checks field errors and success flow.
    - `frontend/src/__tests__/Login.test.jsx` — checks field errors and successful login triggers `AuthContext.login`.

## Where to look in the codebase
- Pages/components: `frontend/src/pages/Register.jsx`, `frontend/src/pages/Login.jsx`
- Styles: `frontend/src/styles/auth.css`, `frontend/src/index.css`
- API wrapper: `frontend/src/services/authApi.js`
- Tests: `frontend/src/__tests__/Register.test.jsx`, `frontend/src/__tests__/Login.test.jsx`

## Backend alignment (critical)
To ensure smooth integration, the backend (and Gateway) must align with the following contract expectations:

1) Routes and Gateway forwarding
  - Gateway should proxy frontend calls under `/api/auth/*` to the auth service.
  - Suggested mappings:
    - `POST /api/auth/register` -> `POST /auth/register` on auth-service
    - `POST /api/auth/login`    -> `POST /auth/login` on auth-service

2) Success responses
  - Login success: HTTP 200 with a JWT and optional user object, e.g.: 

```json
{ "token": "<jwt>", "user": { "id": 123, "email": "user@example.com" } }
```

  - Register success: HTTP 201 (or 200) and ideally return the token or a clear next-step response.

3) Error response format (required by frontend)
  - Field-level validation errors must include a `details` object mapping field names to messages, e.g.:

```json
{
  "message": "Validation failed",
  "details": { "email": "Email is already taken", "password": "Password must be at least 8 characters" }
}
```

  - Recommended HTTP status codes:
    - 400 — validation / bad request
    - 401 — authentication failed
    - 409 — conflict (e.g., email already exists)
    - 500 — server error

4) Field names and validation rules
  - Use consistent field names (`email`, `password`, `displayName` or `name`) matching frontend expectations.
  - Password minimum length: 8. If the backend enforces different strength rules, please share them so frontend validation can match exactly.
  - Email validation: frontend uses a permissive check; backend should accept valid RFC-like emails and provide detailed `details.email` messages when rejecting.

5) Error handling and frontend behavior
  - For 409 or 400 with `details`, frontend displays messages under the mapped inputs and focuses the first invalid field.
  - For 401, backend should return a short `message`; frontend will show a global error (not field-level).

6) CORS and Gateway concerns
  - Ensure Gateway/Backend permit requests from development hosts, or use `VITE_MOCK_AUTH=true` for local development until Gateway is configured.
  - Responses must include `Content-Type: application/json`.

## Example requests and responses (reference)
- Register request:

```http
POST /api/auth/register
Content-Type: application/json

{ "email": "user@example.com", "password": "securepassword", "displayName": "User" }
```

- Register conflict (duplicate email):

HTTP 409
```json
{ "message": "Email already exists", "details": { "email": "This email is already registered" } }
```

- Login failure:

HTTP 401
```json
{ "message": "Invalid credentials" }
```

- Login success:

HTTP 200
```json
{ "token": "<jwt>", "user": { "id": 1, "email": "user@example.com" } }
```

## Testing and local development toggles
- Mock mode: set `VITE_MOCK_AUTH=true` in `frontend/.env` or `frontend/.env.local` to let the frontend use mocked auth responses during development and CI.
- Run frontend tests (inside `frontend`):

```bash
npm run test
```

## Recommended next steps (priority)
1. Implement `POST /auth/login` on the backend (if missing) and ensure it returns a JWT. — High priority.
2. Standardize error responses to include `details` for field-level errors and use the recommended status codes. — High priority.
3. Confirm Gateway mapping for `/api/auth/*` and CORS policy. — Medium priority.
4. Agree on field names and exact password policy to avoid repeated churn. — Medium priority.
5. (Optional) Provide an OpenAPI snippet or contract file to allow automated contract testing in CI. — Medium-low priority.

## References
- Frontend files to inspect: `frontend/src/pages/Register.jsx`, `frontend/src/pages/Login.jsx`, `frontend/src/services/authApi.js`, `frontend/src/__tests__/Register.test.jsx`, `frontend/src/__tests__/Login.test.jsx`.

---
I can now:
- Convert the API examples above into an OpenAPI fragment (YAML/JSON) so backend can implement against it; or
- Create backend alignment issues/PR templates with the exact payload examples and expected statuses.

Which would you prefer me to do next?