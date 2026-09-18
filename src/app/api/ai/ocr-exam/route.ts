import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuration
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 20;

// Function to calculate base64 string size in MB
function getBase64SizeMB(base64String: string): number {
  // Remove data URL prefix if present
  const base64Data = base64String.split(',')[1] || base64String;
  // Base64 size = original size * 4/3, divide by 1024^2 for MB
  return (base64Data.length * 0.75) / (1024 * 1024);
}

// Function to clean base64 and convert to Gemini inlineData format
function convertToGeminiInlineData(base64Image: string) {
  // Remove data URL prefix
  let cleanBase64 = base64Image;
  if (base64Image.startsWith('data:image/')) {
    cleanBase64 = base64Image.split(',')[1];
  }
  
  // Detect mime type from original data URL or default to jpeg
  let mimeType = 'image/jpeg';
  if (base64Image.startsWith('data:image/png')) {
    mimeType = 'image/png';
  } else if (base64Image.startsWith('data:image/webp')) {
    mimeType = 'image/webp';
  }
  
  return {
    inlineData: {
      data: cleanBase64,
      mimeType: mimeType
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("OCR_ERROR: GEMINI_API_KEY is not configured");
      return NextResponse.json({ error: 'OCR işlemi için GEMINI_API_KEY yapılandırması gereklidir' }, { status: 500 });
    }

    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Image data is required as an array' }, { status: 400 });
    }

    // Enforce maximum 5 images limit for Vercel compatibility
    const processedImages = images.slice(0, MAX_IMAGES);
    if (images.length > MAX_IMAGES) {
      console.log(`OCR_API: Limited to ${MAX_IMAGES} images from ${images.length} provided`);
    }

    // Validate total image size
    let totalSizeMB = 0;
    for (const image of processedImages) {
      const imageSizeMB = getBase64SizeMB(image);
      totalSizeMB += imageSizeMB;
      
      if (imageSizeMB > MAX_IMAGE_SIZE_MB) {
        return NextResponse.json({ 
          error: `Single image too large. Maximum ${MAX_IMAGE_SIZE_MB}MB per image.` 
        }, { status: 400 });
      }
    }

    if (totalSizeMB > MAX_IMAGE_SIZE_MB) {
      return NextResponse.json({ 
        error: `Total image size too large. Maximum ${MAX_IMAGE_SIZE_MB}MB total allowed. Current: ${totalSizeMB.toFixed(2)}MB` 
      }, { status: 400 });
    }

    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    // Convert images to Gemini inlineData format
    const geminiImages = processedImages.map(image => convertToGeminiInlineData(image));

    // Prepare the prompt
    const prompt = `Bu görsellerdeki sınav sonuç belgelerinden Türkçe, Matematik, Fen Bilimleri ve Sosyal Bilimler derslerinin doğru, yanlış ve boş sayılarını çıkar.
Lütfen şu JSON formatında yanıt ver:
{
  "scores": {
    "turkish": { "correct": number, "wrong": number, "empty": number },
    "math": { "correct": number, "wrong": number, "empty": number },
    "science": { "correct": number, "wrong": number, "empty": number },
    "social": { "correct": number, "wrong": number, "empty": number }
  }
}
Birden fazla görsel varsa, hepsini analiz et ve sonuçları birleştir.`;

    console.log("OCR_API: Processing", processedImages.length, "images with Gemini 1.5 Flash model. Total size:", totalSizeMB.toFixed(2), "MB");

    // Call Gemini API with images
    const result = await model.generateContent([prompt, ...geminiImages]);
    const response = result.response;
    const content = response.text();

    if (!content) {
      console.error("OCR_ERROR: No response from Gemini API");
      return NextResponse.json({ error: 'No response from Gemini API' }, { status: 500 });
    }

    console.log("OCR_API: Raw response from Gemini:", content.substring(0, 200));

    // Parse JSON response (should be clean JSON due to responseMimeType)
    try {
      const parsedData = JSON.parse(content);
      console.log("OCR_API: Successfully parsed JSON scores");
      return NextResponse.json({ success: true, scores: parsedData.scores });
    } catch (parseError) {
      console.error("OCR_ERROR: JSON Parse Error:", parseError);
      console.error("OCR_ERROR: Raw content:", content);
      return NextResponse.json({ error: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` }, { status: 500 });
    }

  } catch (error) {
    console.error("GEMINI_VISION_ERROR:", error);
    if (error && typeof error === 'object' && 'error' in error) {
      console.error("GEMINI_VISION_ERROR_DETAILS:", (error as any).error);
    }
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}