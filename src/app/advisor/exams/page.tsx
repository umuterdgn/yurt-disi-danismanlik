import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ExamsClient } from "@/components/exams-client";

export default async function ExamsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  const userRole = cookieStore.get('user_role')?.value;

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

  let examResults: any[] = [];
  let students: { id: string; name: string; grade: string }[] = [];

  if (userRole === 'SUPER_ADMIN') {
    const allStudents = await prisma.studentProfile.findMany({
      include: { user: true }
    });
    students = allStudents.map(s => ({ id: s.id, name: s.user.name, grade: s.grade }));

    examResults = await prisma.exam.findMany({
      include: {
        studentProfile: {
          include: { user: true }
        },
        subjectResults: {
          include: {
            questionResults: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  } else if (advisorProfileId) {
    const advisorStudents = await prisma.studentProfile.findMany({
      where: { advisorId: advisorProfileId },
      include: { user: true }
    });
    students = advisorStudents.map(s => ({ id: s.id, name: s.user.name, grade: s.grade }));

    examResults = await prisma.exam.findMany({
      where: {
        studentProfile: {
          advisorId: advisorProfileId
        }
      },
      include: {
        studentProfile: {
          include: { user: true }
        },
        subjectResults: {
          include: {
            questionResults: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  // Get subject analysis (filtered by role)
  const subjectAnalysis = await prisma.subjectAnalysis.findMany({
    include: {
      studentProfile: {
        include: { user: true }
      }
    },
    where: userRole === 'SUPER_ADMIN' ? {} : { studentProfile: { advisorId: advisorProfileId } },
    orderBy: { studentProfile: { user: { name: 'asc' } } }
  });

  // Calculate score changes
  const examResultsWithChange = examResults.map((exam, index, arr) => {
    const nextExam = arr[index + 1];
    const change = nextExam && nextExam.studentProfileId === exam.studentProfileId
      ? (exam.totalNet || 0) - (nextExam.totalNet || 0)
      : 0;
    return { 
      ...exam, 
      change,
      examName: exam.title,
      actualScore: exam.totalNet,
      targetScore: exam.totalScore,
      examDate: exam.date,
      subjectResults: exam.subjectResults || [] // Keep subjectResults for detailed analysis
    };
  });

  return <ExamsClient examResults={examResultsWithChange} subjectAnalysis={subjectAnalysis} students={students} userName={userName} />;
}
