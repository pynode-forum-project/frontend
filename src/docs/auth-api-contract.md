This file consolidates FP-20 notes and the existing auth contract drafts into a single, actionable reference for frontend, gateway, and backend teams.

1. Overview (FP-20 context)

- FP-20 implemented frontend Register/Login UX, validation, styling, an `authApi` wrapper with a `VITE_MOCK_AUTH` mock toggle, and Vitest tests. The frontend consumes backend `details` maps for field errors and focuses the first invalid field.

2. Gateway mapping

- Frontend calls: `/api/auth/*`.
- Suggested proxy mappings:
  - `POST /api/auth/register` -> `POST /auth/register` on auth-service
  - `POST /api/auth/login` -> `POST /auth/login` on auth-service

3. Register — POST /api/auth/register
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
{
  "message": "Registration successful. Verification email sent.",
  "userId": "<uuid>"
}
```

Failure examples:

- 400 Bad Request (validation):

```json
{ "message": "Validation failed", "details": { "email": "Email is required." } }
```

- 409 Conflict (duplicate email):

```json
{
  "message": "Email already exists",
  "details": { "email": "This email is already registered" }
}
```

4. Login — POST /api/auth/login
   Purpose: authenticate a user and establish a session.

Request (JSON):

```json
{ "email": "string", "password": "string" }
```

Success responses (choose one approach and document it):

- Token-in-body (simple): HTTP 200

```json
{
  "token": "<jwt>",
  "user": {
    "id": "<uuid>",
    "email": "user@example.com",
    "firstName": "...",
    "lastName": "..."
  }
}
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

5. Other endpoints (optional)

- Verify: `GET /api/auth/verify?token=...` — 200 OK with message/redirect.
- Password reset flow: `POST /api/auth/forgot` and `POST /api/auth/reset` (use `details` for validation errors).

6. Error format (recommended)
   Prefer a stable shape so frontend can display inline messages.

- Field-level (preferred for 400/409):

```json
{
  "message": "Validation failed",
  "details": { "email": "Invalid email", "password": "Too short" }
}
```

- General error:

```json
{ "message": "Email already in use" }
```

Frontend behavior: when `details` is present, map keys to inputs and focus the first invalid field; otherwise show global message.

Note: to ease backend transitions, the frontend `authApi` wrapper will accept either a `details` object or an `errors` object and normalize it to `details` internally. However, the canonical shape we recommend and prefer is the top-level `message` plus `details` map.

7. Validation rules (summary)

- `email`: required, valid format.
- `password`: required, min 8 chars.
- `confirmPassword`: must match `password`.
- `firstName`/`lastName`: required by current frontend; trim and enforce max length.

8. Transport & CORS

- Responses must be JSON with `Content-Type: application/json`.
- If cookies are used, ensure CORS + credentials settings allow the frontend host. For local dev, use `VITE_MOCK_AUTH=true` to mock.

9. Examples (fetch)

- Register (cookie-aware):

```js
fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
  }),
  credentials: "include",
});
```

- Login:

```js
fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
  credentials: "include",
});
```

10. FP-20 frontend notes

- `authApi` returns `{ ok, status, body }` and supports `VITE_MOCK_AUTH` for local dev and CI.
- Tests: `frontend/src/__tests__/Register.test.jsx` and `Login.test.jsx` exercise validation, error mapping, and success behavior.

11. Action items / Questions for backend

1) Confirm gateway proxy paths for auth endpoints (`/api/auth/*`).
2) Decide session approach (token in JSON vs HttpOnly cookie).
3) Confirm error format (`details` object preferred) and field names.
4) Share exact password policy if stronger than min-8 so frontend can match.

If you want, I can produce an OpenAPI fragment or Postman examples next.

---

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
  "profileImageURL": "string (URL)", // optional, defaults to placeholder if null
  "type": "string", // e.g., "User", "Premium", "Admin"
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

# POST-REPLY SERVICE

## 1) List Posts — GET /api/posts

**Purpose:** Fetch paginated list of posts with sorting and filtering

**Authentication:** Required - `Authorization: Bearer <token>`

**Query Parameters:**

```
page (integer, default: 1) - Page number
limit (integer, default: 10) - Posts per page
sortBy (string, default: dateCreated) - dateCreated or dateModified
sortOrder (string, default: desc) - asc or desc
userId (string, optional) - Filter by creator
status (string, optional) - Filter by status
```

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "postId": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "user-123",
        "title": "My First Post",
        "content": "This is the content of my post",
        "images": ["https://s3.example.com/image1.jpg"],
        "attachments": ["https://s3.example.com/file.pdf"],
        "status": "published",
        "isArchived": false,
        "dateCreated": "2026-01-15T10:30:00Z",
        "dateModified": "2026-01-16T14:20:00Z",
        "author": {
          "firstName": "John",
          "lastName": "Doe",
          "profileImageURL": "https://s3.example.com/profile/user-123.jpg"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

**Frontend Requirements:**
- Each post object **MUST** include:
  - `userId` (string) - Post creator's user ID (used for queries, filtering, and linking to author profile)
  - `author` (object) - Author display information containing:
    - `firstName` (string) - Author's first name
    - `lastName` (string) - Author's last name
    - `profileImageURL` (string, nullable) - Author's profile image URL (null if not set)
- **Database Design Note:** The Post collection stores redundant author information (firstName, lastName, profileImageURL) directly in the post document to avoid additional queries. This is a "space for time" optimization strategy. The `author` data should be populated when the post is created/updated, and should be kept in sync when the user updates their profile.
- The frontend will display: **Title**, **Author Name** (firstName + lastName), **Summary** (truncated content), and **Date**
- If `profileImageURL` is null or empty, frontend will use a placeholder image
- The `content` field will be truncated to ~150 characters for the summary display

**Examples:**

```javascript
// Newest posts first (default)
fetch("/api/posts?page=1&limit=10");

// Oldest posts first
fetch("/api/posts?sortOrder=asc&limit=10");

// User's posts
fetch("/api/posts?userId=user-123&sortOrder=asc");

// Recently modified posts
fetch("/api/posts?sortBy=dateModified&sortOrder=desc");
```

---

## 2) Get Single Post — GET /api/posts/:postId

**Purpose:** Fetch single post with replies

**Authentication:** Required

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "postId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "title": "My First Post",
    "content": "This is the content",
    "images": [],
    "attachments": [],
    "status": "published",
    "dateCreated": "2026-01-15T10:30:00Z",
    "dateModified": "2026-01-16T14:20:00Z",
    "author": {
      "firstName": "John",
      "lastName": "Doe",
      "profileImageURL": "https://s3.example.com/profile/user-123.jpg"
    },
    "replies": [
      {
        "replyId": "550e8400-e29b-41d4-a716-446655440001",
        "userId": "user-456",
        "content": "Great post!",
        "dateCreated": "2026-01-15T11:00:00Z"
      }
    ]
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

**Frontend Requirements:**
- The post object **MUST** include:
  - `userId` (string) - Post creator's user ID
  - `author` (object) - Author display information with the same structure as in List Posts (firstName, lastName, profileImageURL)
- This is required for displaying the post author information on the detail page

**Failure Examples:**

```json
// 404 Not Found
{
  "success": false,
  "error": {
    "message": "Post not found",
    "statusCode": 404
  }
}

// 403 Forbidden
{
  "success": false,
  "error": {
    "message": "You do not have permission to view this post",
    "statusCode": 403
  }
}
```

---

## 3) Create Post — POST /api/posts

**Purpose:** Create new post or save as draft

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Fields:**

```
title (string, required if publish=true)
content (string, required if publish=true)
publish (boolean, default: true)
images (file[], optional)
attachments (file[], optional)
```

**Success (201 Created):**

```json
{
  "success": true,
  "data": {
    "postId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "title": "My New Post",
    "content": "Post content",
    "images": ["https://s3.example.com/image1.jpg"],
    "attachments": [],
    "status": "published",
    "dateCreated": "2026-01-21T12:00:00Z",
    "dateModified": "2026-01-21T12:00:00Z"
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

**Example (Published):**

```javascript
const formData = new FormData();
formData.append("title", "My Post Title");
formData.append("content", "Post content here");
formData.append("publish", true);
formData.append("images", imageFile);

fetch("/api/posts", {
  method: "POST",
  headers: { Authorization: "Bearer " + token },
  body: formData,
});
```

**Example (Draft):**

```javascript
const formData = new FormData();
formData.append("title", "Draft Title");
formData.append("content", "Draft content");
formData.append("publish", false);

fetch("/api/posts", {
  method: "POST",
  headers: { Authorization: "Bearer " + token },
  body: formData,
});
```

---

## 4) Update Post — PUT /api/posts/:postId

**Purpose:** Update existing post

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Fields:**

```
title (string, optional)
content (string, optional)
removeImages (string[], optional) - URLs to remove
removeAttachments (string[], optional) - URLs to remove
images (file[], optional) - New files to add
attachments (file[], optional) - New files to add
```

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "postId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "title": "Updated Title",
    "content": "Updated content",
    "images": ["https://s3.example.com/image2.jpg"],
    "attachments": [],
    "status": "published",
    "dateModified": "2026-01-21T12:00:00Z"
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

---

## 5) Delete Post — DELETE /api/posts/:postId

**Purpose:** Delete post (soft delete - sets status to 'deleted')

**Authentication:** Required

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Post deleted successfully",
    "postId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

---

## 6) Get User Drafts — GET /api/posts/user/me/drafts

**Purpose:** Fetch user's unpublished posts (drafts)

**Authentication:** Required

**Query Parameters:**

```
page (integer, default: 1)
limit (integer, default: 10)
```

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "drafts": [
      {
        "postId": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "user-123",
        "title": "Draft Post",
        "content": "Unfinished draft",
        "status": "unpublished",
        "dateCreated": "2026-01-20T10:30:00Z",
        "dateModified": "2026-01-20T14:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

---

## 7) Get Top Posts — GET /api/posts/user/me/top

**Purpose:** Get user's top 3 posts sorted by reply count

**Authentication:** Required

**Query Parameters:**

```
limit (integer, default: 3, max: 10)
```

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "postId": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "user-123",
        "title": "Popular Post",
        "content": "This post has many replies",
        "status": "published",
        "dateCreated": "2026-01-10T10:30:00Z",
        "dateModified": "2026-01-15T14:20:00Z",
        "replyCount": 12
      }
    ],
    "limit": 3
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

---

---

# HISTORY SERVICE

## 1) Record Post View — POST /api/history

**Purpose:** Track when user views a post

**Authentication:** Required

**Request:**

```json
{
  "postId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success (201 Created):**

```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "postId": "550e8400-e29b-41d4-a716-446655440000",
    "firstViewedAt": "2026-01-15T10:30:00Z",
    "lastViewedAt": "2026-01-21T12:00:00Z",
    "viewCount": 5
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

**Failure Examples:**

```json
// 400 Bad Request
{
  "success": false,
  "error": {
    "message": "postId is required",
    "statusCode": 400
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "message": "Post not found or not published",
    "statusCode": 404
  }
}

// 503 Service Unavailable
{
  "success": false,
  "error": {
    "message": "Post service unavailable",
    "statusCode": 503
  }
}
```

**Frontend Usage (Graceful Degradation):**

```javascript
// Call when opening post detail page
async function recordView(postId, token) {
  try {
    const response = await fetch("/api/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ postId }),
    });

    if (!response.ok) {
      console.warn("Failed to record view:", response.status);
      // Don't block post display on history failure
    }
  } catch (error) {
    console.warn("History tracking failed:", error);
    // Continue - history is not critical
  }
}
```

---

## 2) Get View History — GET /api/history

**Purpose:** Fetch user's view history with pagination

**Authentication:** Required

**Query Parameters:**

```
page (integer, default: 1)
limit (integer, default: 10)
```

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "userId": "user-123",
        "postId": "550e8400-e29b-41d4-a716-446655440000",
        "firstViewedAt": "2026-01-10T10:30:00Z",
        "lastViewedAt": "2026-01-21T12:00:00Z",
        "viewCount": 5,
        "post": {
          "postId": "550e8400-e29b-41d4-a716-446655440000",
          "userId": "user-456",
          "title": "Amazing Post Title",
          "content": "Post content preview...",
          "images": ["https://s3.example.com/image.jpg"],
          "status": "published",
          "dateCreated": "2026-01-10T09:00:00Z",
          "dateModified": "2026-01-15T14:20:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 24,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

**Example:**

```javascript
// Get view history
fetch("/api/history?page=1&limit=10", {
  method: "GET",
  headers: { Authorization: "Bearer " + token },
});
```

---

## 3) Delete History Entry — DELETE /api/history/:postId

**Purpose:** Remove specific post from view history

**Authentication:** Required

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "History entry deleted",
    "postId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

---

## 4) Clear All History — DELETE /api/history

**Purpose:** Delete all view history for current user

**Authentication:** Required

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "All history cleared",
    "deletedCount": 24
  },
  "timestamp": "2026-01-21T12:00:00Z"
}
```

**Frontend Usage (With Confirmation):**

```javascript
async function clearAllHistory(token) {
  if (!window.confirm("Clear entire view history? This cannot be undone.")) {
    return;
  }

  const response = await fetch("/api/history", {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });

  if (response.ok) {
    // Refresh history list
    loadHistory();
  }
}
```

---

# FRONTEND INTEGRATION CHECKLIST

## Pages to Build

- [x] **Posts Listing Page**

  - [x] Fetch posts with pagination (GET /api/posts)
  - [ ] Sort by date (asc/desc) dropdown
  - [ ] Filter by creator input
  - [x] Display: title, author (firstName + lastName), summary (truncated content), date
  - [ ] Pagination controls (next/prev) or "Load More" button
  - [x] Card layout design (Title, Author, Summary)

- [ ] **Post Detail Page**

  - [ ] Fetch single post by ID
  - [ ] Display full post with images/attachments
  - [ ] Show replies/comments section
  - [ ] Call `recordPostView()` when page loads
  - [ ] Edit/delete buttons (if owner)

- [ ] **Create Post Page**

  - [ ] Title and content input
  - [ ] Image upload
  - [ ] File/attachment upload
  - [ ] Publish vs Save Draft toggle
  - [ ] Success notification and redirect

- [ ] **User Profile Page**
  - [ ] Fetch and display user info (GET /users/me)
  - [ ] Top 3 posts section (GET /posts/user/me/top)
  - [ ] Drafts section with pagination (GET /posts/user/me/drafts)
  - [ ] View history section with pagination (GET /history)
  - [ ] Edit profile button
  - [ ] Delete draft button
  - [ ] Delete history entry button
  - [ ] Clear all history button (with confirmation)

## Features to Implement

- [ ] JWT token storage in localStorage
- [ ] Authorization header on all requests
- [ ] Error message display
- [ ] Loading spinners
- [ ] Pagination controls
- [ ] Form validation
- [ ] File upload handling
- [ ] Graceful degradation if history service fails

---

# BACKEND IMPLEMENTATION NOTES

## Post Service Database Schema Update Required

To support the frontend Post List page requirements, the Post Service (`post-reply-service`) **MUST** update the Post model to include redundant author information directly in the post document.

### Database Design Philosophy

**Space for Time Optimization:** The Post collection stores redundant user information (firstName, lastName, profileImageURL) to avoid additional queries to the User Service. This improves query performance at the cost of storage space.

### Required Post Model Schema Update

The Post model (`post-reply-service/src/models/Post.js`) **MUST** be updated to include:

```javascript
const postSchema = new mongoose.Schema({
  postId: String,
  userId: String,  // Author's user ID (for queries and linking)
  
  // Redundant author information (stored for performance)
  authorFirstName: String,      // Author's first name at time of post creation/update
  authorLastName: String,        // Author's last name at time of post creation/update
  authorProfileImageURL: String, // Author's profile image URL at time of post creation/update
  
  title: String,
  content: String,
  images: [String],
  attachments: [String],
  status: String,
  dateCreated: Date,
  dateModified: Date,
  // ... other fields
});
```

### API Response Transformation

When returning posts via `GET /api/posts` and `GET /api/posts/:postId`, transform the flat fields into an `author` object:

```javascript
// In post-reply-service controllers
const posts = await Post.find(statusFilter).sort(sortObj).skip(skip).limit(limit);

// Transform to include author object
const transformedPosts = posts.map(post => ({
  postId: post.postId,
  userId: post.userId,
  title: post.title,
  content: post.content,
  // ... other fields
  author: {
    firstName: post.authorFirstName,
    lastName: post.authorLastName,
    profileImageURL: post.authorProfileImageURL
  }
}));
```

### Data Synchronization Strategy

When a user updates their profile (firstName, lastName, profileImageURL), the system should:

1. **Option 1: Update all posts (Recommended for small datasets)**
   - Update all posts created by that user
   - Ensures data consistency
   - May be slow for users with many posts

2. **Option 2: Lazy update (Recommended for large datasets)**
   - Update posts only when they are accessed
   - Store a `authorDataVersion` or `authorUpdatedAt` timestamp
   - Compare with user's `profileUpdatedAt` to determine if update is needed

3. **Option 3: Accept eventual consistency**
   - Don't update existing posts
   - Only new posts will have updated author information
   - Acceptable if showing historical author information is desired

### Implementation Checklist

- [ ] Update Post model schema to include `authorFirstName`, `authorLastName`, `authorProfileImageURL`
- [ ] Update `createPost` controller to populate author fields from JWT token or User Service
- [ ] Update `updatePost` controller to refresh author fields if needed
- [ ] Update `listPosts` controller to transform flat fields into `author` object
- [ ] Update `getPostById` controller to transform flat fields into `author` object
- [ ] Implement data synchronization strategy when user updates profile
- [ ] Add database migration script for existing posts (if any)

---
