import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      studentProfileId, 
      meetingDate, 
      duration, 
      motivationLevel, 
      issues, 
      achievements, 
      actionItems, 
      notes, 
      nextMeetingDate 
    } = body;

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

    // Check access: SUPER_ADMIN or assigned ADVISOR
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    if (dbUser.role !== 'SUPER_ADMIN' && student.advisorId !== dbUser.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Create meeting note
    const meeting = await prisma.meetingNote.create({
      data: {
        studentProfileId,
        meetingDate: new Date(meetingDate),
        duration,
        motivationLevel,
        issues,
        achievements,
        actionItems,
        notes,
        nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate) : null
      }
    });

    revalidatePath('/advisor/students/[id]');

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}
