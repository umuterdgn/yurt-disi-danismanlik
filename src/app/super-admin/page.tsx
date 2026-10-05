import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";

export default async function SuperAdminPage() {
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
    return <div>Unauthorized</div>;
  }

  // Get summary stats
  const [totalAdvisors, totalStudents, totalAIUsage, expiringSoon] = await Promise.all([
    prisma.user.count({ where: { role: 'ADVISOR' } }),
    prisma.studentProfile.count(),
    prisma.user.aggregate({ _sum: { aiUsageCount: true } }),
    prisma.user.count({
      where: {
        role: 'ADVISOR',
        subscriptionEndsAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  // Get all advisors with their student counts
  const advisors = await prisma.user.findMany({
    where: { role: 'ADVISOR' },
    include: {
      advisorProfile: {
        include: {
          students: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const stats = {
    totalAdvisors,
    totalStudents,
    totalAIUsage: totalAIUsage._sum.aiUsageCount || 0,
    expiringSoon
  };

  return <SuperAdminDashboard stats={stats} advisors={advisors} />;
}
