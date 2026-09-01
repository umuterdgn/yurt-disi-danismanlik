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

  // Rol kontrolü layout component'lerine taşındı (Edge Runtime uyumluluğu için)
  // Middleware sadece temel oturum kontrolü yapar

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
