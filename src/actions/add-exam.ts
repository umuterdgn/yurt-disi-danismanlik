'use server';

import { prisma } from "@/lib/prisma";

export async function addExam(formData: FormData) {
  try {
    const studentProfileId = formData.get('studentProfileId') as string;
    const examName = formData.get('examName') as string;
    const examDate = formData.get('examDate') as string;
    const actualScore = formData.get('actualScore') ? parseFloat(formData.get('actualScore') as string) : null;
    const targetScore = formData.get('targetScore') ? parseFloat(formData.get('targetScore') as string) : null;

    // Validation
    if (!studentProfileId || !examName || !examDate) {
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

    return {
      success: true,
      exam
    };

  } catch (error) {
    console.error('Add exam error:', error);
    return { success: false, error: 'Deneme eklenirken bir hata oluştu' };
  }
}
