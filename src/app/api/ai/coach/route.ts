import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function getStudentContext(userId: string) {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        dailyTasks: {
          where: {
            taskDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          }
        },
        studySessions: {
          where: {
            startTime: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        },
        examResults: {
          orderBy: { examDate: 'desc' },
          take: 3
        },
        applications: {
          include: {
            university: {
              include: { country: true }
            }
          },
          take: 3
        }
      }
    });

    if (!studentProfile) {
      return null;
    }

    // Calculate context data
    const todayTasks = studentProfile.dailyTasks || [];
    const completedTasks = todayTasks.filter(t => t.isCompleted).length;
    const pendingTasks = todayTasks.filter(t => !t.isCompleted).length;

    const studySessions = studentProfile.studySessions || [];
    const totalStudyMinutes = studySessions.reduce((sum, session) => sum + (session.actualDuration || 0), 0);
    const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

    const recentExams = studentProfile.examResults || [];
    const latestExam = recentExams[0];
    const examContext = latestExam
      ? `Son deneme: ${latestExam.examName} (${new Date(latestExam.examDate).toLocaleDateString('tr-TR')}) - Hedef: ${latestExam.targetScore}, Gerçekleşen: ${latestExam.actualScore || 'Henüz yok'}`
      : 'Henüz deneme sonucu yok';

    const applications = studentProfile.applications || [];
    const activeApplication = applications.find(app => ['INITIAL_INTERVIEW', 'DOCUMENT_COLLECTION', 'SUBMITTED'].includes(app.status));
    const abroadContext = activeApplication
      ? `Yurt dışı başvurusu aktif: ${activeApplication.university.name} (${activeApplication.university.country.name}) - ${activeApplication.program} - Durum: ${activeApplication.status}`
      : 'Yurt dışı başvurusu yok';

    return {
      name: studentProfile.user.name,
      grade: studentProfile.grade,
      targetUniversity: studentProfile.targetUniversity,
      targetDepartment: studentProfile.targetMajor,
      targetScore: studentProfile.targetScore,
      currentScore: studentProfile.currentScore,
      completedTasks,
      pendingTasks,
      totalStudyHours,
      examContext,
      abroadContext,
      targetExam: studentProfile.targetExam,
      examDate: studentProfile.examDate ? new Date(studentProfile.examDate).toLocaleDateString('tr-TR') : null
    };
  } catch (error) {
    console.error('Error fetching student context:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user using custom cookie-based auth
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      console.error('AI Coach: Unauthorized - No user_id in cookies');
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('AI Coach: GROQ_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'AI servisi yapılandırılmamış' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    // Fetch student context from database
    const studentContext = await getStudentContext(userId);

    // Build dynamic system prompt with student context
    let systemPrompt = `Sen Nexa Edu'nun profesyonel AI eğitim koçusun. Türk öğrencilere ders çalışma taktikleri, soru çözüm stratejileri, zaman yönetimi ve motivasyon konusunda yardım ediyorsun.

Kurallar:
1. Her zaman Türkçe cevap ver
2. Pratik ve uygulanabilir tavsiyeler ver
3. Öğrencinin seviyesine uygun dil kullan
4. Motivasyonu yüksek tut ama gerçekçi ol
5. Maksimum 2-3 paragraf cevap ver
6. Emoji kullan ama abartma
7. Somut örnekler ver`;

    if (studentContext) {
      systemPrompt += `

---
ÖĞRENCİ BİLGİLERİ:
Adı: ${studentContext.name}
Sınıf: ${studentContext.grade}
Hedef Üniversite: ${studentContext.targetUniversity || 'Belirlemedi'}
Hedef Bölüm: ${studentContext.targetDepartment || 'Belirlemedi'}
Hedef Puan: ${studentContext.targetScore || 'Belirlemedi'}
Mevcut Puan: ${studentContext.currentScore || 0}
Hedef Sınav: ${studentContext.targetExam || 'Belirlemedi'}
Sınav Tarihi: ${studentContext.examDate || 'Belirlemedi'}

BUGÜNKÜ İLERLEME:
Tamamlanan Görevler: ${studentContext.completedTasks}
Bekleyen Görevler: ${studentContext.pendingTasks}
Son 7 Gün Çalışma Süresi: ${studentContext.totalStudyHours} saat

${studentContext.examContext}

${studentContext.abroadContext}
---

Bu öğrencinin verilerini kullanarak, hedefine uygun, spesifik ve analitik tavsiyeler ver. Mevcut durumunu ve ilerlemesini dikkate alarak kişiselleştirilmiş destek sağla.`;
    }

    // Build conversation context
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama3-70b-8192',
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = chatCompletion.choices[0]?.message?.content || 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.';

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('AI Coach error:', error);
    
    // Handle specific Groq API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.error('AI Coach: Invalid API key');
        return NextResponse.json(
          { success: false, error: 'AI API anahtarı geçersiz' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        console.error('AI Coach: Rate limit exceeded');
        return NextResponse.json(
          { success: false, error: 'AI servisi şu anda yoğun, lütfen daha sonra tekrar deneyin' },
          { status: 429 }
        );
      }
    }
    
    console.error('AI Coach: Unknown error', error);
    return NextResponse.json(
      { success: false, error: 'AI koç hatası oluştu' },
      { status: 500 }
    );
  }
}