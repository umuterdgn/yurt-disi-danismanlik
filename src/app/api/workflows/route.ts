import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        actions: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, trigger, isActive, actions } = body;

    if (!name || !trigger) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        trigger,
        isActive: isActive ?? true,
        actions: {
          create: actions.map((action: any, index: number) => ({
            actionType: action.actionType,
            payload: action.payload,
            order: index
          }))
        }
      },
      include: {
        actions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}