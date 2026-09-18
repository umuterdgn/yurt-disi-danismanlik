import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const universities = await prisma.university.findMany({
      include: {
        country: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ universities });
  } catch (error) {
    console.error('Error fetching universities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      countryId,
      city,
      baseScore,
      ranking,
      type,
      tuitionFees,
      languageRequirement,
      requiredScore,
      website,
      description,
      departments,
      applicationDeadline,
      requirements
    } = body;

    if (!name || !countryId) {
      return NextResponse.json({ success: false, error: 'Üniversite adı ve ülke seçimi zorunludur' }, { status: 400 });
    }

    const university = await prisma.university.create({
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
        departments: departments ? departments.split(',').map((d: string) => d.trim()) : [],
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        requirements: requirements || null
      }
    });

    return NextResponse.json({ success: true, university });
  } catch (error) {
    console.error('Error creating university:', error);
    return NextResponse.json({ success: false, error: 'Üniversite oluşturulurken bir hata oluştu' }, { status: 500 });
  }
}