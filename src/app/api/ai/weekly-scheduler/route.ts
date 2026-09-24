import { NextRequest, NextResponse } from 'next/server';
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

    const prompt = `${systemPrompt}

Lütfen ${level} seviyesinde, günlük ${dailyTargetHours} saat çalışma hedefi olan öğrenci için optimize edilmiş haftalık program oluştur.`;

    // FALLBACK MODEL DİZİSİ
    const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];

    // REST API çağrısı
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY eksik.' }, { status: 500 });
    }

    let schedule: WeeklySchedule | null = null;
    let successfulModel: string | null = null;
    let lastError: any = null;

    // FALLBACK DÖNGÜSÜ
    for (const modelName of FALLBACK_MODELS) {
      console.log(`SCHEDULER_AI: Trying ${modelName}...`);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        console.log(`SCHEDULER_AI: ${modelName} response status: ${response.status}`);

        // 503 High Demand - bir sonraki modele geç
        if (response.status === 503) {
          console.warn(`SCHEDULER_AI: ${modelName} 503 High Demand, trying next model...`);
          lastError = { status: 503, model: modelName };
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`SCHEDULER_AI: ${modelName} error:`, errorText);
          lastError = { status: response.status, model: modelName, error: errorText };

          // 404 model bulunamadı - bir sonraki modele geç
          if (response.status === 404) {
            console.warn(`SCHEDULER_AI: ${modelName} 404 not found, trying next model...`);
            continue;
          }

          // Diğer hatalar - hemen dön
          return NextResponse.json({
            success: false,
            error: 'Haftalık program oluşturulurken hata oluştu'
          }, { status: response.status });
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
          console.error(`SCHEDULER_AI: ${modelName} empty response`);
          lastError = { status: 'empty', model: modelName };
          continue;
        }

        // Parse JSON from response
        try {
          schedule = JSON.parse(responseText);
          successfulModel = modelName;
          console.log(`SCHEDULER_AI: ${modelName} worked!`);
          break; // Başarılı, döngüden çık
        } catch (parseError) {
          console.error(`SCHEDULER_AI: ${modelName} parse error:`, parseError);
          lastError = { status: 'parse', model: modelName, error: parseError };
          continue; // Parse hatası - bir sonraki modele geç
        }
      } catch (fetchError: any) {
        console.error(`SCHEDULER_AI: ${modelName} fetch error:`, fetchError);
        lastError = { status: 'fetch', model: modelName, error: fetchError };
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