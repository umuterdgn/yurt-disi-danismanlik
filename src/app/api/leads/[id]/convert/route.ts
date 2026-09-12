import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedAdvisor: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: lead.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Generate a temporary password (should be changed by user later)
    const tempPassword = Math.random().toString(36).slice(-8);

    // Create User
    const user = await prisma.user.create({
      data: {
        email: lead.email,
        password: tempPassword, // In production, this should be hashed
        name: lead.name,
        role: 'STUDENT',
        isApproved: true, // Auto-approve since they're converting from a won lead
      },
    });

    // Create StudentProfile
    const studentProfile = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        advisorId: lead.assignedAdvisorId,
        grade: '12', // Default grade
        targetUniversity: lead.service === 'STUDY_ABROAD' ? 'Yurt Dışı Üniversite' : 'Türk Üniversitesi',
        targetScore: 0,
        currentScore: 0,
        healthScore: 100,
        riskStatus: 'GREEN',
        applicationReadiness: 0,
      },
    });

    // Update lead status to indicate conversion
    await prisma.lead.update({
      where: { id },
      data: {
        status: 'WON',
        notes: lead.notes ? `${lead.notes}\n\nConverted to student on ${new Date().toISOString()}` : `Converted to student on ${new Date().toISOString()}`,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tempPassword, // Return temp password for initial setup
      },
      studentProfile,
    });
  } catch (error) {
    console.error('Error converting lead to student:', error);
    return NextResponse.json({ error: 'Failed to convert lead to student' }, { status: 500 });
  }
}