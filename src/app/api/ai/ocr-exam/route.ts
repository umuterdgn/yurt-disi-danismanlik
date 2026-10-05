import { NextResponse } from "next/server";
import { matchOCRToCurriculum } from "@/lib/curriculum-matcher";
import { incrementAIUsage } from "@/lib/ai-usage";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function analyzeBehavioralPatterns(questionResults: QuestionResult[]) {
  const insights: string[] = [];
  const totalQuestions = questionResults.length;
  if (totalQuestions === 0) return { insights: [] };

  // Fatigue Analysis: Check if errors are concentrated in last 25%
  const wrongAnswers = questionResults.filter(q => q.result === 'WRONG');
  if (wrongAnswers.length > 0) {
    const lastQuarterStart = Math.ceil(totalQuestions * 0.75);
    const wrongInLastQuarter = wrongAnswers.filter(q => q.questionNumber >= lastQuarterStart);
    const wrongInFirstThreeQuarters = wrongAnswers.filter(q => q.questionNumber < lastQuarterStart);
    
    if (wrongInLastQuarter.length > wrongInFirstThreeQuarters.length * 1.5) {
      insights.push('Mental Fatigue / Odak Kaybı: Hatalar sınavın son çeyreğinde yoğunlaşıyor');
    }
  }

  // Blank Behavior Analysis
  const blankQuestions = questionResults.filter(q => q.isBlank || q.result === 'EMPTY');
  if (blankQuestions.length > 0) {
    const lastQuarterStart = Math.ceil(totalQuestions * 0.75);
    const blankInLastQuarter = blankQuestions.filter(q => q.questionNumber >= lastQuarterStart);
    const blankInFirstThreeQuarters = blankQuestions.filter(q => q.questionNumber < lastQuarterStart);
    
    if (blankInLastQuarter.length > blankInFirstThreeQuarters.length * 2) {
      insights.push('Zaman Yönetimi Problemi: Boş sorular sınavın sonuna blok halinde yığılmış');
    } else if (blankInFirstThreeQuarters.length > 0) {
      insights.push('Özgüven/Konu Eksikliği: Boş sorular sınav boyunca aralıklı');
    }
  }

  // Interdisciplinary Gap Analysis
  const interdisciplinaryGaps = questionResults.filter(q => q.interdisciplinaryTag);
  if (interdisciplinaryGaps.length > 0) {
    const gapSubjects = [...new Set(interdisciplinaryGaps.map(q => q.interdisciplinaryTag))];
    insights.push(`Disiplinlerarası Eksiklik: ${gapSubjects.join(', ')}`);
  }

  // Difficulty Level Analysis
  const difficultyDistribution = wrongAnswers.reduce((acc, q) => {
    if (q.difficultyLevel) {
      acc[q.difficultyLevel] = (acc[q.difficultyLevel] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  if (difficultyDistribution['ZOR'] > 0 || difficultyDistribution['AYIRT_EDICI'] > 0) {
    insights.push('Zor Soru Performansı: Gelişim alanı zor sorularda yoğunlaşmış');
  }

  return {
    insights,
    fatiguePattern: insights.find(i => i.includes('Fatigue')) || undefined,
    blankBehavior: insights.find(i => i.includes('Zaman') || i.includes('Özgüven')) || undefined
  };
}

interface QuestionResult {
  questionNumber: number;
  subject: string;
  questionText: string | null;
  markedAnswer: string | null;
  correctAnswer: string | null;
  result: "CORRECT" | "WRONG" | "EMPTY" | "UNCERTAIN";
  confidence: number;
  needsReview: boolean;
  topic: string | null;
  subtopic: string | null;
  learningOutcome: string | null;
  errorType: "KNOWLEDGE_GAP" | "LOGIC_ERROR" | "CALCULATION_ERROR" | null;
  questionStructure: "YENI_NESIL" | "KLASIK" | "ONCULLU" | "GRAFIK_TABLO" | "PARAGRAF" | null;
  difficultyLevel: "KOLAY" | "ORTA" | "ZOR" | "AYIRT_EDICI" | null;
  isBlank: boolean;
  interdisciplinaryTag: string | null;
}

interface OCRResponse {
  success: boolean;
  scores: {
    turkish: { correct: number; wrong: number; empty: number };
    math: { correct: number; wrong: number; empty: number };
    science: { correct: number; wrong: number; empty: number };
    social: { correct: number; wrong: number; empty: number };
  };
  questionResults: QuestionResult[];
  warnings: string[];
  behavioralAnalysis?: {
    fatiguePattern?: string;
    blankBehavior?: string;
    insights: string[];
  };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY eksik." }, { status: 500 });
    }

    const body = await req.json();
    const images = body.images || [];
    const answerKey = body.answerKey || null;
    const examType = body.examType || 'TYT'; // Default to TYT

    if (images.length === 0) {
      return NextResponse.json({ error: "Görsel bulunamadı." }, { status: 400 });
    }

    console.log("GEMINI_API_VERSION: generateContent API with Fallback");
    console.log("GEMINI_REQUEST_IMAGES:", images.length);

    // FALLBACK MODEL DİZİSİ
    const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];

    const prompt = `You are an expert Turkish exam answer-sheet and exam-question OCR system with advanced cognitive error analysis, structural classification, and behavioral analysis capabilities.

Analyze ALL provided exam images as parts of ONE exam.

Your primary task is to identify every visible question and determine the student's marked answer.

For every question:
|- Identify question number
|- Identify subject (turkish, math, science, social)
|- Identify student's marked answer (A, B, C, D, E or null if blank)
|- Determine confidence (0.0 to 1.0)
|- If the question text is visible, identify the most likely topic
|- Identify subtopic when possible
|- Identify learning outcome when possible
|- Classify the question structure type (format)
|- For WRONG answers: Analyze the cognitive error type based on question context and question type
|- Determine difficulty level
|- Determine if the question was left blank (isBlank)
|- Identify interdisciplinary gaps if applicable

DIFFICULTY LEVEL ANALYSIS:
For each question, assess the difficulty level based on complexity, content, and typical exam patterns:
1. KOLAY (Easy): Basic concepts, direct formula application, single-step problems
2. ORTA (Medium): Moderate complexity, requires some reasoning, multi-step but standard
3. ZOR (Hard): Complex problems, requires advanced reasoning, multiple steps, time-consuming
4. AYIRT_EDICI (Distinguishing): Very challenging, designed to separate top performers, often novel or complex

To determine difficulty:
- Direct application of basic formula → KOLAY
- Standard multi-step problem → ORTA
- Complex reasoning or multiple concepts → ZOR
- Novel, very complex, or exceptional difficulty → AYIRT_EDICI
- If uncertain, default to ORTA

INTERDISCIPLINARY GAP ANALYSIS:
When analyzing WRONG answers, check if the error might be rooted in a different subject or topic:
- If a physics/chemistry question is wrong due to mathematical calculation/formula → Set interdisciplinaryTag to "Matematik - [specific math topic]"
- If a math question is wrong due to reading comprehension → Set interdisciplinaryTag to "Türkçe - Okuma Anlama"
- If a question requires knowledge from multiple subjects and the gap is in one → Tag the specific subject-topic causing the issue
- Only set interdisciplinaryTag if you can clearly identify the root cause is in a different subject
- If no interdisciplinary gap, set interdisciplinaryTag to null

FATIGUE ANALYSIS (Focus Loss Detection):
After analyzing all questions, check the distribution of errors:
- If WRONG answers are concentrated in the last 25% of questions (by question number) → This indicates "Mental Fatigue / Focus Loss"
- If errors are evenly distributed → No fatigue pattern
- This analysis helps identify if the student's performance degraded due to exam fatigue

BLANK BEHAVIOR ANALYSIS:
Analyze the pattern of blank questions (EMPTY or isBlank: true):
- If blank questions are clustered at the end of the exam (last 25%) → This indicates "Time Management Problem"
- If blank questions are scattered throughout the exam → This indicates "Confidence/Topic Gap"
- If there are no blank questions → No specific pattern
- Set isBlank to true for EMPTY results, false for CORRECT/WRONG

QUESTION STRUCTURE CLASSIFICATION:
When analyzing questions, categorize the structural format into one of these five types:
1. YENI_NESIL: Story-based or skill-based questions (scenario questions, real-life applications, complex reasoning)
2. KLASIK: Direct knowledge or calculation questions (formula application, direct problem solving)
3. ONCULLU: Multi-part questions with I, II, III items (requires evaluating multiple statements)
4. GRAFIK_TABLO: Visual interpretation questions (graphs, charts, tables, diagrams)
5. PARAGRAF: Long text-based questions (reading comprehension, passage analysis)

To determine question structure:
- If the question has a story, scenario, or real-life context → YENI_NESIL
- If the question has I, II, III statements that need evaluation → ONCULLU
- If the question includes graphs, charts, tables, or visual data → GRAFIK_TABLO
- If the question is based on a long passage or paragraph → PARAGRAF
- If the question is a direct problem without context → KLASIK
- If the question text is not visible, return null for questionStructure

COGNITIVE ERROR ANALYSIS (for WRONG answers only):
When analyzing incorrect answers, categorize the root cause into one of these three types:
1. KNOWLEDGE_GAP: Student lacks basic knowledge of the rule, formula, or concept required to solve the question
2. LOGIC_ERROR: Student misunderstood the question context, misinterpreted the problem statement, or applied wrong reasoning (common in new-generation questions)
3. CALCULATION_ERROR: Student understood the concept but made a simple arithmetic mistake, calculation error, or careless error

To determine error type:
- If the question requires memorized facts/formulas and student got it wrong → KNOWLEDGE_GAP
- If the question is new-generation, requires interpretation, or complex reasoning and student chose a plausible but wrong answer → LOGIC_ERROR
- If the question is straightforward but the marked answer suggests a simple math/processing mistake → CALCULATION_ERROR
- If uncertain about error type, return null for errorType

CRITICAL RULES:
|- Never invent a question number
|- Never invent a marked answer
|- If the marked answer cannot be determined confidently, return null and set confidence below 0.7
|- If the question text is not visible, do not guess the topic. Return null for topic/subtopic/errorType/questionStructure/difficultyLevel/interdisciplinaryTag
|- If only answer bubbles are visible (no question text), return null for topic/subtopic/errorType/questionStructure/difficultyLevel/interdisciplinaryTag
|- Treat all uploaded images as pages of the same exam
|- Subject must be one of: turkish, math, science, social
|- errorType should only be set for WRONG answers, null for CORRECT/EMPTY/UNCERTAIN
|- questionStructure should be set for all questions if text is visible, null otherwise
|- difficultyLevel should be set for all questions if text is visible, default to ORTA if uncertain
|- isBlank should be true for EMPTY results, false for CORRECT/WRONG
|- interdisciplinaryTag should only be set if a clear interdisciplinary gap is identified

Return ONLY a valid JSON object in this exact format:
{
  "questions": [
    {
      "questionNumber": number,
      "subject": "turkish|math|science|social",
      "questionText": "string or null",
      "markedAnswer": "A|B|C|D|E or null",
      "confidence": number between 0.0 and 1.0,
      "topic": "string or null",
      "subtopic": "string or null",
      "learningOutcome": "string or null",
      "errorType": "KNOWLEDGE_GAP|LOGIC_ERROR|CALCULATION_ERROR or null",
      "questionStructure": "YENI_NESIL|KLASIK|ONCULLU|GRAFIK_TABLO|PARAGRAF or null",
      "difficultyLevel": "KOLAY|ORTA|ZOR|AYIRT_EDICI or null",
      "isBlank": boolean,
      "interdisciplinaryTag": "string or null"
    }
  ]
}

Do not include markdown formatting (no \`\`\`json or \`\`\`).`;

    const parts: any[] = [{ text: prompt }];

    // GÖRSELLERİ HAZIRLA (limit 10 sayfa için güvenli)
    images.slice(0, 10).forEach((imgData: string) => {
      const matches = imgData.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({ inline_data: { mime_type: matches[1], data: matches[2] } });
      } else {
        parts.push({ inline_data: { mime_type: "image/jpeg", data: imgData } });
      }
    });

    // FALLBACK MECANİZMASI İLE MODEL DENEYİŞİ
    let parsedData: any = null;
    let successfulModel: string | null = null;
    let lastError: any = null;

    for (const modelName of FALLBACK_MODELS) {
      console.log(`GEMINI_MODEL: Trying ${modelName}...`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { 
            responseMimeType: "application/json"
          }
        })
      });

      console.log(`GEMINI_RESPONSE_STATUS: ${modelName} - ${response.status}`);

      // 503 High Demand - bir sonraki modele geç
      if (response.status === 503) {
        console.warn(`${modelName} 503 High Demand, bir sonraki modele geçiliyor...`);
        lastError = { status: 503, model: modelName };
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GEMINI_API_ERROR: ${modelName} - ${errorText}`);
        
        // 404 model bulunamadı - bir sonraki modele geç
        if (response.status === 404) {
          console.warn(`${modelName} 404 not found, bir sonraki modele geçiliyor...`);
          lastError = { status: 404, model: modelName };
          continue;
        }
        
        // Diğer hatalar - hemen dön
        if (response.status === 401 || response.status === 403) {
          console.error("GEMINI_AUTH_ERROR: Authentication failed");
          return NextResponse.json({ error: "API anahtar geçersiz veya yetkisiz." }, { status: response.status });
        } else if (response.status === 429) {
          console.error("GEMINI_RATE_LIMIT_ERROR: Rate limit exceeded");
          return NextResponse.json({ error: "API rate limit aşıldı. Lütfen biraz bekleyip tekrar deneyin." }, { status: 429 });
        } else if (response.status === 500) {
          console.error("GEMINI_REQUEST_ERROR: Server error");
          return NextResponse.json({ error: "Gemini sunucu hatası. Lütfen daha sonra tekrar deneyin." }, { status: 500 });
        }
        
        return NextResponse.json({ error: `API Hatası: ${response.status} - ${errorText}` }, { status: response.status });
      }

      // Başarılı - yanıtı parse et
      try {
        const result = await response.json();
        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
          console.error(`GEMINI_PARSE_ERROR: ${modelName} - Empty response`);
          lastError = { status: "empty", model: modelName };
          continue;
        }
        
        // Clean markdown if present
        const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedData = JSON.parse(cleanText);
        successfulModel = modelName;
        console.log(`GEMINI_SUCCESS: ${modelName} worked!`);
        break; // Başarılı, döngüden çık
      } catch (parseError) {
        console.error(`GEMINI_PARSE_ERROR: ${modelName} -`, parseError);
        lastError = { status: "parse", model: modelName, error: parseError };
        continue; // Parse hatası - bir sonraki modele geç
      }
    }

    // Tüm modeller başarısız oldu
    if (!parsedData) {
      console.error("GEMINI_FATAL_ERROR: All models failed");
      if (lastError?.status === 503) {
        return NextResponse.json({ error: "Tüm modeller şu anda meşgul (503 High Demand). Lütfen birazdan tekrar deneyin." }, { status: 503 });
      } else if (lastError?.status === 404) {
        return NextResponse.json({ error: "Tüm modeller bulunamadı (404). API anahtarınızın Gemini modellerini desteklediğinden emin olun." }, { status: 404 });
      } else {
        return NextResponse.json({ error: "Tüm modeller başarısız oldu. Lütfen daha sonra tekrar deneyin." }, { status: 500 });
      }
    }

    console.log(`GEMINI_SUCCESS: Used model ${successfulModel}`);
    console.log("GEMINI_RESPONSE_PARSE: Parsing successful");

    // Validate response structure
    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      console.error("GEMINI_PARSE_ERROR: Invalid response structure");
      return NextResponse.json({ error: "Gemini yanıtı beklenen formatta değil." }, { status: 500 });
    }

    // Process question results with answer key comparison
    const questionResults: QuestionResult[] = [];
    const warnings: string[] = [];
    
    const scores: {
      turkish: { correct: number; wrong: number; empty: number };
      math: { correct: number; wrong: number; empty: number };
      science: { correct: number; wrong: number; empty: number };
      social: { correct: number; wrong: number; empty: number };
      unknown: { correct: number; wrong: number; empty: number };
    } = {
      turkish: { correct: 0, wrong: 0, empty: 0 },
      math: { correct: 0, wrong: 0, empty: 0 },
      science: { correct: 0, wrong: 0, empty: 0 },
      social: { correct: 0, wrong: 0, empty: 0 },
      unknown: { correct: 0, wrong: 0, empty: 0 }
    };

    for (const q of parsedData.questions) {
      const subject = q.subject || "unknown";
      let result: "CORRECT" | "WRONG" | "EMPTY" | "UNCERTAIN" = "UNCERTAIN";
      let correctAnswer: string | null = null;
      let needsReview = false;

      // Validate subject
      const validSubjects = ["turkish", "math", "science", "social", "unknown"];
      const normalizedSubject = validSubjects.includes(subject) ? subject : "unknown";

      // Determine needsReview based on confidence
      if (q.confidence < 0.7) {
        needsReview = true;
        warnings.push(`Soru ${q.questionNumber}: Confidence düşük (%${Math.round(q.confidence * 100)})`);
      }

      // Answer key comparison if provided
      if (answerKey && answerKey[q.questionNumber]) {
        correctAnswer = answerKey[q.questionNumber];
        
        if (q.markedAnswer === null) {
          result = "EMPTY";
          (scores as any)[normalizedSubject].empty++;
        } else if (q.markedAnswer === correctAnswer) {
          result = "CORRECT";
          (scores as any)[normalizedSubject].correct++;
        } else {
          result = "WRONG";
          (scores as any)[normalizedSubject].wrong++;
        }
      } else {
        // No answer key - cannot determine result
        result = "UNCERTAIN";
        
        // Count as empty if no marked answer
        if (q.markedAnswer === null) {
          (scores as any)[normalizedSubject].empty++;
        }
      }

      const questionResult: QuestionResult = {
        questionNumber: q.questionNumber,
        subject: normalizedSubject,
        questionText: q.questionText || null,
        markedAnswer: q.markedAnswer || null,
        correctAnswer,
        result,
        confidence: q.confidence || 0.5,
        needsReview,
        topic: q.topic || null,
        subtopic: q.subtopic || null,
        learningOutcome: q.learningOutcome || null,
        errorType: q.errorType || null,
        questionStructure: q.questionStructure || null,
        difficultyLevel: q.difficultyLevel || null,
        isBlank: q.isBlank || result === 'EMPTY',
        interdisciplinaryTag: q.interdisciplinaryTag || null
      };

      questionResults.push(questionResult);
    }

    // Build response with backward-compatible scores (exclude unknown from final response)
    const { unknown: _unknown, ...finalScores } = scores as any;
    
    // Match OCR results to official curriculum
    const curriculumMatchedResults = await matchOCRToCurriculum(questionResults, examType);
    
    // Behavioral Analysis
    const behavioralAnalysis = analyzeBehavioralPatterns(questionResults);
    
    const ocrResponse: OCRResponse = {
      success: true,
      scores: finalScores,
      questionResults: curriculumMatchedResults,
      warnings,
      behavioralAnalysis
    };

    // Increment AI usage for the requesting user
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
    if (user?.email) {
      await incrementAIUsage(user.email);
    }

    return NextResponse.json(ocrResponse);

  } catch (error: any) {
    console.error("OCR_FATAL_ERROR:", error);
    return NextResponse.json({ error: error.message || "Bilinmeyen OCR Hatası" }, { status: 500 });
  }
}
