import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY eksik." }, { status: 500 });
    }

    const body = await req.json();
    const images = body.images || [];

    if (images.length === 0) {
      return NextResponse.json({ error: "Görsel bulunamadı." }, { status: 400 });
    }

    const prompt = "You are an expert exam OCR system. Analyze the provided exam images and extract the correct, incorrect, and blank scores for each subject (Turkish, Math, Science, Social). You MUST return ONLY a valid JSON object in this exact format: {\"scores\": {\"turkish\": {\"correct\": number, \"wrong\": number, \"empty\": number}, \"math\": {\"correct\": number, \"wrong\": number, \"empty\": number}, \"science\": {\"correct\": number, \"wrong\": number, \"empty\": number}, \"social\": {\"correct\": number, \"wrong\": number, \"empty\": number}}}. Do not include markdown formatting. If a subject has no data, set all values to 0.";

    const parts: any[] = [{ text: prompt }];

    // Görselleri doğrudan REST API'nin beklediği snake_case formata çevir
    images.slice(0, 5).forEach((imgData: string) => {
      const matches = imgData.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({
          inline_data: {
            mime_type: matches[1],
            data: matches[2]
          }
        });
      } else {
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: imgData
          }
        });
      }
    });

    // SDK kullanmadan doğrudan Google REST API'ye istek at
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GEMINI_REST_ERROR:", errorText);
      return NextResponse.json({ error: `Google API Hatası: ${response.status} - ${errorText}` }, { status: response.status });
    }

    const result = await response.json();
    
    // Saf JSON çıktısını parse et
    let responseText = result.candidates[0].content.parts[0].text;
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(responseText);

    // Return in the expected format for frontend compatibility
    return NextResponse.json({ success: true, scores: parsedData.scores });

  } catch (error: any) {
    console.error("OCR_FATAL_ERROR:", error);
    return NextResponse.json({ error: error.message || "Bilinmeyen OCR Hatası" }, { status: 500 });
  }
}