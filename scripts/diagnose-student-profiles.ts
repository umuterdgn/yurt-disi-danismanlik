import { prisma } from '../src/lib/prisma'

async function diagnoseStudentProfiles() {
  try {
    console.log('=== Diagnosing Student Profile Issues ===\n')

    // Check all STUDENT users
    const studentUsers = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        studentProfile: true
      }
    })

    console.log(`Total STUDENT users: ${studentUsers.length}`)

    const studentsWithoutProfile = studentUsers.filter(u => !u.studentProfile)
    const studentsWithProfile = studentUsers.filter(u => u.studentProfile)

    console.log(`Students WITH profile: ${studentsWithProfile.length}`)
    console.log(`Students WITHOUT profile: ${studentsWithoutProfile.length}`)

    if (studentsWithoutProfile.length > 0) {
      console.log('\n=== Students without profiles ===')
      studentsWithoutProfile.forEach(user => {
        console.log(`- ${user.email} (${user.name}) - ID: ${user.id}`)
      })
    }

    // Check total student profiles
    const totalProfiles = await prisma.studentProfile.count()
    console.log(`Total student profiles in database: ${totalProfiles}`)

    console.log('\n=== Student Details ===')
    studentUsers.forEach(user => {
      console.log(`- ${user.email} | User ID: ${user.id} | Profile ID: ${user.studentProfile?.id || 'NO PROFILE'}`)
    })

    console.log('\n=== Summary ===')
    console.log(`Total Student Users: ${studentUsers.length}`)
    console.log(`Users with Profiles: ${studentsWithProfile.length}`)
    console.log(`Users without Profiles: ${studentsWithoutProfile.length}`)
    console.log(`Total Student Profiles: ${totalProfiles}`)

  } catch (error) {
    console.error('Error diagnosing student profiles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

diagnoseStudentProfiles()
