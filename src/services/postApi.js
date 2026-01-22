// services/postApi.js

const API_BASE_URL = "http://localhost:8080";

/**
 * Fetch paginated list of posts
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Posts per page (default: 10)
 * @param {string} params.sortBy - Sort field: 'dateCreated' or 'dateModified' (default: 'dateCreated')
 * @param {string} params.sortOrder - Sort order: 'asc' or 'desc' (default: 'desc')
 * @param {string} params.userId - Filter by creator userId (optional)
 * @param {string} params.status - Filter by status (optional)
 * @returns {Promise<Object>} Response with posts and pagination info
 */
export const getPosts = async (params = {}) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  // Build query string
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
  if (params.userId) queryParams.append("userId", params.userId);
  if (params.status) queryParams.append("status", params.status);

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/posts${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to fetch posts: ${response.status}`
    );
  }

  const data = await response.json();
  return data;
};

/**
 * Get a single post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Post data with replies
 */
export const getPostById = async (postId) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to fetch post: ${response.status}`
    );
  }

  const data = await response.json();
  return data;
};
