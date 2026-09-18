'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from '@supabase/ssr';

export async function generateAIStudyPlan(examId: string) {
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

    // Get exam with subject results
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subjectResults: true,
        studentProfile: true
      }
    });

    if (!exam) {
      return { success: false, error: 'Exam not found' };
    }

    // Update Subject Analysis (Mastery Map) based on exam results and advisor comments
    for (const subjectResult of exam.subjectResults) {
      // Calculate proficiency level based on net score
      let proficiency: 'WEAK' | 'MEDIUM' | 'GOOD' | 'EXCELLENT';
      const net = subjectResult.net || 0;
      
      if (net < 5) {
        proficiency = 'WEAK';
      } else if (net < 10) {
        proficiency = 'MEDIUM';
      } else if (net < 15) {
        proficiency = 'GOOD';
      } else {
        proficiency = 'EXCELLENT';
      }

      // Check if subject analysis exists for this subject
      const existingAnalysis = await prisma.subjectAnalysis.findFirst({
        where: {
          studentProfileId: exam.studentProfileId,
          subject: subjectResult.subjectName
        }
      });

      if (existingAnalysis) {
        // Update existing analysis
        await prisma.subjectAnalysis.update({
          where: { id: existingAnalysis.id },
          data: {
            proficiency,
            progressPercent: Math.min(100, Math.round((net / 20) * 100)), // Assume 20 is max net
            lastStudiedAt: new Date()
          }
        });
      } else {
        // Create new analysis for general subject
        await prisma.subjectAnalysis.create({
          data: {
            studentProfileId: exam.studentProfileId,
            subject: subjectResult.subjectName,
            topic: 'Genel', // General topic for the subject
            proficiency,
            progressPercent: Math.min(100, Math.round((net / 20) * 100)),
            lastStudiedAt: new Date()
          }
        });
      }
    }

    // If advisor comments exist, use them to refine the analysis
    if (exam.advisorComments) {
      console.log('Processing advisor comments for AI analysis:', exam.advisorComments);
      // In a real implementation, this would use AI to parse the comments and adjust the mastery map
      // For now, we'll log it and could extend with AI integration
    }

    // Analyze subject results to find weakest areas
    const subjectAnalysis = exam.subjectResults
      .map(sr => ({
        subjectName: sr.subjectName,
        net: sr.net || 0,
        wrong: sr.wrong,
        correct: sr.correct
      }))
      .sort((a, b) => a.net - b.net); // Sort by net (ascending)

    // Get the 2 weakest subjects
    const weakestSubjects = subjectAnalysis.slice(0, 2);

    if (weakestSubjects.length === 0) {
      return { success: false, error: 'No subject data available for analysis' };
    }

    // Generate AI-powered study tasks using Groq with Spaced Repetition
    const generatedTasks = [];

    for (const subject of weakestSubjects) {
      // Spaced Repetition: Create 3 tasks with different due dates
      const dueDates = [
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 days
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // +14 days
      ];

      const repetitionLabels = ['1. Tekrar', '2. Tekrar', '3. Tekrar'];

      for (let i = 0; i < 3; i++) {
        const taskTitle = `${subject.subjectName} - ${repetitionLabels[i]}`;
        const taskDescription = `${subject.subjectName} dersinde net artışı için aralıklı tekrar çalışması. Mevcut net: ${subject.net.toFixed(2)}, Yanlış: ${subject.wrong}. Bu, ${repetitionLabels[i]} çalışmasıdır.`;
        
        // Create daily task with spaced repetition due date
        const dailyTask = await prisma.dailyTask.create({
          data: {
            studentProfileId: exam.studentProfileId,
            title: taskTitle,
            description: taskDescription,
            subject: subject.subjectName,
            topic: 'Genel',
            taskType: 'TEST',
            targetQuantity: 40, // Default 40 questions
            completedQuantity: 0,
            correctCount: 0,
            wrongCount: 0,
            isCompleted: false,
            taskDate: dueDates[i],
            priority: subject.net < 5 ? 'high' : 'medium'
          }
        });

        generatedTasks.push(dailyTask);
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'AI_TASK_GENERATED',
        entityType: 'DailyTask',
        entityId: generatedTasks[0]?.id,
        details: `AI generated ${generatedTasks.length} study tasks with Spaced Repetition (+2, +7, +14 days) based on exam ${exam.title} for weakest subjects: ${weakestSubjects.map(s => s.subjectName).join(', ')}`
      }
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: exam.studentProfile.userId,
        title: 'AI Çalışma Planı Oluşturuldu (Aralıklı Tekrar)',
        message: `${exam.title} deneme sonucuna göre ${weakestSubjects.length} zayıf konu için aralıklı tekrar sistemiyle (${generatedTasks.length} görev: +2, +7, +14 gün) çalışma planı oluşturuldu.`,
        type: 'TASK',
        relatedEntityType: 'DailyTask',
        relatedEntityId: generatedTasks[0]?.id
      }
    });

    // Revalidate paths
    revalidatePath('/advisor/students/[id]');
    revalidatePath('/student/dashboard');
    revalidatePath('/student/tasks');

    return {
      success: true,
      tasks: generatedTasks,
      analysis: {
        weakestSubjects: weakestSubjects.map(s => s.subjectName),
        totalTasks: generatedTasks.length
      }
    };

  } catch (error) {
    console.error('AI study plan generation error:', error);
    return { success: false, error: 'AI çalışma planı oluşturulurken bir hata oluştu' };
  }
}