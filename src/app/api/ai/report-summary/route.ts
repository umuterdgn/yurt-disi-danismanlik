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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "text/plain"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GEMINI_API_ERROR:", errorText);
      return NextResponse.json({ error: "AI rapor özeti oluşturulamadı" }, { status: response.status });
    }

    const responseData = await response.json();
    const summary = responseData.candidates[0].content.parts[0].text;

    return NextResponse.json({
      success: true,
      summary
    });

  } catch (error: any) {
    console.error("Report Summary Error:", error);
    return NextResponse.json({ error: error.message || "Rapor özeti alınırken hata oluştu" }, { status: 500 });
  }
}