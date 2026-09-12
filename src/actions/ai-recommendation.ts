'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function resolveRecommendation(recommendationId: string) {
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

  // Get the recommendation first to get studentId
  const recommendation = await prisma.aIRecommendation.findUnique({
    where: { id: recommendationId }
  })

  if (!recommendation) {
    return { success: false, error: 'Recommendation not found' }
  }

  // Update the recommendation as resolved
  const updatedRecommendation = await prisma.aIRecommendation.update({
    where: { id: recommendationId },
    data: { isResolved: true }
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      action: 'AI_RECOMMENDATION_RESOLVED',
      entityType: 'AIRecommendation',
      entityId: recommendationId,
      details: `AI recommendation resolved: ${recommendation.message}`
    }
  })

  // Revalidate the student detail page
  revalidatePath(`/advisor/students/${recommendation.studentId}`)
  
  return { success: true, recommendation: updatedRecommendation }
}