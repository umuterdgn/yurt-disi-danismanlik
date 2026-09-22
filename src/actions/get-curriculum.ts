'use server';

import { prisma } from "@/lib/prisma";

export async function getCurriculumSubjects(gradeLevel: string = '10. Sınıf') {
  try {
    const gradeLevelRecord = await prisma.gradeLevel.findUnique({
      where: { name: gradeLevel },
      include: {
        subjects: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!gradeLevelRecord) {
      return { success: false, error: 'Sınıf seviyesi bulunamadı' };
    }

    return {
      success: true,
      subjects: gradeLevelRecord.subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        displayName: subject.displayName
      })) || []
    };
  } catch (error) {
    console.error('Get curriculum subjects error:', error);
    return { success: false, error: 'Müfredat dersleri yüklenirken hata oluştu' };
  }
}

export async function getCurriculumTopics(subjectId: string) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        topics: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!subject) {
      return { success: false, error: 'Ders bulunamadı' };
    }

    return {
      success: true,
      topics: subject.topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        code: topic.code
      })) || []
    };
  } catch (error) {
    console.error('Get curriculum topics error:', error);
    return { success: false, error: 'Müfredat konuları yüklenirken hata oluştu' };
  }
}

export async function getCurriculumQuestionTypes(topicId: string) {
  try {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        questionTypes: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!topic) {
      return { success: false, error: 'Konu bulunamadı' };
    }

    return {
      success: true,
      questionTypes: topic.questionTypes.map(qt => ({
        id: qt.id,
        name: qt.name,
        code: qt.code
      })) || []
    };
  } catch (error) {
    console.error('Get curriculum question types error:', error);
    return { success: false, error: 'Müfredat soru tipleri yüklenirken hata oluştu' };
  }
}