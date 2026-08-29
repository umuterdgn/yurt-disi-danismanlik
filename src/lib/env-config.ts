// Environment configuration for the application
// Copy this file to .env.local and fill in your actual values

export const env = {
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // NextAuth
  nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  
  // Google Calendar
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google',
  
  // Zoom
  zoomApiKey: process.env.ZOOM_API_KEY || '',
  zoomApiSecret: process.env.ZOOM_API_SECRET || '',
  zoomJwtAppKey: process.env.ZOOM_JWT_APP_KEY || '',
  zoomJwtAppSecret: process.env.ZOOM_JWT_APP_SECRET || '',
  
  // Application
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}

export function validateEnv() {
  const required = [
    'databaseUrl',
    'supabaseUrl',
    'supabaseAnonKey',
    'nextAuthSecret',
  ]
  
  const missing = required.filter(key => !env[key as keyof typeof env])
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing)
  }
  
  return missing.length === 0
}