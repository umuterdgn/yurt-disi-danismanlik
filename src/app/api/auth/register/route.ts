import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/generated/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'Tüm zorunlu alanları doldurun' },
        { status: 400 }
      )
    }

    // E-posta zaten kullanılıyor mu kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Bu e-posta zaten kullanılıyor' },
        { status: 409 }
      )
    }

    // Kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        email,
        password, // Gerçek uygulamada bcrypt ile hash'lenmeli
        name,
        role: role as UserRole,
      }
    })

    // Role göre profil oluştur
    if (role === 'STUDENT') {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          grade: '11', // Varsayılan sınıf
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