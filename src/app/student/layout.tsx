import { createServerClient } from '@supabase/ssr';
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
    redirect('/login');
  }

  // Role check with Prisma
  let dbUser = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true }
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
      where: { userId: user.id },
      select: { serviceType: true }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
  }

  // Get user notifications
  let notifications: Notification[] = [];
  try {
    notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }

  return <StudentLayoutClient userId={user.id} initialNotifications={notifications} serviceType={studentProfile?.serviceType || 'BOTH'}>{children}</StudentLayoutClient>;
}
