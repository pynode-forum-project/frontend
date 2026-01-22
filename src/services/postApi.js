/**
 * Post API Service
 * Handles all post-related API calls (fetch, create, update, delete)
 * Supports mock mode for testing via VITE_MOCK_DATA env var
 */

import { mockTopPosts, mockDrafts } from "./mockData";

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
 * Fetch user's published posts
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Promise<Object>} Posts data with pagination
 */
export const getUserPosts = async (page = 1, limit = 10) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/posts?userId=me&status=published&page=${page}&limit=${limit}&sortBy=dateCreated&sortOrder=desc`,
      {
        method: "GET",
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw error;
  }
};

/**
 * Fetch user's draft posts (unpublished)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Promise<Object>} Drafts data with pagination
 */
export const getUserDrafts = async (page = 1, limit = 10) => {
  try {
    if (isMockDataEnabled()) {
      await simulateNetworkDelay();
      return mockDrafts;
    }

    const response = await fetch(
      `${API_BASE}/api/posts/user/me/drafts?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch drafts: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching drafts:", error);
    throw error;
  }
};

/**
 * Fetch user's top posts sorted by reply count
 * @param {number} limit - Number of top posts (default: 3, max: 10)
 * @returns {Promise<Object>} Top posts data
 */
export const getUserTopPosts = async (limit = 3) => {
  try {
    if (isMockDataEnabled()) {
      await simulateNetworkDelay();
      return mockTopPosts;
    }

    const response = await fetch(
      `${API_BASE}/api/posts/user/me/top?limit=${Math.min(limit, 10)}`,
      {
        method: "GET",
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch top posts: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching top posts:", error);
    throw error;
  }
};

/**
 * Fetch single post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Post data
 */
export const getPostById = async (postId) => {
  try {
    const response = await fetch(`${API_BASE}/api/posts/${postId}`, {
      method: "GET",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching post:", error);
    throw error;
  }
};

// /**
//  * Create a new post
//  * @param {Object} postData - Post data (title, content, publish flag)
//  * @param {File[]} images - Array of image files
//  * @param {File[]} attachments - Array of attachment files
//  * @returns {Promise<Object>} Created post data
//  */
// export const createPost = async (postData, images = [], attachments = []) => {
//   try {
//     const formData = new FormData();
//     formData.append('title', postData.title || '');
//     formData.append('content', postData.content || '');
//     formData.append('publish', postData.publish !== false ? 'true' : 'false');

//     // Add images
//     images.forEach((image) => {
//       formData.append('images', image);
//     });

//     // Add attachments
//     attachments.forEach((attachment) => {
//       formData.append('attachments', attachment);
//     });

//     const response = await fetch(
//       `${API_BASE}/api/posts`,
//       {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: formData
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Failed to create post: ${response.statusText}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error creating post:', error);
//     throw error;
//   }
// };

// /**
//  * Update a post
//  * @param {string} postId - Post ID
//  * @param {Object} postData - Updated post data
//  * @param {File[]} newImages - New image files to add
//  * @param {File[]} newAttachments - New attachment files to add
//  * @param {string[]} removeImages - URLs of images to remove
//  * @param {string[]} removeAttachments - URLs of attachments to remove
//  * @returns {Promise<Object>} Updated post data
//  */
// export const updatePost = async (
//   postId,
//   postData,
//   newImages = [],
//   newAttachments = [],
//   removeImages = [],
//   removeAttachments = []
// ) => {
//   try {
//     const formData = new FormData();

//     if (postData.title !== undefined) formData.append('title', postData.title);
//     if (postData.content !== undefined) formData.append('content', postData.content);

//     // Add new images
//     newImages.forEach((image) => {
//       formData.append('images', image);
//     });

//     // Add new attachments
//     newAttachments.forEach((attachment) => {
//       formData.append('attachments', attachment);
//     });

//     // Add images to remove
//     if (removeImages.length > 0) {
//       formData.append('removeImages', JSON.stringify(removeImages));
//     }

//     // Add attachments to remove
//     if (removeAttachments.length > 0) {
//       formData.append('removeAttachments', JSON.stringify(removeAttachments));
//     }

//     const response = await fetch(
//       `${API_BASE}/api/posts/${postId}`,
//       {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: formData
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Failed to update post: ${response.statusText}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error updating post:', error);
//     throw error;
//   }
// };

// /**
//  * Delete a post
//  * @param {string} postId - Post ID
//  * @returns {Promise<Object>} Success response
//  */
// export const deletePost = async (postId) => {
//   try {
//     const response = await fetch(
//       `${API_BASE}/api/posts/${postId}`,
//       {
//         method: 'DELETE',
//         headers: getAuthHeader()
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Failed to delete post: ${response.statusText}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error deleting post:', error);
//     throw error;
//   }
// };

// /**
//  * Publish a draft post
//  * @param {string} postId - Post ID
//  * @returns {Promise<Object>} Updated post data
//  */
// export const publishPost = async (postId) => {
//   try {
//     const response = await fetch(
//       `${API_BASE}/api/posts/${postId}/publish`,
//       {
//         method: 'PATCH',
//         headers: getAuthHeader()
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Failed to publish post: ${response.statusText}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error publishing post:', error);
//     throw error;
//   }
// };
