"use server";

import { prisma } from "@/lib/prisma";
import { checkAndAwardBadges } from "@/actions/badge-engine";
import { revalidatePath } from "next/cache";

export async function toggleTaskCompletion(taskId: string) {
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

    // Toggle isCompleted status
    const updatedTask = await prisma.dailyTask.update({
      where: { id: taskId },
      data: {
        isCompleted: !task.isCompleted,
        completedQuantity: !task.isCompleted ? task.targetQuantity : 0
      }
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
