'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { UserRole, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

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
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return { success: false, error: 'Bu e-posta adresi zaten kullanımda' }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Önce Supabase Auth'da kullanıcı oluştur
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password, // Use plain password for Supabase
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

    // Prisma'da kullanıcı oluştur with nested profile creation
    let prismaUser = null
    try {
      prismaUser = await prisma.user.create({
        data: {
          id: authUser.user.id, // KİLİT: Supabase ID'si Prisma ID'si olarak kullanılır
          email: data.email,
          password: hashedPassword, // Store hashed password
          name: data.name,
          role: data.role,
          isApproved: true,
          // Nested profile creation
          ...(data.role === UserRole.ADVISOR && data.profileData?.advisorProfile ? {
            advisorProfile: {
              create: data.profileData.advisorProfile
            }
          } : {}),
          ...(data.role === UserRole.STUDENT && data.profileData?.studentProfile ? {
            studentProfile: {
              create: data.profileData.studentProfile
            }
          } : {}),
          ...(data.role === UserRole.PARENT && data.profileData?.parentProfile ? {
            parentProfile: {
              create: data.profileData.parentProfile
            }
          } : {})
        }
      })
    } catch (error) {
      console.error('Prisma user creation error:', error)
      // Rollback: Supabase kullanıcısını sil
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id)
        console.log('Rolled back: Deleted Supabase user due to Prisma error')
      } catch (rollbackError) {
        console.error('Failed to rollback Supabase user:', rollbackError)
      }
      return { success: false, error: 'Kullanıcı kaydı oluşturma hatası' }
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
  // Get advisorProfileId from advisorId (User ID)
  let advisorProfileId: string | undefined = undefined
  if (data.advisorId) {
    const advisorProfile = await prisma.advisorProfile.findUnique({
      where: { userId: data.advisorId }
    })

    if (advisorProfile) {
      advisorProfileId = advisorProfile.id
    }

    // Check student quota
    const currentStudentCount = await prisma.studentProfile.count({
      where: { advisorId: advisorProfileId }
    });

    const advisorUser = await prisma.user.findUnique({
      where: { id: data.advisorId },
      select: { studentQuota: true }
    });

    if (advisorUser && currentStudentCount >= (advisorUser.studentQuota || 30)) {
      return { success: false, error: 'Öğrenci Kotanız Dolmuştur. Lütfen limitinizi artırmak için Nexa Edu ile iletişime geçin.' }
    }
  }

  return createUser({
    email: data.email,
    password: data.password, // Pass plain password, createUser will hash it
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
        advisorId: advisorProfileId // Use AdvisorProfile ID, not User ID
      }
    }
  })
}

export async function addAdvisorNote(studentId: string, note: string) {
  try {
    // Get student profile to get userId
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { userId: true }
    })

    if (!studentProfile) {
      return { success: false, error: 'Öğrenci profili bulunamadı' }
    }

    const updatedProfile = await prisma.studentProfile.update({
      where: { id: studentId },
      data: { advisorNote: note }
    })

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: studentProfile.userId,
        title: 'Danışman Notu',
        message: `Danışmanınız size yeni bir not bıraktı`,
        type: NotificationType.NOTE,
        relatedEntityType: 'StudentProfile',
        relatedEntityId: studentId
      }
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
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    const userRole = cookieStore.get('user_role')?.value

    // Validate that the requesting user is a student and owns this profile
    if (!userId || userRole !== 'STUDENT') {
      return { success: false, error: 'Unauthorized' }
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { userId: true }
    })

    if (!studentProfile || studentProfile.userId !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

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
      
      // Calculate days difference (calendar days)
      const daysDiff = Math.floor((today.getTime() - lastLoginDay.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calculate hours difference (for 24+ hour check)
      const hoursDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60))
      
      if (daysDiff === 0) {
        // Already logged in today, no change
        return { success: true, streak: newStreak, lastLoginDate: currentProfile.lastLoginDate }
      } else if (daysDiff === 1 && hoursDiff < 48) {
        // Exactly 1 calendar day passed and less than 48 hours (consecutive day)
        newStreak += 1
      } else {
        // More than 1 day gap or 24+ hours passed, reset streak to 0
        newStreak = 0
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
          where: { isCompleted: true }
        },
        applications: {
          include: {
            documents: {
              where: { isUploaded: true }
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
      const updatedBadges = [...currentBadges, ...newBadges]
      const updatedProfile = await prisma.studentProfile.update({
        where: { id: studentId },
        data: {
          badges: updatedBadges
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
