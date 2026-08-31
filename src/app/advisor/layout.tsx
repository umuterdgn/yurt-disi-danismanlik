import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Sidebar } from '@/components/sidebar';
import { prisma } from '@/lib/prisma';

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
  
  let userRole: 'SUPER_ADMIN' | 'ADVISOR' | 'COACH' = 'ADVISOR';
  let advisorType: 'COACH' | 'CONSULTANT' | 'BOTH' = 'BOTH';

  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true, id: true }
    });
    
    if (dbUser?.role === 'SUPER_ADMIN') {
      userRole = 'SUPER_ADMIN';
    } else if (dbUser) {
      const advisorProfile = await prisma.advisorProfile.findUnique({
        where: { userId: dbUser.id },
        select: { advisorType: true }
      });
      
      if (advisorProfile?.advisorType) {
        advisorType = advisorProfile.advisorType as 'COACH' | 'CONSULTANT' | 'BOTH';
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={userRole} advisorType={advisorType} />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
