import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const protectedPaths = ['/dashboard', '/student', '/advisor', '/parent', '/admin']

  // API rotalarını middleware kontrolünden hariç tut
  if (url.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const isProtectedPath = protectedPaths.some((path) => url.pathname.startsWith(path))

  // Custom authentication cookies kontrolü
  const userId = request.cookies.get('user_id')?.value
  const userRole = request.cookies.get('user_role')?.value

  // Kullanıcı giriş yapmamışsa ve korumalı bir sayfaya girmeye çalışıyorsa login'e yönlendir
  if (isProtectedPath && !userId) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rol kontrolü layout component'lerine taşındı (Edge Runtime uyumluluğu için)
  // Middleware sadece temel oturum kontrolü yapar

  return NextResponse.next()
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
