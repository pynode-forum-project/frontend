import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUserTopPosts, getUserDrafts } from "../services/postApi";
import { getViewHistory } from "../services/historyApi";
import EditProfileModal from "../components/EditProfileModal";
import "./Profile.css";

const Profile = () => {
  const { user, loading, isAuthenticated, refreshUser } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Top posts state
  const [topPosts, setTopPosts] = useState([]);
  const [topPostsLoading, setTopPostsLoading] = useState(false);
  const [topPostsError, setTopPostsError] = useState(null);

  // Drafts state
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsError, setDraftsError] = useState(null);

  // View history state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      navigate("/users/login");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadUserActivity();
    }
  }, [user, isAuthenticated]);

  const loadUserActivity = async () => {
    await Promise.all([
      fetchTopPosts(),
      fetchDrafts(),
      fetchViewHistory()
    ]);
  };

  const fetchTopPosts = async () => {
    setTopPostsLoading(true);
    setTopPostsError(null);
    try {
      const response = await getUserTopPosts(3);
      setTopPosts(response.data?.posts || []);
    } catch (error) {
      setTopPostsError("Failed to load top posts");
      console.error("Error fetching top posts:", error);
    } finally {
      setTopPostsLoading(false);
    }
  };

  const fetchDrafts = async () => {
    setDraftsLoading(true);
    setDraftsError(null);
    try {
      const response = await getUserDrafts(1, 10);
      setDrafts(response.data?.drafts || []);
    } catch (error) {
      setDraftsError("Failed to load drafts");
      console.error("Error fetching drafts:", error);
    } finally {
      setDraftsLoading(false);
    }
  };

  const fetchViewHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await getViewHistory(1, 10);
      // Sort by lastViewedAt in descending order (most recent first)
      const sortedHistory = (response.data?.history || []).sort(
        (a, b) => new Date(b.lastViewedAt) - new Date(a.lastViewedAt)
      );
      setHistory(sortedHistory);
    } catch (error) {
      setHistoryError("Failed to load view history");
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await loadUserActivity();
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditSaved = async () => {
    setShowEditModal(false);
    await loadUserActivity();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="alert alert-warning">
          Unable to load user data. Please try logging in again.
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-card-header">
          <h3>My Profile</h3>
        </div>
        <div className="profile-card-body">
          <div className="profile-info">
            <div className="profile-avatar">
              <img
                src={user.profileImageURL || "https://via.placeholder.com/150"}
                alt="Profile"
              />
            </div>
            <div className="profile-details">
              <h4>
                {user.firstName} {user.lastName}
              </h4>
              <div className="profile-field">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="profile-field">
                <strong>User ID:</strong> {user.userId}
              </div>
              <div className="profile-field">
                <strong>Account Type:</strong>{" "}
                <span className="badge badge-info">{user.type || "User"}</span>
              </div>
              <div className="profile-field">
                <strong>Status:</strong>{" "}
                <span
                  className={`badge ${
                    user.active ? "badge-success" : "badge-danger"
                  }`}
                >
                  {user.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="profile-field">
                <strong>Member Since:</strong>{" "}
                {new Date(user.dateJoined).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={() => setShowEditModal(true)}
            >
              Edit Profile
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <span className="btn-spinner"></span>
                  Refreshing...
                </>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Posts Section */}
      <div className="activity-card">
        <div className="activity-card-header">
          <h5>Top 3 Posts (by Replies)</h5>
        </div>
        <div className="activity-card-body">
          {topPostsError && (
            <div className="alert alert-danger">{topPostsError}</div>
          )}
          {topPostsLoading ? (
            <div className="loading-section">
              <p>Loading posts...</p>
            </div>
          ) : topPosts.length > 0 ? (
            <div className="posts-list">
              {topPosts.map((post) => (
                <div key={post.postId} className="post-item">
                  <div className="post-title">
                    <h6>{post.title}</h6>
                    <span className="reply-count">{post.replyCount || 0} replies</span>
                  </div>
                  <p className="post-content">
                    {post.content?.substring(0, 100)}
                    {post.content?.length > 100 ? "..." : ""}
                  </p>
                  <small className="post-date">
                    {new Date(post.dateCreated).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No published posts yet</p>
          )}
        </div>
      </div>

      {/* Drafts Section */}
      <div className="activity-card">
        <div className="activity-card-header">
          <h5>My Drafts</h5>
        </div>
        <div className="activity-card-body">
          {draftsError && (
            <div className="alert alert-danger">{draftsError}</div>
          )}
          {draftsLoading ? (
            <div className="loading-section">
              <p>Loading drafts...</p>
            </div>
          ) : drafts.length > 0 ? (
            <div className="drafts-list">
              {drafts.map((draft) => (
                <div key={draft.postId} className="draft-item">
                  <div className="draft-title">
                    <h6>{draft.title || "(Untitled Draft)"}</h6>
                    <span className="draft-badge">Draft</span>
                  </div>
                  <p className="draft-content">
                    {draft.content?.substring(0, 100)}
                    {draft.content?.length > 100 ? "..." : ""}
                  </p>
                  <small className="draft-date">
                    Modified: {new Date(draft.dateModified).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No drafts yet</p>
          )}
        </div>
      </div>

      {/* View History Section */}
      <div className="activity-card">
        <div className="activity-card-header">
          <h5>Recently Viewed Posts</h5>
        </div>
        <div className="activity-card-body">
          {historyError && (
            <div className="alert alert-danger">{historyError}</div>
          )}
          {historyLoading ? (
            <div className="loading-section">
              <p>Loading history...</p>
            </div>
          ) : history.length > 0 ? (
            <div className="history-list">
              {history.map((entry) => (
                <div key={entry.postId} className="history-item">
                  <div className="history-title">
                    <h6>{entry.post?.title || "(Untitled Post)"}</h6>
                  </div>
                  <p className="history-content">
                    {entry.post?.content?.substring(0, 100)}
                    {entry.post?.content?.length > 100 ? "..." : ""}
                  </p>
                  <div className="history-meta">
                    <small>
                      Last viewed: {new Date(entry.lastViewedAt).toLocaleDateString()}
                    </small>
                    <small className="view-count">Viewed {entry.viewCount} time{entry.viewCount > 1 ? 's' : ''}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No view history yet</p>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSaved}
        />
      )}
    </div>
  );
};

export default Profile;