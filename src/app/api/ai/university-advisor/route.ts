import { NextResponse } from "next/server";

interface AcademicPerformance {
  subject: string;
  successRate: number;
  proficiency: string;
  isStrong: boolean;
}

interface UniversityRecommendation {
  universityName: string;
  country: string;
  city: string;
  estimatedCost: string;
  currency: string;
  admissionRequirements: string[];
  applicationProcess: string;
  languageRequirements: string;
  matchScore: number;
  reason: string;
}

interface UniversityAdvisorRequest {
  academicPerformance: AcademicPerformance[];
  targetMajor: string;
  targetScore: number;
  currentScore: number;
  budget: string;
  languageLevel: string;
  targetCountry?: string;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY eksik." }, { status: 500 });
    }

    const body: UniversityAdvisorRequest = await req.json();
    const {
      academicPerformance,
      targetMajor,
      targetScore,
      currentScore,
      budget,
      languageLevel,
      targetCountry
    } = body;

    // Generate comprehensive performance summary
    const performanceSummary = academicPerformance.map(perf => 
      `${perf.subject}: %${perf.successRate} başarı (${perf.proficiency})`
    ).join(', ');

    const scoreGap = targetScore - currentScore;
    const scoreGapText = scoreGap > 0 
      ? `Hedef puana ${scoreGap.toFixed(1)} net daha gerekiyor`
      : scoreGap < 0 
      ? `Hedef puandan ${Math.abs(scoreGap).toFixed(1)} net üstündesiniz`
      : 'Hedef puana ulaştınız';

    const prompt = `You are an expert international education advisor with deep knowledge of universities worldwide, especially in Europe, UK, USA, Canada, and Australia.

Analyze the following student profile and recommend the 3 best universities for their academic goals:

STUDENT PROFILE:
- Target Major/Program: ${targetMajor}
- Academic Performance: ${performanceSummary}
- Target Score: ${targetScore}
- Current Score: ${currentScore}
- Score Analysis: ${scoreGapText}
- Budget: ${budget}
- Language Level: ${languageLevel}
${targetCountry ? `- Preferred Country: ${targetCountry}` : '- No country preference'}

Your task is to recommend the 3 most suitable universities that match this student's profile. Consider:
1. Academic reputation and ranking for the target major
2. Admission requirements (score thresholds, language requirements)
3. Estimated annual costs within budget range
4. Location and student-friendly environment
5. Application process complexity
6. Language requirements (IELTS/TOEFL scores needed)

Return ONLY a valid JSON object in this exact format:
{
  "recommendations": [
    {
      "universityName": "string",
      "country": "string",
      "city": "string",
      "estimatedCost": "string (e.g., '€15,000-€20,000 per year')",
      "currency": "string (e.g., 'EUR', 'USD', 'GBP')",
      "admissionRequirements": [
        "requirement 1",
        "requirement 2"
      ],
      "applicationProcess": "detailed description",
      "languageRequirements": "string (e.g., 'IELTS 6.5, TOEFL 80')",
      "matchScore": number (0-100),
      "reason": "why this university is a good match"
    }
  ]
}

IMPORTANT:
- Match universities realistically based on the student's current score and target score
- Consider budget constraints strictly
- Provide accurate admission requirements
- Give match scores based on realistic assessment
- If student's current score is significantly below requirements, mention this in the reason

Do not include markdown formatting (no \`\`\`json or \`\`\`).`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GEMINI_API_ERROR:", errorText);
      return NextResponse.json({ error: "AI üniversite önerisi başarısız" }, { status: response.status });
    }

    const data = await response.json();
    const parsedData = JSON.parse(data.candidates[0].content.parts[0].text);

    return NextResponse.json({
      success: true,
      recommendations: parsedData.recommendations,
      studentSummary: {
        targetMajor,
        targetScore,
        currentScore,
        scoreGap,
        budget,
        languageLevel
      }
    });

  } catch (error: any) {
    console.error("University Advisor Error:", error);
    return NextResponse.json({ error: error.message || "Üniversite önerisi alınırken hata oluştu" }, { status: 500 });
  }
}