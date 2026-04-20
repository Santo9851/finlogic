import api from './api';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';

export const authService = {
  // Login to get JWT
  async login(credentials) {
    const response = await api.post('/auth/login/', credentials);
    if (response.data.access) {
      // Store in cookies
      setCookie('access_token', response.data.access, { maxAge: 15 * 60, path: '/' }); // 15 mins
      setCookie('refresh_token', response.data.refresh, { maxAge: 7 * 24 * 60 * 60, path: '/' }); // 7 days
    }
    return response.data;
  },

  // Register
  async register(userData) {
    return await api.post('/auth/register/', userData);
  },

  // Logout
  logout() {
    deleteCookie('access_token', { path: '/' });
    deleteCookie('refresh_token', { path: '/' });
  },

  // Get current session token checking
  getToken() {
    return getCookie('access_token');
  },

  // Refresh Token
  async refresh() {
    const refreshToken = getCookie('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');

    // Use a separate axios call or raw fetch to avoid interceptor loop if needed, 
    // but here we can just use the api instance if we ensure the 401 interceptor doesn't catch its OWN 401
    const response = await api.post('/auth/login/refresh/', { refresh: refreshToken });
    
    if (response.data.access) {
      setCookie('access_token', response.data.access, { maxAge: 15 * 60, path: '/' });
      if (response.data.refresh) {
        setCookie('refresh_token', response.data.refresh, { maxAge: 7 * 24 * 60 * 60, path: '/' });
      }
      return response.data.access;
    }
    throw new Error('Refresh failed');
  },

  // Forgot Password
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password/', { email });
    return response.data;
  },
  
  // Reset Password
  async resetPassword(data) {
    const response = await api.post('/auth/reset-password/', data);
    return response.data;
  }
};
