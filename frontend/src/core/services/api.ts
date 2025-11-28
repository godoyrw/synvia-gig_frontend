import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  try {
    const raw = sessionStorage.getItem('auth_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      const clientId =
        parsed?.clientId ??
        parsed?.organizationId ??
        parsed?.id;

      if (clientId) {
        if (!config.headers) {
          config.headers = new axios.AxiosHeaders();
        }
        config.headers['x-client-id'] = clientId;
      }
    }
  } catch (error) {
    console.warn('Não foi possível ler clientId do sessionStorage', error);
  }

  return config;
});

export default api;
