/**
 * Type-safe environment configuration for Vite
 * Migrated from REACT_APP_ to VITE_ prefix for better performance
 */

interface EnvironmentConfig {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_ENV: 'development' | 'production' | 'test'
  readonly VITE_APP_VERSION: string
  readonly VITE_DEBUG_MODE: boolean
}

/**
 * Runtime environment validation with helpful error messages
 */
function validateEnvironment(): EnvironmentConfig {
  const env = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '2.0.0',
    VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV
  }

  // Validate required environment variables
  const errors: string[] = []

  if (!env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is required for Supabase integration')
  } else if (!env.VITE_SUPABASE_URL.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must be a valid HTTPS URL')
  }

  if (!env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is required for Supabase integration')
  }

  // Environment-specific validation
  if (!['development', 'production', 'test'].includes(env.VITE_APP_ENV)) {
    console.warn(`Unknown environment: ${env.VITE_APP_ENV}, defaulting to development`)
    env.VITE_APP_ENV = 'development'
  }

  // Handle missing Supabase configuration gracefully
  if (errors.length > 0) {
    if (env.VITE_APP_ENV === 'development') {
      console.warn(
        '⚠️ Supabase configuration missing:\n' + 
        errors.map(error => `  • ${error}`).join('\n') +
        '\n\nCollaborative features will be disabled. To enable:\n' +
        '1. Create a Supabase project at https://supabase.com\n' +
        '2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file\n' +
        '3. Restart the development server'
      )
    } else {
      console.error('Missing required environment variables:', errors)
    }
    
    // Return with disabled Supabase for graceful degradation
    return {
      ...env,
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: ''
    } as EnvironmentConfig
  }

  return env as EnvironmentConfig
}

/**
 * Validated environment configuration
 * Safe to use throughout the application
 */
export const env = validateEnvironment()

/**
 * Feature flags based on environment
 */
export const features = {
  supabaseEnabled: !!(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY),
  collaborativeJournal: !!(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY),
  debugMode: env.VITE_DEBUG_MODE,
  isDevelopment: env.VITE_APP_ENV === 'development',
  isProduction: env.VITE_APP_ENV === 'production',
  isTest: env.VITE_APP_ENV === 'test'
} as const

/**
 * Development helper to log environment status
 */
if (env.VITE_DEBUG_MODE) {
  console.group('🔧 Environment Configuration')
  console.log('Environment:', env.VITE_APP_ENV)
  console.log('Version:', env.VITE_APP_VERSION)
  console.log('Supabase:', features.supabaseEnabled ? '✅ Enabled' : '❌ Disabled')
  console.log('Debug Mode:', features.debugMode ? '✅ Enabled' : '❌ Disabled')
  console.groupEnd()
}

/**
 * Type definitions for import.meta.env are now in vite-env.d.ts
 * Removed duplicate declarations to avoid conflicts
 */

export default env