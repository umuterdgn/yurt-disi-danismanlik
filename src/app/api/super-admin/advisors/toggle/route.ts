import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { advisorId, isActive } = await request.json()

    if (!advisorId) {
      return NextResponse.json({ error: 'Missing advisorId' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: advisorId },
      data: {
        isSubscriptionActive: isActive
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error toggling subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
