'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from 'next/cache';

interface CreateApplicationFromMatchParams {
  studentProfileId: string;
  universityName: string;
  country: string;
  estimatedCost: string;
  admissionRequirements: string[];
  program: string;
}

export async function createApplicationFromMatch(params: CreateApplicationFromMatchParams) {
  try {
    const { studentProfileId, universityName, country, estimatedCost, admissionRequirements, program } = params;

    // Find or create the university in the database
    let university = await prisma.university.findFirst({
      where: {
        name: universityName,
        country: {
          name: country
        }
      },
      include: {
        country: true
      }
    });

    if (!university) {
      // Find the country first
      const countryRecord = await prisma.country.findFirst({
        where: { name: country }
      });

      if (!countryRecord) {
        return { success: false, error: 'Ülke bulunamadı' };
      }

      // Create the university
      university = await prisma.university.create({
        data: {
          name: universityName,
          countryId: countryRecord.id,
          // Set default values for required fields
          city: 'TBD',
          ranking: 100,
          tuitionFees: parseFloat(estimatedCost.replace(/[^0-9.]/g, '')) || 25000,
          languageRequirement: 'IELTS',
          requiredScore: 6.5,
          description: `${universityName} - ${country}`,
          departments: [program]
        },
        include: {
          country: true
        }
      });
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        studentProfileId,
        universityId: university.id,
        universityName: university.name,
        country: university.country.name,
        program,
        semester: 'Fall',
        year: new Date().getFullYear() + 1,
        status: 'LEAD',
        estimatedBudget: parseFloat(estimatedCost.replace(/[^0-9.]/g, '')) || 25000,
        actualBudget: null,
        languageTest: 'IELTS',
        languageScore: null
      }
    });

    // Create documents from admission requirements with responsibility assignment
    const documentTypes = [
      { type: 'Pasaport', keywords: ['passport', 'pasaport'], responsibility: 'STUDENT' },
      { type: 'IELTS Belgesi', keywords: ['ielts', 'language', 'dil'], responsibility: 'STUDENT' },
      { type: 'Niyet Mektubu', keywords: ['personal', 'statement', 'motivation', 'niyet'], responsibility: 'STUDENT' },
      { type: 'CV/Özgeçmiş', keywords: ['cv', 'resume', 'özgeçmiş'], responsibility: 'STUDENT' },
      { type: 'Akademik Transkript', keywords: ['transcript', 'academic', 'akademik'], responsibility: 'STUDENT' },
      { type: 'Referans Mektubu', keywords: ['reference', 'recommendation', 'referans'], responsibility: 'ADVISOR' },
      { type: 'Diploma', keywords: ['diploma', 'graduation', 'mezuniyet'], responsibility: 'STUDENT' },
      { type: 'Portfolyo', keywords: ['portfolio', 'portfolyo'], responsibility: 'STUDENT' },
      { type: 'Danışman Raporu', keywords: ['advisor', 'report', 'rapor'], responsibility: 'ADVISOR' },
      { type: 'Mali Durum Belgesi', keywords: ['financial', 'bank', 'mali'], responsibility: 'STUDENT' }
    ];

    for (const requirement of admissionRequirements) {
      const lowerRequirement = requirement.toLowerCase();
      
      for (const docType of documentTypes) {
        if (docType.keywords.some(keyword => lowerRequirement.includes(keyword))) {
          // Check if document already exists for this application
          const existingDoc = await prisma.document.findFirst({
            where: {
              applicationId: application.id,
              documentType: docType.type
            }
          });

          if (!existingDoc) {
            await prisma.document.create({
              data: {
                applicationId: application.id,
                documentType: docType.type,
                documentName: `${docType.type} - ${universityName}`,
                isUploaded: false,
                status: 'PENDING',
                feedback: `AI önerisi: ${requirement}. Sorumluluk: ${docType.responsibility === 'STUDENT' ? 'Öğrenci' : 'Danışman'}`
              }
            });
          }
          break; // Only create one document per requirement
        }
      }
    }

    // Revalidate paths
    revalidatePath('/advisor/students/[id]');
    revalidatePath('/advisor/applications');
    revalidatePath('/student/dashboard');

    return {
      success: true,
      application,
      university: university.name
    };

  } catch (error) {
    console.error('Create application from match error:', error);
    return { success: false, error: 'Başvuru oluşturulurken bir hata oluştu' };
  }
}