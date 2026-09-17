import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Güvenlik için sadece production ortamında çalışmasına izin ver veya
    // basit bir doğrulama mekanizması ekle
    const body = await request.json()
    const { secret } = body

    // Basit bir güvenlik kontrolü
    if (secret !== process.env.SETUP_SECRET || 'SETUP_SECRET_12345') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      )
    }

    console.log('🔧 Setup başlatılıyor...')

    // Super Admin kullanıcısını oluştur veya güncelle
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: { 
        password: '123456',
        isApproved: true,
        isActive: true,
        role: UserRole.SUPER_ADMIN
      },
      create: {
        email: 'admin@test.com',
        password: '123456',
        name: 'Test Admin',
        role: UserRole.SUPER_ADMIN,
        isApproved: true,
        isActive: true,
      },
    })

    console.log('✅ Super Admin kullanıcısı oluşturuldu/güncellendi:', superAdmin.email)

    // Advisor kullanıcısını oluştur veya güncelle
    const advisor = await prisma.user.upsert({
      where: { email: 'advisor@test.com' },
      update: { 
        password: '123456',
        isApproved: true,
        isActive: true,
        role: UserRole.ADVISOR
      },
      create: {
        email: 'advisor@test.com',
        password: '123456',
        name: 'Test Danışman',
        role: UserRole.ADVISOR,
        isApproved: true,
        isActive: true,
      },
    })

    console.log('✅ Advisor kullanıcısı oluşturuldu/güncellendi:', advisor.email)

    // Advisor profil oluştur
    const advisorProfile = await prisma.advisorProfile.upsert({
      where: { userId: advisor.id },
      update: {},
      create: {
        userId: advisor.id,
        specialization: 'Matematik & Fen Bilimleri',
        experience: 8,
        bio: '15 yıllık matematik öğretmeni, 8 yıldır eğitim danışmanlığı yapıyor',
        maxStudents: 20,
      }
    })

    console.log('✅ Advisor profili oluşturuldu')

    // Öğrenci kullanıcısını oluştur veya güncelle
    const student = await prisma.user.upsert({
      where: { email: 'student@test.com' },
      update: { 
        password: '123456',
        isApproved: true,
        isActive: true,
        role: UserRole.STUDENT
      },
      create: {
        email: 'student@test.com',
        password: '123456',
        name: 'Test Öğrenci',
        role: UserRole.STUDENT,
        isApproved: true,
        isActive: true,
      },
    })

    console.log('✅ Öğrenci kullanıcısı oluşturuldu/güncellendi:', student.email)

    // Öğrenci profil oluştur
    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        grade: '11',
        school: 'İstanbul Lisesi',
        targetUniversity: 'Boğaziçi Üniversitesi',
        targetScore: 450,
        currentScore: 380,
        advisorId: advisorProfile.id,
      }
    })

    console.log('✅ Öğrenci profili oluşturuldu')

    // Veli kullanıcısını oluştur veya güncelle
    const parent = await prisma.user.upsert({
      where: { email: 'parent@example.com' },
      update: { 
        password: 'parent123',
        isApproved: true,
        isActive: true,
        role: UserRole.PARENT
      },
      create: {
        email: 'parent@example.com',
        password: 'parent123',
        name: 'Mehmet Demir',
        role: UserRole.PARENT,
        isApproved: true,
        isActive: true,
      },
    })

    console.log('✅ Veli kullanıcısı oluşturuldu/güncellendi:', parent.email)

    // Veli profil oluştur
    const parentProfile = await prisma.parentProfile.upsert({
      where: { userId: parent.id },
      update: {},
      create: {
        userId: parent.id,
        occupation: 'Mühendis',
        address: 'İstanbul, Türkiye',
      }
    })

    console.log('✅ Veli profili oluşturuldu')

    // Öğrenci ile veli ilişkisi
    await prisma.parent.upsert({
      where: {
        parentUserId_studentProfileId: {
          parentUserId: parent.id,
          studentProfileId: studentProfile.id
        }
      },
      update: {},
      create: {
        parentUserId: parent.id,
        studentProfileId: studentProfile.id,
        relationship: 'Baba',
      }
    })

    console.log('✅ Veli-öğrenci ilişkisi oluşturuldu')

    console.log('🎉 Setup başarıyla tamamlandı!')

    return NextResponse.json({
      success: true,
      message: 'Setup başarıyla tamamlandı',
      users: {
        admin: superAdmin.email,
        advisor: advisor.email,
        student: student.email,
        parent: parent.email
      }
    })

  } catch (error) {
    console.error('Setup hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Setup sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}