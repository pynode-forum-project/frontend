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
- Login example:

	fetch('/api/auth/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	})

## 10) Get Current User (GET /api/users/me)

- Description: fetch the currently authenticated user's profile information.
- Authentication: requires valid JWT token in `Authorization: Bearer <token>` header.
- Request: no body required; authentication is via header.

- Success response (200 OK):

	{
		"userId": "<uuid>",
		"firstName": "string",
		"lastName": "string",
		"email": "string",
		"profileImageURL": "string (URL)",  // optional, defaults to placeholder if null
		"type": "string",                   // e.g., "User", "Premium", "Admin"
		"active": boolean,
		"dateJoined": "string (ISO 8601 date)"
	}

- Failure responses:
	- 401 Unauthorized
		{ "message": "Invalid or expired token" }
	- 404 Not Found
		{ "message": "User not found" }

- Frontend expectations:
	- This endpoint is called automatically after login and when refreshing user data on the Profile page.
	- The frontend expects all fields listed above to be present in the response.
	- If `profileImageURL` is null or empty, frontend will use a placeholder image.
	- The `dateJoined` field should be in ISO 8601 format (e.g., "2024-01-15T10:30:00Z") for proper date parsing.

## 12) Update User Profile (PUT /api/users/me)

- Description: update user profile information (firstName, lastName, etc.).
- Authentication: requires valid JWT token in `Authorization: Bearer <token>` header.
- Request (JSON):

```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)"
}
```

- Success response (200 OK):

```json
{
  "userId": "<uuid>",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "profileImageURL": "string",
  "type": "string",
  "active": boolean,
  "dateJoined": "string (ISO 8601)"
}
```

- Failure responses:
  - 400 Bad Request (validation)
    ```json
    { "message": "Validation failed", "details": { "firstName": "First name is required" } }
    ```
  - 401 Unauthorized
    ```json
    { "message": "Invalid or expired token" }
    ```

- Frontend implementation:
  - Located in `src/services/userApi.js`: `updateUserProfile(profileData)`
  - Called from `EditProfileModal.jsx` when user updates basic info
  - Sends only changed fields
  - Refreshes user context after update

---

## 13) Update Profile Image (PUT /api/users/me/profile-image)

- Description: upload and update user's profile image.
- Authentication: requires valid JWT token in `Authorization: Bearer <token>` header.
- Content-Type: `multipart/form-data`
- Request body:
  - `profileImage`: File (image file)

- Success response (200 OK):

```json
{
  "userId": "<uuid>",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "profileImageURL": "string (new image URL)",
  "type": "string",
  "active": boolean,
  "dateJoined": "string (ISO 8601)"
}
```

- Failure responses:
  - 400 Bad Request (invalid file)
    ```json
    { "message": "Invalid image file" }
    ```
  - 401 Unauthorized
    ```json
    { "message": "Invalid or expired token" }
    ```

- Frontend implementation:
  - Located in `src/services/userApi.js`: `updateProfileImage(imageFile)`
  - Called from `EditProfileModal.jsx` Tab 1 (Basic Info & Image)
  - Shows live preview before upload
  - Converts to data URL in mock mode

---

## 14) Request Email Update (POST /api/users/me/email/request-update)

- Description: initiate email change process by sending verification code to new email.
- Authentication: requires valid JWT token in `Authorization: Bearer <token>` header.
- Request (JSON):

```json
{
  "newEmail": "string (new email address)"
}
```

- Success response (200 OK):

```json
{
  "message": "Verification code sent to <newEmail>",
  "success": true
}
```

- Failure responses:
  - 400 Bad Request (validation)
    ```json
    { "message": "Email is already in use" }
    ```
  - 401 Unauthorized
    ```json
    { "message": "Invalid or expired token" }
    ```

- Frontend implementation:
  - Located in `src/services/userApi.js`: `requestEmailUpdate(newEmail)`
  - Called from `EditProfileModal.jsx` Tab 2 (Email & Verification)
  - Shows verification code input step after successful request
  - Sends verification code to user's new email

---

## 15) Confirm Email Update (POST /api/users/me/email/confirm-update)

- Description: complete email change by verifying the confirmation code.
- Authentication: requires valid JWT token in `Authorization: Bearer <token>` header.
- Request (JSON):

```json
{
  "newEmail": "string",
  "verificationCode": "string"
}
```

- Success response (200 OK):

```json
{
  "userId": "<uuid>",
  "firstName": "string",
  "lastName": "string",
  "email": "string (updated email)",
  "profileImageURL": "string",
  "type": "string",
  "active": false,
  "dateJoined": "string (ISO 8601)"
}
```

Note: `active` becomes `false` until user verifies new email via email confirmation link.

- Failure responses:
  - 400 Bad Request (invalid code)
    ```json
    { "message": "Invalid verification code" }
    ```
  - 401 Unauthorized
    ```json
    { "message": "Invalid or expired token" }
    ```

- Frontend implementation:
  - Located in `src/services/userApi.js`: `confirmEmailUpdate(newEmail, verificationCode)`
  - Called from `EditProfileModal.jsx` Tab 2 when user submits verification code
  - Displays warning: "Your account is now unverified"
  - Refreshes user context after update
  - User stays unverified until email is confirmed in backend

---

## 16) Get User Top Posts (GET /api/posts/user/me/top)

- Description: fetch user's top published posts sorted by reply count (descending).
- Authentication: requires valid JWT token in `Authorization: Bearer <token>` header.
- Query parameters:
  - `limit` (integer, optional, default: 3, max: 10) - number of top posts

- Success response (200 OK):

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "postId": "<uuid>",
        "userId": "<uuid>",
        "title": "string",
        "content": "string",
        "status": "published",
        "replyCount": 24,
        "dateCreated": "string (ISO 8601)"
      }
    ],
    "limit": 3
  },
  "timestamp": "string (ISO 8601)"
}
```

- Failure responses:
  - 401 Unauthorized
    ```json
    { "message": "Invalid or expired token" }
    ```

- Frontend implementation:
  - Located in `src/services/postApi.js`: `getUserTopPosts(limit)`
  - Called from `Profile.jsx` on component mount
  - Displays in "Top 3 Posts" section with reply count badges
  - Shows empty state if no posts exist

---

## 17) Get User Drafts (GET /api/posts/user/me/drafts)

- Description: fetch user's unpublished draft posts.
- Authentication: requires valid JWT token in `Authorization: Bearer <token>` header.
- Query parameters:
  - `page` (integer, optional, default: 1)
  - `limit` (integer, optional, default: 10)

- Success response (200 OK):

```json
{
  "success": true,
  "data": {
    "drafts": [
      {
        "postId": "<uuid>",
        "userId": "<uuid>",
        "title": "string (or empty for untitled drafts)",
        "content": "string",
        "status": "unpublished",
        "dateCreated": "string (ISO 8601)",
        "dateModified": "string (ISO 8601)"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "timestamp": "string (ISO 8601)"
}
```

- Failure responses:
  - 401 Unauthorized
    ```json
    { "message": "Invalid or expired token" }
    ```

- Frontend implementation:
  - Located in `src/services/postApi.js`: `getUserDrafts(page, limit)`
  - Called from `Profile.jsx` on component mount
  - Displays in "My Drafts" section with Draft badge
  - Shows modification date and content preview
  - Shows empty state if no drafts exist

---

## 18) Get View History (GET /api/history)

- Description: fetch user's view history of published posts (most recent first).
- Authentication: requires valid JWT token in `Authorization: Bearer <token>` header.
- Query parameters:
  - `page` (integer, optional, default: 1)
  - `limit` (integer, optional, default: 10)

- Success response (200 OK):

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "userId": "<uuid>",
        "postId": "<uuid>",
        "firstViewedAt": "string (ISO 8601)",
        "lastViewedAt": "string (ISO 8601)",
        "viewCount": 5,
        "post": {
          "postId": "<uuid>",
          "userId": "<uuid>",
          "title": "string",
          "content": "string",
          "dateCreated": "string (ISO 8601)"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "string (ISO 8601)"
}
```

Note: History is sorted by `lastViewedAt` (most recent first). Only published posts are included.

- Failure responses:
  - 401 Unauthorized
    ```json
    { "message": "Invalid or expired token" }
    ```

- Frontend implementation:
  - Located in `src/services/historyApi.js`: `getViewHistory(page, limit)`
  - Called from `Profile.jsx` on component mount
  - Displays in "Recently Viewed Posts" section
  - Shows view count and last viewed date
  - Sorted by most recent first
  - Shows empty state if no history exists

---

## 19) Record Post View (POST /api/history)

- Description: record that user has viewed a specific published post.
- Authentication: requires valid JWT token in `Authorization: Bearer <token>` header.
- Request (JSON):

```json
{
  "postId": "<uuid>"
}
```

- Success response (200 OK):

```json
{
  "success": true,
  "data": {
    "userId": "<uuid>",
    "postId": "<uuid>",
    "firstViewedAt": "string (ISO 8601)",
    "lastViewedAt": "string (ISO 8601)",
    "viewCount": 1
  },
  "timestamp": "string (ISO 8601)"
}
```

- Failure responses:
  - 404 Not Found (post doesn't exist)
    ```json
    { "message": "Post not found" }
    ```
  - 403 Forbidden (post not published)
    ```json
    { "message": "Post is not published" }
    ```
  - 401 Unauthorized
    ```json
    { "message": "Invalid or expired token" }
    ```

- Frontend implementation:
  - Located in `src/services/historyApi.js`: `recordPostView(postId)`
  - Called when user views a post detail page
  - Silently fails if post is not published or deleted (non-critical operation)
  - Updates `lastViewedAt` and increments `viewCount` if entry exists

---

## 20) Frontend Implementation Summary (User Profile Features)

### New Files Created:
1. `src/services/postApi.js` - Post API service
2. `src/services/historyApi.js` - History API service
3. `src/services/mockData.js` - Mock data for testing
4. `src/components/EditProfileModal.jsx` - Profile edit modal component
5. `src/components/EditProfileModal.css` - Modal styling

### Updated Files:
1. `src/services/userApi.js` - Added profile update, image upload, email change endpoints
2. `src/pages/Profile.jsx` - Added top posts, drafts, and history sections
3. `src/pages/Profile.css` - Added styles for new profile sections
4. `src/context/AuthContext.jsx` - Enhanced error logging

### Components:
- **Profile Page**: Displays user info, top 3 posts, drafts, and view history
- **EditProfileModal**: Two-tab modal for updating profile and email with verification

### API Calls Flow:
```
Profile.jsx
├── Loads on mount:
│   ├── getUserTopPosts() → GET /api/posts/user/me/top
│   ├── getUserDrafts() → GET /api/posts/user/me/drafts
│   └── getViewHistory() → GET /api/history
│
└── Edit Profile Button → EditProfileModal Opens
    ├── Tab 1 (Basic Info & Image):
    │   ├── updateUserProfile() → PUT /api/users/me
    │   └── updateProfileImage() → PUT /api/users/me/profile-image
    │
    └── Tab 2 (Email & Verification):
        ├── requestEmailUpdate() → POST /api/users/me/email/request-update
        └── confirmEmailUpdate() → POST /api/users/me/email/confirm-update
```

### Error Handling:
- All services provide detailed error messages
- Form shows field-level validation errors where applicable
- Global error messages for API failures
- Loading states during API calls
- Non-critical operations (like recordPostView) fail silently

### Mock Mode Support:
- Enable with `VITE_MOCK_DATA=true` in `.env`
- All services return hardcoded test data when mock mode is enabled
- Simulates 300ms network delay for realistic testing
- No backend required for development/testing

---

## 21) Notes / Questions for backend

**User Profile Endpoints:**
1. Confirm `/api/users/me` PUT endpoint exists and accepts `firstName`, `lastName` updates.
2. Confirm `/api/users/me/profile-image` PUT endpoint exists for profile image uploads.
3. Confirm email update endpoints return proper error messages for duplicate emails.
4. Should `active` flag be set to `false` after email change until new email is verified?

**Post & History Endpoints:**
1. Confirm `/api/posts/user/me/top` endpoint returns posts sorted by `replyCount` (descending).
2. Confirm `/api/posts/user/me/drafts` returns unpublished posts only.
3. Confirm `/api/history` returns entries sorted by `lastViewedAt` (most recent first).
4. Confirm `/api/history` POST creates/updates view entries correctly.

**Data Format:**
1. All timestamps should be ISO 8601 format for proper frontend parsing.
2. Error responses should follow the `{ message, details }` format for field-level errors.
3. Post object should include `replyCount` field for ranking purposes.

---

