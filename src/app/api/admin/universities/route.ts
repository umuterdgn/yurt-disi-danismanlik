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