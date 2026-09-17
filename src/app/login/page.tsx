'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Doğrudan login API'sini kullan
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json()
        console.error('LOGIN_API_ERROR:', errorData)
        setError(errorData.error || 'Giriş başarısız. Lütfen tekrar deneyin.')
        setLoading(false)
        return
      }

      const loginData = await loginResponse.json()

      if (loginData.success && loginData.user) {
        // Kullanıcı bilgisini localStorage'a kaydet
        localStorage.setItem('auth_user', JSON.stringify(loginData.user))

        // Update streak for students
        if (loginData.user.role === 'STUDENT') {
          try {
            await fetch('/api/auth/update-streak', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email })
            })
          } catch (streakError) {
            console.error('Streak update error:', streakError)
            // Don't block login if streak update fails
          }
        }

        // Role göre yönlendirme
        const redirectMap: Record<string, string> = {
          'SUPER_ADMIN': '/admin/dashboard',
          'ADVISOR': '/advisor/dashboard',
          'STUDENT': '/student/dashboard',
          'PARENT': '/parent/dashboard'
        }
        const redirectPath = loginData.redirect || redirectMap[loginData.user.role] || '/dashboard'
        console.log('LOGIN_REDIRECT:', redirectPath, 'for role:', loginData.user.role)
        
        // Güvenilir yönlendirme için hem router.push hem window.location kullan
        setLoading(false)
        router.push(redirectPath)
        router.refresh()
        
        // Yedek yönlendirme yöntemi
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = redirectPath
          }
        }, 500)
      } else {
        console.error('LOGIN_API_DATA_ERROR:', loginData)
        if (loginData.error) {
          setError(loginData.error || 'Giriş başarısız. Lütfen tekrar deneyin.')
        } else {
          setError('Giriş başarısız. Lütfen tekrar deneyin.')
        }
      }
    } catch (err) {
      console.error('LOGIN_GENERAL_ERROR:', err)
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Giriş Yap</h1>
            <p className="text-gray-600 mt-2">Eğitim ve Yurt Dışı Danışmanlık Sistemi</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ornek@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Kayıt Ol
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              Ana sayfaya dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}