/**
 * History API Service
 * Handles view history tracking and retrieval
 * Supports mock mode for testing via VITE_MOCK_DATA env var
 */

import { mockViewHistory } from './mockData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Check for mock data mode
const isMockDataEnabled = () => {
  return import.meta.env.VITE_MOCK_DATA === 'true' || import.meta.env.VITE_MOCK_DATA === true;
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const simulateNetworkDelay = (ms = 300) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Record a post view
 * @param {string} postId - Post ID to record as viewed
 * @returns {Promise<Object>} Updated history entry
 */
export const recordPostView = async (postId) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/history`,
      {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ postId })
      }
    );

    if (!response.ok) {
      // Don't throw error for 404/403 - post might not be published or might be deleted
      console.warn(`Failed to record post view: ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error recording post view:', error);
    return null; // Silently fail - non-critical operation
  }
};

/**
 * Fetch user's view history
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Promise<Object>} History data with pagination (most recent first)
 */
export const getViewHistory = async (page = 1, limit = 10) => {
  try {
    if (isMockDataEnabled()) {
      await simulateNetworkDelay();
      return mockViewHistory;
    }

    const response = await fetch(
      `${API_BASE}/api/history?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: getAuthHeader()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch view history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching view history:', error);
    throw error;
  }
};

/**
 * Delete a specific history entry
 * @param {string} postId - Post ID to remove from history
 * @returns {Promise<Object>} Success response
 */
export const deleteHistoryEntry = async (postId) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/history/${postId}`,
      {
        method: 'DELETE',
        headers: getAuthHeader()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete history entry: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting history entry:', error);
    throw error;
  }
};

/**
 * Clear all view history
 * @returns {Promise<Object>} Success response
 */
export const clearAllHistory = async () => {
  try {
    const response = await fetch(
      `${API_BASE}/api/history`,
      {
        method: 'DELETE',
        headers: getAuthHeader()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to clear history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
};
