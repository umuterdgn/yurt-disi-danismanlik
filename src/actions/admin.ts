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
  targetExam?: string
  examDate?: Date
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
        targetExam: data.targetExam,
        examDate: data.examDate,
        advisorId: data.advisorId
      }
    }
  })
}

export async function addAdvisorNote(studentId: string, note: string) {
  try {
    const updatedProfile = await prisma.studentProfile.update({
      where: { id: studentId },
      data: { advisorNote: note }
    })
    
    revalidatePath('/advisor/students/[id]')
    revalidatePath('/student/dashboard')
    
    return { success: true, profile: updatedProfile }
  } catch (error) {
    console.error('Advisor note addition error:', error)
    return { success: false, error: 'Not eklenirken bir hata oluştu' }
  }
}

export async function addStudentXP(studentId: string, xpAmount: number) {
  try {
    const updatedProfile = await prisma.studentProfile.update({
      where: { id: studentId },
      data: { 
        xp: { increment: xpAmount }
      }
    })
    
    revalidatePath('/student/dashboard')
    revalidatePath('/leaderboard')
    
    return { success: true, profile: updatedProfile, newXP: updatedProfile.xp }
  } catch (error) {
    console.error('XP addition error:', error)
    return { success: false, error: 'XP eklenirken bir hata oluştu' }
  }
}

export async function addStudentBadge(studentId: string, badge: string) {
  try {
    const currentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { badges: true }
    })
    
    if (!currentProfile) {
      return { success: false, error: 'Öğrenci profili bulunamadı' }
    }
    
    const currentBadges = currentProfile.badges || []
    if (currentBadges.includes(badge)) {
      return { success: false, error: 'Bu rozet zaten mevcut' }
    }
    
    const updatedProfile = await prisma.studentProfile.update({
      where: { id: studentId },
      data: { 
        badges: { push: badge }
      }
    })
    
    revalidatePath('/student/dashboard')
    revalidatePath('/student/trophy-room')
    
    return { success: true, profile: updatedProfile, newBadges: updatedProfile.badges }
  } catch (error) {
    console.error('Badge addition error:', error)
    return { success: false, error: 'Rozet eklenirken bir hata oluştu' }
  }
}

export async function updateStudentStreak(studentId: string) {
  try {
    const currentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { 
        streak: true,
        lastLoginDate: true
      }
    })
    
    if (!currentProfile) {
      return { success: false, error: 'Öğrenci profili bulunamadı' }
    }
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let newStreak = currentProfile.streak || 0
    
    if (currentProfile.lastLoginDate) {
      const lastLogin = new Date(currentProfile.lastLoginDate)
      const lastLoginDay = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate())
      
      // Calculate days difference
      const daysDiff = Math.floor((today.getTime() - lastLoginDay.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 0) {
        // Already logged in today, no change
        return { success: true, streak: newStreak, lastLoginDate: currentProfile.lastLoginDate }
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        newStreak += 1
      } else {
        // More than 1 day gap, reset streak
        newStreak = 1
      }
    } else {
      // First login ever
      newStreak = 1
    }
    
    const updatedProfile = await prisma.studentProfile.update({
      where: { id: studentId },
      data: { 
        streak: newStreak,
        lastLoginDate: now
      }
    })
    
    revalidatePath('/student/dashboard')
    
    return { success: true, streak: newStreak, lastLoginDate: now }
  } catch (error) {
    console.error('Streak update error:', error)
    return { success: false, error: 'Streak güncellenirken bir hata oluştu' }
  }
}

export async function checkAndAwardBadges(studentId: string) {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        dailyTasks: {
          where: { status: 'DONE' }
        },
        applications: {
          include: {
            documents: {
              where: { status: 'UPLOADED' }
            }
          }
        }
      }
    })
    
    if (!studentProfile) {
      return { success: false, error: 'Öğrenci profili bulunamadı' }
    }
    
    const newBadges: string[] = []
    const currentBadges = studentProfile.badges || []
    
    // Check for task-related badges
    const completedTasks = studentProfile.dailyTasks.length
    if (completedTasks >= 5 && !currentBadges.includes('odak_ustasi')) {
      newBadges.push('odak_ustasi')
    }
    if (completedTasks >= 50 && !currentBadges.includes('gorev_canavari')) {
      newBadges.push('gorev_canavari')
    }
    
    // Check for document-related badges
    const uploadedDocuments = studentProfile.applications.reduce((total, app) => {
      return total + (app.documents?.length || 0)
    }, 0)
    
    if (uploadedDocuments >= 1 && !currentBadges.includes('evrak_canavari')) {
      newBadges.push('evrak_canavari')
    }
    
    // Check for streak-related badges
    if (studentProfile.streak >= 7 && !currentBadges.includes('ates_ustasi')) {
      newBadges.push('ates_ustasi')
    }
    
    // Check for XP-related badges
    if (studentProfile.xp >= 1000 && !currentBadges.includes('yildiz_ogrenci')) {
      newBadges.push('yildiz_ogrenci')
    }
    if (studentProfile.xp >= 5000 && !currentBadges.includes('bilge_ustasi')) {
      newBadges.push('bilge_ustasi')
    }
    
    // Award new badges
    if (newBadges.length > 0) {
      const updatedProfile = await prisma.studentProfile.update({
        where: { id: studentId },
        data: {
          badges: {
            push: ...newBadges
          }
        }
      })
      
      revalidatePath('/student/dashboard')
      revalidatePath('/student/trophy-room')
      
      return { success: true, newBadges, allBadges: updatedProfile.badges }
    }
    
    return { success: true, newBadges: [], allBadges: currentBadges }
  } catch (error) {
    console.error('Badge check error:', error)
    return { success: false, error: 'Rozet kontrolü sırasında hata oluştu' }
  }
}
