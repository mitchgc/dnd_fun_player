/// <reference types="vite/client" />

/**
 * Extended Vite environment types for DnD Helper
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_ENV: 'development' | 'production' | 'test'
  readonly VITE_APP_VERSION: string
  readonly VITE_DEBUG_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}