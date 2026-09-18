import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'AI servisi yapılandırılmamış' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { studentSymbol, currentXP, studentName } = body;

    const prompt = `
Sen gençler için eğlenceli ve gaza getirici bir motivasyon koçusun. Aşağıdaki öğrenci bilgilerine dayanarak kısa, esprili ve motive edici bir mesaj üret:

Öğrenci Sembolü: ${studentSymbol || '🎓'}
Mevcut XP: ${currentXP || 0}
Öğrenci Adı: ${studentName || 'Öğrenci'}

Lütfen şu kurallara uyan bir mesaj oluştur:
1. Maksimum 2-3 cümle
2. Öğrencinin sembolünü mesaja dahil et
3. XP seviyesine göre öv (örn: "150 XP harikasın!")
4. Eğlenceli ve genç dil kullan
5. Türkçe yaz
6. Emoji kullan ama abartma

Örnekler:
- "🚀 150 XP'ye ulaştın! Bugün o matematiği parçalıyoruz!"
- "🦁 300 XP ile aslan gibi ilerliyorsun! Devam et!"
- "🦉 500 XP! Baykuş gibi zekasın, hedefine yaklaşıyorsun!"
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Sen gençler için eğlenceli ve gaza getirici bir motivasyon koçusun.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.8,
      max_tokens: 150,
    });

    const motivation = chatCompletion.choices[0]?.message?.content || 'Harikasın, devam et!';

    return NextResponse.json({ success: true, motivation });
  } catch (error) {
    console.error('AI Motivation error:', error);
    
    // Handle specific Groq API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { success: false, error: 'AI API anahtarı geçersiz' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: 'AI servisi şu anda yoğun, lütfen daha sonra tekrar deneyin' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Motivasyon mesajı oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
