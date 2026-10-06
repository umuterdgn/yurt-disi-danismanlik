import { prisma } from "@/lib/prisma";
import { cookies } from 'next/headers';
import { AdvisorStudentsClient } from "@/components/advisor-students-client";

export default async function AdvisorStudentsPage() {
  // Get current user from cookies (custom auth system)
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  const userRole = cookieStore.get('user_role')?.value;

  // Get user role and ID from Prisma
  let advisorProfileId = null;
  let userName = 'Danışman';
  
  if (userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          advisorProfile: true
        }
      });
      if (dbUser) {
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
      userRole={userRole || null} 
      userName={userName} 
    />
  );
}
