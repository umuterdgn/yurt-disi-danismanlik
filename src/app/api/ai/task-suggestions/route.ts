import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

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
        exams: {
          include: {
            subjectResults: true
          },
          orderBy: { date: 'desc' },
          take: 3
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

    // Calculate gap between current and target score
    const currentScore = student.currentScore || 0;
    const targetScore = student.targetScore || 0;
    const scoreGap = targetScore - currentScore;

    // Analyze recent exam performance for error patterns
    const recentSubjectPerformance = analyzeRecentExams(student.exams);

    // Build AI prompt with gap-focused coaching
    const aiPrompt = buildGapFocusedPrompt(student, currentScore, targetScore, scoreGap, recentSubjectPerformance);

    // For now, return enhanced mock suggestions based on gap analysis
    // In production, this would call an AI service like Groq with the aiPrompt
    const suggestions = generateGapBasedSuggestions(student, scoreGap, recentSubjectPerformance);

    return NextResponse.json({ 
      suggestions,
      gapAnalysis: {
        currentScore,
        targetScore,
        scoreGap,
        subjectPerformance: recentSubjectPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching AI task suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function analyzeRecentExams(exams: any[]) {
  const subjectPerformance: any = {};
  
  exams.forEach(exam => {
    exam.subjectResults.forEach((subjectResult: any) => {
      const subject = subjectResult.subjectName;
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = {
          totalCorrect: 0,
          totalWrong: 0,
          totalEmpty: 0,
          averageNet: 0,
          examCount: 0
        };
      }
      
      subjectPerformance[subject].totalCorrect += subjectResult.correct;
      subjectPerformance[subject].totalWrong += subjectResult.wrong;
      subjectPerformance[subject].totalEmpty += subjectResult.empty;
      subjectPerformance[subject].averageNet += (subjectResult.net || 0);
      subjectPerformance[subject].examCount += 1;
    });
  });

  // Calculate averages
  Object.keys(subjectPerformance).forEach(subject => {
    const data = subjectPerformance[subject];
    data.averageNet = data.averageNet / data.examCount;
    
    // Determine performance level
    if (data.averageNet >= 8) {
      data.performance = 'EXCELLENT';
    } else if (data.averageNet >= 5) {
      data.performance = 'GOOD';
    } else if (data.averageNet >= 3) {
      data.performance = 'MEDIUM';
    } else {
      data.performance = 'WEAK';
    }
  });

  return subjectPerformance;
}

function buildGapFocusedPrompt(student: any, currentScore: number, targetScore: number, scoreGap: number, subjectPerformance: any) {
  const subjectAnalysis = Object.entries(subjectPerformance)
    .map(([subject, data]: [string, any]) => 
      `${subject}: Net ${data.averageNet.toFixed(2)} (${data.performance}) - ${data.totalWrong} yanlış, ${data.totalEmpty} boş`
    )
    .join('\n');

  return `
Öğrencinin mevcut puanı ${currentScore}, hedef puanı ${targetScore}. Aradaki ${scoreGap.toFixed(2)} puanlık farkı kapatmak için, son denemelerdeki yanlışlarına bakarak EN HIZLI net getirecek, düzeltmesi KESİN ve KOLAY olan konuları önceliklendir.

Öğrenci Performans Analizi:
${subjectAnalysis}

Görev açıklamasında öğrencinin o konuyu NEDEN yanlış yaptığını (Örn: İşlem hatası, formül eksikliği, kavram yanlışlığı, dikkatsizlik) analiz et ve farkı kapatmak için stratejik adımlar öner.

KESİN KURAL: Öğrencinin mevcut puanı ${currentScore}, hedef puanı ${targetScore}. Aradaki ${scoreGap.toFixed(2)} puanlık farkı kapatmak için önceliklendir.

Görev önerileri şu formatta olmalı:
1. Konu adı
2. Öncelik seviyesi (high/medium/low) - gap'a katkısına göre
3. Tahmini net kazancı
4. Neden yanlış yapıldığı analizi
5. Stratejik düzeltme adımları
6. Tahmini çalışma süresi (Pomodoro)
`;
}

function generateGapBasedSuggestions(student: any, scoreGap: number, subjectPerformance: any) {
  const suggestions = [];
  
  // Identify weak subjects that could provide quick net gains
  const weakSubjects = Object.entries(subjectPerformance)
    .filter(([_, data]: [string, any]) => data.performance === 'WEAK' || data.performance === 'MEDIUM')
    .sort((a, b) => (a[1] as any).totalWrong - (b[1] as any).totalWrong);

  // Generate suggestions based on gap and weak subjects
  if (weakSubjects.length > 0) {
    weakSubjects.slice(0, 3).forEach(([subject, data]: [string, any], index: number) => {
      const potentialGain = Math.min(5, data.totalWrong * 0.75); // Estimate potential net gain
      const priority = scoreGap > 50 ? 'high' : (scoreGap > 20 ? 'medium' : 'low');
      
      suggestions.push({
        id: `gap-${index + 1}`,
        title: `${subject} - Hızlı Net Kazanımı`,
        description: `Son denemelerde ${data.totalWrong} yanlış yaptığınız ${subject} dersinde en çok hata yapılan konuları tekrar edin. Tahmini net kazancı: +${potentialGain.toFixed(2)}`,
        subject: subject,
        estimatedPomodoros: Math.ceil(data.totalWrong / 3),
        priority: priority,
        suggestedDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
        gapContribution: potentialGain,
        errorAnalysis: 'İşlem hatası ve formül eksikliği üzerine odaklanın',
        strategicSteps: [
          'Yanlış soruların çözümlerini detaylı inceleyin',
          'Hata yapılan konuların formüllerini tekrar edin',
          'Benzer soru tiplerinden pratik yapın'
        ]
      });
    });
  }

  // Add general gap-focused suggestions if needed
  if (suggestions.length < 3) {
    suggestions.push({
      id: 'gap-general-1',
      title: 'Deneme Analizi ve Hata Tespiti',
      description: `Son 3 denemenizi analiz ederek ${scoreGap.toFixed(2)} puanlık farkı kapatmak için en kritik konuları belirleyin`,
      subject: 'Genel',
      estimatedPomodoros: 2,
      priority: scoreGap > 30 ? 'high' : 'medium',
      suggestedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      gapContribution: scoreGap * 0.1,
      errorAnalysis: 'Sistematik hata patternleri tespit edin',
      strategicSteps: [
        'Yanlış soruları konu bazında sınıflandırın',
        'Hata türlerini belirleyin (işlem, kavram, dikkatsizlik)',
        'Her hata türü için özel düzeltme stratejisi geliştirin'
      ]
    });
  }

  return suggestions;
}