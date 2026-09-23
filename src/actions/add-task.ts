'use server';

import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { NotificationType } from '@prisma/client';

export async function addTask(formData: FormData) {
  try {
    const studentProfileId = formData.get('studentProfileId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const subject = formData.get('subject') as string;
    const topic = formData.get('topic') as string;
    const subjectId = formData.get('subjectId') as string;
    const topicId = formData.get('topicId') as string;
    const questionTypeId = formData.get('questionTypeId') as string;
    const taskType = formData.get('taskType') as string;
    const studyMethod = formData.get('studyMethod') as string;
    const estimatedPomodoros = parseInt(formData.get('estimatedPomodoros') as string);
    const priority = formData.get('priority') as string;
    const taskDate = formData.get('taskDate') as string;

    // Validation
    if (!studentProfileId || !title || !subject || !taskType || !estimatedPomodoros || !taskDate) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' };
    }

    // Get student profile to get userId
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { userId: true }
    });

    if (!studentProfile) {
      return { success: false, error: 'Öğrenci profili bulunamadı' };
    }

    // Create task with curriculum references
    const task = await prisma.dailyTask.create({
      data: {
        studentProfileId,
        title,
        description: description || null,
        subject, // Keep for backward compatibility
        subjectId: subjectId || null, // New curriculum reference
        topic: topic || null, // Keep for backward compatibility
        topicId: topicId || null, // New curriculum reference
        questionTypeId: questionTypeId || null, // New curriculum reference
        taskType: taskType as any, // Convert to TaskType enum
        studyMethod: studyMethod || 'PRACTICE', // New study method field
        targetQuantity: estimatedPomodoros, // Keep targetQuantity for compatibility
        estimatedPomodoros,
        completedQuantity: 0,
        correctCount: 0,
        wrongCount: 0,
        emptyCount: 0,
        priority,
        taskDate: new Date(taskDate),
        isCompleted: false,
        status: 'TODO' // Set default status
      }
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: studentProfile.userId,
        title: 'Yeni Görev Atandı',
        message: `Danışmanınız size yeni bir görev atadı: ${title}`,
        type: NotificationType.TASK,
        relatedEntityType: 'DailyTask',
        relatedEntityId: task.id
      }
    });

    revalidatePath('/student/dashboard');
    revalidatePath('/student/tasks');

    return {
      success: true,
      task
    };

  } catch (error) {
    console.error('Add task error:', error);
    return { success: false, error: 'Görev eklenirken bir hata oluştu' };
  }
}

export async function updateTaskCompletion(taskId: string, isCompleted: boolean) {
  try {
    // Get the task with student profile
    const task = await prisma.dailyTask.findUnique({
      where: { id: taskId },
      include: { studentProfile: true }
    });

    if (!task) {
      return { success: false, error: 'Görev bulunamadı' };
    }

    // Update task completion status
    const updatedTask = await prisma.dailyTask.update({
      where: { id: taskId },
      data: { isCompleted }
    });

    // Update student XP based on task completion
    const xpChange = isCompleted ? 50 : -50;
    
    await prisma.studentProfile.update({
      where: { id: task.studentProfileId },
      data: {
        xp: {
          increment: xpChange
        }
      }
    });

    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Update task error:', error);
    return { success: false, error: 'Görev güncellenirken bir hata oluştu' };
  }
}

export async function updateTaskStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') {
  try {
    const task = await prisma.dailyTask.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return { success: false, error: 'Görev bulunamadı' };
    }

    const updatedTask = await prisma.dailyTask.update({
      where: { id: taskId },
      data: { status }
    });

    revalidatePath('/advisor/tasks');
    revalidatePath('/advisor/students/[id]');

    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Update task status error:', error);
    return { success: false, error: 'Görev durumu güncellenirken bir hata oluştu' };
  }
}

export async function addSuggestedTask(studentProfileId: string, recommendation: any) {
  try {
    // Get student profile to get userId
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { userId: true }
    });

    if (!studentProfile) {
      return { success: false, error: 'Öğrenci profili bulunamadı' };
    }

    // Create task from AI recommendation
    const task = await prisma.dailyTask.create({
      data: {
        studentProfileId,
        title: `${recommendation.topic} Konu Tekrarı`,
        description: recommendation.reason,
        subject: recommendation.subject,
        topic: recommendation.topic,
        taskType: 'REVIEW',
        targetQuantity: 20,
        estimatedPomodoros: 4,
        completedQuantity: 0,
        correctCount: 0,
        wrongCount: 0,
        priority: recommendation.priority,
        taskDate: new Date(),
        isCompleted: false,
        status: 'TODO'
      }
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: studentProfile.userId,
        title: 'Yeni Görev Atandı',
        message: `Danışmanınız size yeni bir görev atadı: ${recommendation.topic} Konu Tekrarı`,
        type: NotificationType.TASK,
        relatedEntityType: 'DailyTask',
        relatedEntityId: task.id
      }
    });

    revalidatePath('/student/dashboard');
    revalidatePath('/student/tasks');
    revalidatePath('/advisor/students/[id]');

    return {
      success: true,
      task
    };

  } catch (error) {
    console.error('Add suggested task error:', error);
    return { success: false, error: 'Önerilen görev eklenirken bir hata oluştu' };
  }
}

export async function completeTaskWithPerformance(taskId: string, correct: number, wrong: number, empty: number) {
  try {
    // Get the task with student profile
    const task = await prisma.dailyTask.findUnique({
      where: { id: taskId },
      include: { studentProfile: true }
    });

    if (!task) {
      return { success: false, error: 'Görev bulunamadı' };
    }

    // Update task with performance data
    const updatedTask = await prisma.dailyTask.update({
      where: { id: taskId },
      data: {
        isCompleted: true,
        status: 'DONE',
        correctCount: correct,
        wrongCount: wrong,
        emptyCount: empty,
        completedQuantity: correct + wrong + empty
      }
    });

    // Update student XP based on task completion
    const xpChange = 50;
    
    await prisma.studentProfile.update({
      where: { id: task.studentProfileId },
      data: {
        xp: {
          increment: xpChange
        }
      }
    });

    // Update SubjectAnalysis for mastery tracking with holistic analysis (if task has subject and topic)
    if (task.subject && task.topic) {
      const totalQuestions = correct + wrong + empty;
      const successRate = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

      // Find existing subject analysis
      const existingAnalysis = await prisma.subjectAnalysis.findFirst({
        where: {
          studentProfileId: task.studentProfileId,
          subject: task.subject,
          topic: task.topic
        }
      });

      if (existingAnalysis) {
        // Update existing analysis with weighted average (30% weight for task data)
        const currentProficiency = existingAnalysis.progressPercent || 0;
        const newProficiency = (currentProficiency * 0.7) + (successRate * 0.3);
        
        let newProficiencyLevel: 'WEAK' | 'MEDIUM' | 'GOOD' | 'EXCELLENT' = 'MEDIUM';
        if (newProficiency >= 86) newProficiencyLevel = 'EXCELLENT';
        else if (newProficiency >= 71) newProficiencyLevel = 'GOOD';
        else if (newProficiency >= 41) newProficiencyLevel = 'MEDIUM';
        else newProficiencyLevel = 'WEAK';

        // Update dataSource to BOTH if it was previously only EXAM, otherwise keep as TASK
        const newDataSource = existingAnalysis.dataSource === 'EXAM' ? 'BOTH' : 'TASK';

        // Calculate task net score
        const taskNet = correct - (wrong / 4);

        // Get current study methods and add the new one
        const currentStudyMethods = existingAnalysis.studyMethods || [];
        const newStudyMethod = task.studyMethod || 'PRACTICE';
        const updatedStudyMethods = [...new Set([...currentStudyMethods, newStudyMethod])];

        await prisma.subjectAnalysis.update({
          where: { id: existingAnalysis.id },
          data: {
            progressPercent: Math.round(newProficiency),
            proficiency: newProficiencyLevel,
            lastStudiedAt: new Date(),
            dataSource: newDataSource,
            // Holistic Analysis: Task Data
            taskNetScore: taskNet,
            taskTotalQuestions: totalQuestions,
            taskCorrect: correct,
            studyMethods: updatedStudyMethods
          }
        });
      } else {
        // Create new subject analysis from task data with holistic data
        let proficiencyLevel: 'WEAK' | 'MEDIUM' | 'GOOD' | 'EXCELLENT' = 'MEDIUM';
        if (successRate >= 86) proficiencyLevel = 'EXCELLENT';
        else if (successRate >= 71) proficiencyLevel = 'GOOD';
        else if (successRate >= 41) proficiencyLevel = 'MEDIUM';
        else proficiencyLevel = 'WEAK';

        // Calculate task net score
        const taskNet = correct - (wrong / 4);

        await prisma.subjectAnalysis.create({
          data: {
            studentProfileId: task.studentProfileId,
            subject: task.subject,
            topic: task.topic,
            proficiency: proficiencyLevel,
            progressPercent: Math.round(successRate),
            lastStudiedAt: new Date(),
            dataSource: 'TASK', // Initially from task data
            // Holistic Analysis: Task Data
            taskNetScore: taskNet,
            taskTotalQuestions: totalQuestions,
            taskCorrect: correct,
            studyMethods: [task.studyMethod || 'PRACTICE']
          }
        });
      }
    }

    revalidatePath('/student/dashboard');
    revalidatePath('/student/tasks');
    revalidatePath('/advisor/students/[id]');
    revalidatePath('/advisor/dashboard');

    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Complete task with performance error:', error);
    return { success: false, error: 'Görev tamamlanırken bir hata oluştu' };
  }
}
