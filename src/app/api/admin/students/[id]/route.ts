import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    switch (action) {
      case 'approve':
        // Approve student account
        await prisma.user.update({
          where: { id: student.userId },
          data: { isApproved: true }
        });
        return NextResponse.json({ success: true, message: 'Öğrenci hesabı onaylandı' });

      case 'reject':
        // Reject/delete student account
        await prisma.studentProfile.delete({
          where: { id }
        });
        return NextResponse.json({ success: true, message: 'Öğrenci başvurusu reddedildi' });

      case 'freeze':
        // Freeze student account
        await prisma.user.update({
          where: { id: student.userId },
          data: { isActive: false }
        });
        return NextResponse.json({ success: true, message: 'Öğrenci hesabı donduruldu' });

      case 'activate':
        // Activate frozen student account
        await prisma.user.update({
          where: { id: student.userId },
          data: { isActive: true }
        });
        return NextResponse.json({ success: true, message: 'Öğrenci hesabı aktifleştirildi' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating student status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}