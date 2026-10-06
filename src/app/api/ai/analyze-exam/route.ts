import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Dosya yüklenmedi' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Sadece görsel dosyaları (.jpg, .png) yüklenebilir' },
        { status: 400 }
      );
    }

    // Get current user from session
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    // Initialize Gemini AI
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API anahtarı yapılandırılmamış' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const mimeType = file.type;

    // Prepare image data for Gemini
    const imageData = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    // System prompt for cognitive error analysis
    const systemPrompt = `Sen Nexa Edu Bilişsel Yapay Zeka Koçusun. Yüklenen öğrenci sınav/soru kağıdı fotoğrafını analiz et. Şunları JSON formatında kesin olarak döndür:
1) questionType (YENI_NESIL veya KLASIK)
2) errorType (KNOWLEDGE_GAP, LOGIC_ERROR, CALCULATION_ERROR, ATTENTION_DEFICIT)
3) feedback (Öğrenciye ve koça yönelik maksimum 2 cümlelik, hatanın nedenini açıklayan bilişsel geri bildirim)

JSON formatı:
{
  "questionType": "YENI_NESIL" | "KLASIK",
  "errorType": "KNOWLEDGE_GAP" | "LOGIC_ERROR" | "CALCULATION_ERROR" | "ATTENTION_DEFICIT",
  "feedback": "kısa bilişsel geri bildirim"
}`;

    // Generate content with image
    const result = await model.generateContent([systemPrompt, imageData]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let analysisResult;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'AI yanıtını işlerken hata oluştu' },
        { status: 500 }
      );
    }

    // Increment AI usage count for the user
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          aiUsageCount: {
            increment: 1
          }
        }
      });
    } catch (dbError) {
      console.error('Error incrementing AI usage count:', dbError);
      // Don't fail the request if AI usage tracking fails
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });

  } catch (error) {
    console.error('OCR analysis error:', error);
    return NextResponse.json(
      { error: 'Analiz sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
