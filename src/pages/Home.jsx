import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { getPosts } from "../services/postApi";
import "./Home.css";

const Home = () => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("dateCreated");
  const [sortOrder, setSortOrder] = useState("desc");
  const [creatorFilter, setCreatorFilter] = useState("");
  const postsPerPage = 10;

  // Check if user is admin
  const isAdmin = () => {
    return user?.type === "admin" || user?.type === "superadmin";
  };

  // Check if user is verified
  const isVerified = () => {
    return user?.emailVerified !== false && user?.type !== "unverified";
  };

  // Fetch posts
  useEffect(() => {
    if (!isAuthenticated || loading) {
      setIsLoadingPosts(false);
      return;
    }

    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const params = {
          page: currentPage,
          limit: postsPerPage,
          sortBy,
          sortOrder,
          status: "published",
        };
        if (creatorFilter) {
          params.userId = creatorFilter;
        }

        const response = await getPosts(params);
        if (response.success && response.data) {
          setPosts(response.data.posts || []);
          setTotalPages(response.data.pagination?.totalPages || 1);
          setTotal(response.data.pagination?.total || 0);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [isAuthenticated, loading, currentPage, sortBy, sortOrder, creatorFilter]);

  // Reset filters
  const resetFilters = () => {
    setSortBy("dateCreated");
    setSortOrder("desc");
    setCreatorFilter("");
    setCurrentPage(1);
  };

  // Toggle sort order
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="home-container">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to Forum Project</h1>
            <p className="hero-subtitle">
              A modern platform for discussions, knowledge sharing, and community
              building. Connect with others, share your ideas, and engage in
              meaningful conversations.
            </p>
            <div className="cta-buttons">
              <Link to="/users/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/users/login" className="btn btn-secondary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div>
          <h1 className="home-title">
            {isAdmin() ? "Admin Dashboard" : "Forum Posts"}
          </h1>
          <p className="home-subtitle">
            {isAdmin() ? "Manage posts and users" : "Discover and share ideas"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filters & Sort</h3>
        </div>
        <div className="filters-content">
          {/* Sort by Date */}
          <button
            onClick={() => toggleSort("dateCreated")}
            className={`filter-btn ${sortBy === "dateCreated" ? "active" : ""}`}
          >
            Date
            {sortBy === "dateCreated" && (
              <span>{sortOrder === "desc" ? " ↓" : " ↑"}</span>
            )}
          </button>

          {/* Filter by Creator */}
          <div className="creator-filter">
            <input
              type="text"
              placeholder="Creator ID"
              value={creatorFilter}
              onChange={(e) => {
                setCreatorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="creator-input"
            />
            {creatorFilter && (
              <button
                onClick={() => {
                  setCreatorFilter("");
                  setCurrentPage(1);
                }}
                className="clear-filter"
              >
                ×
              </button>
            )}
          </div>

          {/* Reset Button */}
          <button onClick={resetFilters} className="filter-btn reset-btn">
            Reset
          </button>
        </div>
      </div>

      {/* Posts List */}
      {isLoadingPosts ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <h3>No posts yet</h3>
          <p>Be the first to share something!</p>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.postId} className="post-card">
              <div className="post-content">
                <Link
                  to={`/posts/${post.postId}`}
                  className="post-title-link"
                >
                  <h2 className="post-title">{post.title}</h2>
                </Link>
                <div className="post-meta">
                  <span className="post-author">
                    {post.author?.firstName} {post.author?.lastName}
                  </span>
                  <span className="post-date">{formatDate(post.dateCreated)}</span>
                  {post.replyCount !== undefined && (
                    <span className="post-replies">
                      {post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}
                    </span>
                  )}
                  {post.isArchived && (
                    <span className="post-archived">Archived</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoadingPosts && posts.length > 0 && totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <div className="pagination-pages">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`pagination-btn ${
                    currentPage === pageNum ? "active" : ""
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Page Info */}
      {!isLoadingPosts && posts.length > 0 && (
        <div className="page-info">
          Showing {((currentPage - 1) * postsPerPage) + 1} to{" "}
          {Math.min(currentPage * postsPerPage, total)} of {total} posts
        </div>
      )}
    </div>
  );
};

export default Home;