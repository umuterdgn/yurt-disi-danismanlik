import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { studentId, targetScore, targetUniversity, targetMajor } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }

    // Check if user is authorized to edit this student
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true, id: true, advisorProfile: true }
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check authorization
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    if (dbUser.role !== 'SUPER_ADMIN' && student.advisorId !== dbUser.advisorProfile?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized to edit this student' }, { status: 403 });
    }

    // Update student information
    const updatedStudent = await prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        targetScore: targetScore !== null ? parseFloat(targetScore.toString()) : null,
        targetUniversity: targetUniversity || null,
        targetMajor: targetMajor || null
      }
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}