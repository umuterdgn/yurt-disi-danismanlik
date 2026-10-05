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

    // Get student profile
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: { simulationProfile: true }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Check access
    if (dbUser.role !== 'SUPER_ADMIN' && student.advisorId !== dbUser.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      simulationProfile: student.simulationProfile
    });
  } catch (error) {
    console.error('Error fetching simulation profile:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { targetUniversity, burnoutRiskScore, ghostCompetitorGap } = body;

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

    // Get student profile
    const student = await prisma.studentProfile.findUnique({
      where: { id }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Check access
    if (dbUser.role !== 'SUPER_ADMIN' && student.advisorId !== dbUser.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Create or update simulation profile
    const simulationProfile = await prisma.simulationProfile.upsert({
      where: { studentProfileId: id },
      create: {
        studentProfileId: id,
        targetUniversity: targetUniversity || null,
        burnoutRiskScore: burnoutRiskScore || 0,
        ghostCompetitorGap: ghostCompetitorGap || null
      },
      update: {
        targetUniversity: targetUniversity !== undefined ? targetUniversity : undefined,
        burnoutRiskScore: burnoutRiskScore !== undefined ? burnoutRiskScore : undefined,
        ghostCompetitorGap: ghostCompetitorGap !== undefined ? ghostCompetitorGap : undefined,
        lastUpdated: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      simulationProfile
    });
  } catch (error) {
    console.error('Error updating simulation profile:', error);
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 });
  }
}
