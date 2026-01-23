/**
 * Reply API Service
 * Handles all reply-related API calls (fetch, create, delete)
 * Supports mock mode for testing via VITE_MOCK_DATA env var
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Check for mock data mode
const isMockDataEnabled = () => {
  return (
    import.meta.env.VITE_MOCK_DATA === "true" ||
    import.meta.env.VITE_MOCK_DATA === true
  );
};

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const simulateNetworkDelay = (ms = 300) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Fetch replies for a post
 * @param {string} postId - Post ID
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise<Object>} Response with replies and pagination info
 */
export const getRepliesByPost = async (postId, params = {}) => {
  // Mock mode
  if (isMockDataEnabled()) {
    await simulateNetworkDelay(400);
    return {
      success: true,
      data: {
        replies: [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total: 0,
          totalPages: 1,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Real API call
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const queryString = queryParams.toString();
    const url = `${API_BASE}/api/posts/${postId}/replies${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch replies: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching replies:", error);
    throw error;
  }
};

/**
 * Create a reply to a post
 * @param {string} postId - Post ID
 * @param {string} comment - Reply content
 * @param {string[]} attachments - Array of attachment URLs
 * @returns {Promise<Object>} Created reply data
 */
export const createReply = async (postId, comment, attachments = []) => {
  // Mock mode
  if (isMockDataEnabled()) {
    await simulateNetworkDelay(500);
    return {
      success: true,
      data: {
        replyId: `mock-reply-${Date.now()}`,
        postId,
        comment,
        attachments,
        dateCreated: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Real API call
  try {
    const response = await fetch(`${API_BASE}/api/posts/${postId}/replies`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ comment, attachments }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Failed to create reply: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating reply:", error);
    throw error;
  }
};

/**
 * Create a nested reply (sub-reply)
 * @param {string} replyId - Parent reply ID
 * @param {string} comment - Reply content
 * @param {string[]} attachments - Array of attachment URLs
 * @returns {Promise<Object>} Created sub-reply data
 */
export const createSubReply = async (replyId, comment, attachments = []) => {
  // Mock mode
  if (isMockDataEnabled()) {
    await simulateNetworkDelay(500);
    return {
      success: true,
      data: {
        replyId: `mock-subreply-${Date.now()}`,
        parentReplyId: replyId,
        comment,
        attachments,
        dateCreated: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Real API call
  try {
    const response = await fetch(`${API_BASE}/api/replies/${replyId}/sub`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ comment, attachments }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Failed to create sub-reply: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating sub-reply:", error);
    throw error;
  }
};

/**
 * Delete a reply
 * @param {string} replyId - Reply ID to delete
 * @returns {Promise<Object>} Success response
 */
export const deleteReply = async (replyId) => {
  // Mock mode
  if (isMockDataEnabled()) {
    await simulateNetworkDelay(300);
    return {
      success: true,
      message: "Reply deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }

  // Real API call
  try {
    const response = await fetch(`${API_BASE}/api/replies/${replyId}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Failed to delete reply: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting reply:", error);
    throw error;
  }
};

/**
 * Delete a nested reply
 * @param {string} parentReplyId - Parent reply ID
 * @param {Array} targetPath - Path to the nested reply (array of indices)
 * @returns {Promise<Object>} Success response
 */
export const deleteNestedReply = async (parentReplyId, targetPath) => {
  // Mock mode
  if (isMockDataEnabled()) {
    await simulateNetworkDelay(300);
    return {
      success: true,
      message: "Nested reply deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }

  // Real API call
  try {
    const response = await fetch(
      `${API_BASE}/api/replies/${parentReplyId}/nested`,
      {
        method: "DELETE",
        headers: getAuthHeader(),
        body: JSON.stringify({ targetPath }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Failed to delete nested reply: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting nested reply:", error);
    throw error;
  }
};
