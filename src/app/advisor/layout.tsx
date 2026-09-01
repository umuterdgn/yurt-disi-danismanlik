import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdvisorLayoutClient from './advisor-layout-client';

export default async function AdvisorLayout({
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
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { role: true }
  });

  if (!dbUser || dbUser.role !== 'ADVISOR') {
    redirect('/dashboard');
  }

  return <AdvisorLayoutClient>{children}</AdvisorLayoutClient>;
}
