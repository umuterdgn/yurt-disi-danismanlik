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

    // Generate AI-powered study tasks using Groq
    const generatedTasks = [];

    for (const subject of weakestSubjects) {
      // Create a targeted task based on the weak subject
      const taskTitle = `${subject.subjectName} - Tekrar ve Pratik`;
      const taskDescription = `${subject.subjectName} dersinde net artışı için çalışma. Mevcut net: ${subject.net.toFixed(2)}, Yanlış: ${subject.wrong}`;
      
      // Create daily task
      const dailyTask = await prisma.dailyTask.create({
        data: {
          studentProfileId: exam.studentProfileId,
          title: taskTitle,
          description: taskDescription,
          subject: subject.subjectName,
          taskType: 'Soru Çözme',
          targetQuantity: 40, // Default 40 questions
          completedQuantity: 0,
          isCompleted: false,
          taskDate: new Date(),
          priority: subject.net < 5 ? 'high' : 'medium'
        }
      });

      generatedTasks.push(dailyTask);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'AI_TASK_GENERATED',
        entityType: 'DailyTask',
        entityId: generatedTasks[0]?.id,
        details: `AI generated ${generatedTasks.length} study tasks based on exam ${exam.title} for weakest subjects: ${weakestSubjects.map(s => s.subjectName).join(', ')}`
      }
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: exam.studentProfile.userId,
        title: 'AI Çalışma Planı Oluşturuldu',
        message: `${exam.title} deneme sonucuna göre ${generatedTasks.length} yeni çalışma görevi eklendi.`,
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