/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_GOOGLE_ANALYTICS_ID: string
  readonly VITE_FACEBOOK_PIXEL_ID: string
  readonly VITE_ENABLE_BETA_FEATURES: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
