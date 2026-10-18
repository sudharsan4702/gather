/**
 * Centralized API Configuration for Catane Gather
 * Reads runtime or build-time environment variable VITE_API_BASE_URL
 * Defaults to http://localhost:8080 for local development
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

export const apiUrl = (endpoint) => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

export const getAuthHeaders = (token, extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Resolves local and remote image URLs.
 * If an image was uploaded to the local /uploads sandbox, prepends the API base URL.
 */
export const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    return `${API_BASE_URL}${url}`;
  }
  if (url.startsWith('uploads/')) {
    return `${API_BASE_URL}/${url}`;
  }
  return url;
};
