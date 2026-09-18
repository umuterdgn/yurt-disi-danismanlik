'use server';

import { prisma } from "@/lib/prisma";

export async function generateWeeklyReport(studentId: string) {
  try {
    // Get student profile
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        dailyTasks: {
          where: {
            taskDate: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          },
          orderBy: { taskDate: 'desc' }
        },
        examResults: {
          orderBy: { examDate: 'desc' },
          take: 10
        }
      }
    });

    if (!student) {
      return { success: false, error: 'Öğrenci bulunamadı' };
    }

    // Calculate weekly stats
    const weeklyTasks = student.dailyTasks.filter(task => 
      new Date(task.taskDate) >= new Date(new Date().setDate(new Date().getDate() - 7))
    );
    const completedTasks = weeklyTasks.filter(task => task.isCompleted);
    
    // Calculate total study hours (based on READING, VIDEO tasks)
    const totalStudyHours = weeklyTasks.reduce((sum, task) => {
      if (task.taskType === 'READING' || task.taskType === 'VIDEO') {
        return sum + task.completedQuantity;
      }
      return sum;
    }, 0);

    // Calculate solved questions (based on TEST, PRACTICE, EXAM tasks)
    const solvedQuestions = weeklyTasks.reduce((sum, task) => {
      if (task.taskType === 'TEST' || task.taskType === 'PRACTICE' || task.taskType === 'EXAM') {
        return sum + (task.correctCount || 0) + (task.wrongCount || 0);
      }
      return sum;
    }, 0);

    // Calculate exam stats
    const recentExams = student.examResults.slice(0, 3);
    const examCount = recentExams.length;
    
    // Calculate average score
    const validScores = recentExams.filter(e => e.actualScore != null);
    const averageScore = validScores.length > 0 
      ? Math.round(validScores.reduce((sum, e) => sum + e.actualScore!, 0) / validScores.length)
      : 0;

    // Calculate score change from previous week
    let scoreChange = 0;
    if (recentExams.length >= 2) {
      const latest = recentExams[0].actualScore || 0;
      const previous = recentExams[recentExams.length - 1].actualScore || 0;
      scoreChange = latest - previous;
    }

    // Prepare data for AI
    const reportData = {
      studentName: student.user.name,
      targetUniversity: student.targetUniversity,
      targetScore: student.targetScore,
      currentScore: student.currentScore,
      weeklyStats: {
        totalStudyHours,
        solvedQuestions,
        examCount,
        averageScore,
        scoreChange
      },
      completedTasks: completedTasks.length,
      totalTasks: weeklyTasks.length
    };

    // Call Groq AI API
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return { success: false, error: 'GROQ_API_KEY bulunamadı' };
    }

    const prompt = `
Sen bir eğitim koçlusun. Aşağıdaki öğrenci verilerine dayanarak haftalık bir eğitim koçluğu raporu oluştur:

Öğrenci Bilgileri:
- İsim: ${reportData.studentName}
- Hedef Üniversite: ${reportData.targetUniversity}
- Hedef Puan: ${reportData.targetScore}
- Mevcut Puan: ${reportData.currentScore}

Haftalık İstatistikler:
- Toplam Çalışma Süresi: ${reportData.weeklyStats.totalStudyHours} saat
- Çözülen Soru Sayısı: ${reportData.weeklyStats.solvedQuestions} soru
- Çözülen Deneme Sayısı: ${reportData.weeklyStats.examCount} deneme
- Ortalama Net: ${reportData.weeklyStats.averageScore}
- Net Değişimi: ${reportData.weeklyStats.scoreChange >= 0 ? '+' : ''}${reportData.weeklyStats.scoreChange}
- Görev Tamamlama Oranı: ${reportData.totalTasks > 0 ? Math.round((reportData.completedTasks / reportData.totalTasks) * 100) : 0}%

Lütfen şu formatta profesyonel bir rapor oluştur:

1. Haftalık Eğitim Koçluğu Raporu
   - Öğrencinin genel performans özeti
   - Güçlü yönleri ve iyileşme alanları
   - Haftalık hedeflere ulaşma durumu

2. Önümüzdeki Haftanın Önceliği
   - Odaklanması gereken konular
   - Çalışma programı önerileri
   - Hedef belirleme

3. Motivasyon ve Teşvik
   - Öğrenciyi motive edici mesajlar
   - Başarıya giden yol haritası

Rapor Türkçe, profesyonel ve öğrenciyi motive edici bir dilde yazılmalıdır.
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'Sen deneyimli bir eğitim koçusun. Öğrencilerin performansını analiz edip motive edici raporlar oluşturuyorsun.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: `Groq API hatası: ${errorData.error?.message || response.statusText}` };
    }

    const data = await response.json();
    const generatedReport = data.choices[0]?.message?.content || 'Rapor oluşturulamadı';

    return {
      success: true,
      report: generatedReport,
      data: reportData
    };

  } catch (error) {
    console.error('Rapor oluşturma hatası:', error);
    return { success: false, error: 'Rapor oluşturulurken bir hata oluştu' };
  }
}
