'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { NotificationType } from '@prisma/client'

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

export async function updateDocumentStatus(documentId: string, status: 'APPROVED' | 'REVISION_REQUIRED', feedback?: string) {
  try {
    // Get document with student info
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        application: {
          include: {
            studentProfile: {
              include: { user: true }
            }
          }
        }
      }
    })

    if (!document) {
      return { success: false, error: 'Evrak bulunamadı' }
    }

    // Update document status
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        feedback: feedback || null
      }
    })

    // Create notification for student
    if (document.application?.studentProfile?.userId) {
      const title = status === 'APPROVED' ? 'Evrak Onaylandı' : 'Evrak Revizyon Gerekiyor'
      const message = status === 'APPROVED' 
        ? `${document.documentType} evrağınız onaylandı.`
        : `${document.documentType} evrağınız için revizyon gerekiyor: ${feedback || 'Detaylı bilgi için danışmanınızla iletişime geçin.'}`

      await prisma.notification.create({
        data: {
          userId: document.application.studentProfile.userId,
          title,
          message,
          type: NotificationType.DOCUMENT,
          relatedEntityType: 'Document',
          relatedEntityId: documentId
        }
      })
    }

    revalidatePath('/advisor/documents')
    revalidatePath('/student/dashboard')
    revalidatePath('/student/study-abroad')

    return { success: true, document: updatedDocument }
  } catch (error) {
    console.error('Document status update error:', error)
    return { success: false, error: 'Evrak durumu güncellenirken bir hata oluştu' }
  }
}

export async function createNotification(userId: string, title: string, message: string, type: NotificationType, relatedEntityType?: string, relatedEntityId?: string) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedEntityType,
        relatedEntityId
      }
    })

    return { success: true, notification }
  } catch (error) {
    console.error('Notification creation error:', error)
    return { success: false, error: 'Bildirim oluşturulurken bir hata oluştu' }
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    })

    revalidatePath('/student/dashboard')
    revalidatePath('/advisor/dashboard')

    return { success: true, notification }
  } catch (error) {
    console.error('Notification read error:', error)
    return { success: false, error: 'Bildirim okundu olarak işaretlenirken bir hata oluştu' }
  }
}

export async function getUnreadNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return { success: true, notifications }
  } catch (error) {
    console.error('Get notifications error:', error)
    return { success: false, error: 'Bildirimler alınırken bir hata oluştu' }
  }
}