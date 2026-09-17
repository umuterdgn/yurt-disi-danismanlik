import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminLayoutClient from './admin-layout-client';

export default async function AdminLayout({
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
    if (userRole !== 'SUPER_ADMIN') {
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
      console.error('Prisma error in admin layout:', error);
      redirect('/login');
    }

    if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
      redirect('/login');
    }

    return <AdminLayoutClient>{children}</AdminLayoutClient>;
  } catch (error) {
    // Allow NEXT_REDIRECT errors to pass through
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Auth error in admin layout:', error);
    redirect('/login');
  }
}