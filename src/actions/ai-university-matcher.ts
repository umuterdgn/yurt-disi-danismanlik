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

    // Build dynamic prompt based on available data with enhanced sanitization
    const hasGPA = formData.gpa && formData.gpa.trim() !== '' && formData.gpa !== 'undefined' && formData.gpa !== 'null';
    const hasIELTS = formData.ieltsScore && formData.ieltsScore.trim() !== '' && formData.ieltsScore !== 'undefined' && formData.ieltsScore !== 'null';
    const hasBudget = formData.budget && formData.budget.trim() !== '' && formData.budget !== 'undefined' && formData.budget !== 'null';
    const hasDepartment = formData.department && formData.department.trim() !== '' && formData.department !== 'undefined' && formData.department !== 'null';
    const hasCountry = formData.targetCountry && formData.targetCountry.trim() !== '' && formData.targetCountry !== 'undefined' && formData.targetCountry !== 'null';
    const hasSocialSkills = formData.socialSkills && formData.socialSkills.trim() !== '' && formData.socialSkills !== 'undefined' && formData.socialSkills !== 'null';

    // Sanitize input values to prevent template injection
    const sanitizedBudget = hasBudget ? formData.budget.replace(/[${}]/g, '') : 'Belirtilmedi';
    const sanitizedGPA = hasGPA ? formData.gpa.replace(/[${}]/g, '') : 'Belirtilmedi';
    const sanitizedIELTS = hasIELTS ? formData.ieltsScore.replace(/[${}]/g, '') : 'Belirtilmedi';
    const sanitizedCountry = hasCountry ? formData.targetCountry.replace(/[${}]/g, '') : 'Belirtilmedi';
    const sanitizedDepartment = hasDepartment ? formData.department.replace(/[${}]/g, '') : 'Belirtilmedi';
    const sanitizedSocialSkills = hasSocialSkills ? formData.socialSkills.replace(/[${}]/g, '') : '';

    // Check if multiple countries are specified for comparison
    const countries = sanitizedCountry.split(',').map(c => c.trim()).filter(c => c);
    const isComparison = countries.length > 1;

    const prompt = `
Sen bir yurt dışı eğitim danışmanlık uzmanısın. Aşağıdaki öğrenci profilini analiz et ve en uygun üniversiteleri öner:

Öğrenci Profili:
|- Yıllık Bütçe: ${sanitizedBudget} $
|- Not Ortalaması (GPA): ${sanitizedGPA}
|- IELTS Puanı: ${sanitizedIELTS}
|- Hedef Ülke(ler): ${sanitizedCountry}
|- Bölüm/Program: ${sanitizedDepartment}
${hasSocialSkills ? `- Sosyal Yetenekler & Ekstra Başarılar: ${sanitizedSocialSkills}` : ''}

${!hasGPA || !hasIELTS ? `
ÖZEL NOT: Öğrenci GPA veya IELTS skoru belirtmemiş. Bu durumda:
|- Her üniversite için genel/ortalama kabul şartlarını listele
|- 'Not belirtilmediği için standart şartlar baz alınmıştır' şeklinde not düş
|- Genel kabul kriterlerini kullanarak öneriler sun
` : ''}

${isComparison ? `
ÖZEL İSTEM: Bu öğrenci ${countries.length} farklı ülke karşılaştırması yapıyor (${sanitizedCountry}).
Lütfen her ülke için en iyi üniversiteyi öner ve bunları şu kriterlere göre karşılaştır:
|- Bütçe uygunluğu
|- Kabul şartları
|- Akademik kalite
|- Yaşam maliyeti
|- Vize kolaylığı
` : ''}

${!hasDepartment && !hasCountry ? `
ÖZEL İSTEM: Öğrenci bölüm veya ülke belirtmemiş. Bu durumda:
|- Dünya genelinde en iyi üniversiteleri öner
|- Farklı ülkelerden seçkiler sun
|- Her ülke için en az 1 üniversite öner
|- Genel kabul şartlarını belirt
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
|- Gerçek dünya üniversiteleri kullanın
|- Kabul şartlarını madde işaretli liste olarak belirtin
|- Eğer karşılaştırma varsa, bütçe ve avantajları karşılaştırın
|- En az 2 alternatif üniversite önerin
|- Sosyal yetenekleri kabul ihtimali hesaplamasında kullanın
|- Eğer GPA/IELTS belirtilmemişse, genel kabul şartlarını kullan
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Sen uzman bir yurt dışı eğitim danışmanısın. Gerçek üniversite verileri ve kabul şartları hakkında bilgi sahibisin. Türkçe yanıt ver ve JSON formatında çıktı üret. You MUST return the output strictly in JSON format. OUTPUT MUST BE STRICTLY A VALID JSON OBJECT. DO NOT ADD ANY MARKDOWN OR TEXT OUTSIDE THE JSON.'
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