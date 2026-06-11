import axios from 'axios';

const axiosClient = axios.create({
  //@ts-ignore
  baseURL: import.meta.env.VITE_API_URL as string,
});

axiosClient.interceptors.request.use(
  (config) => {
    const raw = localStorage.getItem('token');

    if (raw) {
      try {
        const token = JSON.parse(raw);
        config.headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Invalid token format:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // Let axios set Content-Type automatically (critical for FormData multipart boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      window.dispatchEvent(new CustomEvent('auth:logout', {
        detail: { reason: 'unauthorized' }
      }));
    }

    return Promise.reject(error);
  }
);

export default axiosClient;