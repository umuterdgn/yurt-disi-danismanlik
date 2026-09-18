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
      include: {
        studentProfile: {
          include: {
            advisor: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!dbUser?.studentProfile) {
      return NextResponse.json({ success: false, error: 'Student profile not found' }, { status: 404 });
    }

    const studentProfile = {
      name: dbUser.name,
      email: dbUser.email,
      grade: dbUser.studentProfile.grade,
      targetUniversities: dbUser.studentProfile.targetUniversities,
      targetScore: dbUser.studentProfile.targetScore,
      currentScore: dbUser.studentProfile.currentScore
    };

    // Get today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyTasks = await prisma.dailyTask.findMany({
      where: {
        studentProfileId: dbUser.studentProfile.id,
        taskDate: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { priority: 'desc' }
    });

    // Get exam results
    const examResults = await prisma.examResult.findMany({
      where: { studentProfileId: dbUser.studentProfile.id },
      orderBy: { examDate: 'asc' }
    });

    // Get subject analysis
    const subjectAnalysis = await prisma.subjectAnalysis.findMany({
      where: { studentProfileId: dbUser.studentProfile.id }
    });

    return NextResponse.json({
      success: true,
      studentProfile,
      dailyTasks,
      examResults,
      subjectAnalysis
    });
  } catch (error) {
    console.error('Error fetching student dashboard data:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}
