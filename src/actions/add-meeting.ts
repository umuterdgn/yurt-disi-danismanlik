'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from '@supabase/ssr';

export async function addMeeting(formData: FormData) {
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

    // If nextMeetingDate is provided, create a follow-up appointment
    if (nextMeetingDate) {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        include: { user: true }
      });

      if (studentProfile) {
        const nextMeetingDateTime = new Date(nextMeetingDate);
        const appointmentEndTime = new Date(nextMeetingDateTime.getTime() + duration * 60000);

        const appointment = await prisma.appointment.create({
          data: {
            creatorId: dbUser.id,
            title: `Görüşme Takibi - ${studentProfile.user.name}`,
            description: `Önceki görüşmeden (${new Date(meetingDate).toLocaleDateString('tr-TR')}) sonra planlanan takip görüşmesi.`,
            appointmentType: 'follow_up',
            startTime: nextMeetingDateTime,
            endTime: appointmentEndTime,
            location: zoomLink ? 'Online (Zoom)' : 'Office',
            zoomMeetingUrl: zoomLink || null,
            status: 'scheduled'
          }
        });

        // Add student as participant
        await prisma.appointmentParticipant.create({
          data: {
            appointmentId: appointment.id,
            userId: studentProfile.userId,
            status: 'accepted'
          }
        });

        // Create notification for student
        await prisma.notification.create({
          data: {
            userId: studentProfile.userId,
            title: 'Yeni Görüşme Planlandı',
            message: `${nextMeetingDateTime.toLocaleDateString('tr-TR')} tarihinde ${nextMeetingDateTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}'de yeni bir görüşme planlandı.`,
            type: 'MEETING',
            relatedEntityType: 'Appointment',
            relatedEntityId: appointment.id
          }
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'MEETING_CREATED',
        entityType: 'MeetingNote',
        entityId: meeting.id,
        details: `Meeting note created for student ${studentProfileId} with duration ${duration} minutes${nextMeetingDate ? ' and follow-up appointment scheduled' : ''}`
      }
    });

    // Revalidate paths
    revalidatePath('/advisor/meetings');
    revalidatePath('/advisor/students/[id]');
    revalidatePath('/student/dashboard');

    return {
      success: true,
      meeting,
      followUpCreated: !!nextMeetingDate
    };

  } catch (error) {
    console.error('Add meeting error:', error);
    return { success: false, error: 'Görüşme eklenirken bir hata oluştu' };
  }
}

export async function rescheduleMeeting(meetingId: string, newDate: string, newTime: string) {
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

    // Parse the new date and time
    const [year, month, day] = newDate.split('-').map(Number);
    const [hours, minutes] = newTime.split(':').map(Number);
    const newMeetingDate = new Date(year, month - 1, day, hours, minutes);

    // Update the meeting note
    const meeting = await prisma.meetingNote.update({
      where: { id: meetingId },
      data: {
        meetingDate: newMeetingDate
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'MEETING_RESCHEDULED',
        entityType: 'MeetingNote',
        entityId: meeting.id,
        details: `Meeting rescheduled to ${newMeetingDate.toLocaleDateString('tr-TR')} at ${newMeetingDate.toLocaleTimeString('tr-TR')}`
      }
    });

    // Revalidate paths
    revalidatePath('/advisor/meetings');
    revalidatePath('/advisor/students/[id]');

    return {
      success: true,
      meeting
    };

  } catch (error) {
    console.error('Reschedule meeting error:', error);
    return { success: false, error: 'Görüşme ertelenirken bir hata oluştu' };
  }
}
