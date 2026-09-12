'use server';

import { cookies } from "next/headers";
import { createServerClient } from '@supabase/ssr';

interface SOPAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  overallScore: number;
  wordCount: number;
  readabilityScore: number;
}

export async function analyzeSOPWithAI(text: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    // AI SOP Analysis Logic
    const analysis = await performSOPAnalysis(text);

    return {
      success: true,
      analysis
    };

  } catch (error) {
    console.error('AI SOP analysis error:', error);
    return { success: false, error: 'SOP analizi sırasında bir hata oluştu' };
  }
}

// Mock AI SOP Analysis Function
// In production, this would integrate with Groq AI or similar service
async function performSOPAnalysis(text: string): Promise<SOPAnalysis> {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  const wordCount = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = wordCount / Math.max(1, sentences.length);

  // Basic analysis metrics
  let strengths: string[] = [];
  let weaknesses: string[] = [];
  let suggestions: string[] = [];
  let overallScore = 50;

  // Check word count
  if (wordCount >= 500 && wordCount <= 800) {
    strengths.push("İdeal kelime sayısı (500-800 kelime)");
    overallScore += 10;
  } else if (wordCount < 500) {
    weaknesses.push("Metin çok kısa, daha fazla detay ekleyin");
    suggestions.push("Kelime sayısını 500-800 arasına çıkarın");
  } else {
    weaknesses.push("Metin çok uzun, gereksiz detayları çıkarın");
    suggestions.push("Metni daha öz hale getirin");
  }

  // Check for academic goals
  if (text.toLowerCase().includes('hedef') || text.toLowerCase().includes('goal') || text.toLowerCase().includes('amaç')) {
    strengths.push("Akademik hedeflerden bahsediliyor");
    overallScore += 10;
  } else {
    weaknesses.push("Akademik hedefler belirtilmemiş");
    suggestions.push("Akademik hedeflerinizi net bir şekilde belirtin");
  }

  // Check for university connection
  if (text.toLowerCase().includes('üniversite') || text.toLowerCase().includes('university') || text.toLowerCase().includes('program')) {
    strengths.push("Üniversite/program ile bağlantı kurulmuş");
    overallScore += 10;
  } else {
    weaknesses.push("Üniversite ile bağlantı zayıf");
    suggestions.push("Seçtiğiniz üniversiteyle neden uyumlu olduğunuzu belirtin");
  }

  // Check for personal experience
  if (text.toLowerCase().includes('deneyim') || text.toLowerCase().includes('experience') || text.toLowerCase().includes('tecrübe')) {
    strengths.push("Kişisel deneyimler dahil edilmiş");
    overallScore += 10;
  } else {
    weaknesses.push("Kişisel deneyimler eksik");
    suggestions.push("Kişisel deneyimlerinizi ve başarılarınızı ekleyin");
  }

  // Check for future plans
  if (text.toLowerCase().includes('gelecek') || text.toLowerCase().includes('future') || text.toLowerCase().includes('kariyer')) {
    strengths.push("Gelecek planları belirtilmiş");
    overallScore += 10;
  } else {
    weaknesses.push("Gelecek planları eksik");
    suggestions.push("Mezuniyet sonrası kariyer hedeflerinizi belirtin");
  }

  // Check readability
  const readabilityScore = Math.min(100, Math.max(0, 100 - (avgSentenceLength - 15) * 2));
  if (readabilityScore >= 70) {
    strengths.push("İyi okunabilirlik");
  } else {
    weaknesses.push("Cümleler çok uzun veya karmaşık");
    suggestions.push("Cümleleri daha kısa ve anlaşılır hale getirin");
  }

  // Check for repetition (simple check)
  const words = text.toLowerCase().split(/\s+/);
  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  const repeatedWords = Object.entries(wordFrequency)
    .filter(([word, count]) => count > 5 && word.length > 3)
    .map(([word]) => word);

  if (repeatedWords.length > 0) {
    weaknesses.push(`Bazı kelimeler tekrarlanıyor: ${repeatedWords.slice(0, 3).join(', ')}`);
    suggestions.push("Tekrarlanan kelimeleri çeşitlendirin");
  }

  // Check for structure (paragraphs)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 3 && paragraphs.length <= 5) {
    strengths.push("İyi paragraf yapısı");
    overallScore += 5;
  } else {
    weaknesses.push("Paragraf yapısı düzensiz");
    suggestions.push("Metni 3-5 paragrafa bölün");
  }

  // Cap the overall score
  overallScore = Math.min(100, overallScore);

  // Add some generic suggestions if needed
  if (suggestions.length < 3) {
    suggestions.push("Giriş paragrafında dikkat çekici bir açıklama kullanın");
    suggestions.push("Sonuç paragrafında güçlü bir kapanış yapın");
  }

  return {
    strengths,
    weaknesses,
    suggestions,
    overallScore,
    wordCount,
    readabilityScore: Math.round(readabilityScore)
  };
}