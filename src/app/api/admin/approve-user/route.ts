import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID gereklidir' },
        { status: 400 }
      )
    }

    // Kullanıcıyı onayla
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      user,
      message: 'Kullanıcı başarıyla onaylandı'
    })

  } catch (error) {
    console.error('Approve user error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Onay bekleyen tüm öğrencileri getir
    const pendingUsers = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isApproved: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      users: pendingUsers
    })

  } catch (error) {
    console.error('Get pending users error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}