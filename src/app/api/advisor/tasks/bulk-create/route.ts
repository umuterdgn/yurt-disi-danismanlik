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
    const { tasks } = body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ success: false, error: 'Görev listesi gerekli' }, { status: 400 });
    }

    // Verify authorization
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true, id: true, advisorProfile: true }
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if user can create tasks for all students in the batch
    const studentIds = [...new Set(tasks.map(t => t.studentProfileId))];
    for (const studentId of studentIds) {
      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        return NextResponse.json({ success: false, error: `Student not found: ${studentId}` }, { status: 404 });
      }

      if (dbUser.role !== 'SUPER_ADMIN' && student.advisorId !== dbUser.advisorProfile?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized to create tasks for this student' }, { status: 403 });
      }
    }

    // Bulk create tasks using transaction
    const createdTasks = await prisma.$transaction(async (tx) => {
      const tasksWithNotifications = [];
      
      for (const taskData of tasks) {
        const task = await tx.dailyTask.create({
          data: {
            studentProfileId: taskData.studentProfileId,
            title: taskData.title,
            description: taskData.description || null,
            subject: taskData.subject,
            topic: taskData.topic || null,
            taskType: taskData.taskType as any,
            studyMethod: taskData.studyMethod || 'PRACTICE',
            targetQuantity: taskData.targetQuantity,
            estimatedPomodoros: taskData.estimatedPomodoros,
            completedQuantity: 0,
            correctCount: 0,
            wrongCount: 0,
            emptyCount: 0,
            priority: taskData.priority,
            taskDate: new Date(taskData.taskDate),
            isCompleted: false,
            status: 'TODO'
          }
        });

        // Get student for notification
        const student = await tx.studentProfile.findUnique({
          where: { id: taskData.studentProfileId },
          select: { userId: true }
        });

        if (student) {
          await tx.notification.create({
            data: {
              userId: student.userId,
              title: 'Yeni Haftalık Program Görevi',
              message: `Danışmanınız size ${taskData.title} görevini ekledi.`,
              type: 'TASK',
              relatedEntityType: 'DailyTask',
              relatedEntityId: task.id
            }
          });
        }

        tasksWithNotifications.push(task);
      }

      return tasksWithNotifications;
    });

    // Revalidate paths
    for (const studentId of studentIds) {
      // We would need to revalidate student dashboard paths here
      // revalidatePath(`/student/dashboard`);
      // revalidatePath(`/student/tasks`);
    }

    return NextResponse.json({ 
      success: true, 
      tasks: createdTasks,
      message: `${createdTasks.length} görev başarıyla oluşturuldu` 
    });

  } catch (error) {
    console.error('Bulk create tasks error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Görevler oluşturulurken hata oluştu' 
    }, { status: 500 });
  }
}