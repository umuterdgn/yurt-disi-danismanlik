import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Edge uyumlu Supabase Client oluşturma
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ÖNEMLİ: Middleware içinde getSession() yerine getUser() kullanılmalıdır
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const protectedPaths = ['/dashboard', '/student', '/advisor', '/parent', '/admin']

  // API rotalarını middleware kontrolünden hariç tut
  if (url.pathname.startsWith('/api')) {
    return supabaseResponse
  }

  const isProtectedPath = protectedPaths.some((path) => url.pathname.startsWith(path))

  // Kullanıcı giriş yapmamışsa ve korumalı bir sayfaya girmeye çalışıyorsa login'e yönlendir
  if (isProtectedPath && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rol bazlı erişim kontrolü (RBAC)
  if (isProtectedPath && user?.email) {
    try {
      // Kullanıcının rolünü al
      const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/user-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })

      const roleData = await roleResponse.json()

      if (roleData.success && roleData.role) {
        const userRole = roleData.role

        // SUPER_ADMIN tüm korumalı rotalara erişebilir
        if (userRole === 'SUPER_ADMIN') {
          return supabaseResponse
        }

        // Diğer roller için rol bazlı kısıtlama
        const rolePaths: Record<string, string[]> = {
          'ADVISOR': ['/advisor'],
          'STUDENT': ['/student'],
          'PARENT': ['/parent'],
        }

        const allowedPaths = rolePaths[userRole] || []

        // Kullanıcı kendi rolüne ait olmayan bir yola erişmeye çalışıyorsa
        const hasAccess = allowedPaths.some(path => url.pathname.startsWith(path))
        
        if (!hasAccess && url.pathname !== '/dashboard') {
          // Dashboard'a yönlendir
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        }
      }
    } catch (error) {
      console.error('Role check error:', error)
    }
  }

  return supabaseResponse
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
