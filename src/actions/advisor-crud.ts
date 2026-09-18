'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { NotificationType } from '@prisma/client'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Create Document for Student
export async function createDocument(formData: FormData) {
  try {
    const studentProfileId = formData.get('studentProfileId') as string
    const applicationId = formData.get('applicationId') as string
    const documentType = formData.get('documentType') as string
    const documentName = formData.get('documentName') as string
    const filePath = formData.get('filePath') as string
    const expiryDate = formData.get('expiryDate') as string

    if (!studentProfileId || !applicationId || !documentType || !documentName) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' }
    }

    // Get student profile to get userId
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { userId: true }
    })

    if (!studentProfile) {
      return { success: false, error: 'Öğrenci profili bulunamadı' }
    }

    const document = await prisma.document.create({
      data: {
        applicationId,
        documentType,
        documentName,
        filePath: filePath || null,
        isUploaded: !!filePath,
        uploadDate: filePath ? new Date() : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: filePath ? 'UPLOADED' : 'MISSING'
      }
    })

    // Create notification for student
    if (filePath) {
      await prisma.notification.create({
        data: {
          userId: studentProfile.userId,
          title: 'Yeni Evrak Eklendi',
          message: `Danışmanınız ${documentType} evrağınızı sisteme yükledi.`,
          type: NotificationType.DOCUMENT,
          relatedEntityType: 'Document',
          relatedEntityId: document.id
        }
      })
    }

    revalidatePath('/advisor/students/[id]')
    revalidatePath('/advisor/documents')
    revalidatePath('/student/dashboard')

    return { success: true, document }
  } catch (error) {
    console.error('Create document error:', error)
    return { success: false, error: 'Evrak oluşturulurken bir hata oluştu' }
  }
}

// Create Application for Student
export async function createApplication(formData: FormData) {
  try {
    const studentProfileId = formData.get('studentProfileId') as string
    const universityId = formData.get('universityId') as string
    const program = formData.get('program') as string
    const semester = formData.get('semester') as string
    const year = parseInt(formData.get('year') as string)

    if (!studentProfileId || !universityId || !program || !semester || !year) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' }
    }

    // Get student profile to get userId
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { userId: true }
    })

    if (!studentProfile) {
      return { success: false, error: 'Öğrenci profili bulunamadı' }
    }

    const application = await prisma.application.create({
      data: {
        studentProfileId,
        universityId,
        program,
        semester,
        year,
        status: 'LEAD'
      }
    })

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: studentProfile.userId,
        title: 'Yeni Başvuru Başlatıldı',
        message: `Danışmanınız sizin için yeni bir başvuru süreci başlattı.`,
        type: NotificationType.APPLICATION_UPDATE,
        relatedEntityType: 'Application',
        relatedEntityId: application.id
      }
    })

    revalidatePath('/advisor/students/[id]')
    revalidatePath('/advisor/applications')
    revalidatePath('/student/dashboard')

    return { success: true, application }
  } catch (error) {
    console.error('Create application error:', error)
    return { success: false, error: 'Başvuru oluşturulurken bir hata oluştu' }
  }
}

// Create Meeting Note
export async function createMeetingNote(formData: FormData) {
  try {
    const studentProfileId = formData.get('studentProfileId') as string
    const meetingDate = formData.get('meetingDate') as string
    const duration = parseInt(formData.get('duration') as string)
    const motivationLevel = formData.get('motivationLevel') as string
    const issues = formData.get('issues') as string
    const achievements = formData.get('achievements') as string
    const actionItems = formData.get('actionItems') as string
    const notes = formData.get('notes') as string
    const nextMeetingDate = formData.get('nextMeetingDate') as string

    if (!studentProfileId || !meetingDate || !duration || !notes) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' }
    }

    const meetingNote = await prisma.meetingNote.create({
      data: {
        studentProfileId,
        meetingDate: new Date(meetingDate),
        duration,
        motivationLevel: motivationLevel || 'medium',
        issues: issues || undefined,
        achievements: achievements || undefined,
        actionItems: actionItems || undefined,
        notes,
        nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate) : undefined
      }
    })

    revalidatePath('/advisor/students/[id]')
    revalidatePath('/advisor/dashboard')

    return { success: true, meetingNote }
  } catch (error) {
    console.error('Create meeting note error:', error)
    return { success: false, error: 'Görüşme notu oluşturulurken bir hata oluştu' }
  }
}

// Create Exam Result
export async function createExamResult(formData: FormData) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return { success: false, error: 'Unauthorized' }
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    // Check if user has Advisor or Admin role
    if (dbUser.role !== 'ADVISOR' && dbUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only Advisors and Admins can create exams' }
    }

    const studentProfileId = formData.get('studentProfileId') as string
    const examName = formData.get('examName') as string
    const examType = formData.get('examType') as string
    const examDate = formData.get('examDate') as string
    const targetScore = parseFloat(formData.get('targetScore') as string)
    const actualScore = formData.get('actualScore') ? parseFloat(formData.get('actualScore') as string) : null
    const turkishScore = formData.get('turkishScore') ? parseFloat(formData.get('turkishScore') as string) : null
    const mathScore = formData.get('mathScore') ? parseFloat(formData.get('mathScore') as string) : null
    const scienceScore = formData.get('scienceScore') ? parseFloat(formData.get('scienceScore') as string) : null
    const socialScore = formData.get('socialScore') ? parseFloat(formData.get('socialScore') as string) : null
    const notes = formData.get('notes') as string

    // Enhanced validation for studentProfileId
    if (!studentProfileId || studentProfileId === 'undefined' || studentProfileId === 'null' || studentProfileId.trim() === '') {
      return { success: false, error: 'Geçerli bir öğrenci profili seçilmelidir' }
    }

    if (!examName || !examType || !examDate || !targetScore) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' }
    }

    // Get student profile to get userId
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { userId: true }
    })

    if (!studentProfile) {
      return { success: false, error: 'Öğrenci profili bulunamadı' }
    }

    const examResult = await prisma.examResult.create({
      data: {
        studentProfileId,
        examName,
        examType,
        examDate: new Date(examDate),
        targetScore,
        actualScore,
        scoreDifference: actualScore ? actualScore - targetScore : null,
        turkishScore,
        mathScore,
        scienceScore,
        socialScore,
        notes: notes || null
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'EXAM_CREATED',
        entityType: 'ExamResult',
        entityId: examResult.id,
        details: `Exam result created: ${examName} for student ${studentProfileId}`
      }
    })

    // Create notification for student
    if (actualScore !== null) {
      await prisma.notification.create({
        data: {
          userId: studentProfile.userId,
          title: 'Yeni Deneme Sonucu',
          message: `${examName} deneme sonucunuz girildi: ${actualScore} net`,
          type: NotificationType.GENERAL,
          relatedEntityType: 'ExamResult',
          relatedEntityId: examResult.id
        }
      })
    }

    revalidatePath('/advisor/exams')
    revalidatePath('/advisor/students/[id]')
    revalidatePath('/student/dashboard')
    revalidatePath('/student/exams')

    return { success: true, examResult }
  } catch (error) {
    console.error('Create exam result error:', error)
    return { success: false, error: 'Deneme sonucu oluşturulurken bir hata oluştu' }
  }
}