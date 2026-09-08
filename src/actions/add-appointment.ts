'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addAppointment(formData: FormData) {
  try {
    const studentProfileId = formData.get('studentProfileId') as string;
    const meetingDate = formData.get('meetingDate') as string;
    const duration = parseInt(formData.get('duration') as string);
    const motivationLevel = formData.get('motivationLevel') as string;
    const issues = formData.get('issues') as string;
    const achievements = formData.get('achievements') as string;
    const actionItems = formData.get('actionItems') as string;
    const notes = formData.get('notes') as string;

    // Validation
    if (!studentProfileId || !meetingDate || !duration || !motivationLevel || !notes) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' };
    }

    // Create meeting note
    const appointment = await prisma.meetingNote.create({
      data: {
        studentProfileId,
        meetingDate: new Date(meetingDate),
        duration,
        motivationLevel,
        issues: issues || null,
        achievements: achievements || null,
        actionItems: actionItems || null,
        notes
      }
    });

    revalidatePath('/admin/appointments');

    return {
      success: true,
      appointment
    };

  } catch (error) {
    console.error('Add appointment error:', error);
    return { success: false, error: 'Randevu eklenirken bir hata oluştu' };
  }
}
