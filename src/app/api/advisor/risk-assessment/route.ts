import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        advisorProfile: true
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get students based on role
    const whereClause = dbUser.role === 'SUPER_ADMIN' 
      ? {}
      : { advisorId: dbUser.advisorProfile?.id };

    const students = await prisma.studentProfile.findMany({
      where: whereClause,
      include: {
        user: true,
        dailyTasks: {
          where: {
            taskDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        },
        examResults: {
          orderBy: { examDate: 'desc' },
          take: 2
        },
        meetingNotes: {
          where: {
            meetingDate: {
              gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
            }
          }
        }
      }
    });

    // Calculate risk score for each student
    const studentsWithRisk = students.map(student => {
      let riskScore = 0;
      const riskFactors: string[] = [];

      // 1. Görev İhmali: Son 7 gün içindeki görevlerin %50'sinden azı tamamlanmışsa
      const last7DaysTasks = student.dailyTasks;
      if (last7DaysTasks.length > 0) {
        const completedTasks = last7DaysTasks.filter(t => t.isCompleted).length;
        const completionRate = completedTasks / last7DaysTasks.length;
        
        if (completionRate < 0.5) {
          riskScore += 1;
          riskFactors.push(`Son 7 günde görevlerin %${Math.round(completionRate * 100)}'ü tamamlanmış (hedef: %50+)`);
        }
      }

      // 2. Akademik Düşüş: Son 2 deneme sınavında netler sürekli düşüşteyse
      if (student.examResults.length >= 2) {
        const latest = student.examResults[0].actualScore || 0;
        const previous = student.examResults[1].actualScore || 0;
        
        if (latest < previous) {
          riskScore += 1;
          riskFactors.push(`Son 2 deneme sınavında net düşüşü (${previous} → ${latest})`);
        }
      }

      // 3. İletişim Kopukluğu: Son 14 gün içinde hiçbir görüşme yapılmamışsa
      const recentMeetings = student.meetingNotes;
      if (recentMeetings.length === 0) {
        riskScore += 1;
        riskFactors.push('Son 14 günde hiç görüşme yapılmamış');
      }

      // Determine risk level
      let riskLevel = 'LOW';
      if (riskScore >= 2) {
        riskLevel = 'HIGH';
      } else if (riskScore === 1) {
        riskLevel = 'MEDIUM';
      }

      return {
        id: student.id,
        name: student.user.name,
        grade: student.grade,
        targetUniversities: student.targetUniversities,
        riskLevel,
        riskScore,
        riskFactors,
        healthScore: student.healthScore
      };
    });

    // Filter and sort students
    const criticalStudents = studentsWithRisk.filter(s => s.riskLevel === 'HIGH');
    const warningStudents = studentsWithRisk.filter(s => s.riskLevel === 'MEDIUM');
    const safeStudents = studentsWithRisk.filter(s => s.riskLevel === 'LOW');

    return NextResponse.json({
      summary: {
        critical: criticalStudents.length,
        warning: warningStudents.length,
        safe: safeStudents.length
      },
      students: [...criticalStudents, ...warningStudents].sort((a, b) => b.riskScore - a.riskScore)
    });

  } catch (error) {
    console.error('Error calculating risk assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
