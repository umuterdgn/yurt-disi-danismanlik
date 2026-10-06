import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";

export default async function SuperAdminPage() {
  const cookieStore = await cookies();

  // Check custom auth cookies first (legacy support)
  const userId = cookieStore.get('user_id')?.value;
  const userRole = cookieStore.get('user_role')?.value;

  if (userId && userRole === 'SUPER_ADMIN') {
    // User is authenticated via custom cookies, proceed to render
  } else {
    // Fallback to Supabase auth
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

    // Check if user is SUPER_ADMIN
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
      redirect('/');
    }
  }

  // Get summary stats
  const [totalAdmins, totalStudents, totalAIUsage, expiringSoon] = await Promise.all([
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.studentProfile.count(),
    prisma.user.aggregate({ _sum: { aiUsageCount: true } }),
    prisma.user.count({
      where: {
        role: 'ADMIN',
        subscriptionEndsAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  // Get all admins (organization owners) with their advisor profiles
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    include: {
      advisorProfile: {
        include: {
          students: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Format admins - ensure advisorProfile.students is properly handled
  const formattedAdmins = admins.map(admin => ({
    ...admin,
    advisorProfile: admin.advisorProfile ? {
      ...admin.advisorProfile,
      students: admin.advisorProfile.students || []
    } : null
  }));

  const stats = {
    totalAdmins,
    totalStudents,
    totalAIUsage: totalAIUsage._sum.aiUsageCount || 0,
    expiringSoon
  };

  return <SuperAdminDashboard stats={stats} advisors={formattedAdmins} />;
}
