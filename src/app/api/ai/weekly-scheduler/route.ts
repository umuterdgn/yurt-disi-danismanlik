import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CURRICULUM, getSubjectsForExamType, getTopicsForSubject } from '@/lib/constants/curriculum';

interface WeeklyScheduleRequest {
  studentId: string;
  level: 'Zero' | 'Medium' | 'Advanced';
  dailyTargetHours: number;
  subjectAnalysis: any[];
  recentTasks: any[];
  examType?: string;
  startDate?: string;
}

interface WeeklySchedule {
  days: {
    day: string;
    date: string;
    tasks: {
      subject: string;
      topic: string;
      studyMethod: string;
      pomodoros: number;
      duration: number;
      priority: string;
    }[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: WeeklyScheduleRequest = await request.json();
    const { 
      studentId, 
      level, 
      dailyTargetHours, 
      subjectAnalysis, 
      recentTasks, 
      examType = 'TYT',
      startDate 
    } = body;

    // Validate required fields
    if (!studentId || !level || !dailyTargetHours) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: studentId, level, dailyTargetHours' 
      }, { status: 400 });
    }

    // Get curriculum for the exam type
    const curriculumSubjects = getSubjectsForExamType(examType);
    const curriculumTopics = curriculumSubjects.reduce((acc, subject) => {
      acc[subject] = getTopicsForSubject(examType, subject);
      return acc;
    }, {} as Record<string, string[]>);

    // Analyze weak subjects from subject analysis
    const weakSubjects = subjectAnalysis
      .filter(analysis => analysis.proficiency === 'WEAK' || analysis.progressPercent < 50)
      .map(analysis => ({
        subject: analysis.subject,
        progressPercent: analysis.progressPercent,
        topics: analysis.topic || []
      }))
      .sort((a, b) => a.progressPercent - b.progressPercent);

    // Analyze recent completed tasks to avoid repetition
    // Limit to last 20 tasks to prevent token limit issues
    const recentTopics = recentTasks
      .filter(task => task.isCompleted)
      .slice(0, 20)
      .map(task => ({
        subject: task.subject,
        topic: task.topic,
        completedDate: task.taskDate
      }));

    // Build the system prompt for Gemini
    const systemPrompt = `Sen uzman bir eğitim koçuyuz ve Türk müfredat sistemine aşinasın. 
Aşağıdaki resmi MEB müfredatına tam olarak uyum sağlayarak 7 günlük (Pazartesi-Pazar) çalışma programı oluşturacaksın.

KURSİKÜM VERİLERI:
Sınav Türü: ${examType}
Mevcut Müfredat Dersleri: ${curriculumSubjects.join(', ')}
Müfredat Konuları: ${JSON.stringify(curriculumTopics, null, 2)}

ÖĞRENCİ PROFİLİ:
Seviye: ${level} (Sıfır/Orta/İleri)
Günlük Hedef Çalışma Saati: ${dailyTargetHours} saat
Zayıf Dersler: ${weakSubjects.map(s => `${s.subject} (%${s.progressPercent})`).join(', ') || 'Yok'}
Son 2 Haftada Tamamlanan Görevler: ${recentTasks.map(t => `${t.subject} - ${t.topic}`).join(', ') || 'Yok'}

KRİTİK KURALLAR:
1. KESİNLİKLE resmi müfredattaki konuları kullan. Müfredatta olmayan konu asla önerme.
2. Zayıf derslere ağırlık ver (%50-60 zaman ayır).
3. Her gün farklı ders dengesi oluştur (örn: Matematik + Fizik yerine her gün farklı kombinasyon).
4. Günlük çalışma süresini (${dailyTargetHours} saat) hesapla ve buna göre pomodoro sayısı belirle (1 pomodoro = 25 dakika).
5. Çalışma yöntemleri: "VIDEO" (Video izleme), "READING" (Okuma), "PRACTICE" (Soru çözümü), "TEST" (Test çözme), "REVIEW" (Konu tekrarı).
6. Her gün 2-3 görev öner, toplam günlük çalışma süresini aşma.
7. Öncelik seviyesi: Zayıf dersler için "high", diğerleri için "medium".
8. Son 2 haftada tamamlanan konuları tekrar etme.
9. Her gün için gerçek tarih hesapla (startDate'dan başlayarak).

JSON FORMATI:
{
  "days": [
    {
      "day": "Pazartesi",
      "date": "2025-01-13",
      "tasks": [
        {
          "subject": "Matematik",
          "topic": "Türev",
          "studyMethod": "PRACTICE",
          "pomodoros": 2,
          "duration": 50,
          "priority": "high"
        }
      ]
    }
  ]
}

Başlangıç tarihi: ${startDate || new Date().toISOString().split('T')[0]}

Şimdi öğrenci için optimize edilmiş, müfredat uyumlu 7 günlük çalışma programı oluştur. Sadece JSON formatında yanıt ver, açıklama ekle.

Return ONLY valid JSON. Do NOT include markdown blocks, text, or explanations.`;

    // FALLBACK MODEL DİZİSİ
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];

    const prompt = `${systemPrompt}

Lütfen ${level} seviyesinde, günlük ${dailyTargetHours} saat çalışma hedefi olan öğrenci için optimize edilmiş haftalık program oluştur.`;

    // FALLBACK MECANİZMASI İLE MODEL DENEYİŞİ
    let schedule: WeeklySchedule | null = null;
    let successfulModel: string | null = null;
    let lastError: any = null;

    for (const modelName of models) {
      console.log(`SCHEDULER_AI: Trying ${modelName}...`);

      try {
        // Initialize Gemini with current model
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        console.log(`SCHEDULER_AI: ${modelName} response received`);

        // JSON Sanitization - Markdown temizliği
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parse JSON from response
        try {
          // Extract JSON from response (in case there's extra text)
          const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            schedule = JSON.parse(jsonMatch[0]);
          } else {
            schedule = JSON.parse(cleanJson);
          }
          successfulModel = modelName;
          console.log(`SCHEDULER_AI: ${modelName} worked!`);
          break; // Başarılı, döngüden çık
        } catch (parseError) {
          console.error(`SCHEDULER_AI_PARSE_ERROR: ${modelName} -`, parseError);
          console.error(`SCHEDULER_AI_PARSE_ERROR: Response text:`, cleanJson);
          lastError = { status: 'parse', model: modelName, error: parseError };
          continue; // Parse hatası - bir sonraki modele geç
        }
      } catch (modelError: any) {
        console.error(`SCHEDULER_AI_ERROR: ${modelName} -`, modelError);
        lastError = { status: 'model', model: modelName, error: modelError };

        // Timeout veya rate limit kontrolü
        if (modelError.message?.includes('timeout') || modelError.message?.includes('ETIME')) {
          console.warn(`${modelName} timeout, bir sonraki modele geçiliyor...`);
          continue;
        }

        // Diğer hatalar - bir sonraki modele geç
        continue;
      }
    }

    // Tüm modeller başarısız oldu
    if (!schedule) {
      console.error('SCHEDULER_AI_FATAL_ERROR: All models failed');
      console.error('SCHEDULER_AI_FATAL_ERROR: Last error:', lastError);
      return NextResponse.json({
        success: false,
        error: 'Haftalık program oluşturulurken hata oluştu. Lütfen daha sonra tekrar deneyin.'
      }, { status: 500 });
    }

    console.log(`SCHEDULER_AI_SUCCESS: Used model ${successfulModel}`);

    // Validate schedule structure
    if (!schedule || !schedule.days || !Array.isArray(schedule.days) || schedule.days.length !== 7) {
      console.error('SCHEDULER_AI_VALIDATION_ERROR: Invalid schedule structure', schedule);
      return NextResponse.json({
        success: false,
        error: 'AI tarafından geçersiz program formatı döndürüldü'
      }, { status: 500 });
    }

    // Calculate actual dates starting from startDate
    const startDateObj = new Date(startDate || new Date());
    const scheduleWithDates = {
      ...schedule,
      days: schedule.days.map((day, index) => {
        const date = new Date(startDateObj);
        date.setDate(date.getDate() + index);
        return {
          ...day,
          date: date.toISOString().split('T')[0]
        };
      })
    };

    return NextResponse.json({ 
      success: true, 
      schedule: scheduleWithDates,
      metadata: {
        studentId,
        level,
        dailyTargetHours,
        examType,
        weakSubjectsCount: weakSubjects.length,
        curriculumSubjects: curriculumSubjects
      }
    });

  } catch (error) {
    console.error('SCHEDULER_AI_ERROR:', error);
    return NextResponse.json({
      success: false,
      error: 'Haftalık program oluşturulurken hata oluştu'
    }, { status: 500 });
  }
}