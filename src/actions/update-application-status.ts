'use server';

import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";

export async function updateApplicationStatus(applicationId: string, newStatus: ApplicationStatus) {
  try {
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: newStatus }
    });

    return {
      success: true,
      application
    };

  } catch (error) {
    console.error('Update application status error:', error);
    return { success: false, error: 'Başvuru durumu güncellenirken bir hata oluştu' };
  }
}
