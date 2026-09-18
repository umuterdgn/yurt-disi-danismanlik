'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createUniversity(formData: FormData) {
  const name = formData.get('name') as string;
  const countryId = formData.get('countryId') as string;
  const city = formData.get('city') as string;
  const baseScore = formData.get('baseScore') as string;
  const ranking = formData.get('ranking') as string;
  const type = formData.get('type') as string;
  const tuitionFees = formData.get('tuitionFees') as string;
  const languageRequirement = formData.get('languageRequirement') as string;
  const requiredScore = formData.get('requiredScore') as string;
  const website = formData.get('website') as string;
  const description = formData.get('description') as string;
  const departments = formData.get('departments') as string;
  const applicationDeadline = formData.get('applicationDeadline') as string;
  const requirements = formData.get('requirements') as string;

  if (!name || !countryId) {
    return { success: false, error: 'Üniversite adı ve ülke seçimi zorunludur' };
  }

  try {
    await prisma.university.create({
      data: {
        name,
        countryId,
        city: city || null,
        baseScore: baseScore ? parseFloat(baseScore) : null,
        ranking: ranking ? parseInt(ranking) : null,
        type: type || null,
        tuitionFees: tuitionFees ? parseFloat(tuitionFees) : null,
        languageRequirement: languageRequirement || null,
        requiredScore: requiredScore ? parseFloat(requiredScore) : null,
        website: website || null,
        description: description || null,
        departments: departments ? departments.split(',').map(d => d.trim()) : [],
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        requirements: requirements || null
      }
    });

    revalidatePath('/admin/universities');
    revalidatePath('/advisor/universities');

    return { success: true };
  } catch (error) {
    console.error('Error creating university:', error);
    return { success: false, error: 'Üniversite oluşturulurken bir hata oluştu' };
  }
}