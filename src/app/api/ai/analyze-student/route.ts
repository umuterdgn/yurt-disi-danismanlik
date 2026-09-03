import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examResults, subjectAnalysis } = body;

    // Build the prompt for AI analysis
    const prompt = `
Sen bir deneyimli eğitim koçusun. Aşağıdaki öğrenci verilerine dayanarak kapsamlı bir çalışma analizi ve öneri raporu hazırla:

Öğrenci Deneme Sonuçları:
${JSON.stringify(examResults, null, 2)}

Konu Analizi Verileri:
${JSON.stringify(subjectAnalysis, null, 2)}

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
          content: 'Sen uzman bir eğitim koçusun ve öğrenci performans analizi konusunda uzmanlaşmışsın.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 2048,
    });

    const analysis = chatCompletion.choices[0]?.message?.content || 'Analiz oluşturulamadı';

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('AI Analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Analiz oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
