import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Groq API key is not configured' }, { status: 500 });
    }

    // Call Groq Vision API
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
            content: 'You are a helpful assistant that outputs strictly in JSON format. You are an AI assistant that extracts exam scores from images. You MUST return the output strictly in JSON format.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Bu görseldeki sınav sonuç belgesinden Türkçe, Matematik, Fen Bilimleri ve Sosyal Bilimler derslerinin doğru, yanlış ve boş sayılarını çıkar.
Lütfen şu JSON formatında yanıt ver:
{
  "scores": {
    "turkish": { "correct": number, "wrong": number, "empty": number },
    "math": { "correct": number, "wrong": number, "empty": number },
    "science": { "correct": number, "wrong": number, "empty": number },
    "social": { "correct": number, "wrong": number, "empty": number }
  }
}
Sadece JSON formatında yanıt ver, başka açıklama ekleme.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API Error:', error);
      return NextResponse.json({ error: 'Failed to process image with Groq API' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No response from Groq API' }, { status: 500 });
    }

    // Parse JSON response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ success: true, scores: parsedData.scores });
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw content:', content);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}