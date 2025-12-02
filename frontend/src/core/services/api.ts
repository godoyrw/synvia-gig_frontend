import axios from 'axios';

type AppEnv = 'local' | 'homolog' | 'production';

const APP_ENV = (import.meta.env.VITE_APP_ENV as AppEnv) ?? 'local';

// mapa de URLs por ambiente
const API_BY_ENV: Record<AppEnv, string> = {
  local: 'http://localhost:3001',
  homolog: 'https://microservices-homolog.synviabrasil.com',
  production: 'https://microservices.synviabrasil.com',
};

// prioridade:
// 1) VITE_API_BASE_URL (se quiser forçar via build/deploy)
// 2) URL mapeada pelo APP_ENV
// 3) fallback local (segurança)
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  API_BY_ENV[APP_ENV] ||
  'http://localhost:3001';

export const api = axios.create({
  baseURL,
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
