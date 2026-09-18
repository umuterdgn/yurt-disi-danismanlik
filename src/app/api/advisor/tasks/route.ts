import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentProfileId, title, description, subject, taskType, targetQuantity, estimatedPomodoros, priority, taskDate } = body;

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

    // Create task
    const task = await prisma.dailyTask.create({
      data: {
        studentProfileId,
        title,
        description,
        subject,
        taskType: taskType || 'Soru çözme',
        targetQuantity: targetQuantity || (estimatedPomodoros ? estimatedPomodoros * 25 : 25), // Default to 25 minutes if not provided
        estimatedPomodoros: estimatedPomodoros || 1,
        completedQuantity: 0,
        isCompleted: false,
        priority: priority || 'medium',
        taskDate: taskDate ? new Date(taskDate) : new Date()
      }
    });

    revalidatePath('/advisor/students/[id]');
    revalidatePath('/student/dashboard');
    revalidatePath('/student/tasks');

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
