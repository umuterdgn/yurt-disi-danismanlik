import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingNoteId, notes } = body;

    if (!meetingNoteId || !notes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the meeting note
    const meetingNote = await prisma.meetingNote.findUnique({
      where: { id: meetingNoteId },
      include: {
        studentProfile: {
          include: {
            user: true,
            advisor: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!meetingNote) {
      return NextResponse.json({ error: 'Meeting note not found' }, { status: 404 });
    }

    // AI Analysis using Groq
    const prompt = `
Sen bir eğitim danışmanlık asistanısın. Aşağıdaki görüşme notlarını analiz et ve şu 3 şeyi JSON formatında döndür:

1. **Kısa Özet**: Görüşmenin 2-3 cümlelik özeti
2. **Kararlar**: Görüşmede alınan önemli kararlar
3. **Aksiyonlar**: Öğrencinin yapması gereken görevler (başlık, açıklama, öncelik)

Aşağıdaki JSON formatında yanıt ver:
{
  "summary": "Kısa özet...",
  "decisions": ["Karar 1", "Karar 2"],
  "actions": [
    {
      "title": "Görev başlığı",
      "description": "Görev açıklaması",
      "priority": "high/medium/low",
      "subject": "Konu (örn: Matematik)"
    }
  ]
}

Görüşme Notları:
${notes}
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that outputs strictly in JSON format. Sen bir eğitim danışmanlık asistanısın. Görüşme notlarını analiz edip özet, kararlar ve aksiyonlar çıkarırsın. You MUST return the output strictly in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-70b-8192",
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Clean markdown blocks from response before parsing
    const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiAnalysis = JSON.parse(cleanJson);

    // Update meeting note with AI analysis
    await prisma.meetingNote.update({
      where: { id: meetingNoteId },
      data: {
        aiSummary: aiAnalysis.summary,
        aiDecisions: JSON.stringify(aiAnalysis.decisions),
        aiActions: JSON.stringify(aiAnalysis.actions),
        aiProcessedAt: new Date(),
        tasksGenerated: false
      }
    });

    // Create tasks from AI actions
    const createdTasks = [];
    for (const action of aiAnalysis.actions) {
      try {
        const task = await prisma.task.create({
          data: {
            studentProfileId: meetingNote.studentProfileId,
            advisorId: meetingNote.studentProfile.advisorId,
            title: action.title,
            description: action.description,
            priority: action.priority || 'medium',
            subject: action.subject,
            status: 'TODO',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default due date: 7 days
          }
        });
        createdTasks.push(task);
      } catch (error) {
        console.error('Error creating task from AI action:', error);
      }
    }

    // Mark tasks as generated
    await prisma.meetingNote.update({
      where: { id: meetingNoteId },
      data: {
        tasksGenerated: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: meetingNote.studentProfile.advisor?.userId,
        action: 'MEETING_TASKS_GENERATED',
        entityType: 'MeetingNote',
        entityId: meetingNoteId,
        details: `AI generated ${createdTasks.length} tasks from meeting analysis for student ${meetingNote.studentProfile.user.name}`
      }
    });

    return NextResponse.json({
      success: true,
      aiAnalysis,
      createdTasks,
      tasksCount: createdTasks.length
    });

  } catch (error) {
    console.error('Error in AI meeting summary:', error);
    return NextResponse.json({ error: 'Failed to process meeting summary' }, { status: 500 });
  }
}