import apiRequest from "./api";

/**
 * Fetch current user profile data
 * @returns {Promise<object>} User data
 */
export const getCurrentUser = async () => {
  const response = await apiRequest("/api/users/me");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch user data");
  }

  return response.json();
};

/**
 * Update user profile
 * @param {object} userData - User data to update
 * @returns {Promise<object>} Updated user data
 */
export const updateUserProfile = async (userData) => {
  const response = await apiRequest("/api/users/profile", {
    method: "PUT",
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update profile");
  }

  return response.json();
};
