// src/utils/axioServices.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { END_POINT } from '../constants/urls.js';
// You might need a way to reset navigation, we'll discuss this below

const api = axios.create({
  baseURL: END_POINT,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token (Async for Mobile)
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-refresh + logout
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    const isLoginRequest = originalRequest.url.includes('/login/');
    const isRefreshRequest = originalRequest.url.includes('/token/refresh/');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoginRequest &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        // Note: Use a clean axios instance here to avoid interceptor loops
        const refreshResponse = await axios.post(
          `${END_POINT}/usr-mngmnt/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access: newAccessToken } = refreshResponse.data;
        await AsyncStorage.setItem('access_token', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.warn('Token refresh failed. Logging out...');

        // Clear mobile storage
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);

        // IMPORTANT: In Mobile, you can't use window.location.
        // You usually emit an event or use a Navigation Service to reset the stack to 'Login'.
        // For now, let the error bubble up to the screen level.
        
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;