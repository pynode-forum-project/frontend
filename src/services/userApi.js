// services/userApi.js

import { mockUser } from "./mockData";

const API_BASE_URL = "http://localhost:8080";

// Check for mock data mode - read dynamically to catch changes
const isMockDataEnabled = () => {
  return import.meta.env.VITE_MOCK_DATA === "true" || import.meta.env.VITE_MOCK_DATA === true;
};

const simulateNetworkDelay = (ms = 300) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Fetch the current authenticated user's profile
 * Requires JWT token in localStorage
 * Supports mock mode via VITE_MOCK_DATA env var
 */
export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (isMockDataEnabled()) {
    await simulateNetworkDelay();
    return mockUser;
  }

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user data: ${response.status}`);
  }

  return response.json();
};

/**
 * Update user profile information
 * @param {Object} profileData - Object containing firstName, lastName, or other fields
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (profileData) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (isMockDataEnabled()) {
    await simulateNetworkDelay();
    const updatedUser = { ...mockUser, ...profileData };
    return updatedUser;
  }

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to update profile: ${response.status}`);
  }

  return response.json();
};

/**
 * Update user profile image
 * @param {File} imageFile - Image file to upload
 * @returns {Promise<Object>} Updated user data with new profile image URL
 */
export const updateProfileImage = async (imageFile) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (isMockDataEnabled()) {
    await simulateNetworkDelay();
    // Create a data URL for the image
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          ...mockUser,
          profileImageURL: e.target.result,
        });
      };
      reader.readAsDataURL(imageFile);
    });
  }

  const formData = new FormData();
  formData.append('profileImage', imageFile);

  const response = await fetch(`${API_BASE_URL}/api/users/me/profile-image`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to update profile image: ${response.status}`);
  }

  return response.json();
};

/**
 * Request email update with verification code
 * @param {string} newEmail - New email address to update to
 * @returns {Promise<Object>} Response with message about verification code
 */
export const requestEmailUpdate = async (newEmail) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (isMockDataEnabled()) {
    await simulateNetworkDelay();
    return {
      success: true,
      message: `Verification code sent to ${newEmail}`,
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/users/me/email/request-update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ newEmail })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to request email update: ${response.status}`);
  }

  return response.json();
};

/**
 * Confirm email update with verification code
 * @param {string} newEmail - New email address
 * @param {string} verificationCode - Verification code sent to new email
 * @returns {Promise<Object>} Updated user data with new email
 */
export const confirmEmailUpdate = async (newEmail, verificationCode) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (isMockDataEnabled()) {
    await simulateNetworkDelay();
    // For mock mode, accept any verification code for demo purposes
    return {
      ...mockUser,
      email: newEmail,
      active: false, // Email not verified until confirmed in real backend
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/users/me/email/confirm-update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ newEmail, verificationCode })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to confirm email update: ${response.status}`);
  }

  return response.json();
};