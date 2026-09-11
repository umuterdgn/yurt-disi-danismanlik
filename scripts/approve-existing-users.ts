import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres.cgclalfcuehpmkvixaox:Hopekutay064431%21@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

async function approveExistingUsers() {
  try {
    // Update all existing users to have isApproved = true
    const result = await prisma.user.updateMany({
      where: {
        isApproved: false
      },
      data: {
        isApproved: true
      }
    })

    console.log(`✅ Successfully approved ${result.count} existing users`)
    
    // Verify the update
    const unapprovedUsers = await prisma.user.count({
      where: { isApproved: false }
    })
    
    console.log(`📊 Remaining unapproved users: ${unapprovedUsers}`)
    
  } catch (error) {
    console.error('❌ Error approving existing users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

approveExistingUsers()