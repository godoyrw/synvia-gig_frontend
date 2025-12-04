/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_USERS?: string
  readonly VITE_USE_MOCK_TENANTS?: string
  // adicione outras variáveis VITE_ aqui conforme for criando
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
