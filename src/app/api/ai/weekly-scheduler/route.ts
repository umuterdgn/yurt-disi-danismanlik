import { NextRequest, NextResponse } from 'next/server';
import { CURRICULUM, getSubjectsForExamType, getTopicsForSubject } from '@/lib/constants/curriculum';
import { incrementAIUsage } from '@/lib/ai-usage';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

interface WeeklyScheduleRequest {
  studentId: string;
  level: 'Zero' | 'Medium' | 'Advanced';
  dailyTargetHours: number;
  subjectAnalysis: any[];
  recentTasks: any[];
  examType?: string;
  startDate?: string;
  learningDNA?: {
    preferredLearningStyle?: 'VISUAL' | 'AUDITORY' | 'KINESTHETIC' | null;
    peakFocusTime?: 'MORNING' | 'AFTERNOON' | 'EVENING' | null;
    failedStrategies?: Array<{
      subject: string;
      topic: string;
      method: string;
      lastAttempt: string;
    }>;
  };
  burnoutRiskScore?: number; // 0-100
  targetUniversity?: string;
  ghostCompetitorGap?: number;
}

interface WeeklySchedule {
  days: {
    day: string;
    date: string;
    tasks: {
      subject: string;
      topic: string;
      studyMethod: string;
      pomodoros: number;
      duration: number;
      priority: string;
    }[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: WeeklyScheduleRequest = await request.json();
    const {
      studentId,
      level,
      dailyTargetHours,
      subjectAnalysis,
      recentTasks,
      examType = 'TYT',
      startDate,
      learningDNA,
      burnoutRiskScore = 0,
      targetUniversity,
      ghostCompetitorGap
    } = body;

    // Validate required fields
    if (!studentId || !level || !dailyTargetHours) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: studentId, level, dailyTargetHours' 
      }, { status: 400 });
    }

    // Get curriculum for the exam type
    const curriculumSubjects = getSubjectsForExamType(examType);
    const curriculumTopics = curriculumSubjects.reduce((acc, subject) => {
      acc[subject] = getTopicsForSubject(examType, subject);
      return acc;
    }, {} as Record<string, string[]>);

    // Analyze weak subjects from subject analysis
    const weakSubjects = subjectAnalysis
      .filter(analysis => analysis.proficiency === 'WEAK' || analysis.progressPercent < 50)
      .map(analysis => ({
        subject: analysis.subject,
        progressPercent: analysis.progressPercent,
        topics: analysis.topic || []
      }))
      .sort((a, b) => a.progressPercent - b.progressPercent);

    // Analyze recent completed tasks to avoid repetition
    // Limit to last 20 tasks to prevent token limit issues
    const recentTopics = recentTasks
      .filter(task => task.isCompleted)
      .slice(0, 20)
      .map(task => ({
        subject: task.subject,
        topic: task.topic,
        completedDate: task.taskDate
      }));

    // Calculate adjusted daily hours based on burnout risk
    let adjustedDailyTargetHours = dailyTargetHours;
    let isDeLoadWeek = false;

    if (burnoutRiskScore >= 80) {
      // Reduce load by 40% for high burnout risk
      adjustedDailyTargetHours = Math.round(dailyTargetHours * 0.6);
      isDeLoadWeek = true;
    }

    // Build the system prompt for Gemini with pedagogical frameworks
    const systemPrompt = `You are an expert educational coach specializing in Turkish curriculum systems with adaptive learning capabilities.
Create a scientifically grounded 7-day (Monday-Sunday) study schedule using evidence-based pedagogical frameworks and personalized learning DNA.

CURRICULUM DATA:
Exam Type: ${examType}
Curriculum Subjects: ${curriculumSubjects.join(', ')}
Curriculum Topics: ${JSON.stringify(curriculumTopics, null, 2)}

STUDENT PROFILE:
Level: ${level} (Zero/Medium/Advanced)
Daily Target Study Hours: ${dailyTargetHours} hours
Weak Subjects: ${weakSubjects.map(s => `${s.subject} (%${s.progressPercent})`).join(', ') || 'None'}
Recently Completed Tasks (Last 2 Weeks): ${recentTasks.map(t => `${t.subject} - ${t.topic}`).join(', ') || 'None'}

LEARNING DNA (Adaptive Memory):
Preferred Learning Style: ${learningDNA?.preferredLearningStyle || 'Not yet determined'}
Peak Focus Time: ${learningDNA?.peakFocusTime || 'Not yet determined'}
Failed Strategies (Methods that didn't work): ${learningDNA?.failedStrategies?.map(fs => `${fs.subject} - ${fs.topic}: ${fs.method}`).join(', ') || 'None'}

SIMULATION PROFILE (Future Simulator):
Burnout Risk Score: ${burnoutRiskScore}/100 (${burnoutRiskScore >= 80 ? 'HIGH RISK - De-Load Week' : burnoutRiskScore >= 60 ? 'MODERATE RISK' : 'LOW RISK'})
Target University: ${targetUniversity || 'Not specified'}
Ghost Competitor Gap: ${ghostCompetitorGap ? `${ghostCompetitorGap} net difference` : 'Not calculated'}

BURNOUT AWARENESS RULES:
${isDeLoadWeek ? `
⚠️ CRITICAL: This is a DE-LOAD WEEK (Cognitive Recovery Week)
- Student's burnout risk score is ${burnoutRiskScore}/100 (HIGH RISK)
- REDUCE study load by 40% (adjusted to ${adjustedDailyTargetHours} hours/day instead of ${dailyTargetHours})
- Focus on LIGHT, REVIEW, and REINFORCEMENT tasks only
- NO new complex topics or heavy problem-solving
- Include mental health breaks, relaxation activities, and light physical exercise
- Prioritize sleep, stress management, and well-being
- Goal: Recovery and maintaining current knowledge, NOT new learning
` : `
- Burnout risk is ${burnoutRiskScore}/100 (${burnoutRiskScore >= 60 ? 'MODERATE' : 'LOW'})
- Maintain standard study load with balanced intensity
- Include regular breaks and stress management activities
- Monitor student well-being and adjust if needed
`}

DYNAMIC MEMORY ADAPTATION RULES:
1. CHECK FAILED STRATEGIES BEFORE ASSIGNING METHODS:
   - Before assigning a study method to a subject-topic combination, check the failedStrategies array.
   - If the student previously used a specific method (e.g., "VIDEO") for a subject-topic and still struggled with it:
     - DO NOT repeat the same method.
     - Switch to a DIFFERENT, complementary method.
     - Example: If "VIDEO" failed for "Mathematics - Polynomials", assign "PRACTICE with written notes" or "TUTOR session" instead.

2. LEARNING STYLE ADAPTATION:
   - If preferredLearningStyle is "VISUAL": Prioritize VIDEO, DIAGRAMS, INFOGRAPHICS, ANIMATIONS.
   - If preferredLearningStyle is "AUDITORY": Prioritize AUDIO LECTURES, PODCASTS, DISCUSSIONS, TEACHING OTHERS.
   - If preferredLearningStyle is "KINESTHETIC": Prioritize HANDS-ON PRACTICE, WRITTEN PROBLEM SOLVING, EXPERIMENTS, INTERACTIVE SIMULATIONS.
   - If not determined: Use balanced mix of methods.

3. PEAK FOCUS TIME SCHEDULING:
   - If peakFocusTime is "MORNING": Schedule the most challenging subjects/tasks in the morning hours.
   - If peakFocusTime is "AFTERNOON": Schedule challenging tasks in afternoon, lighter tasks in morning.
   - If peakFocusTime is "EVENING": Schedule challenging tasks in evening, lighter tasks earlier in the day.
   - If not determined: Distribute challenging tasks throughout the day.

4. SPECIFIC TASK FORMATTING (No Generic Tasks):
   - NEVER use generic commands like "Study Biology" or "Practice Mathematics".
   - ALWAYS provide specific, actionable instructions that match the learning style.
   - Examples based on learning style:
     * VISUAL: "Biology - Cell Division: Watch animated video explanation + Create visual mind map (40 min)"
     * AUDITORY: "History - Ottoman Empire: Listen to audio lecture + Explain concepts aloud (30 min)"
     * KINESTHETIC: "Physics - Newton's Laws: Solve 10 written problems + Perform simple experiment (50 min)"
     * BALANCED: "Mathematics - Derivatives: Watch concept video + Solve 15 practice problems (2 pomodoros)"

PEDAGOGICAL FRAMEWORKS - STRICTLY FOLLOW:

1. EBBINGHAUS FORGETTING CURVE (Spaced Repetition):
   - When scheduling topics where the student made mistakes or has gaps, ALWAYS use spaced repetition methodology.
   - If you introduce a topic as "Concept Learning" early in the week, you MUST schedule a "Problem Solving / Review" task for that same topic 2-3 days later.
   - This reinforces learning at optimal intervals to prevent forgetting.

2. BLOOM'S TAXONOMY (Cognitive Level Differentiation):
   - If student's overall success rate is BELOW 40%: Design tasks as "Subject Learning and Basic Comprehension" (Remembering, Understanding levels).
   - If student's overall success rate is ABOVE 70%: Design tasks as "New Generation Problem Solving and Timed Practice" (Analyzing, Evaluating, Creating levels).
   - Adapt task complexity based on the student's current cognitive readiness.

3. POMODORO CAPACITY LIMIT (Micro-tasking):
   - NEVER overload a student beyond their daily capacity.
   - Break tasks into small, specific, completable micro-tasks following Pomodoro principles (e.g., 40 min work + 10 min break).
   - ALWAYS specify tasks with context and method: "Mathematics - Polynomials Basic Concepts Test (40 min)" or "Physics - Newton's Laws Practice Problems (2 pomodoros)".

CRITICAL RULES:
1. Use ONLY topics from the official curriculum. Never suggest topics outside the curriculum.
2. Allocate 50-60% of time to weak subjects.
3. Create balanced daily subject combinations (vary subjects each day).
4. Calculate daily study time (${adjustedDailyTargetHours} hours) and determine pomodoro count accordingly (1 pomodoro = 25 minutes).
5. Study methods: "VIDEO" (Video watching), "READING" (Reading), "PRACTICE" (Problem solving), "TEST" (Test taking), "REVIEW" (Topic review), "TUTOR" (One-on-one session), "WRITTEN_NOTES" (Note-taking), "AUDIO" (Audio learning), "WELLNESS" (Mental health activities), "LIGHT_REVIEW" (Light review).
6. Recommend 2-3 tasks per day, do not exceed daily target hours.
7. Priority level: "high" for weak subjects, "medium" for others.
8. Do not repeat topics completed in the last 2 weeks unless for spaced repetition.
9. Calculate actual dates for each day (starting from startDate).
10. ADAPT: Always check failedStrategies and avoid repeating unsuccessful methods.
${isDeLoadWeek ? `
11. DE-LOAD WEEK SPECIFIC RULES:
    - Focus on REVIEW, LIGHT_REVIEW, and WELLNESS tasks only
    - NO new complex topics or heavy problem-solving sessions
    - Include daily WELLNESS activities (meditation, light exercise, breaks)
    - Each day should have at least 1 WELLNESS task
    - Keep tasks short and achievable (20-30 minutes each)
    - Goal: Maintain current knowledge and promote recovery
` : ''}

JSON FORMAT:
{
  "days": [
    {
      "day": "Monday",
      "date": "2025-01-13",
      "tasks": [
        {
          "subject": "Mathematics",
          "topic": "Derivatives",
          "studyMethod": "PRACTICE",
          "pomodoros": 2,
          "duration": 50,
          "priority": "high"
        }
      ]
    }
  ]
}

Start date: ${startDate || new Date().toISOString().split('T')[0]}

Now create an optimized, curriculum-aligned 7-day study schedule that applies the Ebbinghaus Forgetting Curve, Bloom's Taxonomy, and Pomodoro principles. Return ONLY valid JSON. Do NOT include markdown blocks, text, or explanations.`;

    const prompt = `${systemPrompt}

Please create an optimized weekly schedule for a ${level} level student with ${dailyTargetHours} hours daily study target.`;

    // FALLBACK MODEL DİZİSİ
    const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];

    // REST API çağrısı
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY eksik.' }, { status: 500 });
    }

    let schedule: WeeklySchedule | null = null;
    let successfulModel: string | null = null;
    let lastError: any = null;

    // FALLBACK DÖNGÜSÜ
    for (const modelName of FALLBACK_MODELS) {
      console.log(`SCHEDULER_AI: Trying ${modelName}...`);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        console.log(`SCHEDULER_AI: ${modelName} response status: ${response.status}`);

        // 503 High Demand - bir sonraki modele geç
        if (response.status === 503) {
          console.warn(`SCHEDULER_AI: ${modelName} 503 High Demand, trying next model...`);
          lastError = { status: 503, model: modelName };
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`SCHEDULER_AI: ${modelName} error:`, errorText);
          lastError = { status: response.status, model: modelName, error: errorText };

          // 404 model bulunamadı - bir sonraki modele geç
          if (response.status === 404) {
            console.warn(`SCHEDULER_AI: ${modelName} 404 not found, trying next model...`);
            continue;
          }

          // Diğer hatalar - hemen dön
          return NextResponse.json({
            success: false,
            error: 'Haftalık program oluşturulurken hata oluştu'
          }, { status: response.status });
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
          console.error(`SCHEDULER_AI: ${modelName} empty response`);
          lastError = { status: 'empty', model: modelName };
          continue;
        }

        // Parse JSON from response
        try {
          schedule = JSON.parse(responseText);
          successfulModel = modelName;
          console.log(`SCHEDULER_AI: ${modelName} worked!`);
          break; // Başarılı, döngüden çık
        } catch (parseError) {
          console.error(`SCHEDULER_AI: ${modelName} parse error:`, parseError);
          lastError = { status: 'parse', model: modelName, error: parseError };
          continue; // Parse hatası - bir sonraki modele geç
        }
      } catch (fetchError: any) {
        console.error(`SCHEDULER_AI: ${modelName} fetch error:`, fetchError);
        lastError = { status: 'fetch', model: modelName, error: fetchError };
        continue;
      }
    }

    // Tüm modeller başarısız oldu
    if (!schedule) {
      console.error('SCHEDULER_AI_FATAL_ERROR: All models failed');
      console.error('SCHEDULER_AI_FATAL_ERROR: Last error:', lastError);
      return NextResponse.json({
        success: false,
        error: 'Haftalık program oluşturulurken hata oluştu. Lütfen daha sonra tekrar deneyin.'
      }, { status: 500 });
    }

    console.log(`SCHEDULER_AI_SUCCESS: Used model ${successfulModel}`);

    // Increment AI usage for the requesting user (use custom cookie auth)
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (userId) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true }
        });
        if (dbUser?.email) {
          await incrementAIUsage(dbUser.email);
        }
      } catch (error) {
        console.error('Error incrementing AI usage:', error);
      }
    }

    // Validate schedule structure
    if (!schedule || !schedule.days || !Array.isArray(schedule.days) || schedule.days.length !== 7) {
      console.error('SCHEDULER_AI_VALIDATION_ERROR: Invalid schedule structure', schedule);
      return NextResponse.json({
        success: false,
        error: 'AI tarafından geçersiz program formatı döndürüldü'
      }, { status: 500 });
    }

    // Calculate actual dates starting from startDate
    const startDateObj = new Date(startDate || new Date());
    const scheduleWithDates = {
      ...schedule,
      days: schedule.days.map((day, index) => {
        const date = new Date(startDateObj);
        date.setDate(date.getDate() + index);
        return {
          ...day,
          date: date.toISOString().split('T')[0]
        };
      })
    };

    return NextResponse.json({
      success: true,
      schedule: scheduleWithDates,
      metadata: {
        studentId,
        level,
        dailyTargetHours,
        adjustedDailyTargetHours,
        examType,
        weakSubjectsCount: weakSubjects.length,
        curriculumSubjects: curriculumSubjects,
        learningDNA: learningDNA || null,
        burnoutRiskScore,
        isDeLoadWeek,
        targetUniversity,
        ghostCompetitorGap
      }
    });

  } catch (error) {
    console.error('SCHEDULER_AI_ERROR:', error);
    return NextResponse.json({
      success: false,
      error: 'Haftalık program oluşturulurken hata oluştu'
    }, { status: 500 });
  }
}