'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { UserRole } from '@prisma/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function createUser(data: {
  email: string
  password: string
  name: string
  role: UserRole
  profileData?: any
}) {
  try {
    // Önce Supabase Auth'da kullanıcı oluştur
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        role: data.role
      }
    })

    if (authError) {
      console.error('Supabase Auth hatası:', authError)
      return { success: false, error: authError.message }
    }

    // Prisma'da kullanıcı oluştur
    const prismaUser = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        ...(data.profileData && data.profileData)
      }
    })

    // Role göre profil oluştur
    if (data.role === UserRole.ADVISOR && data.profileData?.advisorProfile) {
      await prisma.advisorProfile.create({
        data: {
          userId: prismaUser.id,
          ...data.profileData.advisorProfile
        }
      })
    } else if (data.role === UserRole.STUDENT && data.profileData?.studentProfile) {
      await prisma.studentProfile.create({
        data: {
          userId: prismaUser.id,
          ...data.profileData.studentProfile
        }
      })
    } else if (data.role === UserRole.PARENT && data.profileData?.parentProfile) {
      await prisma.parentProfile.create({
        data: {
          userId: prismaUser.id,
          ...data.profileData.parentProfile
        }
      })
    }

    revalidatePath('/admin/users')

    return { success: true, user: prismaUser }
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error)
    return { success: false, error: 'Bir hata oluştu' }
  }
}

export async function createAdvisor(data: {
  email: string
  password: string
  name: string
  specialization: string
  experience: number
  bio: string
  maxStudents: number
}) {
  return createUser({
    email: data.email,
    password: data.password,
    name: data.name,
    role: UserRole.ADVISOR,
    profileData: {
      advisorProfile: {
        specialization: data.specialization,
        experience: data.experience,
        bio: data.bio,
        maxStudents: data.maxStudents
      }
    }
  })
}

export async function createStudent(data: {
  email: string
  password: string
  name: string
  grade: string
  school: string
  targetUniversity: string
  targetScore: number
  currentScore: number
  advisorId?: string
}) {
  return createUser({
    email: data.email,
    password: data.password,
    name: data.name,
    role: UserRole.STUDENT,
    profileData: {
      studentProfile: {
        grade: data.grade,
        school: data.school,
        targetUniversity: data.targetUniversity,
        targetScore: data.targetScore,
        currentScore: data.currentScore,
        advisorId: data.advisorId
      }
    }
  })
}
