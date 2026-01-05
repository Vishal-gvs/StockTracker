import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If 403 (Invalid Token) or 401, maybe try refresh?
    // For now, simpler: user needs to login again if access token expires and we don't handle refresh loop seamlessly yet.
    // Ideally we catch 403, call /refresh (if endpoint existed), then retry.
    // Given the timeframe, basic setup:
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
