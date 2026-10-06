import { prisma } from '../src/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function syncSupabasePrismaUsers() {
  try {
    console.log('Starting Supabase-Prisma user sync...')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not found')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }, {
      db: { schema: 'public' },
      global: { headers: {} }
    })

    // Get all users from Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      throw new Error(`Failed to list Supabase users: ${listError.message}`)
    }

    console.log(`Found ${users.length} users in Supabase Auth`)

    let syncedCount = 0
    let profileCreatedCount = 0
    let errorCount = 0

    for (const supabaseUser of users) {
      try {
        // Check if user exists in Prisma
        const prismaUser = await prisma.user.findUnique({
          where: { id: supabaseUser.id },
          include: {
            studentProfile: true,
            advisorProfile: true,
            parentProfile: true
          }
        })

        if (!prismaUser) {
          // User exists in Supabase but not in Prisma - create them
          console.log(`Creating Prisma user for: ${supabaseUser.email}`)

          const newUser = await prisma.user.create({
            data: {
              id: supabaseUser.id,
              email: supabaseUser.email,
              name: supabaseUser.user_metadata?.name || supabaseUser.email,
              password: '', // Password managed by Supabase
              role: (supabaseUser.user_metadata?.role as any) || 'STUDENT',
              isApproved: true
            }
          })

          console.log(`✓ Created Prisma user: ${supabaseUser.email}`)

          // Create profile based on role
          if (newUser.role === 'STUDENT') {
            await prisma.studentProfile.create({
              data: {
                userId: newUser.id,
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
                serviceType: 'BOTH'
              }
            })
            console.log(`✓ Created StudentProfile for: ${supabaseUser.email}`)
            profileCreatedCount++
          } else if (newUser.role === 'ADVISOR') {
            await prisma.advisorProfile.create({
              data: {
                userId: newUser.id,
                maxStudents: 20
              }
            })
            console.log(`✓ Created AdvisorProfile for: ${supabaseUser.email}`)
            profileCreatedCount++
          } else if (newUser.role === 'PARENT') {
            await prisma.parentProfile.create({
              data: {
                userId: newUser.id
              }
            })
            console.log(`✓ Created ParentProfile for: ${supabaseUser.email}`)
            profileCreatedCount++
          }

          syncedCount++
        } else {
          // User exists in both - check if profile is missing
          if (prismaUser.role === 'STUDENT' && !prismaUser.studentProfile) {
            console.log(`Creating missing StudentProfile for: ${supabaseUser.email}`)
            await prisma.studentProfile.create({
              data: {
                userId: prismaUser.id,
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
                serviceType: 'BOTH'
              }
            })
            console.log(`✓ Created missing StudentProfile for: ${supabaseUser.email}`)
            profileCreatedCount++
          } else if (prismaUser.role === 'ADVISOR' && !prismaUser.advisorProfile) {
            console.log(`Creating missing AdvisorProfile for: ${supabaseUser.email}`)
            await prisma.advisorProfile.create({
              data: {
                userId: prismaUser.id,
                maxStudents: 20
              }
            })
            console.log(`✓ Created missing AdvisorProfile for: ${supabaseUser.email}`)
            profileCreatedCount++
          } else if (prismaUser.role === 'PARENT' && !prismaUser.parentProfile) {
            console.log(`Creating missing ParentProfile for: ${supabaseUser.email}`)
            await prisma.parentProfile.create({
              data: {
                userId: prismaUser.id
              }
            })
            console.log(`✓ Created missing ParentProfile for: ${supabaseUser.email}`)
            profileCreatedCount++
          }
        }
      } catch (error) {
        console.error(`✗ Error processing user ${supabaseUser.email}:`, error)
        errorCount++
      }
    }

    console.log(`\nSync complete!`)
    console.log(`Synced users: ${syncedCount}`)
    console.log(`Created profiles: ${profileCreatedCount}`)
    console.log(`Errors: ${errorCount}`)

  } catch (error) {
    console.error('Error syncing users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
syncSupabasePrismaUsers()
