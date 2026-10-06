import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    console.log('Starting database repair...')

    let fixedProfilesCount = 0
    let hashedPasswordsCount = 0
    const errors: string[] = []

    // ============================================
    // 1. FIX MISSING STUDENT PROFILES
    // ============================================
    console.log('Step 1: Checking for students without profiles...')

    const studentsWithoutProfile = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        studentProfile: null
      }
    })

    console.log(`Found ${studentsWithoutProfile.length} students without profiles`)

    // Get a fallback advisor if needed
    let fallbackAdvisorId: string | undefined = undefined
    if (studentsWithoutProfile.length > 0) {
      const firstAdvisor = await prisma.advisorProfile.findFirst()
      if (firstAdvisor) {
        fallbackAdvisorId = firstAdvisor.id
        console.log(`Using fallback advisor: ${firstAdvisor.id}`)
      }
    }

    for (const user of studentsWithoutProfile) {
      try {
        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            grade: '11',
            school: 'Belirtilmemiş',
            targetScore: 300,
            currentScore: 0,
            xp: 0,
            streak: 0,
            studentSymbol: '🎓',
            healthScore: 100,
            riskStatus: 'GREEN',
            applicationReadiness: 0,
            targetUniversities: [],
            serviceType: 'BOTH',
            advisorId: fallbackAdvisorId
          }
        })
        console.log(`✓ Created StudentProfile for: ${user.email}`)
        fixedProfilesCount++
      } catch (error) {
        const errorMsg = `Failed to create profile for ${user.email}: ${error}`
        console.error(`✗ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    // ============================================
    // 2. HASH PLAIN TEXT PASSWORDS
    // ============================================
    console.log('Step 2: Checking for plain text passwords...')

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true
      }
    })

    console.log(`Found ${allUsers.length} total users`)

    for (const user of allUsers) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')

      if (!isHashed) {
        try {
          const hashedPassword = await bcrypt.hash(user.password, 10)
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
          })
          console.log(`✓ Hashed password for: ${user.email}`)
          hashedPasswordsCount++
        } catch (error) {
          const errorMsg = `Failed to hash password for ${user.email}: ${error}`
          console.error(`✗ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }
    }

    // ============================================
    // 3. RETURN SUMMARY
    // ============================================
    console.log('Database repair complete!')

    return NextResponse.json({
      success: true,
      fixedProfilesCount,
      hashedPasswordsCount,
      errors: errors.length > 0 ? errors : undefined,
      message: 'Veritabanı başarıyla onarıldı.'
    })

  } catch (error) {
    console.error('Database repair error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Veritabanı onarımı sırasında bir hata oluştu',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
