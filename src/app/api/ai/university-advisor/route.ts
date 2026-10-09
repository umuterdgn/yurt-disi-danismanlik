import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

async function getStudentContextForAbroad(userId: string) {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        applications: {
          include: {
            university: {
              include: { country: true }
            },
            documents: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        subjectAnalysis: {
          orderBy: { progressPercent: 'desc' },
          take: 5
        }
      }
    });

    if (!studentProfile) {
      return null;
    }

    // Get language test scores from applications
    const languageTests = studentProfile.applications
      .map(app => ({
        type: app.languageTest,
        score: app.languageScore
      }))
      .filter(test => test.type && test.score);

    // Get target countries from applications
    const targetCountries = [...new Set(
      studentProfile.applications
        .map(app => app.university?.country?.name)
        .filter(Boolean)
    )];

    // Get active applications
    const activeApplications = studentProfile.applications.filter(app =>
      ['INITIAL_INTERVIEW', 'DOCUMENT_COLLECTION', 'SUBMITTED'].includes(app.status)
    );

    return {
      name: studentProfile.user.name,
      grade: studentProfile.grade,
      targetMajor: studentProfile.targetMajor,
      targetScore: studentProfile.targetScore,
      currentScore: studentProfile.currentScore,
      languageTests,
      targetCountries,
      activeApplications: activeApplications.length,
      subjectAnalysis: studentProfile.subjectAnalysis,
      school: studentProfile.school
    };
  } catch (error) {
    console.error('Error fetching student context for abroad:', error);
    return null;
  }
}

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
    // Authenticate user using custom cookie-based auth
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      console.error('AI University Advisor: Unauthorized - No user_id in cookies');
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('AI University Advisor: GEMINI_API_KEY is not configured');
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

    // Fetch student context from database
    const studentContext = await getStudentContextForAbroad(userId);

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
- Name: ${studentContext?.name || 'Unknown'}
- Grade: ${studentContext?.grade || 'Unknown'}
- School: ${studentContext?.school || 'Unknown'}
- Target Major/Program: ${targetMajor || studentContext?.targetMajor || 'Not specified'}
- Academic Performance: ${performanceSummary}
- Target Score: ${targetScore || studentContext?.targetScore || 'Not specified'}
- Current Score: ${currentScore || studentContext?.currentScore || 0}
- Score Analysis: ${scoreGapText}
- Budget: ${budget}
- Language Level: ${languageLevel}
${studentContext?.languageTests && studentContext.languageTests.length > 0 ? `- Language Tests: ${studentContext.languageTests.map(t => `${t.type}: ${t.score}`).join(', ')}` : ''}
${studentContext?.targetCountries && studentContext.targetCountries.length > 0 ? `- Target Countries from Applications: ${studentContext.targetCountries.join(', ')}` : ''}
${(studentContext?.activeApplications || 0) > 0 ? `- Active Applications: ${studentContext?.activeApplications || 0} (already in process)` : ''}
${targetCountry ? `- Preferred Country (from request): ${targetCountry}` : '- No country preference from request'}
${studentContext?.subjectAnalysis && studentContext.subjectAnalysis.length > 0 ? `- Strong Subjects: ${studentContext.subjectAnalysis.slice(0, 3).map(s => `${s.subject} (%${s.progressPercent})`).join(', ')}` : ''}

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

    // FALLBACK MODEL DİZİSİ
    const models = ["gemini-3.6-flash"];

    let parsedData: any = null;
    let successfulModel: string | null = null;
    let lastError: any = null;

    for (const modelName of models) {
      console.log(`UNIVERSITY_ADVISOR_AI: Trying ${modelName}...`);

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        console.log(`UNIVERSITY_ADVISOR_AI: ${modelName} response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`UNIVERSITY_ADVISOR_AI_ERROR: ${modelName} - ${errorText}`);

          // 404 model bulunamadı - bir sonraki modele geç
          if (response.status === 404) {
            console.warn(`${modelName} 404 not found, bir sonraki modele geçiliyor...`);
            lastError = { status: 404, model: modelName };
            continue;
          }

          // 503 High Demand - bir sonraki modele geç
          if (response.status === 503) {
            console.warn(`${modelName} 503 High Demand, bir sonraki modele geçiliyor...`);
            lastError = { status: 503, model: modelName };
            continue;
          }

          // Diğer hatalar - hemen dön
          if (response.status === 401 || response.status === 403) {
            console.error("UNIVERSITY_ADVISOR_AUTH_ERROR: Authentication failed");
            return NextResponse.json({ error: "API anahtar geçersiz veya yetkisiz." }, { status: response.status });
          } else if (response.status === 429) {
            console.error("UNIVERSITY_ADVISOR_RATE_LIMIT_ERROR: Rate limit exceeded");
            return NextResponse.json({ error: "API rate limit aşıldı. Lütfen biraz bekleyip tekrar deneyin." }, { status: 429 });
          } else if (response.status === 500) {
            console.error("UNIVERSITY_ADVISOR_REQUEST_ERROR: Server error");
            return NextResponse.json({ error: "Gemini sunucu hatası. Lütfen daha sonra tekrar deneyin." }, { status: 500 });
          }

          lastError = { status: response.status, model: modelName, error: errorText };
          continue;
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
          console.error(`UNIVERSITY_ADVISOR_PARSE_ERROR: ${modelName} - Empty response`);
          lastError = { status: "empty", model: modelName };
          continue;
        }

        // Clean markdown if present
        const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedData = JSON.parse(cleanText);
        successfulModel = modelName;
        console.log(`UNIVERSITY_ADVISOR_AI: ${modelName} worked!`);
        break; // Başarılı, döngüden çık
      } catch (parseError) {
        console.error(`UNIVERSITY_ADVISOR_PARSE_ERROR: ${modelName} -`, parseError);
        lastError = { status: "parse", model: modelName, error: parseError };
        continue; // Parse hatası - bir sonraki modele geç
      }
    }

    // Tüm modeller başarısız oldu
    if (!parsedData) {
      console.error("UNIVERSITY_ADVISOR_FATAL_ERROR: All models failed");
      console.error("UNIVERSITY_ADVISOR_FATAL_ERROR: Last error:", lastError);
      return NextResponse.json({
        error: "Üniversite önerisi alınırken hata oluştu. Lütfen daha sonra tekrar deneyin."
      }, { status: 500 });
    }

    console.log(`UNIVERSITY_ADVISOR_AI_SUCCESS: Used model ${successfulModel}`);

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