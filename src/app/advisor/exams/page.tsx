import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ExamsClient } from "@/components/exams-client";

export default async function ExamsPage() {
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
  
  let examResults: any[] = [];
  let students: { id: string; name: string; grade: string }[] = [];
  let userName = 'Danışman';

  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        advisorProfile: true
      }
    });

    if (dbUser) {
      userName = dbUser.name;

      // Get students for the dialog
      if (dbUser.role === 'SUPER_ADMIN') {
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
      } else if (dbUser.advisorProfile) {
        const advisorStudents = await prisma.studentProfile.findMany({
          where: { advisorId: dbUser.advisorProfile.id },
          include: { user: true }
        });
        students = advisorStudents.map(s => ({ id: s.id, name: s.user.name, grade: s.grade }));
        
        examResults = await prisma.exam.findMany({
          where: {
            studentProfile: {
              advisorId: dbUser.advisorProfile.id
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
    }
  }

  // Get subject analysis
  const subjectAnalysis = await prisma.subjectAnalysis.findMany({
    include: {
      studentProfile: {
        include: { user: true }
      }
    },
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
