import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { advisorId, days } = await request.json()

    if (!advisorId || !days) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: advisorId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentEnd = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : new Date()
    currentEnd.setDate(currentEnd.getDate() + days)

    await prisma.user.update({
      where: { id: advisorId },
      data: {
        subscriptionEndsAt: currentEnd,
        isSubscriptionActive: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error extending subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
