import axios from 'axios';

// Production backend URL or local fallback
const rawBaseURL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://stockmind-ai-backend-38f2.onrender.com/api/';

const api = axios.create({
  baseURL: rawBaseURL.endsWith('/')
    ? rawBaseURL
    : `${rawBaseURL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT access token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Refresh endpoint
// Currently not configured
export const REFRESH_ENDPOINT_URL = null;

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    // Network error
    if (!error.response) {
      console.error(
        'Network error / Backend unreachable:',
        error.message
      );

      return Promise.reject(error);
    }

    const status = error.response.status;

    // Make sure originalRequest exists
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Don't intercept login/register requests
    const requestURL = originalRequest.url || '';

    const isAuthRequest =
      requestURL.includes('login') ||
      requestURL.includes('register');

    // Handle 401
    if (
      status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken && REFRESH_ENDPOINT_URL) {
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}${REFRESH_ENDPOINT_URL}`,
            {
              refresh: refreshToken,
            }
          );

          const newAccessToken = response.data.access;

          localStorage.setItem(
            'access_token',
            newAccessToken
          );

          originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;

          return api(originalRequest);

        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');

          window.location.href = '/login';

          return Promise.reject(refreshError);
        }
      }

      // No refresh token available
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      window.location.href = '/login';
    }

    // Error logging
    if (status === 400) {
      console.error(
        'Bad Request / Validation Error:',
        error.response.data
      );
    } else if (status === 401) {
      console.error(
        'Unauthorized:',
        error.response.data
      );
    } else if (status === 403) {
      console.error(
        'Forbidden:',
        error.response.data
      );
    } else if (status === 404) {
      console.error(
        'Endpoint not found:',
        error.response.config?.url
      );
    } else if (status === 422) {
      console.error(
        'Validation error:',
        error.response.data
      );
    } else if (status >= 500) {
      console.error(
        'Backend server error:',
        error.response.data
      );
    }

    return Promise.reject(error);
  }
);

export default api;