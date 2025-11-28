/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // adicione outras variáveis VITE_ aqui conforme for criando
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
