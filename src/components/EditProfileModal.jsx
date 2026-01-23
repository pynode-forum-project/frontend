import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  updateUserProfile,
  updateProfileImage,
  requestEmailUpdate,
  confirmEmailUpdate
} from "../services/userApi";
import "./EditProfileModal.css";

const EditProfileModal = ({ onClose, onSave }) => {
  const { user, refreshUser } = useContext(AuthContext);

  // Form states
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(
    user?.profileImageURL || ""
  );

  // Email verification states
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateBasicInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const updates = {};

      if (firstName !== user?.firstName) {
        updates.firstName = firstName;
      }
      if (lastName !== user?.lastName) {
        updates.lastName = lastName;
      }

      if (Object.keys(updates).length > 0) {
        await updateUserProfile(updates);
        setSuccess("Profile updated successfully!");
      }

      if (profileImage) {
        await updateProfileImage(profileImage);
        setSuccess("Profile image updated successfully!");
        setProfileImage(null);
      }

      await refreshUser();
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!newEmail || newEmail === user?.email) {
        setError("Please enter a different email address");
        setLoading(false);
        return;
      }

      await requestEmailUpdate(newEmail);
      setSuccess("Verification code sent to your new email address!");
      setShowEmailVerification(true);
    } catch (err) {
      setError(err.message || "Failed to request email update");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!verificationCode) {
        setError("Please enter the verification code");
        setLoading(false);
        return;
      }

      await confirmEmailUpdate(newEmail, verificationCode);
      setSuccess("Email updated successfully! Your account is now unverified.");
      setShowEmailVerification(false);
      setNewEmail("");
      setVerificationCode("");
      await refreshUser();

      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to confirm email update");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEmailUpdate = () => {
    setShowEmailVerification(false);
    setNewEmail("");
    setVerificationCode("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === "basic" ? "active" : ""}`}
            onClick={() => setActiveTab("basic")}
          >
            Basic Info & Image
          </button>
          <button
            className={`tab-btn ${activeTab === "email" ? "active" : ""}`}
            onClick={() => setActiveTab("email")}
          >
            Email & Verification
          </button>
        </div>

        <div className="modal-body">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <form onSubmit={handleUpdateBasicInfo}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength="50"
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength="50"
                />
              </div>

              <div className="form-group">
                <label>Profile Image</label>
                <div className="image-upload-section">
                  <div className="image-preview">
                    <img
                      src={
                        profileImagePreview ||
                        "https://via.placeholder.com/150"
                      }
                      alt="Profile Preview"
                    />
                  </div>
                  <div className="image-upload-input">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      id="profile-image-input"
                      className="file-input"
                    />
                    <label htmlFor="profile-image-input" className="btn btn-secondary">
                      Choose Image
                    </label>
                    {profileImage && (
                      <p className="image-selected">
                        ✓ {profileImage.name} selected
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Email & Verification Tab */}
          {activeTab === "email" && (
            <div>
              {!showEmailVerification ? (
                <form onSubmit={handleRequestEmailChange}>
                  <div className="form-group">
                    <label>Current Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      disabled
                    />
                  </div>

                  <div className="email-update-info">
                    <p className="info-text">
                      To update your email, you'll need to verify the new email
                      with a confirmation code.
                    </p>
                    <p className="warning-text">
                      Your account will become unverified until you confirm the
                      new email address.
                    </p>
                  </div>

                  <div className="form-group">
                    <label>New Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter your new email"
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Verification Code"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmEmailChange}>
                  <div className="verification-section">
                    <p className="verification-text">
                      A verification code has been sent to <strong>{newEmail}</strong>
                    </p>
                  </div>

                  <div className="form-group">
                    <label>Verification Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter the verification code"
                      required
                      maxLength="10"
                    />
                    <small className="form-help">
                      Check your email for the verification code
                    </small>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? "Verifying..." : "Confirm Email Change"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancelEmailUpdate}
                      disabled={loading}
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;