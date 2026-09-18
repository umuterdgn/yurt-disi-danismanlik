import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get student profile
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: true,
        advisor: {
          include: { user: true }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Check access: SUPER_ADMIN or assigned ADVISOR
    if (dbUser.role !== 'SUPER_ADMIN' && student.advisorId !== dbUser.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Get subject analysis
    const subjectAnalysis = await prisma.subjectAnalysis.findMany({
      where: { studentProfileId: id }
    });

    // Get meeting notes
    const meetingNotes = await prisma.meetingNote.findMany({
      where: { studentProfileId: id },
      orderBy: { meetingDate: 'desc' }
    });

    const studentData = {
      id: student.id,
      name: student.user.name,
      grade: student.grade,
      targetUniversities: student.targetUniversities,
      currentScore: student.currentScore,
      targetScore: student.targetScore
    };

    return NextResponse.json({
      success: true,
      student: studentData,
      subjectAnalysis,
      meetingNotes
    });
  } catch (error) {
    console.error('Error fetching student data:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}
