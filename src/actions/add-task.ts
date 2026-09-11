'use server';

import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { NotificationType } from '@prisma/client';

export async function addTask(formData: FormData) {
  try {
    const studentProfileId = formData.get('studentProfileId') as string;
    const title = formData.get('title') as string;
    const subject = formData.get('subject') as string;
    const taskType = formData.get('taskType') as string;
    const targetQuantity = parseInt(formData.get('targetQuantity') as string);
    const priority = formData.get('priority') as string;
    const taskDate = formData.get('taskDate') as string;

    // Validation
    if (!studentProfileId || !title || !subject || !taskType || !targetQuantity || !taskDate) {
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

    // Create task
    const task = await prisma.dailyTask.create({
      data: {
        studentProfileId,
        title,
        subject,
        taskType,
        targetQuantity,
        completedQuantity: 0,
        priority,
        taskDate: new Date(taskDate),
        isCompleted: false
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
