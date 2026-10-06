import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function hashUserPasswords() {
  try {
    console.log('Starting password hashing for all users...')

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      }
    })

    console.log(`Found ${users.length} users`)

    let updatedCount = 0
    let skippedCount = 0

    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')

      if (isHashed) {
        console.log(`Skipped ${user.email} (role: ${user.role}) - password already hashed`)
        skippedCount++
        continue
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, 10)

      // Update the user
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })

      console.log(`Updated ${user.email} (role: ${user.role}) - password hashed`)
      updatedCount++
    }

    console.log(`\nPassword hashing complete!`)
    console.log(`Updated: ${updatedCount} users`)
    console.log(`Skipped: ${skippedCount} users (already hashed)`)

  } catch (error) {
    console.error('Error hashing passwords:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
hashUserPasswords()
