'use server';

import { prisma } from "@/lib/prisma";

interface QuestionTypeAnalysis {
  questionType: string;
  count: number;
  wrongCount: number;
  emptyCount: number;
}

interface WorksheetTopicResult {
  subject: string;
  topic: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  successRate: number;
  status: 'strong' | 'medium' | 'weak';
  questionTypeAnalysis: QuestionTypeAnalysis[];
}

interface WeakQuestionTypeRecommendation {
  type: 'question_type_review';
  subject: string;
  topic: string;
  questionType: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedAction: string;
  sourceWorksheetId: string;
}

export async function analyzeWorksheetTopics(worksheetId: string) {
  try {
    // Get worksheet with question type analysis
    const worksheet = await prisma.worksheet.findUnique({
      where: { id: worksheetId },
      include: {
        studentProfile: true
      }
    });

    if (!worksheet) {
      return { success: false, error: 'Worksheet not found' };
    }

    const questionTypeAnalysis = (worksheet.questionTypeAnalysis as unknown) as QuestionTypeAnalysis[] || [];
    
    // Calculate total metrics
    const totalQuestions = worksheet.correct + worksheet.wrong + worksheet.empty;
    const net = worksheet.correct - (worksheet.wrong / 4);
    const successRate = totalQuestions > 0 ? (worksheet.correct / totalQuestions) * 100 : 0;

    // Determine status based on success rate
    let status: 'strong' | 'medium' | 'weak' = 'medium';
    if (successRate >= 71) {
      status = 'strong';
    } else if (successRate >= 41) {
      status = 'medium';
    } else {
      status = 'weak';
    }

    const topicResult: WorksheetTopicResult = {
      subject: worksheet.subject,
      topic: worksheet.topic,
      totalQuestions,
      correct: worksheet.correct,
      wrong: worksheet.wrong,
      empty: worksheet.empty,
      net,
      successRate,
      status,
      questionTypeAnalysis
    };

    // Generate recommendations for weak question types
    const recommendations: WeakQuestionTypeRecommendation[] = [];
    
    for (const questionType of questionTypeAnalysis) {
      // Focus on question types with significant wrong/empty counts
      const totalErrors = questionType.wrongCount + questionType.emptyCount;
      if (totalErrors >= 2) { // At least 2 errors to warrant attention
        const priority: 'high' | 'medium' | 'low' = 
          totalErrors >= 4 ? 'high' : 
          totalErrors >= 3 ? 'medium' : 'low';
        
        recommendations.push({
          type: 'question_type_review',
          subject: worksheet.subject,
          topic: worksheet.topic,
          questionType: questionType.questionType,
          priority,
          reason: `${worksheet.topic} konusunda ${questionType.questionType} soru tipinde ${questionType.wrongCount} yanlış ve ${questionType.emptyCount} boş yaptınız.`,
          suggestedAction: `${worksheet.topic} - ${questionType.questionType} soru tipine özel çalışma yap. En az 10 benzer soru çöz.`,
          sourceWorksheetId: worksheetId
        });
      }
    }

    // Update SubjectAnalysis for mastery tracking with holistic analysis
    const existingAnalysis = await prisma.subjectAnalysis.findFirst({
      where: {
        studentProfileId: worksheet.studentProfileId,
        subject: worksheet.subject,
        topic: worksheet.topic
      }
    });

    if (existingAnalysis) {
      // Update existing analysis with weighted average and holistic data
      const currentProficiency = existingAnalysis.progressPercent || 0;
      const newProficiency = (currentProficiency * 0.7) + (successRate * 0.3); // 70% old, 30% new
      
      let newProficiencyLevel: 'WEAK' | 'MEDIUM' | 'GOOD' | 'EXCELLENT' = 'MEDIUM';
      if (newProficiency >= 86) newProficiencyLevel = 'EXCELLENT';
      else if (newProficiency >= 71) newProficiencyLevel = 'GOOD';
      else if (newProficiency >= 41) newProficiencyLevel = 'MEDIUM';
      else newProficiencyLevel = 'WEAK';

      await prisma.subjectAnalysis.update({
        where: { id: existingAnalysis.id },
        data: {
          progressPercent: Math.round(newProficiency),
          proficiency: newProficiencyLevel,
          lastStudiedAt: new Date(),
          dataSource: existingAnalysis.dataSource === 'EXAM' ? 'BOTH' : 'TASK',
          // Holistic Analysis: Add worksheet data to task data
          taskNetScore: (existingAnalysis.taskNetScore || 0) + net,
          taskTotalQuestions: (existingAnalysis.taskTotalQuestions || 0) + totalQuestions,
          taskCorrect: (existingAnalysis.taskCorrect || 0) + worksheet.correct
        }
      });
    } else {
      // Create new subject analysis with holistic data
      let proficiencyLevel: 'WEAK' | 'MEDIUM' | 'GOOD' | 'EXCELLENT' = 'MEDIUM';
      if (successRate >= 86) proficiencyLevel = 'EXCELLENT';
      else if (successRate >= 71) proficiencyLevel = 'GOOD';
      else if (successRate >= 41) proficiencyLevel = 'MEDIUM';
      else proficiencyLevel = 'WEAK';

      await prisma.subjectAnalysis.create({
        data: {
          studentProfileId: worksheet.studentProfileId,
          subject: worksheet.subject,
          topic: worksheet.topic,
          proficiency: proficiencyLevel,
          progressPercent: Math.round(successRate),
          lastStudiedAt: new Date(),
          dataSource: 'TASK', // Worksheet data counts as task/practice data
          // Holistic Analysis: Task Data
          taskNetScore: net,
          taskTotalQuestions: totalQuestions,
          taskCorrect: worksheet.correct
        }
      });
    }

    // Create AI recommendations for weak question types
    for (const recommendation of recommendations) {
      if (recommendation.priority === 'high' || recommendation.priority === 'medium') {
        await prisma.aIRecommendation.create({
          data: {
            studentId: worksheet.studentProfileId,
            advisorId: worksheet.studentProfile.advisorId,
            type: 'ACADEMIC',
            message: `${recommendation.subject} - ${recommendation.topic}: ${recommendation.questionType} soru tipi eksiğiniz var`,
            suggestedAction: recommendation.suggestedAction,
            priority: recommendation.priority.toUpperCase()
          }
        });
      }
    }

    return {
      success: true,
      topicResult,
      recommendations,
      totalQuestionTypes: questionTypeAnalysis.length,
      weakQuestionTypes: questionTypeAnalysis.filter(qt => (qt.wrongCount + qt.emptyCount) >= 2).length
    };

  } catch (error) {
    console.error('Worksheet analysis error:', error);
    return { success: false, error: 'Worksheet analysis failed' };
  }
}