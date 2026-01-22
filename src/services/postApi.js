// services/postApi.js

const API_BASE_URL = "http://localhost:8080";

// Mock mode - set VITE_MOCK_POSTS=true in .env.local to use mock data
const MOCK = import.meta.env.VITE_MOCK_POSTS === 'true';

// Helper to simulate network latency
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Mock data generator
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

  // Sort based on params (simplified - in real app, backend handles this)
  // For mock, we'll just return in reverse order for 'desc'

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
  // Mock mode
  if (MOCK) {
    await delay(500); // Simulate network delay
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
  // Mock mode
  if (MOCK) {
    await delay(400);
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
