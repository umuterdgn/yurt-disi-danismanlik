'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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