import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { YKS_CURRICULUM } from '@/constants/curriculum';

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
      suggestions: suggestions.map(s => ({
        ...s,
        // Ensure taskType is included in the response
        taskType: s.taskType || 'OTHER'
      })),
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

  // Analyze completed tasks and topics
  const completedTasks = student.dailyTasks || [];
  const tasksBySubject = completedTasks.reduce((acc: any, task: any) => {
    if (!acc[task.subject]) {
      acc[task.subject] = {
        total: 0,
        completed: 0,
        topics: []
      };
    }
    acc[task.subject].total += task.targetQuantity || 1;
    acc[task.subject].completed += task.completedQuantity || 0;
    if (task.topic && !acc[task.subject].topics.includes(task.topic)) {
      acc[task.subject].topics.push(task.topic);
    }
    return acc;
  }, {});

  const taskAnalysis = Object.entries(tasksBySubject)
    .map(([subject, data]: [string, any]) => 
      `${subject}: ${data.completed}/${data.total} görev tamamlandı. Çalışılan konular: ${data.topics.length > 0 ? data.topics.join(', ') : 'Henüz konu belirtilmemiş'}`
    )
    .join('\n');

  // Identify subjects with exam data but no tasks, and vice versa
  const subjectsWithExams = Object.keys(subjectPerformance);
  const subjectsWithTasks = Object.keys(tasksBySubject);
  const subjectsWithExamsNoTasks = subjectsWithExams.filter(s => !subjectsWithTasks.includes(s));
  const subjectsWithTasksNoExams = subjectsWithTasks.filter(s => !subjectsWithExams.includes(s));

  return `
Öğrencinin Sınıfı: ${student.grade}. Bu sınıfın müfredatına ve öğrencinin Konu Hakimiyet verilerine bak.

Öğrencinin mevcut puanı ${currentScore}, hedef puanı ${targetScore}. Aradaki ${scoreGap.toFixed(2)} puanlık farkı kapatmak için, son denemelerdeki yanlışlarına bakarak EN HIZLI net getirecek, düzeltmesi KESİN ve KOLAY olan konuları önceliklendir.

Öğrenci Performans Analizi (Deneme Verileri):
${subjectAnalysis}

Görev Tamamlama Analizi:
${taskAnalysis}

KRİTİK VERİ EKSİKLİKLERİ:
${subjectsWithExamsNoTasks.length > 0 ? `Deneme verisi var ama görev çalışması yok: ${subjectsWithExamsNoTasks.join(', ')}. Bu derslerde deneme sonuçlarına göre öncelikli görev ekleyin.` : 'Tüm derslerde deneme ve görev verisi dengeli.'}
${subjectsWithTasksNoExams.length > 0 ? `Görev çalışması var ama deneme verisi yok: ${subjectsWithTasksNoExams.join(', ')}. Bu derslerde çalışılan konuları test etmek için branş denemesi çözün.` : ''}

RESMİ YKS MÜFREDAT (Ders ve Konu Listeleri):
${Object.entries(YKS_CURRICULUM).map(([subject, topics]) => `${subject}: ${topics.slice(0, 5).join(', ')}...`).join('\n')}

MÜFREDAT AI KURALLARI:
- Eğer bir konuda başarı %50'nin altındaysa ona soru çözümü DEĞİL, 'Konu Tekrarı' (REVIEW) görevi öner.
- Eğer %50-70 arasındaysa önce temel soru çözümü, sonra konu tekrarı öner.
- Eğer %70 üzerindeyse zorluk derecesi yüksek 'Test' (TEST) görevi öner.
- Görev türünü kesin olarak belirt: TEST, REVIEW, READING, VIDEO, PRACTICE, PROJECT, EXAM, OTHER.

Görev açıklamasında öğrencinin o konuyu NEDEN yanlış yaptığını (Örn: İşlem hatası, formül eksikliği, kavram yanlışlığı, dikkatsizlik) analiz et ve farkı kapatmak için stratejik adımlar öner.

ÖZEL TAVSİYE FORMATI:
- Genel "temel konulara çalışın" demek yerine spesifik öneriler ver
- Örnek: "Optik konusundaki 1 görevi tamamladın ama deneme verisi eksik, önce bir branş denemesi çöz"
- Örnek: "Türev konusunda 3 görev tamamlandı ama denemede 5 yanlış var, formül tekrarı yap"
- Örnek: "Paragraf konusunda görev yok ama denemede başarılı, yeni bir konuya geç"

KESİN KURAL: Öğrencinin mevcut puanı ${currentScore}, hedef puanı ${targetScore}. Aradaki ${scoreGap.toFixed(2)} puanlık farkı kapatmak için önceliklendir.

Görev önerileri şu formatta olmalı:
1. Konu adı
2. Görev türü (TEST, REVIEW, READING, vb.)
3. Öncelik seviyesi (high/medium/low) - gap'a katkısına göre
4. Tahmini net kazancı
5. Neden yanlış yapıldığı analizi
6. Stratejik düzeltme adımları
7. Tahmini çalışma süresi (Pomodoro)
`;
}

function generateGapBasedSuggestions(student: any, scoreGap: number, subjectPerformance: any) {
  const suggestions = [];
  
  // Analyze completed tasks and topics
  const completedTasks = student.dailyTasks || [];
  const tasksBySubject = completedTasks.reduce((acc: any, task: any) => {
    if (!acc[task.subject]) {
      acc[task.subject] = {
        total: 0,
        completed: 0,
        topics: []
      };
    }
    acc[task.subject].total += task.targetQuantity || 1;
    acc[task.subject].completed += task.completedQuantity || 0;
    if (task.topic && !acc[task.subject].topics.includes(task.topic)) {
      acc[task.subject].topics.push(task.topic);
    }
    return acc;
  }, {});

  // Identify weak subjects that could provide quick net gains
  const weakSubjects = Object.entries(subjectPerformance)
    .filter(([_, data]: [string, any]) => data.performance === 'WEAK' || data.performance === 'MEDIUM')
    .sort((a, b) => (a[1] as any).totalWrong - (b[1] as any).totalWrong);

  // Generate suggestions based on gap and weak subjects with mastery-based task types
  if (weakSubjects.length > 0) {
    weakSubjects.slice(0, 3).forEach(([subject, data]: [string, any], index: number) => {
      const potentialGain = Math.min(5, data.totalWrong * 0.75); // Estimate potential net gain
      const priority = scoreGap > 50 ? 'high' : (scoreGap > 20 ? 'medium' : 'low');
      
      const taskData = tasksBySubject[subject] || { total: 0, completed: 0, topics: [] };
      
      // Determine task type and description based on performance and task data
      let taskType = 'TEST';
      let taskTitle = `${subject} - Hızlı Net Kazanımı`;
      let taskDescription = '';
      let errorAnalysis = '';
      let strategicSteps: string[] = [];
      
      if (data.performance === 'WEAK') {
        if (taskData.total === 0) {
          taskType = 'REVIEW';
          taskTitle = `${subject} - Temel Konu Çalışması`;
          taskDescription = `${subject} dersinde ${data.totalWrong} yanlış var ama henüz görev çalışması yok. Önce temel konuları öğrenip deneme çözün.`;
          errorAnalysis = 'Temel kavram eksikliği ve hiçbir çalışma yapılmamış';
          strategicSteps = [
            'Konu anlatım videosu izleyin',
            'Temel kavramları tekrar edin',
            'Formül ve teoremleri öğrenin',
            'Basit örneklerle başlayın',
            'Konu bitince branş denemesi çözün'
          ];
        } else if (taskData.topics.length === 0) {
          taskType = 'REVIEW';
          taskTitle = `${subject} - Konu Belirleme`;
          taskDescription = `${subject} dersinde ${taskData.completed}/${taskData.total} görev tamamlandı ama konu belirtilmemiş. Görevlere konu ekleyerek daha detaylı çalışın.`;
          errorAnalysis = 'Çalışma var ama konu takibi yok';
          strategicSteps = [
            'Görevlere konu ekleyin',
            'Çalıştığınız konuları belirleyin',
            'Konu bazlı çalışma planı yapın'
          ];
        } else {
          taskType = 'REVIEW';
          taskTitle = `${subject} - ${taskData.topics.slice(0, 2).join(' ve ')} Konu Tekrarı`;
          taskDescription = `${subject} dersinde ${taskData.topics.slice(0, 2).join(' ve ')} konularında ${taskData.completed} görev tamamladınız ama denemede ${data.totalWrong} yanlış var. Bu konuları tekrar edin.`;
          errorAnalysis = 'Çalışılan konularda bile kavram eksikliği';
          strategicSteps = [
            `${taskData.topics.slice(0, 2).join(' ve ')} konularını tekrar edin`,
            'Yanlış soruların çözümlerini inceleyin',
            'Formüller pekiştirin',
            'Yeni bir deneme çözün'
          ];
        }
      } else if (data.performance === 'MEDIUM') {
        if (taskData.total === 0) {
          taskType = 'PRACTICE';
          taskTitle = `${subject} - Pratik Soru Çözümü`;
          taskDescription = `${subject} dersinde deneme performansınız orta ama görev çalışması yok. Soru çözümü ile deneme başarınızı artırın.`;
          errorAnalysis = 'Pratik yetersizliği';
          strategicSteps = [
            'Temel soru çözümü yapın',
            'Konu tekrarı ile soru çözümü kombinasyonu',
            'Kendinizi test edin'
          ];
        } else {
          taskType = 'PRACTICE';
          taskTitle = `${subject} - ${taskData.topics.slice(0, 2).join(' ve ')} Pratik`;
          taskDescription = `${subject} dersinde ${taskData.topics.slice(0, 2).join(' ve ')} konularında ${taskData.completed} görev tamamlandı. Performansınızı artırmak için daha fazla pratik yapın.`;
          errorAnalysis = 'İşlem hatası ve pratik yetersizliği';
          strategicSteps = [
            'Yanlış soruların çözümlerini detaylı inceleyin',
            'Hata yapılan konuların formüllerini tekrar edin',
            'Benzer soru tiplerinden pratik yapın'
          ];
        }
      }
      
      suggestions.push({
        id: `gap-${index + 1}`,
        title: taskTitle,
        description: taskDescription,
        subject: subject,
        estimatedPomodoros: Math.ceil(data.totalWrong / 3) + 1,
        priority: priority,
        suggestedDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
        gapContribution: potentialGain,
        errorAnalysis: errorAnalysis,
        strategicSteps: strategicSteps,
        // Add custom fields for mastery system
        taskType: taskType,
        topic: taskData.topics.length > 0 ? taskData.topics[0] : subject // Use first topic or subject
      });
    });
  }

  // Add suggestions for subjects with tasks but no exam data
  const subjectsWithTasksNoExams = Object.keys(tasksBySubject).filter(subject => !subjectPerformance[subject]);
  if (subjectsWithTasksNoExams.length > 0 && suggestions.length < 3) {
    subjectsWithTasksNoExams.slice(0, 2).forEach((subject, index) => {
      const taskData = tasksBySubject[subject];
      suggestions.push({
        id: `task-no-exam-${index + 1}`,
        title: `${subject} - Deneme Çözümü`,
        description: `${subject} dersinde ${taskData.completed}/${taskData.total} görev tamamlandı ama deneme verisi yok. Çalışılan konuları test etmek için branş denemesi çözün.`,
        subject: subject,
        estimatedPomodoros: 2,
        priority: 'medium',
        suggestedDate: new Date(Date.now() + (suggestions.length + 1) * 24 * 60 * 60 * 1000).toISOString(),
        gapContribution: 0,
        errorAnalysis: 'Çalışma var ama performans testi yok',
        strategicSteps: [
          'Branş denemesi çözün',
          'Çalışılan konuları test edin',
          'Performansınızı ölçün'
        ],
        taskType: 'EXAM',
        topic: taskData.topics.length > 0 ? taskData.topics[0] : subject
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
      ],
      // Add custom fields for mastery system
      taskType: 'REVIEW',
      topic: 'Genel Analiz'
    });
  }

  return suggestions;
}