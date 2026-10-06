import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user using custom cookie-based auth
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      console.error('AI Generate Task Suggestions: Unauthorized - No user_id in cookies');
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

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

    // Check if student is in 9th, 10th, or 11th grade (long-term preparation focus)
    const isEarlyPrep = ['9', '10', '11'].includes(student.grade);
    const is12thGrade = student.grade === '12';

    // Generate AI suggestions based on student performance and grade
    let suggestions: any[] = [];

    if (isEarlyPrep) {
      // Long-term preparation focus for 9th, 10th, 11th grade students
      const domain = student.domain || 'ESIT_AGIRLIK';
      
      // Domain-specific subjects
      const domainSubjects: Record<string, string[]> = {
        'SAYISAL': ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'],
        'SOZEL': ['Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe'],
        'ESIT_AGIRLIK': ['Matematik', 'Edebiyat', 'Tarih', 'Coğrafya'],
        'DIL': ['Yabancı Dil', 'Edebiyat', 'Tarih', 'Coğrafya']
      };

      const relevantSubjects = domainSubjects[domain] || domainSubjects['ESIT_AGIRLIK'];
      
      // Get weak subjects from domain-relevant subjects
      const weakSubjects = student.subjectAnalysis
        .filter(sa => (sa.proficiency === 'WEAK' || sa.proficiency === 'MEDIUM') && 
                      relevantSubjects.includes(sa.subject))
        .map(sa => sa.subject);

      if (weakSubjects.length > 0) {
        suggestions = weakSubjects.slice(0, 3).map((subject, index) => ({
          id: `${Date.now()}-${index}`,
          title: `${subject} - Temel Konu Çalışması`,
          description: `${subject} dersinin temel konularına odaklanarak TYT/AYT netlerinizi artırın. Uzun vadeli plan için temel eksikleri kapatın.`,
          subject,
          estimatedPomodoros: 3,
          priority: 'high',
          suggestedDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
        }));
      } else {
        // Fallback for early prep with no weak subjects
        suggestions = [
          {
            id: `${Date.now()}-1`,
            title: 'TYT Temel Konu Tekrarı',
            description: 'TYT\'nin temel konularını sistematik olarak tekrar edin ve okul sınavlarına hazırlanın.',
            subject: 'Genel',
            estimatedPomodoros: 4,
            priority: 'high',
            suggestedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: `${Date.now()}-2`,
            title: 'Okul Sınavı Hazırlığı',
            description: 'Yaklaşan okul sınavları için ders çalışma planı oluşturun ve uygulayın.',
            subject: 'Planlama',
            estimatedPomodoros: 2,
            priority: 'medium',
            suggestedDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          }
        ];
      }
    } else if (is12thGrade) {
      // 12th grade - focused on YKS preparation and university targets
      const weakSubjects = student.subjectAnalysis
        .filter(sa => sa.proficiency === 'WEAK' || sa.proficiency === 'MEDIUM')
        .map(sa => sa.subject);

      suggestions = weakSubjects.slice(0, 3).map((subject, index) => ({
        id: `${Date.now()}-${index}`,
        title: `${subject} - Deneme Odaklı Çalışma`,
        description: `${subject} konusuna odaklanarak deneme sınavlarında net artışı hedefleyin.`,
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
            title: 'Deneme Analizi ve Strateji',
            description: 'Son denemelerdeki performansınızı analiz edin ve çalışma stratejinizi buna göre güncelleyin.',
            subject: 'Analiz',
            estimatedPomodoros: 3,
            priority: 'high',
            suggestedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: `${Date.now()}-2`,
            title: 'Hedef Üniversite Puanı Çalışması',
            description: `Hedef puanınız (${student.targetScore || '-'}) için yoğun deneme çözün.`,
            subject: 'Deneme',
            estimatedPomodoros: 4,
            priority: 'high',
            suggestedDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          }
        );
      }
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating AI task suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}