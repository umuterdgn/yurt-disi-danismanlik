import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { StudentAnalysisClient } from "@/components/student-analysis-client";

export default async function AdvisorStudentAnalysisPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  
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
  let userId = null;
  
  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true, id: true }
    });
    if (dbUser) {
      userRole = dbUser.role;
      userId = dbUser.id;
    }
  }

  // Get student profile
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      advisor: {
        include: { user: true }
      }
    }
  });

  if (!student) {
    return <div>Öğrenci bulunamadı</div>;
  }

  // Check access: SUPER_ADMIN or assigned ADVISOR
  if (userRole !== 'SUPER_ADMIN' && student.advisorId !== userId) {
    return <div>Bu öğrenciye erişim izniniz yok</div>;
  }

  // Get exam results
  const examResults = await prisma.examResult.findMany({
    where: { studentProfileId: studentId },
    orderBy: { examDate: 'desc' }
  });

  // Get subject analysis
  const subjectAnalysis = await prisma.subjectAnalysis.findMany({
    where: { studentProfileId: studentId }
  });

  // Get meeting notes
  const meetingNotes = await prisma.meetingNote.findMany({
    where: { studentProfileId: studentId },
    orderBy: { meetingDate: 'desc' }
  });

  // Prepare chart data for exam results
  const examChartData = examResults.map(result => ({
    name: result.examName,
    targetScore: result.targetScore,
    actualScore: result.actualScore,
    date: new Date(result.examDate).toLocaleDateString('tr-TR')
  }));

  // Prepare chart data for subject analysis
  const subjectChartData = subjectAnalysis.map(analysis => ({
    subject: `${analysis.subject} - ${analysis.topic}`,
    progress: analysis.progressPercent,
    hours: analysis.totalHours
  }));

  return (
    <StudentAnalysisClient
      student={student}
      examChartData={examChartData}
      subjectChartData={subjectChartData}
      subjectAnalysis={subjectAnalysis}
      meetingNotes={meetingNotes}
    />
  );
}
