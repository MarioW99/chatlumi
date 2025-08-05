/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_FUNCTIONS_BASE_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_OFFLINE_MODE: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_DEBUG_MODE: string
  readonly VITE_MESSAGE_CACHE_DURATION: string
  readonly VITE_MAX_MESSAGE_LENGTH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 