import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true, id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Role-based filtering: SUPER_ADMIN sees all, ADVISOR sees only their assigned students
    const students = await prisma.studentProfile.findMany({
      include: {
        user: true,
        advisor: {
          include: { user: true }
        }
      },
      where: dbUser.role === 'SUPER_ADMIN' ? {} : { advisorId: dbUser.id },
      orderBy: { createdAt: 'desc' }
    });

    // Get last meeting date for each student
    const studentsWithLastMeeting = await Promise.all(
      students.map(async (student) => {
        const lastMeeting = await prisma.meetingNote.findFirst({
          where: { studentProfileId: student.id },
          orderBy: { meetingDate: 'desc' }
        });

        return {
          id: student.id,
          name: student.user.name,
          grade: student.grade,
          targetUniversities: student.targetUniversities,
          currentScore: student.currentScore,
          targetScore: student.targetScore,
          lastMeetingDate: lastMeeting?.meetingDate
        };
      })
    );

    return NextResponse.json({ success: true, students: studentsWithLastMeeting });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}
