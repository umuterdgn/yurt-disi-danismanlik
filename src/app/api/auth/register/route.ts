import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

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
    const role: UserRole = 'STUDENT'

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

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 10)

    // Prisma'da kullanıcı oluştur (Supabase user ID ile) ve nested create ile profil oluştur
    let user = null
    try {
      user = await prisma.user.create({
        data: {
          id: supabaseUserId, // KİLİT: Supabase ID'si Prisma ID'si olarak kullanılır
          email,
          password: hashedPassword, // Hash'lenmiş şifreyi kaydet
          name,
          role: role as UserRole,
          // Nested profile creation - tek işlemde oluştur
          studentProfile: {
            create: {
              grade: '11',
              school: 'Belirtilmemiş',
              targetScore: 300,
              currentScore: 0,
              xp: 0,
              streak: 0,
              studentSymbol: '🎓',
              healthScore: 100,
              riskStatus: 'GREEN',
              applicationReadiness: 0,
              targetUniversities: [],
              serviceType: 'BOTH'
            }
          }
        }
      })
    } catch (error) {
      console.error('Prisma user creation error:', error)
      // Rollback: Supabase kullanıcısını sil
      try {
        await supabase.auth.admin.deleteUser(supabaseUserId)
        console.log('Rolled back: Deleted Supabase user due to Prisma error')
      } catch (rollbackError) {
        console.error('Failed to rollback Supabase user:', rollbackError)
      }
      return NextResponse.json(
        { success: false, error: 'Kullanıcı kaydı oluşturma hatası' },
        { status: 500 }
      )
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