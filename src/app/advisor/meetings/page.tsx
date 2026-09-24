import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AdvisorMeetingsCalendar } from "@/components/advisor-meetings-calendar";

export default async function MeetingsPage() {
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
  
  let meetingNotes: any[] = [];
  let students: { id: string; name: string }[] = [];
  let userName = 'Danışman';

  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        advisorProfile: true
      }
    });

    if (dbUser) {
      userName = dbUser.name;

      // Get students for the dialog
      if (dbUser.role === 'SUPER_ADMIN') {
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
      } else if (dbUser.advisorProfile) {
        const advisorStudents = await prisma.studentProfile.findMany({
          where: { advisorId: dbUser.advisorProfile.id },
          include: { user: true }
        });
        students = advisorStudents.map(s => ({ id: s.id, name: s.user.name }));
        
        meetingNotes = await prisma.meetingNote.findMany({
          where: {
            studentProfile: {
              advisorId: dbUser.advisorProfile.id
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
    }
  }

  return (
    <AdvisorMeetingsCalendar 
      meetings={meetingNotes}
      students={students}
      userName={userName}
    />
  );
}
