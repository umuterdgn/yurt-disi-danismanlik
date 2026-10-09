import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;

    if (!userId || userRole !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUniversity, targetMajor, targetScore } = body;

    // Validation
    if (!targetUniversity || !targetMajor || !targetScore) {
      return NextResponse.json({ success: false, error: 'Tüm alanları doldurunuz' }, { status: 400 });
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId }
    });

    if (!studentProfile) {
      return NextResponse.json({ success: false, error: 'Öğrenci profili bulunamadı' }, { status: 404 });
    }

    // Update student profile
    const updatedProfile = await prisma.studentProfile.update({
      where: { id: studentProfile.id },
      data: {
        targetUniversity,
        targetMajor,
        targetScore: parseFloat(targetScore)
      }
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error('Error updating target:', error);
    return NextResponse.json({ success: false, error: 'Hedef güncellenirken hata oluştu' }, { status: 500 });
  }
}
