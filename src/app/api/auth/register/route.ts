import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Tüm zorunlu alanları doldurun' },
        { status: 400 }
      )
    }

    // Force role to STUDENT for security - no role selection from public registration
    const role = 'STUDENT'

    // Supabase Admin Client oluştur
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        detectSessionInUrl: false
      }
    })

    // Supabase Auth'ta kullanıcı oluştur
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      console.error('Supabase Auth error:', authError)
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      )
    }

    const supabaseUserId = authData.user.id

    // Prisma'da kullanıcı oluştur (Supabase user ID ile)
    const user = await prisma.user.create({
      data: {
        id: supabaseUserId,
        email,
        password, // Supabase zaten hash'ledi, ama Prisma'da da tutuyoruz
        name,
        role: role as UserRole,
      }
    })

    // Role göre profil oluştur
    if (role === 'STUDENT') {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          grade: '11',
        }
      })
    } else if (role === 'ADVISOR') {
      await prisma.advisorProfile.create({
        data: {
          userId: user.id,
          maxStudents: 20,
        }
      })
    } else if (role === 'PARENT') {
      await prisma.parentProfile.create({
        data: {
          userId: user.id,
        }
      })
    }

    // Kullanıcı bilgilerini hazırla (şifre hariç)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'Kayıt başarılı'
    })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}