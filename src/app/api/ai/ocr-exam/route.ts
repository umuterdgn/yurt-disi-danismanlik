import { NextResponse } from "next/server";
import { matchOCRToCurriculum } from "@/lib/curriculum-matcher";

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
    const models = ["gemini-2.5-flash"];

    const prompt = `You are an expert Turkish exam answer-sheet and exam-question OCR system.

Analyze ALL provided exam images as parts of ONE exam.

Your primary task is to identify every visible question and determine the student's marked answer.

For every question:
- Identify question number
- Identify subject (turkish, math, science, social)
- Identify student's marked answer (A, B, C, D, E or null if blank)
- Determine confidence (0.0 to 1.0)
- If the question text is visible, identify the most likely topic
- Identify subtopic when possible
- Identify learning outcome when possible

CRITICAL RULES:
- Never invent a question number
- Never invent a marked answer
- If the marked answer cannot be determined confidently, return null and set confidence below 0.7
- If the question text is not visible, do not guess the topic. Return null for topic/subtopic
- If only answer bubbles are visible (no question text), return null for topic/subtopic
- Treat all uploaded images as pages of the same exam
- Subject must be one of: turkish, math, science, social

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
      "learningOutcome": "string or null"
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

    for (const modelName of models) {
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
        learningOutcome: q.learningOutcome || null
      };

      questionResults.push(questionResult);
    }

    // Build response with backward-compatible scores (exclude unknown from final response)
    const { unknown: _unknown, ...finalScores } = scores as any;
    
    // Match OCR results to official curriculum
    const curriculumMatchedResults = await matchOCRToCurriculum(questionResults, examType);
    
    const ocrResponse: OCRResponse = {
      success: true,
      scores: finalScores,
      questionResults: curriculumMatchedResults,
      warnings
    };

    return NextResponse.json(ocrResponse);

  } catch (error: any) {
    console.error("OCR_FATAL_ERROR:", error);
    return NextResponse.json({ error: error.message || "Bilinmeyen OCR Hatası" }, { status: 500 });
  }
}