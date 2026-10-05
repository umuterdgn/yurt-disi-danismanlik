import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Middleware for basic authentication checks only
// Role-based authorization is handled in server components
export async function middleware(request: NextRequest) {
  try {
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

    // Response with cookie management
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow request to continue to prevent blocking
    return NextResponse.next()
  }
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
