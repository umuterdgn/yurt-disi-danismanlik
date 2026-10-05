import { prisma } from '@/lib/prisma'

export async function incrementAIUsage(userEmail: string) {
  try {
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        aiUsageCount: {
          increment: 1
        }
      }
    });
  } catch (error) {
    console.error('Error incrementing AI usage:', error);
  }
}
