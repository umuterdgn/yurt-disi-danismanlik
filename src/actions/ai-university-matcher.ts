'use server';

import { cookies } from "next/headers";
import { createServerClient } from '@supabase/ssr';
import Groq from 'groq-sdk';

interface UniversityMatch {
  name: string;
  country: string;
  matchPercentage: number;
  reasons: string[];
  estimatedCost: string;
  requirements: string[];
  admissionRequirements: string[];
  ranking?: number;
  documentCount?: number;
  comparison?: string; // Comparison with other options
  alternatives?: string[]; // Alternative universities
}

export async function matchUniversitiesWithAI(formData: {
  budget: string;
  gpa: string;
  ieltsScore: string;
  targetCountry: string;
  department: string;
  socialSkills?: string;
}) {
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

    // AI University Matching Logic using Groq
    const matches = await performAIMatching(formData);

    return {
      success: true,
      matches
    };

  } catch (error) {
    console.error('AI university matching error:', error);
    return { success: false, error: 'Üniversite eşleştirme sırasında bir hata oluştu' };
  }
}

// AI University Matching Function using Groq
async function performAIMatching(formData: {
  budget: string;
  gpa: string;
  ieltsScore: string;
  targetCountry: string;
  department: string;
  socialSkills?: string;
}): Promise<UniversityMatch[]> {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Check if multiple countries are specified for comparison
    const countries = formData.targetCountry.split(',').map(c => c.trim()).filter(c => c);
    const isComparison = countries.length > 1;

    // Build dynamic prompt based on available data
    const hasGPA = formData.gpa && formData.gpa.trim() !== '';
    const hasIELTS = formData.ieltsScore && formData.ieltsScore.trim() !== '';
    const hasBudget = formData.budget && formData.budget.trim() !== '';
    const hasDepartment = formData.department && formData.department.trim() !== '';
    const hasCountry = formData.targetCountry && formData.targetCountry.trim() !== '';

    const prompt = `
Sen bir yurt dışı eğitim danışmanlık uzmanısın. Aşağıdaki öğrenci profilini analiz et ve en uygun üniversiteleri öner:

Öğrenci Profili:
${hasBudget ? `- Yıllık Bütçe: ${formData.budget} $` : '- Yıllık Bütçe: Belirtilmedi'}
${hasGPA ? `- Not Ortalaması (GPA): ${formData.gpa}` : '- Not Ortalaması (GPA): Belirtilmedi'}
${hasIELTS ? `- IELTS Puanı: ${formData.ieltsScore}` : '- IELTS Puanı: Belirtilmedi'}
${hasCountry ? `- Hedef Ülke(ler): ${formData.targetCountry}` : '- Hedef Ülke(ler): Belirtilmedi'}
${hasDepartment ? `- Bölüm/Program: ${formData.department}` : '- Bölüm/Program: Belirtilmedi'}
${formData.socialSkills ? `- Sosyal Yetenekler & Ekstra Başarılar: ${formData.socialSkills}` : ''}

${!hasGPA || !hasIELTS ? `
ÖZEL NOT: Öğrenci GPA veya IELTS skoru belirtmemiş. Bu durumda:
- Her üniversite için genel/ortalama kabul şartlarını listele
- 'Not belirtilmediği için standart şartlar baz alınmıştır' şeklinde not düş
- Genel kabul kriterlerini kullanarak öneriler sun
` : ''}

${isComparison ? `
ÖZEL İSTEM: Bu öğrenci ${countries.length} farklı ülke karşılaştırması yapıyor (${countries.join(', ')}).
Lütfen her ülke için en iyi üniversiteyi öner ve bunları şu kriterlere göre karşılaştır:
- Bütçe uygunluğu
- Kabul şartları
- Akademik kalite
- Yaşam maliyeti
- Vize kolaylığı
` : ''}

${!hasDepartment && !hasCountry ? `
ÖZEL İSTEM: Öğrenci bölüm veya ülke belirtmemiş. Bu durumda:
- Dünya genelinde en iyi üniversiteleri öner
- Farklı ülkelerden seçkiler sun
- Her ülke için en az 1 üniversite öner
- Genel kabul şartlarını belirt
` : ''}

Lütfen şu formatta JSON döndür:
{
  "universities": [
    {
      "name": "Üniversite Adı",
      "country": "Ülke Adı",
      "matchPercentage": 85,
      "reasons": ["Neden önerildiği", "Diğer nedenler"],
      "estimatedCost": "$30,000",
      "requirements": ["GPA 3.5", "IELTS 7.0"],
      "admissionRequirements": ["Kabul şartı 1", "Kabul şartı 2", "Kabul şartı 3"],
      "ranking": 10,
      "comparison": "Diğer ülkelerle karşılaştırma (eğer varsa)",
      "alternatives": ["Alternatif üniversite 1", "Alternatif üniversite 2"]
    }
  ]
}

Her üniversite için:
- Gerçek dünya üniversiteleri kullanın
- Kabul şartlarını madde işaretli liste olarak belirtin
- Eğer karşılaştırma varsa, bütçe ve avantajları karşılaştırın
- En az 2 alternatif üniversite önerin
- Sosyal yetenekleri kabul ihtimali hesaplamasında kullanın
- Eğer GPA/IELTS belirtilmemişse, genel kabul şartlarını kullan
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Sen uzman bir yurt dışı eğitim danışmanısın. Gerçek üniversite verileri ve kabul şartları hakkında bilgi sahibisin. Türkçe yanıt ver ve JSON formatında çıktı üret.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" }
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    const aiData = JSON.parse(aiResponse);

    if (!aiData.universities || !Array.isArray(aiData.universities)) {
      throw new Error('Invalid AI response format');
    }

    return aiData.universities.map((uni: any) => ({
      name: uni.name,
      country: uni.country,
      matchPercentage: uni.matchPercentage || 75,
      reasons: uni.reasons || ['Genel profil uyumu'],
      estimatedCost: uni.estimatedCost || '$25,000',
      requirements: uni.requirements || ['GPA gereksinimi', 'IELTS gereksinimi'],
      admissionRequirements: uni.admissionRequirements || ['Transkript', 'Kişisel beyan'],
      ranking: uni.ranking,
      comparison: uni.comparison,
      alternatives: uni.alternatives || [],
      documentCount: uni.admissionRequirements?.length || 5
    }));

  } catch (error) {
    console.error('Groq AI error:', error);
    throw new Error('AI university matching failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}