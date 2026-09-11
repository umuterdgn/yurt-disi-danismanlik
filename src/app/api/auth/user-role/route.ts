import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-posta gereklidir' },
        { status: 400 }
      )
    }

    // Kullanıcıyı bul - daha robust hata yönetimi
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: { 
          role: true, 
          isApproved: true,
          id: true,
          email: true
        }
      })
    } catch (prismaError) {
      console.error('Prisma query error:', prismaError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Veritabanı sorgusu hatası',
          details: prismaError instanceof Error ? prismaError.message : 'Bilinmeyen hata'
        },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Kullanıcı verilerini doğrula
    if (!user.role) {
      console.error('User found but missing role:', user)
      return NextResponse.json(
        { success: false, error: 'Kullanıcı rolü bulunamadı' },
        { status: 500 }
      )
    }

    // isApproved alanı var mı kontrol et (backwards compatibility)
    const isApproved = user.isApproved !== undefined ? user.isApproved : true

    return NextResponse.json({
      success: true,
      role: user.role,
      isApproved: isApproved
    })

  } catch (error) {
    console.error('User role error:', error)
    
    // Daha detaylı hata mesajı
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('Detailed error:', errorMessage)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bir hata oluştu',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
