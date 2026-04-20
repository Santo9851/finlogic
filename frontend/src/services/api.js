import axios from 'axios';
import { getCookie } from 'cookies-next';

// Configure basic axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Attempt to get token - if you're using another method to store tokens (like localStorage), update this
    const token = getCookie('access_token') || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't refresh if it's the login or refresh endpoint itself
      if (originalRequest.url.includes('/auth/login/')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = getCookie('refresh_token');

      if (refreshToken) {
        try {
          // Use a fresh axios instance for the refresh call to avoid interceptor loops
          const refreshRes = await axios.post(
            `${api.defaults.baseURL}/auth/login/refresh/`, 
            { refresh: refreshToken }
          );

          if (refreshRes.data.access) {
            const newToken = refreshRes.data.access;
            const newRefreshToken = refreshRes.data.refresh;
            
            // Update cookies
            const { setCookie } = await import('cookies-next');
            setCookie('access_token', newToken, { maxAge: 15 * 60, path: '/' });
            if (newRefreshToken) {
                setCookie('refresh_token', newRefreshToken, { maxAge: 7 * 24 * 60 * 60, path: '/' });
            }

            // Retry original request
            api.defaults.headers.Authorization = `Bearer ${newToken}`;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, clear everything and redirect (or let AuthContext handle it)
          console.error('Refresh token expired or invalid');
          const { deleteCookie } = await import('cookies-next');
          deleteCookie('access_token', { path: '/' });
          deleteCookie('refresh_token', { path: '/' });
          if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
