'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from '@supabase/ssr';

export async function createAdvancedExam(formData: FormData) {
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

    // Get form data
    const studentProfileId = formData.get('studentProfileId') as string;
    const examName = formData.get('examName') as string;
    const examDate = formData.get('examDate') as string;
    const examType = formData.get('examType') as string;
    const totalNet = parseFloat(formData.get('totalNet') as string);

    // Subject scores
    const turkishCorrect = parseInt(formData.get('turkish_correct') as string) || 0;
    const turkishWrong = parseInt(formData.get('turkish_wrong') as string) || 0;
    const turkishEmpty = parseInt(formData.get('turkish_empty') as string) || 0;

    const mathCorrect = parseInt(formData.get('math_correct') as string) || 0;
    const mathWrong = parseInt(formData.get('math_wrong') as string) || 0;
    const mathEmpty = parseInt(formData.get('math_empty') as string) || 0;

    const scienceCorrect = parseInt(formData.get('science_correct') as string) || 0;
    const scienceWrong = parseInt(formData.get('science_wrong') as string) || 0;
    const scienceEmpty = parseInt(formData.get('science_empty') as string) || 0;

    const socialCorrect = parseInt(formData.get('social_correct') as string) || 0;
    const socialWrong = parseInt(formData.get('social_wrong') as string) || 0;
    const socialEmpty = parseInt(formData.get('social_empty') as string) || 0;

    // Validation
    if (!studentProfileId || !examName || !examDate || !examType) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' };
    }

    // Calculate individual nets
    const turkishNet = turkishCorrect - (turkishWrong / 4);
    const mathNet = mathCorrect - (mathWrong / 4);
    const scienceNet = scienceCorrect - (scienceWrong / 4);
    const socialNet = socialCorrect - (socialWrong / 4);

    // Create exam with subject results
    const exam = await prisma.exam.create({
      data: {
        studentProfileId,
        title: examName,
        date: new Date(examDate),
        totalNet,
        totalScore: totalNet * 10, // Approximate score calculation
        examType,
        subjectResults: {
          create: [
            {
              subjectName: 'Türkçe',
              correct: turkishCorrect,
              wrong: turkishWrong,
              empty: turkishEmpty,
              net: turkishNet
            },
            {
              subjectName: 'Matematik',
              correct: mathCorrect,
              wrong: mathWrong,
              empty: mathEmpty,
              net: mathNet
            },
            {
              subjectName: 'Fen Bilimleri',
              correct: scienceCorrect,
              wrong: scienceWrong,
              empty: scienceEmpty,
              net: scienceNet
            },
            {
              subjectName: 'Sosyal Bilimler',
              correct: socialCorrect,
              wrong: socialWrong,
              empty: socialEmpty,
              net: socialNet
            }
          ]
        }
      },
      include: {
        subjectResults: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'EXAM_CREATED',
        entityType: 'Exam',
        entityId: exam.id,
        details: `Advanced exam created: ${examName} with total net ${totalNet}`
      }
    });

    // Generate AI study plan based on the new exam results
    try {
      const { generateAIStudyPlan } = await import('./ai-study-plan');
      const studyPlanResult = await generateAIStudyPlan(exam.id);
      
      if (studyPlanResult.success) {
        console.log('AI study plan generated successfully:', studyPlanResult.analysis);
      }
    } catch (error) {
      console.error('Failed to generate AI study plan:', error);
      // Don't fail the exam creation if AI study plan fails
    }

    // Revalidate paths
    revalidatePath('/advisor/exams');
    revalidatePath('/advisor/students/[id]');
    revalidatePath('/student/exams');
    revalidatePath('/student/dashboard');

    return {
      success: true,
      exam
    };

  } catch (error) {
    console.error('Create advanced exam error:', error);
    return { success: false, error: 'Gelişmiş deneme eklenirken bir hata oluştu' };
  }
}