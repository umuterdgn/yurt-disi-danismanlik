'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Resolve AI Recommendation
export async function resolveRecommendation(formData: FormData) {
  try {
    const recommendationId = formData.get('recommendationId') as string
    const userId = formData.get('userId') as string

    if (!recommendationId) {
      return { success: false, error: 'Öneri ID bulunamadı' }
    }

    // Get recommendation details before resolving
    const recommendation = await prisma.aIRecommendation.findUnique({
      where: { id: recommendationId }
    })

    if (!recommendation) {
      return { success: false, error: 'Öneri bulunamadı' }
    }

    // Mark as resolved
    await prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: { isResolved: true }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: 'AI_RECOMMENDATION_RESOLVED',
        entityType: 'AIRecommendation',
        entityId: recommendationId,
        details: `AI recommendation resolved: ${recommendation.message.substring(0, 100)}...`
      }
    })

    revalidatePath('/advisor/students/[id]')
    revalidatePath('/advisor/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Resolve recommendation error:', error)
    return { success: false, error: 'Öneri çözülürken bir hata oluştu' }
  }
}

// Update Student Health Score
export async function updateHealthScore(formData: FormData) {
  try {
    const studentId = formData.get('studentId') as string
    const healthScore = parseInt(formData.get('healthScore') as string)
    const riskStatus = formData.get('riskStatus') as string
    const userId = formData.get('userId') as string

    if (!studentId || !healthScore || !riskStatus) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' }
    }

    // Update student profile
    await prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        healthScore,
        riskStatus,
        lastActivityDate: new Date()
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: 'HEALTH_SCORE_UPDATED',
        entityType: 'StudentProfile',
        entityId: studentId,
        details: `Health score updated to ${healthScore}, risk status: ${riskStatus}`
      }
    })

    revalidatePath('/advisor/students/[id]')
    revalidatePath('/advisor/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Update health score error:', error)
    return { success: false, error: 'Sağlık skoru güncellenirken bir hata oluştu' }
  }
}