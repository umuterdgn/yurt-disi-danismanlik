import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { cookies } from 'next/headers';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

    // Build conversation context
    const messages = [
      {
        role: 'system' as const,
        content: `Sen Türk öğrenciler için profesyonel bir eğitim koçusun. Öğrencilere ders çalışma taktikleri, soru çözüm stratejileri, zaman yönetimi ve motivasyon konusunda yardım ediyorsun.

Kurallar:
1. Her zaman Türkçe cevap ver
2. Pratik ve uygulanabilir tavsiyeler ver
3. Öğrencinin seviyesine uygun dil kullan
4. Motivasyonu yüksek tut ama gerçekçi ol
5. Maksimum 2-3 paragraf cevap ver
6. Emoji kullan ama abartma
7. Somut örnekler ver

Örnek sorular ve cevaplar:
- "Matematik nasıl çalışmalıyım?" → "Matematik için önce temel kavramları pekiştir. Her gün en az 20 soru çöz, hatalı soruları tekrar et. Konu bitince deneme çöz, eksikleri belirle."
- "Motivasyonum düştü" → "Bu normal! Küçük hedefler koy, her gün bir adım ilerle. Başarılarını not al, kendini ödüllendir. Unutma, her büyük başarı küçük adımlarla başlar."
- "Sınav stresimi nasıl yenerim?" → "Stresi yönetmek için planlı çalış. Son hafta tekrar değil, deneme çöz. Nefes egzersizleri yap, uykuna dikkat et. Güvendiğin en iyi arkadaşınla konuş."`
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