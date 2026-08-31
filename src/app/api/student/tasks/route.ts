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

    // Get student profile
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: { studentProfile: true }
    });

    if (!dbUser?.studentProfile) {
      return NextResponse.json({ success: false, error: 'Student profile not found' }, { status: 404 });
    }

    // Get today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.dailyTask.findMany({
      where: {
        studentProfileId: dbUser.studentProfile.id,
        taskDate: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { priority: 'desc' }
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { taskId, isCompleted, completedQuantity } = await request.json();

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

    // Get student profile
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: { studentProfile: true }
    });

    if (!dbUser?.studentProfile) {
      return NextResponse.json({ success: false, error: 'Student profile not found' }, { status: 404 });
    }

    // Update task
    const updateData: any = {};
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
    }
    if (completedQuantity !== undefined) {
      updateData.completedQuantity = completedQuantity;
    }

    const task = await prisma.dailyTask.update({
      where: {
        id: taskId,
        studentProfileId: dbUser.studentProfile.id
      },
      data: updateData
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}
