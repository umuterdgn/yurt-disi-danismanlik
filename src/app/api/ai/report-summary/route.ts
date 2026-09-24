import { NextResponse } from "next/server";

interface ReportData {
  studentName: string;
  reportType: 'weekly' | 'monthly';
  dateRange: {
    start: string;
    end: string;
  };
  exams: {
    date: string;
    totalNet: number;
    subjectResults: any[];
  }[];
  completedTasks: {
    subject: string;
    topic: string;
    completedCorrect: number;
    completedWrong: number;
    completedEmpty: number;
    studyMethod: string;
  }[];
  pomodoroData: {
    totalMinutes: number;
    totalSessions: number;
    topSubjects: { subject: string; minutes: number }[];
  };
  currentScore: number;
  targetScore: number;
  weakSubjects: string[];
  strongSubjects: string[];
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY eksik." }, { status: 500 });
    }

    const data: ReportData = await req.json();
    const {
      studentName,
      reportType,
      dateRange,
      exams,
      completedTasks,
      pomodoroData,
      currentScore,
      targetScore,
      weakSubjects,
      strongSubjects
    } = data;

    // Calculate statistics
    const totalExams = exams.length;
    const averageNet = totalExams > 0 ? exams.reduce((sum, e) => sum + (e.totalNet || 0), 0) / totalExams : 0;
    const totalTasks = completedTasks.length;
    const totalCorrect = completedTasks.reduce((sum, t) => sum + (t.completedCorrect || 0), 0);
    const totalWrong = completedTasks.reduce((sum, t) => sum + (t.completedWrong || 0), 0);
    const totalEmpty = completedTasks.reduce((sum, t) => sum + (t.completedEmpty || 0), 0);
    const taskSuccessRate = totalTasks > 0 ? (totalCorrect / (totalCorrect + totalWrong + totalEmpty)) * 100 : 0;
    
    const totalPomodoroHours = Math.round(pomodoroData.totalMinutes / 25);
    const topSubjectsList = pomodoroData.topSubjects.slice(0, 3).map(s => s.subject).join(', ');

    const scoreGap = targetScore - currentScore;
    const scoreGapText = scoreGap > 0 
      ? `Hedef puana ${scoreGap.toFixed(1)} net daha gerekiyor`
      : scoreGap < 0 
      ? `Hedef puandan ${Math.abs(scoreGap).toFixed(1)} net üstündesiniz`
      : 'Hedef puana ulaştınız';

    const reportPeriod = reportType === 'weekly' ? 'bu hafta' : 'bu ay';

    const prompt = `You are an expert educational consultant and academic coach with years of experience in student development and parent communication.

You need to write a professional, encouraging, and insightful coaching summary for the following student's ${reportType} progress report.

STUDENT PROFILE:
- Name: ${studentName}
- Report Period: ${reportPeriod} (${dateRange.start} to ${dateRange.end})
- Current Score: ${currentScore}
- Target Score: ${targetScore}
- Score Analysis: ${scoreGapText}

PERFORMANCE DATA:
- Total Exams Taken: ${totalExams}
- Average Net Score: ${averageNet.toFixed(2)}
- Total Tasks Completed: ${totalTasks}
- Task Success Rate: ${taskSuccessRate.toFixed(1)}%
- Correct Answers: ${totalCorrect}
- Wrong Answers: ${totalWrong}
- Empty Answers: ${totalEmpty}
- Total Study Time: ${totalPomodoroHours} Pomodoro sessions (${pomodoroData.totalMinutes} minutes)
- Most Studied Subjects: ${topSubjectsList || 'N/A'}

STRONG SUBJECTS: ${strongSubjects.join(', ') || 'None identified'}
WEAK SUBJECTS: ${weakSubjects.join(', ') || 'None identified'}

REQUIREMENTS:
1. Write a professional coaching summary in Turkish
2. Keep it to 1-2 paragraphs (150-250 words)
3. Address both the student and parents
4. Highlight specific achievements and areas for improvement
5. Mention the most studied subjects and their impact
6. Be encouraging but realistic about challenges
7. Reference specific data points (exam performance, task completion, study time)
8. End with a clear action item or recommendation for the next ${reportType === 'weekly' ? 'week' : 'month'}

TONE: Professional, encouraging, insightful, and data-driven. Avoid generic praise - be specific based on the data provided.

Return ONLY the summary text (no markdown formatting, no introductory text, no explanatory notes).`;

    // FALLBACK MODEL DİZİSİ (OCR sisteminde kullanılan aynı döngü)
    const models = ["gemini-2.5-flash"];
    
    let summary: string | null = null;
    let successfulModel: string | null = null;
    let lastError: any = null;

    for (const modelName of models) {
      console.log(`GEMINI_MODEL: Trying ${modelName} for report summary...`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            responseMimeType: "text/plain"
          }
        })
      });

      console.log(`GEMINI_RESPONSE_STATUS: ${modelName} - ${response.status}`);

      // 503 High Demand - bir sonraki modele geç
      if (response.status === 503) {
        console.warn(`${modelName} 503 High Demand, bir sonraki modele geçiliyor...`);
        lastError = { status: 503, model: modelName };
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GEMINI_API_ERROR: ${modelName} - ${errorText}`);
        
        // 404 model bulunamadı - bir sonraki modele geç
        if (response.status === 404) {
          console.warn(`${modelName} 404 not found, bir sonraki modele geçiliyor...`);
          lastError = { status: 404, model: modelName };
          continue;
        }
        
        // Diğer hatalar - hemen dön
        if (response.status === 401 || response.status === 403) {
          console.error("GEMINI_AUTH_ERROR: Authentication failed");
          return NextResponse.json({ error: "API anahtar geçersiz veya yetkisiz." }, { status: response.status });
        } else if (response.status === 429) {
          console.error("GEMINI_RATE_LIMIT_ERROR: Rate limit exceeded");
          return NextResponse.json({ error: "API rate limit aşıldı. Lütfen biraz bekleyip tekrar deneyin." }, { status: 429 });
        } else if (response.status === 500) {
          console.error("GEMINI_REQUEST_ERROR: Server error");
          return NextResponse.json({ error: "Gemini sunucu hatası. Lütfen daha sonra tekrar deneyin." }, { status: 500 });
        }
        
        return NextResponse.json({ error: `API Hatası: ${response.status} - ${errorText}` }, { status: response.status });
      }

      // Başarılı - yanıtı parse et
      try {
        const responseData = await response.json();
        summary = responseData.candidates[0].content.parts[0].text;
        successfulModel = modelName;
        console.log(`GEMINI_SUCCESS: ${modelName} worked!`);
        break; // Başarılı, döngüden çık
      } catch (parseError) {
        console.error(`GEMINI_PARSE_ERROR: ${modelName} -`, parseError);
        lastError = { status: "parse", model: modelName, error: parseError };
        continue; // Parse hatası - bir sonraki modele geç
      }
    }

    // Tüm modeller başarısız oldu
    if (!summary) {
      console.error("GEMINI_FATAL_ERROR: All models failed for report summary");
      if (lastError?.status === 503) {
        return NextResponse.json({ error: "Tüm modeller şu anda meşgul (503 High Demand). Lütfen birazdan tekrar deneyin." }, { status: 503 });
      } else if (lastError?.status === 404) {
        return NextResponse.json({ error: "Tüm modeller bulunamadı (404). API anahtarınızın Gemini modellerini desteklediğinden emin olun." }, { status: 404 });
      } else {
        return NextResponse.json({ error: "Tüm modeller başarısız oldu. Lütfen daha sonra tekrar deneyin." }, { status: 500 });
      }
    }

    console.log(`GEMINI_SUCCESS: Used model ${successfulModel} for report summary`);

    return NextResponse.json({
      success: true,
      summary
    });

  } catch (error: any) {
    console.error("Report Summary Error:", error);
    return NextResponse.json({ error: error.message || "Rapor özeti alınırken hata oluştu" }, { status: 500 });
  }
}