import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Image data is required as an array' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error("OCR_ERROR: Groq API key is not configured");
      return NextResponse.json({ error: 'Groq API key is not configured' }, { status: 500 });
    }

    // Prepare image content for Groq Vision API with proper base64 prefix validation
    const imageContent = images.map((image: string) => {
      // Ensure base64 has proper prefix
      let imageUrl = image;
      if (!image.startsWith('data:image/')) {
        // If missing prefix, assume JPEG
        imageUrl = `data:image/jpeg;base64,${image}`;
      }
      return {
        type: 'image_url' as const,
        image_url: {
          url: imageUrl
        }
      };
    });

    console.log("OCR_API: Processing", images.length, "images with Groq Vision");

    // Call Groq Vision API with multiple images - NO response_format for vision models
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts exam scores from images. You MUST return ONLY a valid raw JSON object. Do not wrap it in markdown code blocks. Just the raw JSON.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Bu görsellerdeki sınav sonuç belgelerinden Türkçe, Matematik, Fen Bilimleri ve Sosyal Bilimler derslerinin doğru, yanlış ve boş sayılarını çıkar.
Lütfen şu JSON formatında yanıt ver:
{
  "scores": {
    "turkish": { "correct": number, "wrong": number, "empty": number },
    "math": { "correct": number, "wrong": number, "empty": number },
    "science": { "correct": number, "wrong": number, "empty": number },
    "social": { "correct": number, "wrong": number, "empty": number }
  }
}
Birden fazla görsel varsa, hepsini analiz et ve sonuçları birleştir. You MUST return ONLY a valid raw JSON object. Do not wrap it in markdown code blocks. Just the raw JSON.`
              },
              ...imageContent
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 500
        // REMOVED: response_format: { type: 'json_object' } - Vision models don't support this
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GROQ_VISION_ERROR:", errorText);
      try {
        const errorJson = JSON.parse(errorText);
        console.error("GROQ_VISION_ERROR_DETAILS:", errorJson);
      } catch (e) {
        // Error text wasn't JSON
      }
      return NextResponse.json({ error: `Failed to process image with Groq API: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("OCR_ERROR: No response from Groq API");
      return NextResponse.json({ error: 'No response from Groq API' }, { status: 500 });
    }

    console.log("OCR_API: Raw response from Groq:", content.substring(0, 200));

    // Manual JSON parsing - remove markdown blocks
    try {
      // Remove markdown code blocks if present (with or without language tag)
      let cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/```\w*\n?/g, '')
        .trim();

      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log("OCR_API: Successfully parsed JSON scores");
      return NextResponse.json({ success: true, scores: parsedData.scores });
    } catch (parseError) {
      console.error("OCR_ERROR: JSON Parse Error:", parseError);
      console.error("OCR_ERROR: Raw content:", content);
      return NextResponse.json({ error: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` }, { status: 500 });
    }

  } catch (error) {
    console.error("GROQ_VISION_ERROR:", error);
    if (error && typeof error === 'object' && 'error' in error) {
      console.error("GROQ_VISION_ERROR_DETAILS:", (error as any).error);
    }
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}