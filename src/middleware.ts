import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Middleware for authentication and subscription checks
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const protectedPaths = ['/dashboard', '/student', '/advisor', '/parent', '/admin', '/super-admin']

  // API rotalarını middleware kontrolünden hariç tut
  if (url.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const isProtectedPath = protectedPaths.some((path) => url.pathname.startsWith(path))

  // Create response that will handle cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Supabase client oluştur with proper cookie management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Kullanıcı giriş yapmamışsa ve korumalı bir sayfaya girmeye çalışıyorsa login'e yönlendir
  if (isProtectedPath && !session) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Super Admin kontrolü
  if (url.pathname.startsWith('/super-admin') && session) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      // Get user role from database
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/user-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      const userData = await userResponse.json()

      if (userData.role !== 'SUPER_ADMIN') {
        url.pathname = '/advisor'
        return NextResponse.redirect(url)
      }
    }
  }

  // Subscription expired kontrolü (Advisor için)
  if (url.pathname.startsWith('/advisor') && session) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/subscription-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      const userData = await userResponse.json()

      if (!userData.isSubscriptionActive || userData.isExpired) {
        url.pathname = '/subscription-expired'
        return NextResponse.redirect(url)
      }
    }
  }

  // Response with cookie management
  return response
}

// Middleware'in çalışacağı dosya yollarını (matcher) belirliyoruz
export const config = {
  matcher: [
    /*
     * Aşağıdaki yollar hariç tüm requestlerde middleware çalışır:
     * - _next/static (statik dosyalar)
     * - _next/image (imaj optimizasyon API'si)
     * - favicon.ico (favicon)
     * - resim/svg uzantılı dosyalar
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
