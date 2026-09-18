'use server';

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createServerClient } from '@supabase/ssr';

export async function addExam(formData: FormData) {
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

    // Check if user has Advisor or Admin role
    if (dbUser.role !== 'ADVISOR' && dbUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only Advisors and Admins can create exams' };
    }

    const studentProfileId = formData.get('studentProfileId') as string;
    const examName = formData.get('examName') as string;
    const examDate = formData.get('examDate') as string;
    const actualScore = formData.get('actualScore') ? parseFloat(formData.get('actualScore') as string) : null;
    const targetScore = formData.get('targetScore') ? parseFloat(formData.get('targetScore') as string) : null;

    // Enhanced validation for studentProfileId
    if (!studentProfileId || studentProfileId === 'undefined' || studentProfileId === 'null' || studentProfileId.trim() === '') {
      return { success: false, error: 'Geçerli bir öğrenci profili seçilmelidir' };
    }

    // Verify student profile exists in database
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId }
    });

    if (!studentProfile) {
      return { success: false, error: 'Seçilen öğrenci profili bulunamadı' };
    }

    // Validation
    if (!examName || !examDate) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' };
    }

    // Create exam result
    const examData: any = {
      studentProfileId,
      examName,
      examDate: new Date(examDate)
    };

    if (actualScore !== null && actualScore !== undefined) {
      examData.actualScore = actualScore;
    }
    if (targetScore !== null && targetScore !== undefined) {
      examData.targetScore = targetScore;
    }

    const exam = await prisma.examResult.create({
      data: examData
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'EXAM_CREATED',
        entityType: 'ExamResult',
        entityId: exam.id,
        details: `Exam created: ${examName} for student ${studentProfileId}`
      }
    });

    return {
      success: true,
      exam
    };

  } catch (error) {
    console.error('Add exam error:', error);
    return { success: false, error: 'Deneme eklenirken bir hata oluştu' };
  }
}
