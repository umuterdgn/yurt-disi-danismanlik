import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get student data for AI context
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        subjectAnalysis: true,
        examResults: {
          orderBy: { examDate: 'desc' },
          take: 5
        },
        dailyTasks: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Return mock suggestions for now (can be enhanced with actual AI integration)
    const suggestions = [
      {
        id: '1',
        title: 'Matematik - Türev Tekrarı',
        description: 'Son denemelerde düşük performans gösterdiğiniz türev konusunu tekrar edin',
        subject: 'Matematik',
        estimatedPomodoros: 3,
        priority: 'high',
        suggestedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'Fizik - Kuvvet ve Hareket',
        description: 'Newton yasaları ve momentum konularını çözümlü sorularla pekiştirin',
        subject: 'Fizik',
        estimatedPomodoros: 2,
        priority: 'medium',
        suggestedDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        title: 'Kimya - Organik Bileşikler',
        description: 'Alkan, alken ve alkinler arasındaki farkları ve reaksiyonları复习',
        subject: 'Kimya',
        estimatedPomodoros: 2,
        priority: 'medium',
        suggestedDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching AI task suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}