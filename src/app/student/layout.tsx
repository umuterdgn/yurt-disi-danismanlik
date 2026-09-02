import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StudentLayoutClient from './student-layout-client';

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
    redirect('/dashboard');
  }

  return <StudentLayoutClient>{children}</StudentLayoutClient>;
}
