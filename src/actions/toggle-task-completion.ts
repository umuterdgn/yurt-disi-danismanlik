"use server";

import { prisma } from "@/lib/prisma";
import { checkAndAwardBadges } from "@/actions/badge-engine";
import { revalidatePath } from "next/cache";

export async function toggleTaskCompletion(taskId: string, correctCount?: number, wrongCount?: number) {
  try {
    // Get current task with student profile
    const task = await prisma.dailyTask.findUnique({
      where: { id: taskId },
      include: {
        studentProfile: {
          select: { id: true }
        }
      }
    });

    if (!task) {
      return { success: false, error: "Görev bulunamadı" };
    }

    // Check if task type requires performance tracking
    const requiresPerformanceTracking = task.taskType === 'TEST' || task.taskType === 'EXAM';
    
    // If task is being completed and requires performance tracking, check if counts are provided
    if (!task.isCompleted && requiresPerformanceTracking) {
      if (correctCount === undefined || wrongCount === undefined) {
        return { 
          success: false, 
          error: "Bu görev türü için performans verileri gerekli",
          requiresPerformance: true,
          taskType: task.taskType
        };
      }
    }

    // Prepare update data
    const updateData: any = {
      isCompleted: !task.isCompleted,
      completedQuantity: !task.isCompleted ? task.targetQuantity : 0
    };

    // Add performance tracking if applicable
    if (!task.isCompleted && requiresPerformanceTracking && correctCount !== undefined && wrongCount !== undefined) {
      updateData.correctCount = correctCount;
      updateData.wrongCount = wrongCount;
    } else if (task.isCompleted) {
      // Reset performance data when uncompleting
      updateData.correctCount = 0;
      updateData.wrongCount = 0;
    }

    // Toggle isCompleted status
    const updatedTask = await prisma.dailyTask.update({
      where: { id: taskId },
      data: updateData
    });

    // If task is being completed, check for badges
    if (updatedTask.isCompleted && task.studentProfile) {
      const badgeResult = await checkAndAwardBadges(task.studentProfile.id);
      if (badgeResult.success && badgeResult.newBadges && badgeResult.newBadges.length > 0) {
        return { 
          success: true, 
          task: updatedTask,
          newBadges: badgeResult.newBadges,
          message: `Tebrikler! Yeni rozetler kazandınız: ${badgeResult.newBadges.join(', ')}`
        };
      }
    }

    revalidatePath('/student/dashboard');
    revalidatePath('/student/tasks');

    return { success: true, task: updatedTask };
  } catch (error) {
    console.error("Görev tamamlama hatası:", error);
    return { success: false, error: "Görev durumu güncellenirken bir hata oluştu" };
  }
}
