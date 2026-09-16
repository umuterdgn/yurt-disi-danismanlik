import { createServerClient } from '@supabase/ssr';
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