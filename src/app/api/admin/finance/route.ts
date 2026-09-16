import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      packageName,
      totalAmount,
      paidAmount,
      currency,
      installmentCount,
      installmentInterval
    } = body;

    if (!studentId || !packageName || !totalAmount || !paidAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create finance package
    const financePackage = await prisma.financePackage.create({
      data: {
        studentProfileId: studentId,
        packageName,
        totalAmount,
        paidAmount,
        currency,
        status: 'ACTIVE',
        installments: {
          create: generateInstallments(
            totalAmount,
            paidAmount,
            installmentCount,
            installmentInterval
          )
        }
      },
      include: {
        installments: true
      }
    });

    return NextResponse.json({ success: true, financePackage });
  } catch (error) {
    console.error('Error creating finance record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateInstallments(
  totalAmount: number,
  paidAmount: number,
  installmentCount: number,
  installmentInterval: number
) {
  const remainingAmount = totalAmount - paidAmount;
  const installmentAmount = Math.round((remainingAmount / installmentCount) * 100) / 100;

  const installments = [];
  const currentDate = new Date();

  for (let i = 0; i < installmentCount; i++) {
    const dueDate = new Date(currentDate);
    dueDate.setDate(dueDate.getDate() + (i + 1) * installmentInterval);

    installments.push({
      amount: installmentAmount,
      dueDate,
      status: 'PENDING'
    });
  }

  return installments;
}