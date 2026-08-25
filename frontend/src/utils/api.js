import axios from 'axios';

// Ensure baseURL always ends with a trailing slash to prevent path resolution issues
let rawBaseURL = 'https://stockmind-ai-backend-38f2.onrender.com/api/';
if (!rawBaseURL.endsWith('/')) {
  rawBaseURL += '/';
}

const api = axios.create({
  baseURL: rawBaseURL,
});

// Request interceptor to add the access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Configuration constant for refresh endpoint 
// (Update this when backend provides a refresh endpoint, e.g., 'token/refresh/')
export const REFRESH_ENDPOINT_URL = null;

// Response interceptor for handling 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const status = error.response.status;

      // Do not intercept if the request is to login or register itself
      const isAuthRequest = originalRequest.url.includes('login') || originalRequest.url.includes('register');

      if (status === 401 && !originalRequest._retry && !isAuthRequest) {
        originalRequest._retry = true;

        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken && REFRESH_ENDPOINT_URL) {
          try {
            const response = await axios.post(`${api.defaults.baseURL}${REFRESH_ENDPOINT_URL}`, {
              refresh: refreshToken
            });

            localStorage.setItem('access_token', response.data.access);
            originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;

            return api(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh URL configured or no token, require re-login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }

      // Centralized error logging
      if (status === 400) console.error("Bad Request / Validation Error:", error.response.data);
      else if (status === 401) console.error("Unauthorized:", error.response.data);
      else if (status === 403) console.error("Forbidden:", error.response.data);
      else if (status === 404) console.error("Endpoint not found:", error.response.config.url);
      else if (status === 422) console.error("Validation error:", error.response.data);
      else if (status >= 500) console.error("Backend server error:", error.response.data);

    } else {
      console.error("Network error / Backend unreachable:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
