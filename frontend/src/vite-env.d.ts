/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_DEFAULT_GROUPS: string;
  readonly VITE_TOKEN_KEY: string;
  readonly VITE_USER_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}