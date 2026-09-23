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
    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get('since');
    
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
      select: { role: true, id: true, advisorProfile: true }
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check access to student
    const student = await prisma.studentProfile.findUnique({
      where: { id }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    if (dbUser.role !== 'SUPER_ADMIN' && student.advisorId !== dbUser.advisorProfile?.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Build where clause
    const whereClause: any = {
      studentProfileId: id
    };

    if (since) {
      whereClause.taskDate = {
        gte: new Date(since)
      };
    }

    const tasks = await prisma.dailyTask.findMany({
      where: whereClause,
      orderBy: { taskDate: 'desc' }
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching student tasks:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}
