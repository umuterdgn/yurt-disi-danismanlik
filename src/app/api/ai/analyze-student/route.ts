import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function getStudentContextForAnalysis(userId: string) {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        subjectAnalysis: {
          orderBy: { progressPercent: 'asc' },
          take: 10
        }
      }
    });

    if (!studentProfile) {
      return null;
    }

    return {
      name: studentProfile.user.name,
      grade: studentProfile.grade,
      targetUniversity: studentProfile.targetUniversity,
      targetDepartment: studentProfile.targetMajor,
      targetScore: studentProfile.targetScore,
      currentScore: studentProfile.currentScore,
      targetExam: studentProfile.targetExam,
      examDate: studentProfile.examDate ? new Date(studentProfile.examDate).toLocaleDateString('tr-TR') : null,
      school: studentProfile.school
    };
  } catch (error) {
    console.error('Error fetching student context for analysis:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user using custom cookie-based auth
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      console.error('AI Analyze Student: Unauthorized - No user_id in cookies');
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('AI Analyze Student: GROQ_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'AI servisi yapılandırılmamış' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { studentId, examResults, subjectAnalysis, scores, notes } = body;

    // Get student context for analysis
    const studentContext = await getStudentContextForAnalysis(userId);

    // Build the prompt for AI analysis
    const prompt = `
Sen bir deneyimli eğitim koçusun. Aşağıdaki öğrenci verilerine dayanarak kapsamlı bir çalışma analizi ve öneri raporu hazırla:

ÖĞRENCİ PROFİLİ:
- Adı: ${studentContext?.name || 'Bilinmiyor'}
- Sınıf: ${studentContext?.grade || 'Bilinmiyor'}
- Okul: ${studentContext?.school || 'Bilinmiyor'}
- Hedef Üniversite: ${studentContext?.targetUniversity || 'Belirlemedi'}
- Hedef Bölüm: ${studentContext?.targetDepartment || 'Belirlemedi'}
- Hedef Puan: ${studentContext?.targetScore || 'Belirlemedi'}
- Mevcut Puan: ${studentContext?.currentScore || 0}
- Hedef Sınav: ${studentContext?.targetExam || 'Belirlemedi'}
- Sınav Tarihi: ${studentContext?.examDate || 'Belirlemedi'}

Öğrenci Son Netleri:
- Türkçe: ${scores?.turkish || 0}
- Matematik: ${scores?.math || 0}
- Fen Bilimleri: ${scores?.science || 0}
- Sosyal Bilimler: ${scores?.social || 0}

Öğrenci Deneme Sonuçları:
${JSON.stringify(examResults, null, 2)}

Konu Analizi Verileri:
${JSON.stringify(subjectAnalysis, null, 2)}

Ek Notlar:
${notes || 'Yok'}

Lütfen şu formatta Türkçe bir analiz raporu oluştur:
1. GENEL DURUM DEĞERLENDİRMESİ: Öğrencinin genel performansını özetle
2. GÜÇLÜ YÖNLER: Öğrencinin iyi olduğu alanları belirle
3. ZAYIF YÖNLER VE EKSİKLER: Geliştirilmesi gereken konuları detaylıca listele
4. ÇALIŞMA ÖNERİLERİ: Her zayıf konu için spesifik çalışma stratejileri öner
5. HAFTALIK ÇALIŞMA PROGRAMI: Öğrenci için gerçekçi bir haftalık çalışma planı öner
6. MOTİVASYON MESAJI: Öğrenciyi motive edecek destekleyici bir mesaj

Raporu profesyonel, destekleyici ve uygulanabilir bir dilde yaz.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that outputs strictly in JSON format. Sen uzman bir eğitim koçusun ve öğrenci performans analizi konusunda uzmanlaşmışsın.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      max_tokens: 2048,
    });

    const analysis = chatCompletion.choices[0]?.message?.content || 'Analiz oluşturulamadı';

    // Save analysis to SubjectProgress if studentId is provided
    if (studentId) {
      try {
        // Create or update a subject analysis entry with the AI analysis
        await prisma.subjectAnalysis.create({
          data: {
            studentProfileId: studentId,
            subject: 'Genel Analiz',
            topic: 'AI Destekli Çalışma Planı',
            proficiency: 'MEDIUM',
            progressPercent: 0,
            totalHours: 0
          }
        });
      } catch (error) {
        console.error('Error saving analysis to database:', error);
        // Don't fail the request if database save fails
      }
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('AI Analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Analiz oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
