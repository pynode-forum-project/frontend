/**
 * Mock Data for Testing
 * This file provides hardcoded test data for profile features
 */

export const mockUser = {
  userId: "user-123",
  firstName: "John",
  lastName: "Developer",
  email: "john.developer@example.com",
  profileImageURL:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
  type: "Premium",
  active: true,
  dateJoined: "2024-01-15T10:30:00Z",
};

export const mockTopPosts = {
  success: true,
  data: {
    posts: [
      {
        postId: "post-001",
        userId: "user-123",
        title: "Getting Started with React Hooks",
        content:
          "React Hooks have revolutionized the way we write React components. In this post, I'll walk through the basics of useState and useEffect hooks, and how they can make your code cleaner and more maintainable. We'll explore common patterns and best practices for using hooks effectively in your projects.",
        status: "published",
        replyCount: 24,
        dateCreated: "2025-12-15T10:30:00Z",
      },
      {
        postId: "post-002",
        userId: "user-123",
        title: "Best Practices for API Design",
        content:
          "Designing a good REST API is crucial for the success of your application. This post covers naming conventions, HTTP status codes, error handling, pagination, and versioning strategies. I'll share real-world examples and lessons learned from building APIs at scale.",
        status: "published",
        replyCount: 18,
        dateCreated: "2025-11-22T14:15:00Z",
      },
      {
        postId: "post-003",
        userId: "user-123",
        title: "Docker for Beginners: A Complete Guide",
        content:
          "Docker has become an essential tool for modern development. Learn how to containerize your applications, manage images and containers, and deploy them efficiently. This comprehensive guide includes practical examples and troubleshooting tips for common Docker issues.",
        status: "published",
        replyCount: 15,
        dateCreated: "2025-10-08T09:45:00Z",
      },
    ],
    limit: 3,
  },
  timestamp: new Date().toISOString(),
};

export const mockDrafts = {
  success: true,
  data: {
    drafts: [
      {
        postId: "draft-001",
        userId: "user-123",
        title: "Advanced State Management Patterns",
        content:
          "This draft explores different approaches to state management in React applications, comparing Redux, Context API, and newer solutions like Zustand. We'll discuss when to use each approach and their trade-offs.",
        status: "unpublished",
        dateCreated: "2025-12-10T08:20:00Z",
        dateModified: "2025-12-20T16:45:00Z",
      },
      {
        postId: "draft-002",
        userId: "user-123",
        title: "",
        content: "Testing JavaScript applications is critical for maintainability...",
        status: "unpublished",
        dateCreated: "2025-12-05T11:30:00Z",
        dateModified: "2025-12-19T13:22:00Z",
      },
      {
        postId: "draft-003",
        userId: "user-123",
        title: "Web Performance Optimization Tips",
        content:
          "Learn how to measure and improve your website's performance. Topics include lazy loading, code splitting, caching strategies, and using browser DevTools to identify bottlenecks.",
        status: "unpublished",
        dateCreated: "2025-11-28T15:00:00Z",
        dateModified: "2025-12-15T10:15:00Z",
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 3,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  },
  timestamp: new Date().toISOString(),
};

export const mockViewHistory = {
  success: true,
  data: {
    history: [
      {
        userId: "user-123",
        postId: "viewed-001",
        firstViewedAt: "2025-12-10T08:20:00Z",
        lastViewedAt: "2025-12-20T16:45:00Z",
        viewCount: 5,
        post: {
          postId: "viewed-001",
          userId: "user-456",
          title: "Understanding JavaScript Async/Await",
          content:
            "Async/await has made writing asynchronous code much more readable. This post explains how promises work under the hood and how async/await simplifies handling asynchronous operations.",
          dateCreated: "2025-11-15T09:30:00Z",
        },
      },
      {
        userId: "user-123",
        postId: "viewed-002",
        firstViewedAt: "2025-12-08T14:20:00Z",
        lastViewedAt: "2025-12-18T10:30:00Z",
        viewCount: 3,
        post: {
          postId: "viewed-002",
          userId: "user-789",
          title: "CSS Grid Layout: A Deep Dive",
          content:
            "CSS Grid is a powerful layout system that allows you to create complex 2D layouts easily. Learn about grid containers, grid items, and how to use grid for responsive design.",
          dateCreated: "2025-10-20T11:00:00Z",
        },
      },
      {
        userId: "user-123",
        postId: "viewed-003",
        firstViewedAt: "2025-12-05T10:15:00Z",
        lastViewedAt: "2025-12-15T14:20:00Z",
        viewCount: 2,
        post: {
          postId: "viewed-003",
          userId: "user-999",
          title: "Node.js Event Loop Explained",
          content:
            "Understanding the event loop is crucial for writing efficient Node.js applications. This post breaks down how the event loop works, microtasks, and macrotasks.",
          dateCreated: "2025-09-30T15:45:00Z",
        },
      },
      {
        userId: "user-123",
        postId: "viewed-004",
        firstViewedAt: "2025-12-01T09:00:00Z",
        lastViewedAt: "2025-12-12T11:30:00Z",
        viewCount: 1,
        post: {
          postId: "viewed-004",
          userId: "user-555",
          title: "Vue.js 3 Composition API Guide",
          content:
            "Vue 3 introduced the Composition API as a more flexible way to compose component logic. Learn how to use it and when to choose it over the Options API.",
          dateCreated: "2025-08-15T12:00:00Z",
        },
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 4,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  },
  timestamp: new Date().toISOString(),
};