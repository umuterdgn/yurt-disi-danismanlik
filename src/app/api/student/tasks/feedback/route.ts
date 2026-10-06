import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { taskId, feedback } = await request.json();

    if (!taskId || !feedback) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;

    if (!userId || userRole !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get student profile
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true }
    });

    if (!dbUser?.studentProfile) {
      return NextResponse.json({ success: false, error: 'Student profile not found' }, { status: 404 });
    }

    // Get the task to update
    const task = await prisma.dailyTask.findFirst({
      where: {
        id: taskId,
        studentProfileId: dbUser.studentProfile.id
      }
    });

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Update task with feedback
    const updatedTask = await prisma.dailyTask.update({
      where: { id: taskId },
      data: {
        feedback: feedback,
        feedbackNotes: feedback === 'HARD' ? 'Student found this task difficult' : feedback === 'EASY' ? 'Student found this task easy' : 'Student found this task moderate'
      }
    });

    // Update Learning DNA based on feedback
    const currentLearningDNA = dbUser.studentProfile.learningDNA as any || {};
    const failedStrategies = currentLearningDNA.failedStrategies || [];

    // If feedback is HARD, add this strategy to failed strategies
    if (feedback === 'HARD' && task.studyMethod) {
      const newFailedStrategy = {
        subject: task.subject,
        topic: task.topic || 'General',
        method: task.studyMethod,
        lastAttempt: new Date().toISOString()
      };

      // Check if this strategy is already in failed strategies
      const alreadyExists = failedStrategies.some(
        (fs: any) => fs.subject === newFailedStrategy.subject &&
                     fs.topic === newFailedStrategy.topic &&
                     fs.method === newFailedStrategy.method
      );

      if (!alreadyExists) {
        failedStrategies.push(newFailedStrategy);
      }

      // Update student profile with new learning DNA
      await prisma.studentProfile.update({
        where: { id: dbUser.studentProfile.id },
        data: {
          learningDNA: {
            ...currentLearningDNA,
            failedStrategies
          }
        }
      });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Error submitting task feedback:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}
