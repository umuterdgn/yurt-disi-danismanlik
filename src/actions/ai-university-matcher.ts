'use server';

import { cookies } from "next/headers";
import { createServerClient } from '@supabase/ssr';

interface UniversityMatch {
  name: string;
  country: string;
  matchPercentage: number;
  reasons: string[];
  estimatedCost: string;
  requirements: string[];
  ranking?: number;
}

export async function matchUniversitiesWithAI(formData: {
  budget: string;
  gpa: string;
  ieltsScore: string;
  targetCountry: string;
  department: string;
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

    // AI University Matching Logic
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

// Mock AI University Matching Function
// In production, this would integrate with Groq AI or similar service
async function performAIMatching(formData: {
  budget: string;
  gpa: string;
  ieltsScore: string;
  targetCountry: string;
  department: string;
}): Promise<UniversityMatch[]> {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  const budget = parseInt(formData.budget) || 25000;
  const gpa = parseFloat(formData.gpa) || 3.0;
  const ieltsScore = parseFloat(formData.ieltsScore) || 6.0;
  const targetCountry = formData.targetCountry;
  const department = formData.department;

  // Mock university database with real universities
  const universityDatabase = [
    {
      name: "University College London",
      country: "United Kingdom",
      ranking: 8,
      averageCost: 30000,
      requiredGPA: 3.5,
      requiredIELTS: 7.0,
      popularDepartments: ["Computer Science", "Engineering", "Medicine", "Law"]
    },
    {
      name: "Technical University of Munich",
      country: "Germany",
      ranking: 50,
      averageCost: 15000,
      requiredGPA: 3.2,
      requiredIELTS: 6.5,
      popularDepartments: ["Engineering", "Computer Science", "Data Science", "Architecture"]
    },
    {
      name: "University of Toronto",
      country: "Canada",
      ranking: 25,
      averageCost: 35000,
      requiredGPA: 3.3,
      requiredIELTS: 6.5,
      popularDepartments: ["Computer Science", "Business Administration", "Medicine", "Psychology"]
    },
    {
      name: "ETH Zurich",
      country: "Switzerland",
      ranking: 10,
      averageCost: 20000,
      requiredGPA: 3.7,
      requiredIELTS: 7.0,
      popularDepartments: ["Engineering", "Computer Science", "Data Science", "Architecture"]
    },
    {
      name: "University of Melbourne",
      country: "Australia",
      ranking: 35,
      averageCost: 28000,
      requiredGPA: 3.2,
      requiredIELTS: 6.5,
      popularDepartments: ["Business Administration", "Arts & Design", "Medicine", "Law"]
    },
    {
      name: "National University of Singapore",
      country: "Singapore",
      ranking: 15,
      averageCost: 25000,
      requiredGPA: 3.5,
      requiredIELTS: 6.5,
      popularDepartments: ["Computer Science", "Business Administration", "Engineering", "Data Science"]
    },
    {
      name: "University of Amsterdam",
      country: "Netherlands",
      ranking: 60,
      averageCost: 18000,
      requiredGPA: 3.0,
      requiredIELTS: 6.5,
      popularDepartments: ["Business Administration", "Psychology", "Law", "Economics"]
    },
    {
      name: "KU Leuven",
      country: "Belgium",
      ranking: 45,
      averageCost: 12000,
      requiredGPA: 3.1,
      requiredIELTS: 6.5,
      popularDepartments: ["Engineering", "Computer Science", "Medicine", "Architecture"]
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
      const ieltsScore = Math.max(0, 25 + (ieltsDiff * 5));
      score += ieltsScore;
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

      // Convert score to percentage
      const matchPercentage = Math.min(100, Math.round(score));

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
        ranking: uni.ranking
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
        ranking: 15
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
        ranking: 40
      }
    ];
  }

  return scoredUniversities;
}