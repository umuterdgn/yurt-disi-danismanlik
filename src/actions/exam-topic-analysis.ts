'use server';

import { prisma } from "@/lib/prisma";

interface TopicResult {
  subject: string;
  topic: string | null;
  subtopic: string | null;
  totalQuestions: number;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  successRate: number;
  status: 'strong' | 'medium' | 'weak';
}

interface WeakTopicRecommendation {
  type: 'topic_review';
  subject: string;
  topic: string | null;
  subtopic: string | null;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedAction: string;
  sourceExamId: string;
}

export async function analyzeExamTopics(examId: string) {
  try {
    // Get exam with question results
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subjectResults: {
          include: {
            questionResults: true
          }
        }
      }
    });

    if (!exam) {
      return { success: false, error: 'Exam not found' };
    }

    // Aggregate topic results
    const topicMap = new Map<string, TopicResult>();

    for (const subjectResult of exam.subjectResults) {
      for (const questionResult of subjectResult.questionResults) {
        // Skip questions without a valid topic - don't create 'Genel' or 'unknown' entries
        if (!questionResult.topic || questionResult.topic === 'unknown' || questionResult.topic === 'Genel') {
          continue;
        }
        
        const topicKey = `${subjectResult.subjectName}-${questionResult.topic}`;
        
        if (!topicMap.has(topicKey)) {
          topicMap.set(topicKey, {
            subject: subjectResult.subjectName,
            topic: questionResult.topic,
            subtopic: questionResult.subTopic,
            totalQuestions: 0,
            correct: 0,
            wrong: 0,
            empty: 0,
            net: 0,
            successRate: 0,
            status: 'medium'
          });
        }

        const topic = topicMap.get(topicKey)!;
        topic.totalQuestions++;

        if (questionResult.result === 'CORRECT') {
          topic.correct++;
        } else if (questionResult.result === 'WRONG') {
          topic.wrong++;
        } else if (questionResult.result === 'EMPTY') {
          topic.empty++;
        }
      }
    }

    // Calculate metrics and status for each topic
    const topicResults: TopicResult[] = [];
    for (const topic of topicMap.values()) {
      // Skip topics with no questions (division by zero protection)
      if (topic.totalQuestions === 0) {
        continue;
      }
      
      topic.net = topic.correct - (topic.wrong / 4);
      topic.successRate = (topic.correct / topic.totalQuestions) * 100;
      
      // Determine status based on success rate
      if (topic.successRate >= 71) {
        topic.status = 'strong';
      } else if (topic.successRate >= 41) {
        topic.status = 'medium';
      } else {
        topic.status = 'weak';
      }
      
      topicResults.push(topic);
    }

    // Generate task recommendations for weak topics
    const recommendations: WeakTopicRecommendation[] = [];
    
    for (const topic of topicResults) {
      if (topic.status === 'weak' && topic.topic) {
        const priority: 'high' | 'medium' | 'low' = 
          topic.successRate <= 40 ? 'high' : 
          topic.successRate <= 70 ? 'medium' : 'low';
        
        recommendations.push({
          type: 'topic_review',
          subject: topic.subject,
          topic: topic.topic,
          subtopic: topic.subtopic,
          priority,
          reason: `Son denemede bu konudaki soruların %${Math.round(topic.successRate)}'si doğru yapıldı (${topic.correct}/${topic.totalQuestions}).`,
          suggestedAction: `${topic.topic}${topic.subtopic ? ` - ${topic.subtopic}` : ''} konu tekrarı yap ve en az 20 soru çöz.`,
          sourceExamId: examId
        });
      }
    }

    // Update SubjectAnalysis for mastery tracking with holistic analysis
    for (const topic of topicResults) {
      if (topic.topic) {
        // Find existing subject analysis
        const existingAnalysis = await prisma.subjectAnalysis.findFirst({
          where: {
            studentProfileId: exam.studentProfileId,
            subject: topic.subject,
            topic: topic.topic
          }
        });

        if (existingAnalysis) {
          // Update existing analysis with weighted average and holistic data
          const currentProficiency = existingAnalysis.progressPercent || 0;
          const newProficiency = (currentProficiency * 0.7) + (topic.successRate * 0.3); // 70% old, 30% new
          
          let newProficiencyLevel: 'WEAK' | 'MEDIUM' | 'GOOD' | 'EXCELLENT' = 'MEDIUM';
          if (newProficiency >= 86) newProficiencyLevel = 'EXCELLENT';
          else if (newProficiency >= 71) newProficiencyLevel = 'GOOD';
          else if (newProficiency >= 41) newProficiencyLevel = 'MEDIUM';
          else newProficiencyLevel = 'WEAK';

          // Calculate exam net score
          const examNet = topic.correct - (topic.wrong / 4);

          await prisma.subjectAnalysis.update({
            where: { id: existingAnalysis.id },
            data: {
              progressPercent: Math.round(newProficiency),
              proficiency: newProficiencyLevel,
              lastStudiedAt: new Date(),
              dataSource: existingAnalysis.dataSource === 'TASK' ? 'BOTH' : 'EXAM',
              // Holistic Analysis: Exam Data
              examNetScore: examNet,
              examTotalQuestions: topic.totalQuestions,
              examCorrect: topic.correct
            }
          });
        } else {
          // Create new subject analysis with holistic data
          let proficiencyLevel: 'WEAK' | 'MEDIUM' | 'GOOD' | 'EXCELLENT' = 'MEDIUM';
          if (topic.successRate >= 86) proficiencyLevel = 'EXCELLENT';
          else if (topic.successRate >= 71) proficiencyLevel = 'GOOD';
          else if (topic.successRate >= 41) proficiencyLevel = 'MEDIUM';
          else proficiencyLevel = 'WEAK';

          // Calculate exam net score
          const examNet = topic.correct - (topic.wrong / 4);

          await prisma.subjectAnalysis.create({
            data: {
              studentProfileId: exam.studentProfileId,
              subject: topic.subject,
              topic: topic.topic,
              proficiency: proficiencyLevel,
              progressPercent: Math.round(topic.successRate),
              lastStudiedAt: new Date(),
              dataSource: 'EXAM', // Initially from exam data
              // Holistic Analysis: Exam Data
              examNetScore: examNet,
              examTotalQuestions: topic.totalQuestions,
              examCorrect: topic.correct
            }
          });
        }
      }
    }

    // Note: Automatic task creation has been removed to prevent spam
    // AI now only suggests tasks; advisors can choose to add them via the UI
    // The recommendations are returned as suggestedTasks for manual approval

    // Update exam analysis status
    await prisma.exam.update({
      where: { id: examId },
      data: { analysisStatus: 'analyzed' }
    });

    return {
      success: true,
      topicResults,
      recommendations,
      suggestedTasks: recommendations, // AI suggests tasks, advisor approves them
      totalTopics: topicResults.length,
      weakTopics: topicResults.filter(t => t.status === 'weak').length
    };

  } catch (error) {
    console.error('Topic analysis error:', error);
    return { success: false, error: 'Topic analysis failed' };
  }
}
