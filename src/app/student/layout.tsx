import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StudentLayoutClient from './student-layout-client';
import { Notification } from '@prisma/client';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userRole = cookieStore.get('user_role')?.value;

    if (!userId || !userRole) {
      redirect('/login');
    }

    // Role check
    if (userRole !== 'STUDENT') {
      redirect('/login');
    }

    // Verify user exists in database
    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true, name: true }
      });
    } catch (error) {
      console.error('Prisma error in student layout:', error);
      redirect('/login');
    }

    if (!dbUser || dbUser.role !== 'STUDENT') {
      redirect('/login');
    }

    // Get student profile with serviceType
    let studentProfile = null;
    try {
      studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: userId },
        select: { serviceType: true }
      });
    } catch (error) {
      console.error('Error fetching student profile:', error);
    }

    // Get user notifications
    let notifications: Notification[] = [];
    try {
      notifications = await prisma.notification.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }

    return <StudentLayoutClient userId={userId} initialNotifications={notifications} serviceType={studentProfile?.serviceType || 'BOTH'}>{children}</StudentLayoutClient>;
  } catch (error) {
    // Allow NEXT_REDIRECT errors to pass through
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Auth error in student layout:', error);
    redirect('/login');
  }
}
