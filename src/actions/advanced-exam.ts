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
    let turkishCorrect = parseInt(formData.get('turkish_correct') as string) || 0;
    let turkishWrong = parseInt(formData.get('turkish_wrong') as string) || 0;
    let turkishEmpty = parseInt(formData.get('turkish_empty') as string) || 0;

    let mathCorrect = parseInt(formData.get('math_correct') as string) || 0;
    let mathWrong = parseInt(formData.get('math_wrong') as string) || 0;
    let mathEmpty = parseInt(formData.get('math_empty') as string) || 0;

    let scienceCorrect = parseInt(formData.get('science_correct') as string) || 0;
    let scienceWrong = parseInt(formData.get('science_wrong') as string) || 0;
    let scienceEmpty = parseInt(formData.get('science_empty') as string) || 0;

    let socialCorrect = parseInt(formData.get('social_correct') as string) || 0;
    let socialWrong = parseInt(formData.get('social_wrong') as string) || 0;
    let socialEmpty = parseInt(formData.get('social_empty') as string) || 0;

    // Validation
    if (!studentProfileId || !examName || !examDate || !examType) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' };
    }

    // Calculate individual nets (backend recalculation)
    const turkishNet = turkishCorrect - (turkishWrong / 4);
    const mathNet = mathCorrect - (mathWrong / 4);
    const scienceNet = scienceCorrect - (scienceWrong / 4);
    const socialNet = socialCorrect - (socialWrong / 4);

    // Recalculate total net from verified counts
    const verifiedTotalNet = turkishNet + mathNet + scienceNet + socialNet;

    console.log('Final verified totals:', {
      turkishNet,
      mathNet,
      scienceNet,
      socialNet,
      totalNet: verifiedTotalNet
    });

    // Parse answer key if provided
    let answerKey: Record<string, string> | null = null;
    if (answerKeyJson) {
      try {
        answerKey = JSON.parse(answerKeyJson);
      } catch (e) {
        console.error('Failed to parse answer key:', e);
      }
    }

    // Parse question results if provided
    let parsedQuestionResults: any[] = [];
    if (questionResultsJson) {
      try {
        parsedQuestionResults = JSON.parse(questionResultsJson);
      } catch (e) {
        console.error('Failed to parse question results:', e);
      }
    }

    const hasOCRData = ocrProcessed && parsedQuestionResults.length > 0;

    // If OCR data is available, recalculate scores from question results (backend verification)
    if (hasOCRData) {
      // Reset counts
      turkishCorrect = 0; turkishWrong = 0; turkishEmpty = 0;
      mathCorrect = 0; mathWrong = 0; mathEmpty = 0;
      scienceCorrect = 0; scienceWrong = 0; scienceEmpty = 0;
      socialCorrect = 0; socialWrong = 0; socialEmpty = 0;

      // Calculate real scores from question results
      for (const qr of parsedQuestionResults) {
        const subject = qr.subject || 'unknown';
        
        // Count based on result field (already compared with answer key in OCR route)
        if (qr.result === 'CORRECT') {
          if (subject === 'turkish') turkishCorrect++;
          else if (subject === 'math') mathCorrect++;
          else if (subject === 'science') scienceCorrect++;
          else if (subject === 'social') socialCorrect++;
        } else if (qr.result === 'WRONG') {
          if (subject === 'turkish') turkishWrong++;
          else if (subject === 'math') mathWrong++;
          else if (subject === 'science') scienceWrong++;
          else if (subject === 'social') socialWrong++;
        } else if (qr.result === 'EMPTY') {
          if (subject === 'turkish') turkishEmpty++;
          else if (subject === 'math') mathEmpty++;
          else if (subject === 'science') scienceEmpty++;
          else if (subject === 'social') socialEmpty++;
        }
      }

      console.log('Backend recalculation from OCR:', {
        turkish: { correct: turkishCorrect, wrong: turkishWrong, empty: turkishEmpty },
        math: { correct: mathCorrect, wrong: mathWrong, empty: mathEmpty },
        science: { correct: scienceCorrect, wrong: scienceWrong, empty: scienceEmpty },
        social: { correct: socialCorrect, wrong: socialWrong, empty: socialEmpty }
      });
    }

    // Create exam with subject results and advisor comments
    const exam = await prisma.exam.create({
      data: {
        studentProfileId,
        title: examName,
        date: new Date(examDate),
        totalNet: verifiedTotalNet, // Use backend-calculated net
        totalScore: verifiedTotalNet * 10, // Approximate score calculation
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
    if (hasOCRData) {
      try {
        // Map subject names to match database
        const subjectNameMap: Record<string, string> = {
          'turkish': 'Türkçe',
          'math': 'Matematik',
          'science': 'Fen Bilimleri',
          'social': 'Sosyal Bilimler'
        };

        for (const qr of parsedQuestionResults) {
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

    // Run topic analysis if OCR was used
    if (hasOCRData) {
      try {
        const { analyzeExamTopics } = await import('./exam-topic-analysis');
        const analysisResult = await analyzeExamTopics(exam.id);
        
        if (analysisResult.success) {
          console.log('Topic analysis completed:', analysisResult);
        }
      } catch (error) {
        console.error('Failed to run topic analysis:', error);
        // Don't fail the exam creation if topic analysis fails
      }
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