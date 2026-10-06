import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { updateStudentStreak } from '@/actions/admin'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

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

    // AUTO-SYNC: Create Supabase Auth session for user if it doesn't exist
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
        
        // Check if user exists in Supabase Auth
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (!listError && users) {
          const supabaseUser = users.find(u => u.email === email)
          
          if (!supabaseUser) {
            // User exists in Prisma but not in Supabase Auth - create them
            console.log("AUTO-SYNC: Creating Supabase Auth user for", email)
            
            const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
              email,
              password,
              options: {
                data: {
                  prisma_user_id: user.id,
                  role: user.role
                }
              }
            })
            
            if (signUpError) {
              console.error("AUTO-SYNC_SIGNUP_ERROR:", signUpError)
              // Don't fail login if Supabase sync fails, just log it
            } else {
              console.log("AUTO-SYNC: Successfully created Supabase Auth user for", email)
            }
          }
        }
        
        // Sign in to Supabase to create session
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password
        })
        
        if (signInError) {
          console.error("SUPABASE_SIGNIN_ERROR:", signInError)
          // Don't fail login if Supabase sign-in fails, just log it
        } else if (signInData.session) {
          // Set Supabase session cookies
          const cookieStore = await cookies()
          
          const session = signInData.session
          const accessToken = session.access_token
          const refreshToken = session.refresh_token
          
          // Set Supabase auth cookies
          cookieStore.set('sb-access-token', accessToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })
          
          cookieStore.set('sb-refresh-token', refreshToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })
          
          console.log("AUTO-SYNC: Successfully created Supabase session for", email)
        }
      }
    } catch (supabaseError) {
      console.error("AUTO-SYNC_ERROR:", supabaseError)
      // Don't fail login if Supabase sync fails, just log it
    }

    // Session cookie oluştur (legacy - for backward compatibility)
    const cookieStore = await cookies()
    cookieStore.set('user_id', user.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    cookieStore.set('user_email', user.email, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    cookieStore.set('user_role', user.role, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Kullanıcı bilgilerini hazırla (şifre hariç)
    const { password: _, ...userWithoutPassword } = user

    // Role göre redirect path belirle
    const redirectMap: Record<string, string> = {
      'SUPER_ADMIN': '/super-admin',
      'ADMIN': '/admin/dashboard',
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