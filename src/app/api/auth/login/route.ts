import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { updateStudentStreak } from '@/actions/admin'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      )
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        advisorProfile: true,
        parentProfile: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 401 }
      )
    }

    // Şifre kontrolü
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Hatalı şifre' },
        { status: 401 }
      )
    }

    // Kullanıcı onay kontrolü
    if (!user.isApproved) {
      return NextResponse.json(
        { success: false, error: 'Hesabınız yönetici onayı bekliyor' },
        { status: 403 }
      )
    }

    // Update streak for students
    if (user.role === UserRole.STUDENT && user.studentProfile) {
      await updateStudentStreak(user.studentProfile.id)
    }

    // Session cookie oluştur
    const cookieStore = await cookies()
    cookieStore.set('user_id', user.id)
    cookieStore.set('user_email', user.email)
    cookieStore.set('user_role', user.role)

    // Kullanıcı bilgilerini hazırla (şifre hariç)
    const { password: _, ...userWithoutPassword } = user

    // Role göre redirect path belirle
    const redirectMap: Record<string, string> = {
      'SUPER_ADMIN': '/admin/dashboard',
      'ADVISOR': '/advisor/dashboard',
      'STUDENT': '/student/dashboard',
      'PARENT': '/parent/dashboard'
    }
    const redirectPath = redirectMap[user.role] || '/dashboard'

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      redirect: redirectPath
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}