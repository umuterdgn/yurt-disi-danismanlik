import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeWorksheetTopics } from "@/actions/worksheet-analysis";

interface QuestionTypeAnalysis {
  questionType: string;
  count: number;
  wrongCount: number;
  emptyCount: number;
}

interface WorksheetResponse {
  success: boolean;
  subject: string;
  topic: string;
  correct: number;
  wrong: number;
  empty: number;
  questionTypeAnalysis: QuestionTypeAnalysis[];
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
    const subject = body.subject || '';
    const topic = body.topic || '';
    const studentId = body.studentId;

    if (images.length === 0) {
      return NextResponse.json({ error: "Görsel bulunamadı." }, { status: 400 });
    }

    if (!subject || !topic) {
      return NextResponse.json({ error: "Ders ve konu seçilmelidir." }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({ error: "Öğrenci ID eksik." }, { status: 400 });
    }

    console.log("GEMINI_API_VERSION: generateContent API with Fallback");
    console.log("GEMINI_REQUEST_IMAGES:", images.length);
    console.log("WORKSHEET_SUBJECT:", subject);
    console.log("WORKSHEET_TOPIC:", topic);

    // FALLBACK MODEL DİZİSİ
    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];

    const prompt = `You are an expert Turkish worksheet/homework analysis system.

Analyze the provided worksheet images for subject: ${subject}, topic: ${topic}.

Your primary task is to:
1. Count total correct, wrong, and empty answers
2. Identify question types for wrong and empty answers
3. Provide detailed question type analysis

For each question type, identify:
- Question type name (e.g., "Yeni Nesil", "Matematiksel İşlem", "Yorum", "Bilgi", "Kavrama", "Paragraf", "Klasik", "Çoktan Seçmeli", "Boşluk Doldurma")
- How many questions of this type were wrong
- How many questions of this type were left empty

CRITICAL RULES:
- Question types must be in Turkish
- Focus on wrong and empty answers for question type analysis
- Only return question types that have wrong or empty answers
- Be specific about question types (e.g., instead of just "İşlem", use "Türev İşlem", "İntegral İşlem" when applicable)
- If a question type has no wrong or empty answers, don't include it in the analysis

Return ONLY a valid JSON object in this exact format:
{
  "correct": number,
  "wrong": number,
  "empty": number,
  "questionTypeAnalysis": [
    {
      "questionType": "string (e.g., 'Yeni Nesil', 'Matematiksel İşlem')",
      "count": number (total questions of this type),
      "wrongCount": number,
      "emptyCount": number
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
    if (parsedData.correct === undefined || parsedData.wrong === undefined || parsedData.empty === undefined) {
      console.error("GEMINI_PARSE_ERROR: Invalid response structure");
      return NextResponse.json({ error: "Gemini yanıtı beklenen formatta değil." }, { status: 500 });
    }

    // Build response
    const warnings: string[] = [];
    const questionTypeAnalysis: QuestionTypeAnalysis[] = parsedData.questionTypeAnalysis || [];

    // Add warning if confidence is low (we can estimate from question type analysis)
    if (questionTypeAnalysis.length === 0 && parsedData.wrong > 0) {
      warnings.push("Soru tipi analizi yapılamadı. Görsel kalitesini kontrol edin.");
    }

    // Save to database
    let worksheetId: string | null = null;
    try {
      const worksheet = await prisma.worksheet.create({
        data: {
          studentProfileId: studentId,
          subject,
          topic,
          correct: parsedData.correct,
          wrong: parsedData.wrong,
          empty: parsedData.empty,
          questionTypeAnalysis: questionTypeAnalysis as any,
          ocrProcessed: true,
          ocrConfidence: 0.8, // Default confidence
          ocrStatus: "COMPLETED"
        }
      });
      worksheetId = worksheet.id;
      console.log("WORKSHEET_SAVED:", worksheet.id);

      // Trigger worksheet analysis for SubjectAnalysis integration
      try {
        const analysisResult = await analyzeWorksheetTopics(worksheet.id);
        console.log("WORKSHEET_ANALYSIS:", analysisResult);
        
        if (analysisResult.success) {
          warnings.push(`Konu analizi güncellendi. ${analysisResult.weakQuestionTypes} zayıf soru tipi tespit edildi.`);
        }
      } catch (analysisError) {
        console.error("WORKSHEET_ANALYSIS_ERROR:", analysisError);
        warnings.push("Konu analizi güncellenirken hata oluştu ancak veri kaydedildi.");
      }
    } catch (dbError) {
      console.error("WORKSHEET_DB_ERROR:", dbError);
      warnings.push("Veritabanına kaydedilirken hata oluştu ancak analiz tamamlandı.");
    }

    const worksheetResponse: WorksheetResponse = {
      success: true,
      subject,
      topic,
      correct: parsedData.correct,
      wrong: parsedData.wrong,
      empty: parsedData.empty,
      questionTypeAnalysis,
      warnings
    };

    return NextResponse.json(worksheetResponse);

  } catch (error: any) {
    console.error("OCR_FATAL_ERROR:", error);
    return NextResponse.json({ error: error.message || "Bilinmeyen OCR Hatası" }, { status: 500 });
  }
}