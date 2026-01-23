import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPosts } from "../services/postApi";
import "./PostList.css";

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Fetch posts
  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPosts({
        page,
        limit: 10,
        sortBy: "dateCreated",
        sortOrder: "desc",
      });

      if (response.success && response.data) {
        setPosts(response.data.posts || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load posts");
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  // Handle pagination
  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      fetchPosts(pagination.page + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      fetchPosts(pagination.page - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Truncate content for summary
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get author display name
  const getAuthorName = (author) => {
    if (!author) return "Unknown";
    const firstName = author.firstName || "";
    const lastName = author.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Unknown";
  };

  // Get profile image or placeholder
  const getProfileImage = (author) => {
    if (author?.profileImageURL) {
      return author.profileImageURL;
    }
    // Placeholder image - you can replace this with a default avatar
    return "https://via.placeholder.com/40?text=User";
  };

  if (loading && posts.length === 0) {
    return (
      <div className="post-list-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="post-list-container">
        <div className="error-container">
          <h3>Error Loading Posts</h3>
          <p>{error}</p>
          <button onClick={() => fetchPosts(1)} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-list-container">
      <div className="post-list-header">
        <h1>All Posts</h1>
        <p className="post-count">
          {pagination.total > 0
            ? `Showing ${posts.length} of ${pagination.total} posts`
            : "No posts found"}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>No posts available yet.</p>
        </div>
      ) : (
        <>
          <div className="posts-grid">
            {posts.map((post) => (
              <Link
                key={post.postId}
                to={`/posts/${post.postId}`}
                className="post-card"
              >
                <div className="post-card-header">
                  <div className="post-author">
                    <img
                      src={getProfileImage(post.author)}
                      alt={getAuthorName(post.author)}
                      className="author-avatar"
                    />
                    <div className="author-info">
                      <span className="author-name">
                        {getAuthorName(post.author)}
                      </span>
                      <span className="post-date">
                        {formatDate(post.dateCreated)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="post-card-body">
                  <h2 className="post-title">{post.title || "Untitled"}</h2>
                  <p className="post-summary">
                    {truncateContent(post.content)}
                  </p>
                </div>
                {post.images && post.images.length > 0 && (
                  <div className="post-card-footer">
                    <span className="post-images-count">
                      📷 {post.images.length} image
                      {post.images.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={handlePrevPage}
                disabled={!pagination.hasPrevPage}
                className="btn-pagination"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasNextPage}
                className="btn-pagination"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostList;
