import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        role: true,
        subscriptionEndsAt: true,
        isSubscriptionActive: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only check subscription for ADVISOR role
    if (user.role !== 'ADVISOR') {
      return NextResponse.json({
        isSubscriptionActive: true,
        isExpired: false
      })
    }

    const isExpired = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) < new Date() : false

    return NextResponse.json({
      isSubscriptionActive: user.isSubscriptionActive,
      isExpired
    })
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
