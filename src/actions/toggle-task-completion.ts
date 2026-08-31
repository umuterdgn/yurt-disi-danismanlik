"use server";

import { prisma } from "@/lib/prisma";

export async function toggleTaskCompletion(taskId: string) {
  try {
    // Get current task
    const task = await prisma.dailyTask.findUnique({
      where: { id: taskId }
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

    return { success: true, task: updatedTask };
  } catch (error) {
    console.error("Görev tamamlama hatası:", error);
    return { success: false, error: "Görev durumu güncellenirken bir hata oluştu" };
  }
}
