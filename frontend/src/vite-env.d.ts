/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INSTAGRAM_ID: string
  readonly VITE_INSTAGRAM_APP_ID: string
  readonly VITE_INSTAGRAM_ACCESS_TOKEN: string
  /** Base URL del backend. Vacío = mock local. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
