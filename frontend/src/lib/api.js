import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5008/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 60000, // 60-second timeout — AI generation can take time
});

// Request interceptor: Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid retrying on timeout or network errors
    if (!error.response) {
      return Promise.reject(error);
    }

    // Skip refresh logic for auth routes (login, signup) or if retry is already set
    const isAuthRoute = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/signup');

    if (error.response.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${BASE_URL.replace('/api', '')}/api/auth/refresh`,
          {},
          { withCredentials: true, timeout: 5000 }
        );

        if (res.data.success) {
          const { accessToken } = res.data;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed — clear all auth data; let the React app handle redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('activeRole');
        
        // Dispatch custom event so AuthContext can update state
        window.dispatchEvent(new Event('auth-logout'));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
