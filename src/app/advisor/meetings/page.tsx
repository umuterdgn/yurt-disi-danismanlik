import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AdvisorMeetingsCalendar } from "@/components/advisor-meetings-calendar";

export default async function MeetingsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  const userRole = cookieStore.get('user_role')?.value;

  let advisorProfileId = null;
  let userName = 'Danışman';

  if (userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          advisorProfile: true
        }
      });
      if (dbUser) {
        advisorProfileId = dbUser.advisorProfile?.id;
        userName = dbUser.name;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  let meetingNotes: any[] = [];
  let students: { id: string; name: string }[] = [];

  if (userRole === 'SUPER_ADMIN') {
    const allStudents = await prisma.studentProfile.findMany({
      include: { user: true }
    });
    students = allStudents.map(s => ({ id: s.id, name: s.user.name }));

    meetingNotes = await prisma.meetingNote.findMany({
      include: {
        studentProfile: {
          include: {
            user: true
          }
        }
      },
      orderBy: { meetingDate: 'desc' }
    });
  } else if (advisorProfileId) {
    const advisorStudents = await prisma.studentProfile.findMany({
      where: { advisorId: advisorProfileId },
      include: { user: true }
    });
    students = advisorStudents.map(s => ({ id: s.id, name: s.user.name }));

    meetingNotes = await prisma.meetingNote.findMany({
      where: {
        studentProfile: {
          advisorId: advisorProfileId
        }
      },
      include: {
        studentProfile: {
          include: {
            user: true
          }
        }
      },
      orderBy: { meetingDate: 'desc' }
    });
  }

  return (
    <AdvisorMeetingsCalendar 
      meetings={meetingNotes}
      students={students}
      userName={userName}
    />
  );
}
