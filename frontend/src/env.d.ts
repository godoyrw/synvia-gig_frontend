/// <reference types="vite/client" />

type AppEnv = 'local' | 'homolog' | 'production';

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: AppEnv;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_MOCK_USERS?: 'true' | 'false';
  readonly VITE_USE_MOCK_TENANTS?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
