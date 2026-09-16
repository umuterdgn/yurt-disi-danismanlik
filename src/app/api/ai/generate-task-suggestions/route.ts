import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get student data for AI context
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        subjectAnalysis: true,
        examResults: {
          orderBy: { examDate: 'desc' },
          take: 5
        },
        dailyTasks: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Generate AI suggestions based on student performance
    // This is a simplified version - can be enhanced with actual AI integration
    const weakSubjects = student.subjectAnalysis
      .filter(sa => sa.proficiency === 'WEAK' || sa.proficiency === 'MEDIUM')
      .map(sa => sa.subject);

    const suggestions = weakSubjects.slice(0, 3).map((subject, index) => ({
      id: `${Date.now()}-${index}`,
      title: `${subject} - Tekrar ve Pratik`,
      description: `${subject} konusunu çalışarak temelinizi güçlendirin`,
      subject,
      estimatedPomodoros: 2,
      priority: 'medium',
      suggestedDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
    }));

    // Fallback suggestions if no weak subjects
    if (suggestions.length === 0) {
      suggestions.push(
        {
          id: `${Date.now()}-1`,
          title: 'Genel Tekrar',
          description: 'Son denemelerdeki hatalı soruları tekrar çözün',
          subject: 'Genel',
          estimatedPomodoros: 3,
          priority: 'high',
          suggestedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `${Date.now()}-2`,
          title: 'Deneme Analizi',
          description: 'Son deneme sonuçlarınızı detaylı analiz edin',
          subject: 'Analiz',
          estimatedPomodoros: 2,
          priority: 'medium',
          suggestedDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        }
      );
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating AI task suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}