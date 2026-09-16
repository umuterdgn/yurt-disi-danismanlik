import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { updateStudentStreak } from '@/actions/admin'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Hesabınız aktif değil' },
        { status: 403 }
      )
    }

    // Update streak for students
    if (user.role === UserRole.STUDENT && user.studentProfile) {
      await updateStudentStreak(user.studentProfile.id)
    }

    // Supabase kullanıcı kontrolü
    let supabaseUser
    try {
      const { data: existingUser } = await supabase.auth.admin.getUserById(user.id)
      if (!existingUser.user) {
        // Supabase'de kullanıcı yoksa oluştur
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: user.role
          }
        })

        if (createError) {
          console.error('Supabase user creation error:', createError)
          return NextResponse.json(
            { success: false, error: 'Kullanıcı oluşturma hatası' },
            { status: 500 }
          )
        }
        supabaseUser = newUser.user
      } else {
        supabaseUser = existingUser.user
      }
    } catch (supabaseError) {
      console.error('Supabase auth error:', supabaseError)
      return NextResponse.json(
        { success: false, error: 'Auth hatası' },
        { status: 500 }
      )
    }

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