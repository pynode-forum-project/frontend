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

## 11) Notes / Questions for backend

- Do auth endpoints live under `/api/auth` or another prefix? Please confirm.
- Does the backend restrict emails to `.com`? If not, frontend will loosen validation to accept any valid email.
- Will backend return JWT `token` in the login response, or use HttpOnly cookies? Which method should frontend implement?
- What shape are validation errors returned in (field map vs array)? Provide an example.
- User service endpoint `/api/users/me` must validate JWT token and return user data as specified in section 10.

---

If you'd like, I can also:

- add inline error handling examples in `src/pages/Register.jsx` and `src/pages/Login.jsx`, or
- create Postman examples using the agreed shapes.

Please confirm preferences and I'll update the frontend accordingly.

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
        "dateModified": "2026-01-16T14:20:00Z"
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

- [ ] **Posts Listing Page**

  - [ ] Fetch posts with pagination
  - [ ] Sort by date (asc/desc) dropdown
  - [ ] Filter by creator input
  - [ ] Display: title, creator, date
  - [ ] Pagination controls (next/prev)

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
