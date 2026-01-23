/**
 * File API Service
 * Handles file upload operations to S3
 * Supports mock mode for testing via VITE_MOCK_DATA env var
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Check for mock data mode
const isMockDataEnabled = () => {
  return (
    import.meta.env.VITE_MOCK_DATA === "true" ||
    import.meta.env.VITE_MOCK_DATA === true
  );
};

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

const simulateNetworkDelay = (ms = 300) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Upload a file to S3
 * @param {File} file - File to upload
 * @param {string} type - File type ('profile', 'attachment', 'general')
 * @returns {Promise<Object>} Response with file URL
 */
export const uploadFile = async (file, type = "general") => {
  // Mock mode - return a mock URL
  if (isMockDataEnabled()) {
    await simulateNetworkDelay(500);
    // Create a mock URL using FileReader for images
    if (file.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            success: true,
            data: {
              url: e.target.result,
              key: `mock/${file.name}`,
            },
            timestamp: new Date().toISOString(),
          });
        };
        reader.readAsDataURL(file);
      });
    }
    // For non-images, return a mock URL
    return {
      success: true,
      data: {
        url: `https://mock-s3.example.com/${type}/${file.name}`,
        key: `mock/${type}/${file.name}`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Real API call
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE}/api/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Failed to upload file: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

/**
 * Delete a file from S3
 * @param {string} key - File key/URL to delete
 * @returns {Promise<Object>} Success response
 */
export const deleteFile = async (key) => {
  // Mock mode
  if (isMockDataEnabled()) {
    await simulateNetworkDelay(300);
    return {
      success: true,
      message: "File deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }

  // Real API call
  try {
    const response = await fetch(`${API_BASE}/api/files/${key}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Failed to delete file: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
