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

    // Check if user has Advisor or Super Admin role
    if (dbUser.role !== 'ADVISOR' && dbUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Only Advisors and Super Admins can create exams' };
    }

    // Get form data
    const studentProfileId = formData.get('studentProfileId') as string;
    const examName = formData.get('examName') as string;
    const examDate = formData.get('examDate') as string;
    const examType = formData.get('examType') as string;
    const totalNet = parseFloat(formData.get('totalNet') as string);
    const advisorComments = formData.get('advisorComments') as string;

    // OCR-related fields
    const questionResultsJson = formData.get('questionResults') as string;
    const answerKeyJson = formData.get('answerKey') as string;
    const ocrProcessed = formData.get('ocrProcessed') === 'true';
    const ocrConfidence = formData.get('ocrConfidence') ? parseFloat(formData.get('ocrConfidence') as string) : null;
    const ocrStatus = formData.get('ocrStatus') as string || null;

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

    // Subject scores (manual entry or OCR summary)
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

    // Parse answer key if provided
    let answerKey: Record<string, string> | null = null;
    if (answerKeyJson) {
      try {
        answerKey = JSON.parse(answerKeyJson);
      } catch (e) {
        console.error('Failed to parse answer key:', e);
      }
    }

    // Create exam with subject results and advisor comments
    const exam = await prisma.exam.create({
      data: {
        studentProfileId,
        title: examName,
        date: new Date(examDate),
        totalNet,
        totalScore: totalNet * 10, // Approximate score calculation
        examType,
        advisorComments: advisorComments || null,
        answerKey: answerKey ? answerKey as any : null,
        ocrProcessed,
        ocrConfidence,
        ocrStatus,
        analysisStatus: ocrProcessed ? 'analyzed' : 'pending',
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

    // Create question results if OCR was used
    if (ocrProcessed && questionResultsJson) {
      try {
        const questionResults = JSON.parse(questionResultsJson);
        
        // Map subject names to match database
        const subjectNameMap: Record<string, string> = {
          'turkish': 'Türkçe',
          'math': 'Matematik',
          'science': 'Fen Bilimleri',
          'social': 'Sosyal Bilimler'
        };

        for (const qr of questionResults) {
          const mappedSubjectName = subjectNameMap[qr.subject] || qr.subject;
          
          // Find the corresponding subject result
          const subjectResult = exam.subjectResults.find(sr => sr.subjectName === mappedSubjectName);
          
          if (subjectResult) {
            await prisma.questionResult.create({
              data: {
                subjectResultId: subjectResult.id,
                questionNumber: qr.questionNumber,
                subject: mappedSubjectName,
                questionText: qr.questionText || null,
                markedAnswer: qr.markedAnswer || null,
                correctAnswer: qr.correctAnswer || null,
                result: qr.result,
                confidence: qr.confidence || null,
                needsReview: qr.needsReview || false,
                topic: qr.topic || null,
                subTopic: qr.subTopic || null,
                learningOutcome: qr.learningOutcome || null
              }
            });
          }
        }
      } catch (e) {
        console.error('Failed to create question results:', e);
        // Don't fail the exam creation if question results fail
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'EXAM_CREATED',
        entityType: 'Exam',
        entityId: exam.id,
        details: `Advanced exam created: ${examName} with total net ${totalNet}, OCR: ${ocrProcessed}`
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