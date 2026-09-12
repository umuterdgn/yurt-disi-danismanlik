import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get active quests for the current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const activeQuests = await prisma.quest.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        questProgress: {
          where: { studentProfileId: studentId }
        }
      }
    });

    const questsWithProgress = activeQuests.map(quest => {
      const progress = quest.questProgress[0];
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        xpReward: quest.xpReward,
        targetCount: quest.targetCount,
        type: quest.type,
        difficulty: quest.difficulty,
        currentCount: progress?.currentCount || 0,
        isCompleted: progress?.isCompleted || false,
        completedAt: progress?.completedAt
      };
    });

    return NextResponse.json(questsWithProgress);
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 });
  }
}