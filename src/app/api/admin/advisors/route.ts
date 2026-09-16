import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      advisorType,
      specialization,
      experience,
      maxStudents
    } = body;

    if (!name || !email || !password || !advisorType || !maxStudents) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Create user and advisor profile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // In production, this should be hashed
        role: 'ADVISOR',
        isApproved: true,
        isActive: true,
        advisorProfile: {
          create: {
            advisorType,
            specialization: specialization || null,
            experience: experience ? parseInt(experience) : null,
            maxStudents: parseInt(maxStudents)
          }
        }
      },
      include: {
        advisorProfile: true
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error creating advisor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}