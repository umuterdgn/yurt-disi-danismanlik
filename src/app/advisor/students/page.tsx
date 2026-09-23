import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AdvisorStudentsClient } from "@/components/advisor-students-client";

export default async function AdvisorStudentsPage() {
  // Get current user from Supabase
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
  
  // Get user role and ID from Prisma
  let userRole = null;
  let advisorProfileId = null;
  let userName = 'Danışman';
  
  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: {
          advisorProfile: true
        }
      });
      if (dbUser) {
        userRole = dbUser.role;
        advisorProfileId = dbUser.advisorProfile?.id;
        userName = dbUser.name;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  // Role-based filtering: SUPER_ADMIN sees all, ADVISOR sees only their assigned students
  let students: any[] = [];
  try {
    students = await prisma.studentProfile.findMany({
      include: {
        user: true,
        advisor: {
          include: {
            user: true
          }
        },
      },
      where: userRole === 'SUPER_ADMIN' ? {} : { advisorId: advisorProfileId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    students = [];
  }

  return (
    <AdvisorStudentsClient 
      students={students} 
      userRole={userRole} 
      userName={userName} 
    />
  );
}
