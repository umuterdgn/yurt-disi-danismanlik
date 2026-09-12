import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questId, studentId, increment = 1 } = body;

    if (!questId || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create quest progress
    let questProgress = await prisma.questProgress.findFirst({
      where: {
        questId,
        studentProfileId: studentId
      },
      include: {
        quest: true
      }
    });

    if (!questProgress) {
      try {
        questProgress = await prisma.questProgress.create({
          data: {
            questId,
            studentProfileId: studentId,
            currentCount: 0,
            isCompleted: false
          },
          include: {
            quest: true
          }
        });
      } catch (error) {
        // Handle race condition - try to find again
        questProgress = await prisma.questProgress.findFirst({
          where: {
            questId,
            studentProfileId: studentId
          },
          include: {
            quest: true
          }
        });
        if (!questProgress) throw error;
      }
    }

    // Don't update if already completed
    if (questProgress.isCompleted) {
      return NextResponse.json({ 
        success: true, 
        message: 'Quest already completed',
        questProgress 
      });
    }

    // Increment progress
    const newCount = questProgress.currentCount + increment;
    const isCompleted = newCount >= questProgress.quest.targetCount;

    // Update quest progress
    const updatedProgress = await prisma.questProgress.update({
      where: { id: questProgress.id },
      data: {
        currentCount: newCount,
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      },
      include: {
        quest: true
      }
    });

    // Award XP if quest is completed and not yet awarded
    if (isCompleted && !questProgress.xpAwarded) {
      // Award XP to student
      await prisma.studentProfile.update({
        where: { id: studentId },
        data: {
          xp: {
            increment: questProgress.quest.xpReward
          }
        }
      });

      // Mark XP as awarded
      await prisma.questProgress.update({
        where: { id: questProgress.id },
        data: {
          xpAwarded: true
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'QUEST_COMPLETED',
          entityType: 'Quest',
          entityId: questId,
          details: `Quest "${questProgress.quest.title}" completed. Awarded ${questProgress.quest.xpReward} XP to student ${studentId}`
        }
      });

      return NextResponse.json({
        success: true,
        questProgress: { ...updatedProgress, xpAwarded: true },
        xpAwarded: questProgress.quest.xpReward,
        message: `Quest completed! +${questProgress.quest.xpReward} XP awarded`
      });
    }

    return NextResponse.json({
      success: true,
      questProgress: updatedProgress,
      message: 'Quest progress updated'
    });

  } catch (error) {
    console.error('Error updating quest progress:', error);
    return NextResponse.json({ error: 'Failed to update quest progress' }, { status: 500 });
  }
}