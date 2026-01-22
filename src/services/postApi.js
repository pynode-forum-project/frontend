/**
 * Post API Service
 * Handles all post-related API calls (fetch, create, update, delete)
 * Supports mock mode for testing via VITE_MOCK_DATA or VITE_MOCK_POSTS env var
 */

import { mockTopPosts, mockDrafts } from "./mockData";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Check for mock data mode (supports both VITE_MOCK_DATA and VITE_MOCK_POSTS for backward compatibility)
const isMockDataEnabled = () => {
  return (
    import.meta.env.VITE_MOCK_DATA === "true" ||
    import.meta.env.VITE_MOCK_DATA === true ||
    import.meta.env.VITE_MOCK_POSTS === "true" ||
    import.meta.env.VITE_MOCK_POSTS === true
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

// Mock data generator for Post List page (25 posts with pagination)
const generateMockPosts = (page = 1, limit = 10) => {
  const totalPosts = 25; // Total mock posts available
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalPosts);
  const totalPages = Math.ceil(totalPosts / limit);

  const authors = [
    { firstName: "John", lastName: "Doe", profileImageURL: null },
    { firstName: "Jane", lastName: "Smith", profileImageURL: "https://i.pravatar.cc/150?img=1" },
    { firstName: "Bob", lastName: "Wilson", profileImageURL: "https://i.pravatar.cc/150?img=2" },
    { firstName: "Alice", lastName: "Johnson", profileImageURL: null },
    { firstName: "Charlie", lastName: "Brown", profileImageURL: "https://i.pravatar.cc/150?img=3" },
  ];

  const sampleTitles = [
    "How to Get Started with React Hooks",
    "Understanding JavaScript Closures",
    "Best Practices for API Design",
    "Introduction to Microservices Architecture",
    "CSS Grid vs Flexbox: When to Use Which",
    "Building Scalable Web Applications",
    "The Future of Web Development",
    "TypeScript Tips and Tricks",
    "Database Optimization Strategies",
    "Security Best Practices for Web Apps",
  ];

  const sampleContents = [
    "React Hooks revolutionized how we write React components. In this comprehensive guide, we'll explore useState, useEffect, and custom hooks. Learn how to manage state and side effects in functional components.",
    "Closures are one of the most important concepts in JavaScript. They allow functions to access variables from their outer scope even after the outer function has returned. This article explains closures with practical examples.",
    "Designing a good API is crucial for the success of your application. We'll cover RESTful principles, versioning strategies, error handling, and documentation best practices.",
    "Microservices architecture breaks down applications into smaller, independent services. Learn about the benefits, challenges, and when to use this architectural pattern.",
    "Both CSS Grid and Flexbox are powerful layout tools, but they serve different purposes. This guide helps you choose the right tool for your layout needs.",
    "Scalability is essential for modern web applications. Discover techniques for horizontal scaling, caching strategies, and database optimization.",
    "Web development is constantly evolving. Explore the latest trends, frameworks, and technologies shaping the future of web development.",
    "TypeScript adds type safety to JavaScript. Learn advanced TypeScript features, type inference, generics, and how to migrate existing JavaScript projects.",
    "Database performance can make or break your application. We'll discuss indexing strategies, query optimization, and database design principles.",
    "Security should be a top priority in web development. This article covers common vulnerabilities, authentication best practices, and how to protect your applications.",
  ];

  const posts = [];
  for (let i = startIndex; i < endIndex; i++) {
    const author = authors[i % authors.length];
    const daysAgo = totalPosts - i;
    const dateCreated = new Date();
    dateCreated.setDate(dateCreated.getDate() - daysAgo);
    
    const dateModified = Math.random() > 0.7 
      ? new Date(dateCreated.getTime() + Math.random() * 86400000)
      : dateCreated;

    posts.push({
      postId: `mock-post-${i + 1}`,
      userId: `user-${(i % 5) + 1}`,
      title: sampleTitles[i % sampleTitles.length],
      content: sampleContents[i % sampleContents.length],
      images: Math.random() > 0.5 ? [`https://picsum.photos/400/300?random=${i}`] : [],
      attachments: Math.random() > 0.8 ? [`https://example.com/file-${i}.pdf`] : [],
      status: "published",
      isArchived: false,
      dateCreated: dateCreated.toISOString(),
      dateModified: dateModified.toISOString(),
      author: {
        firstName: author.firstName,
        lastName: author.lastName,
        profileImageURL: author.profileImageURL,
      },
    });
  }

  return {
    success: true,
    data: {
      posts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Fetch paginated list of posts (for Post List page)
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
  // Mock mode
  if (isMockDataEnabled()) {
    await simulateNetworkDelay(500);
    const page = params.page || 1;
    const limit = params.limit || 10;
    return generateMockPosts(page, limit);
  }

  // Real API call
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
  const url = `${API_BASE}/api/posts${queryString ? `?${queryString}` : ""}`;

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
 * @returns {Promise<Object>} Post data with replies
 */
export const getPostById = async (postId) => {
  // Mock mode
  if (isMockDataEnabled()) {
    await simulateNetworkDelay(400);
    // Generate a mock post based on postId
    const mockPost = generateMockPosts(1, 1).data.posts[0];
    mockPost.postId = postId;
    return {
      success: true,
      data: {
        ...mockPost,
        replies: [], // Empty replies for now
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Real API call
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
