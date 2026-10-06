import { prisma } from '../src/lib/prisma'

async function fixMissingStudentProfiles() {
  try {
    console.log('Starting to fix missing student profiles...')

    // Find all STUDENT role users without student profiles
    const studentsWithoutProfile = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        studentProfile: null
      },
      include: {
        advisorProfile: true,
        parentProfile: true
      }
    })

    console.log(`Found ${studentsWithoutProfile.length} STUDENT users without profiles`)

    if (studentsWithoutProfile.length === 0) {
      console.log('No students with missing profiles found. All good!')
      return
    }

    let fixedCount = 0
    let errorCount = 0

    for (const user of studentsWithoutProfile) {
      try {
        // Create student profile for this user
        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            grade: '11', // Default grade
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
            serviceType: 'BOTH'
          }
        })

        console.log(`✓ Fixed student profile for: ${user.email} (${user.name})`)
        fixedCount++
      } catch (error) {
        console.error(`✗ Failed to create profile for: ${user.email}`, error)
        errorCount++
      }
    }

    console.log(`\nFix complete!`)
    console.log(`Fixed: ${fixedCount} students`)
    console.log(`Errors: ${errorCount} students`)

  } catch (error) {
    console.error('Error fixing student profiles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
fixMissingStudentProfiles()
