'use server';

import { prisma } from "@/lib/prisma";

export async function addMeeting(formData: FormData) {
  try {
    const studentProfileId = formData.get('studentProfileId') as string;
    const meetingDate = formData.get('meetingDate') as string;
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : 60;
    const motivationLevel = formData.get('motivationLevel') as string;
    const issues = formData.get('issues') as string;
    const achievements = formData.get('achievements') as string;
    const actionItems = formData.get('actionItems') as string;
    const nextMeetingDate = formData.get('nextMeetingDate') as string;
    const notes = formData.get('notes') as string;
    const zoomLink = formData.get('zoomLink') as string;

    // Validation
    if (!studentProfileId || !meetingDate) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' };
    }

    // Create meeting note
    const meetingData: any = {
      studentProfileId,
      meetingDate: new Date(meetingDate),
      duration,
      motivationLevel,
      notes
    };

    if (issues) meetingData.issues = issues;
    if (achievements) meetingData.achievements = achievements;
    if (actionItems) meetingData.actionItems = actionItems;
    if (nextMeetingDate) meetingData.nextMeetingDate = new Date(nextMeetingDate);
    if (zoomLink) meetingData.notes += `\n\nZoom Link: ${zoomLink}`;

    const meeting = await prisma.meetingNote.create({
      data: meetingData
    });

    return {
      success: true,
      meeting
    };

  } catch (error) {
    console.error('Add meeting error:', error);
    return { success: false, error: 'Görüşme eklenirken bir hata oluştu' };
  }
}
