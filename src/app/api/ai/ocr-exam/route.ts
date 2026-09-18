import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY eksik." }, { status: 500 });
    }

    const body = await req.json();
    const images = body.images || [];

    if (images.length === 0) {
      return NextResponse.json({ error: "Görsel bulunamadı." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    // Görselleri Gemini'ın İSTEDİĞİ formata çevir (Prefix temizleme ÇOK KRİTİK)
    const imageParts = images.slice(0, 5).map((imgData: string) => {
      const matches = imgData.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        return {
          inlineData: {
            mimeType: matches[1],
            data: matches[2], // Sadece saf base64 string
          },
        };
      }
      // Fallback: assume it's already clean base64
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: imgData,
        },
      };
    });

    const prompt = "You are an expert exam OCR system. Analyze the provided exam images and extract the correct, incorrect, and blank scores for each subject (Turkish, Math, Science, Social). You MUST return ONLY a valid JSON object in this exact format: {\"scores\": {\"turkish\": {\"correct\": number, \"wrong\": number, \"empty\": number}, \"math\": {\"correct\": number, \"wrong\": number, \"empty\": number}, \"science\": {\"correct\": number, \"wrong\": number, \"empty\": number}, \"social\": {\"correct\": number, \"wrong\": number, \"empty\": number}}}. Do not include markdown formatting. If a subject has no data, set all values to 0.";

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();

    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    // Return in the expected format for frontend compatibility
    return NextResponse.json({ success: true, scores: parsedData.scores });

  } catch (error: any) {
    console.error("GEMINI_OCR_ERROR:", error);
    return NextResponse.json({ error: error.message || "OCR İşlem Hatası" }, { status: 500 });
  }
}