import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { TaskStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentProfileId, title, description, subject, taskType, targetQuantity, estimatedPomodoros, priority, taskDate, status } = body;

    console.log("INCOMING_TASK:", body);

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

    // Get advisor profile if user is an advisor
    const advisorProfile = await prisma.advisorProfile.findUnique({
      where: { userId: dbUser.id },
      select: { id: true }
    });

    // Check access: SUPER_ADMIN or assigned ADVISOR
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Check if user is SUPER_ADMIN or the assigned advisor
    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN';
    const isAssignedAdvisor = advisorProfile && student.advisorId === advisorProfile.id;
    
    console.log("Access check:", { isSuperAdmin, isAssignedAdvisor, advisorProfileId: advisorProfile?.id, studentAdvisorId: student.advisorId });

    if (!isSuperAdmin && !isAssignedAdvisor) {
      return NextResponse.json({ success: false, error: 'Access denied - You must be SUPER_ADMIN or the assigned advisor' }, { status: 403 });
    }

    // Validate and map taskType to enum values
    const validTaskTypes = ['TEST', 'REVIEW', 'READING', 'VIDEO', 'PRACTICE', 'PROJECT', 'EXAM', 'OTHER'];
    let mappedTaskType: string = 'PRACTICE'; // Default value

    if (taskType) {
      // If it's already a valid enum value, use it
      if (validTaskTypes.includes(taskType.toUpperCase())) {
        mappedTaskType = taskType.toUpperCase();
      } else {
        // Map Turkish/common values to enum
        const taskTypeMap: Record<string, string> = {
          'Soru çözme': 'PRACTICE',
          'soru çözme': 'PRACTICE',
          'Soru': 'PRACTICE',
          'soru': 'PRACTICE',
          'Test': 'TEST',
          'test': 'TEST',
          'Deneme': 'TEST',
          'deneme': 'TEST',
          'Tekrar': 'REVIEW',
          'tekrar': 'REVIEW',
          'Okuma': 'READING',
          'okuma': 'READING',
          'Video': 'VIDEO',
          'video': 'VIDEO',
          'Proje': 'PROJECT',
          'proje': 'PROJECT',
          'Sınav': 'EXAM',
          'sınav': 'EXAM',
          'Diğer': 'OTHER',
          'diğer': 'OTHER'
        };
        mappedTaskType = taskTypeMap[taskType] || 'PRACTICE';
      }
    }

    // Validate and map status to enum values
    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    let mappedStatus: string = 'TODO'; // Default value

    if (status) {
      if (validStatuses.includes(status.toUpperCase())) {
        mappedStatus = status.toUpperCase();
      } else {
        // Map Turkish/common values to enum
        const statusMap: Record<string, string> = {
          'Yapılacak': 'TODO',
          'yapılacak': 'TODO',
          'Devam ediyor': 'IN_PROGRESS',
          'devam ediyor': 'IN_PROGRESS',
          'İn progress': 'IN_PROGRESS',
          'Tamamlandı': 'DONE',
          'tamamlandı': 'DONE',
          'Bitti': 'DONE',
          'bitti': 'DONE'
        };
        mappedStatus = statusMap[status] || 'TODO';
      }
    }

    // Validate date format
    let validTaskDate: Date;
    if (taskDate) {
      validTaskDate = new Date(taskDate);
      if (isNaN(validTaskDate.getTime())) {
        validTaskDate = new Date();
      }
    } else {
      validTaskDate = new Date();
    }

    // Create task data
    const taskData = {
      studentProfileId,
      title,
      description,
      subject,
      taskType: mappedTaskType as any, // Prisma will validate this against the enum
      targetQuantity: targetQuantity || (estimatedPomodoros ? estimatedPomodoros * 25 : 25),
      estimatedPomodoros: estimatedPomodoros || 1,
      completedQuantity: 0,
      isCompleted: false,
      priority: priority || 'medium',
      taskDate: validTaskDate,
      status: mappedStatus as TaskStatus
    };

    console.log("PROCESSED_TASK_DATA:", taskData);

    const task = await prisma.dailyTask.create({
      data: taskData
    });

    revalidatePath('/advisor/students/[id]');
    revalidatePath('/student/dashboard');
    revalidatePath('/student/tasks');

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("TASK_ERROR:", error);
    if (error instanceof Error) {
      console.error("TASK_ERROR_MESSAGE:", error.message);
      console.error("TASK_ERROR_STACK:", error.stack);
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Görev eklenirken hata oluştu', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
