import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateStudentStreak } from '@/actions/admin'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-posta gereklidir' },
        { status: 400 }
      )
    }

    // Get user from Prisma
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Only update streak for students
    if (user.role !== 'STUDENT') {
      return NextResponse.json({ success: true, message: 'Streak only for students' })
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })

    if (!studentProfile) {
      return NextResponse.json(
        { success: false, error: 'Öğrenci profili bulunamadı' },
        { status: 404 }
      )
    }

    // Update streak
    const result = await updateStudentStreak(studentProfile.id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        streak: result.streak,
        lastLoginDate: result.lastLoginDate
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Update streak error:', error)
    return NextResponse.json(
      { success: false, error: 'Streak güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}