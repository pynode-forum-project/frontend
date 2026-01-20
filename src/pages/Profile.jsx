import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  const { user, loading, isAuthenticated, refreshUser } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      navigate("/users/login");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    } finally {
      setRefreshing(false);
    }
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
              onClick={() => navigate("/users/edit-profile")}
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

      {/* Additional Profile Information Section */}
      <div className="activity-card">
        <div className="activity-card-header">
          <h5>Activity Summary</h5>
        </div>
        <div className="activity-card-body">
          <p>This section can display user activity, posts, comments, etc.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
