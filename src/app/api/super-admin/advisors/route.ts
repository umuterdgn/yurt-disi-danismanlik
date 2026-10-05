import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, studentQuota, subscriptionDuration } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Create user in Supabase Auth
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'ADVISOR'
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Calculate subscription end date
    const subscriptionEndsAt = new Date()
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + subscriptionDuration)

    // Create user in Prisma
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        password: '', // Managed by Supabase
        name,
        role: 'ADVISOR',
        isApproved: true,
        isActive: true,
        studentQuota,
        subscriptionEndsAt,
        isSubscriptionActive: true
      }
    })

    // Create advisor profile
    await prisma.advisorProfile.create({
      data: {
        userId: user.id,
        specialization: 'GENERAL'
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error creating advisor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
