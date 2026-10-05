'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from '@supabase/ssr';

export async function updateQuestionErrorType(questionResultId: string, errorType: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return { success: false, error: 'User not found' };
    }

    // Update question result error type
    const updatedQuestionResult = await prisma.questionResult.update({
      where: { id: questionResultId },
      data: { errorType: errorType as any }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'QUESTION_ERROR_TYPE_UPDATED',
        entityType: 'QuestionResult',
        entityId: questionResultId,
        details: `Error type updated to: ${errorType}`
      }
    });

    // Revalidate paths
    revalidatePath('/advisor/students/[id]');
    revalidatePath('/student/exams');

    return {
      success: true,
      questionResult: updatedQuestionResult
    };

  } catch (error) {
    console.error('Update question error type error:', error);
    return { success: false, error: 'Hata tipi güncellenirken bir hata oluştu' };
  }
}