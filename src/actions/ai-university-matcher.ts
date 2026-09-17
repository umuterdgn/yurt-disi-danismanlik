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

    const prompt = `
Sen bir yurt dışı eğitim danışmanlık uzmanısın. Aşağıdaki öğrenci profilini analiz et ve en uygun üniversiteleri öner:

Öğrenci Profili:
- Yıllık Bütçe: ${formData.budget} $
- Not Ortalaması (GPA): ${formData.gpa}
- IELTS Puanı: ${formData.ieltsScore}
- Hedef Ülke(ler): ${formData.targetCountry}
- Bölüm/Program: ${formData.department}
${formData.socialSkills ? `- Sosyal Yetenekler & Ekstra Başarılar: ${formData.socialSkills}` : ''}

${isComparison ? `
ÖZEL İSTEM: Bu öğrenci ${countries.length} farklı ülke karşılaştırması yapıyor (${countries.join(', ')}). 
Lütfen her ülke için en iyi üniversiteyi öner ve bunları şu kriterlere göre karşılaştır:
- Bütçe uygunluğu
- Kabul şartları
- Akademik kalite
- Yaşam maliyeti
- Vize kolaylığı
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
      model: 'llama-3.3-70b-versatile',
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
    
    // Fallback to mock data if AI fails
    return await getFallbackMatches(formData);
  }
}

// Fallback function when AI fails
async function getFallbackMatches(formData: {
  budget: string;
  gpa: string;
  ieltsScore: string;
  targetCountry: string;
  department: string;
  socialSkills?: string;
}): Promise<UniversityMatch[]> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  const budget = parseInt(formData.budget) || 25000;
  const gpa = parseFloat(formData.gpa) || 3.0;
  const ieltsScore = parseFloat(formData.ieltsScore) || 6.0;
  const targetCountry = formData.targetCountry;
  const department = formData.department;
  const socialSkills = formData.socialSkills || '';

  // Mock university database with real universities and admission requirements
  const universityDatabase = [
    {
      name: "University College London",
      country: "United Kingdom",
      ranking: 8,
      averageCost: 30000,
      requiredGPA: 3.5,
      requiredIELTS: 7.0,
      popularDepartments: ["Computer Science", "Engineering", "Medicine", "Law"],
      admissionRequirements: ["IELTS 7.0 minimum", "Academic transcripts", "Personal statement", "Two academic references", "Passport copy"]
    },
    {
      name: "Technical University of Munich",
      country: "Germany",
      ranking: 50,
      averageCost: 15000,
      requiredGPA: 3.2,
      requiredIELTS: 6.5,
      popularDepartments: ["Engineering", "Computer Science", "Data Science", "Architecture"],
      admissionRequirements: ["IELTS 6.5 minimum", "Abitur or equivalent", "Motivation letter", "CV/Resume", "Proof of German language proficiency (optional but recommended)"]
    },
    {
      name: "University of Toronto",
      country: "Canada",
      ranking: 25,
      averageCost: 35000,
      requiredGPA: 3.3,
      requiredIELTS: 6.5,
      popularDepartments: ["Computer Science", "Business Administration", "Medicine", "Psychology"],
      admissionRequirements: ["IELTS 6.5 minimum", "High school transcripts", "Personal statement", "Two teacher recommendations", "Study permit application"]
    },
    {
      name: "ETH Zurich",
      country: "Switzerland",
      ranking: 10,
      averageCost: 20000,
      requiredGPA: 3.7,
      requiredIELTS: 7.0,
      popularDepartments: ["Engineering", "Computer Science", "Data Science", "Architecture"],
      admissionRequirements: ["IELTS 7.0 minimum", "Matura or equivalent", "Motivation letter", "Two academic references", "Portfolio (for architecture)"]
    },
    {
      name: "University of Melbourne",
      country: "Australia",
      ranking: 35,
      averageCost: 28000,
      requiredGPA: 3.2,
      requiredIELTS: 6.5,
      popularDepartments: ["Business Administration", "Arts & Design", "Medicine", "Law"],
      admissionRequirements: ["IELTS 6.5 minimum", "Academic transcripts", "Personal statement", "Two references", "Student visa (Subclass 500)"]
    },
    {
      name: "National University of Singapore",
      country: "Singapore",
      ranking: 15,
      averageCost: 25000,
      requiredGPA: 3.5,
      requiredIELTS: 6.5,
      popularDepartments: ["Computer Science", "Business Administration", "Engineering", "Data Science"],
      admissionRequirements: ["IELTS 6.5 minimum", "High school diploma", "Personal statement", "Two teacher recommendations", "Student pass application"]
    },
    {
      name: "University of Amsterdam",
      country: "Netherlands",
      ranking: 60,
      averageCost: 18000,
      requiredGPA: 3.0,
      requiredIELTS: 6.5,
      popularDepartments: ["Business Administration", "Psychology", "Law", "Economics"],
      admissionRequirements: ["IELTS 6.5 minimum", "Dutch VWO diploma or equivalent", "Motivation letter", "CV/Resume", "Residence permit application"]
    },
    {
      name: "KU Leuven",
      country: "Belgium",
      ranking: 45,
      averageCost: 12000,
      requiredGPA: 3.1,
      requiredIELTS: 6.5,
      popularDepartments: ["Engineering", "Computer Science", "Medicine", "Architecture"],
      admissionRequirements: ["IELTS 6.5 minimum", "Secondary school diploma", "Motivation letter", "Two academic references", "Proof of language proficiency"]
    }
  ];

  // Filter and score universities based on student profile
  const scoredUniversities = universityDatabase
    .filter(uni => {
      // Filter by country if specified
      if (targetCountry && uni.country !== targetCountry) return false;
      
      // Filter by department
      if (!uni.popularDepartments.includes(department)) return false;
      
      return true;
    })
    .map(uni => {
      let score = 0;
      const reasons: string[] = [];

      // Budget matching (30 points)
      const budgetDiff = Math.abs(budget - uni.averageCost);
      const budgetScore = Math.max(0, 30 - (budgetDiff / 1000));
      score += budgetScore;
      if (budgetDiff < 5000) {
        reasons.push("Bütçenize uygun maliyetli");
      }

      // GPA matching (25 points)
      const gpaDiff = gpa - uni.requiredGPA;
      const gpaScore = Math.max(0, 25 + (gpaDiff * 10));
      score += gpaScore;
      if (gpa >= uni.requiredGPA) {
        reasons.push("GPA gereksinimini karşılıyorsunuz");
      } else if (gpa >= uni.requiredGPA - 0.3) {
        reasons.push("GPA gereksinimine yakın");
      }

      // IELTS matching (25 points)
      const ieltsDiff = ieltsScore - uni.requiredIELTS;
      const ieltsScoreMatch = Math.max(0, 25 + (ieltsDiff * 5));
      score += ieltsScoreMatch;
      if (ieltsScore >= uni.requiredIELTS) {
        reasons.push("IELTS skorunuz yetiyor");
      } else if (ieltsScore >= uni.requiredIELTS - 0.5) {
        reasons.push("IELTS skorunuz yeterli sınırda");
      }

      // Ranking bonus (20 points)
      const rankingScore = Math.max(0, 20 - (uni.ranking / 10));
      score += rankingScore;
      if (uni.ranking <= 20) {
        reasons.push("Dünya sıralamasında üst seviye üniversite");
      } else if (uni.ranking <= 50) {
        reasons.push("İyi dünya sıralamasına sahip");
      }

      // Social skills bonus (15 points)
      if (socialSkills) {
        const socialBonus = 15;
        score += socialBonus;
        reasons.push("Sosyal yetenekler ve ekstra başarılar kabul şansınızı artırıyor");
      }

      // Convert score to percentage (max 115 points to account for social skills bonus)
      const matchPercentage = Math.min(100, Math.round((score / 115) * 100));

      // Find alternatives from same country
      const alternatives = universityDatabase
        .filter(u => u.country === uni.country && u.name !== uni.name)
        .slice(0, 2)
        .map(u => u.name);

      return {
        name: uni.name,
        country: uni.country,
        matchPercentage,
        reasons: reasons.length > 0 ? reasons : ["Genel profil uyumu"],
        estimatedCost: `$${uni.averageCost.toLocaleString()}`,
        requirements: [
          `Minimum GPA: ${uni.requiredGPA}`,
          `IELTS: ${uni.requiredIELTS}`,
          department
        ],
        admissionRequirements: uni.admissionRequirements,
        ranking: uni.ranking,
        documentCount: uni.admissionRequirements.length,
        comparison: `${uni.country} için maliyet ${uni.averageCost.toLocaleString()}$. İyi değer sunan ${uni.ranking}. sıralamada.`,
        alternatives: alternatives.length > 0 ? alternatives : ['Alternatif bulunamadı']
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 4); // Top 4 matches

  // If no matches found, provide some default recommendations
  if (scoredUniversities.length === 0) {
    return [
      {
        name: "University of California, Berkeley",
        country: "United States",
        matchPercentage: 75,
        reasons: [
          "Bölümünüz için güçlü program",
          "Akademik mükemmeliyet merkezi",
          "Kariyer fırsatları geniş"
        ],
        estimatedCost: "$45,000",
        requirements: ["GPA: 3.7+", "IELTS: 7.0+", department],
        admissionRequirements: ["IELTS 7.0 minimum", "SAT/ACT scores", "Personal statement", "Two teacher recommendations", "Transcripts", "Passport copy", "F-1 visa application"],
        ranking: 15,
        documentCount: 7,
        comparison: "Amerika için yüksek kalite ama maliyetli. İlk 20 sıralamada.",
        alternatives: ["University of California, Los Angeles", "Stanford University"]
      },
      {
        name: "University of Sydney",
        country: "Australia",
        matchPercentage: 70,
        reasons: [
          "Uluslararası öğrenci dostu",
          "Güçlü akademik program",
          "Şehir hayatı uygun"
        ],
        estimatedCost: "$32,000",
        requirements: ["GPA: 3.2+", "IELTS: 6.5+", department],
        admissionRequirements: ["IELTS 6.5 minimum", "High school transcripts", "Personal statement", "Two references", "Student visa (Subclass 500)", "Health insurance (OSHC)"],
        ranking: 40,
        documentCount: 6,
        comparison: "Avustralya için orta maliyet. İyi yaşam koşulları.",
        alternatives: ["University of Melbourne", "Australian National University"]
      }
    ];
  }

  return scoredUniversities;
}