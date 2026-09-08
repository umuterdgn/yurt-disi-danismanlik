'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addApplication(formData: FormData) {
  try {
    const studentProfileId = formData.get('studentProfileId') as string;
    const universityId = formData.get('universityId') as string;
    const program = formData.get('program') as string;
    const semester = formData.get('semester') as string;
    const year = parseInt(formData.get('year') as string);
    const status = formData.get('status') as string;

    // Validation
    if (!studentProfileId || !universityId || !program || !semester || !year || !status) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' };
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        studentProfileId,
        universityId,
        program,
        semester,
        year,
        status: status as any
      }
    });

    revalidatePath('/admin/applications');

    return {
      success: true,
      application
    };

  } catch (error) {
    console.error('Add application error:', error);
    return { success: false, error: 'Başvuru eklenirken bir hata oluştu' };
  }
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  try {
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: status as any }
    });

    revalidatePath('/admin/applications');

    return { success: true, application };
  } catch (error) {
    console.error('Update application status error:', error);
    return { success: false, error: 'Durum güncellenirken bir hata oluştu' };
  }
}
