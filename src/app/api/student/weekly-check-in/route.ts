import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, stressLevel, motivationLevel, notes, weekNumber, year } = body;

    if (!studentId || !stressLevel || !motivationLevel || !weekNumber || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate stress and motivation levels (1-5)
    if (stressLevel < 1 || stressLevel > 5 || motivationLevel < 1 || motivationLevel > 5) {
      return NextResponse.json({ error: 'Stress and motivation levels must be between 1 and 5' }, { status: 400 });
    }

    // Authenticate user using custom cookie-based auth
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;

    if (!userId || userRole !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify that the student belongs to the authenticated user
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!studentProfile || studentProfile.userId !== userId) {
      return NextResponse.json({ error: 'Student profile not found or unauthorized' }, { status: 403 });
    }

    // Check if check-in already exists for this week
    const existingCheckIn = await prisma.weeklyCheckIn.findFirst({
      where: {
        studentProfileId: studentId,
        weekNumber,
        year
      }
    });

    if (existingCheckIn) {
      // Update existing check-in
      const updatedCheckIn = await prisma.weeklyCheckIn.update({
        where: { id: existingCheckIn.id },
        data: {
          stressLevel,
          motivationLevel,
          notes
        }
      });

      return NextResponse.json({ success: true, checkIn: updatedCheckIn });
    }

    // Create new check-in
    const checkIn = await prisma.weeklyCheckIn.create({
      data: {
        studentProfileId: studentId,
        stressLevel,
        motivationLevel,
        notes,
        weekNumber,
        year
      }
    });

    // Create notification for advisor if risk levels detected
    if (stressLevel >= 4 || motivationLevel <= 2) {
      if (studentProfile.advisorId) {
        await prisma.notification.create({
          data: {
            userId: studentProfile.advisorId,
            title: 'Öğrenci Risk Uyarısı',
            message: `${studentProfile.user.name} için risk durum bildirimi alındı. Stres: ${stressLevel}/5, Motivasyon: ${motivationLevel}/5`,
            type: 'MEETING',
            relatedEntityType: 'StudentProfile',
            relatedEntityId: studentId
          }
        });
      }
    }

    return NextResponse.json({ success: true, checkIn });

  } catch (error) {
    console.error('Weekly check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Authenticate user using custom cookie-based auth
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;

    if (!userId || userRole !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current week info
    const currentWeek = Math.ceil(new Date().getDate() / 7);
    const currentYear = new Date().getFullYear();

    // Check if check-in exists for this week
    const currentCheckIn = await prisma.weeklyCheckIn.findFirst({
      where: {
        studentProfileId: studentId,
        weekNumber: currentWeek,
        year: currentYear
      }
    });

    // Get recent check-ins (last 4 weeks)
    const recentCheckIns = await prisma.weeklyCheckIn.findMany({
      where: { studentProfileId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 4
    });

    return NextResponse.json({
      hasSubmittedThisWeek: !!currentCheckIn,
      currentCheckIn,
      recentCheckIns
    });

  } catch (error) {
    console.error('Get weekly check-ins error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}