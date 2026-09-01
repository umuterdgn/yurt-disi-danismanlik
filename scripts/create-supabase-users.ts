import "dotenv/config";
import { createClient } from '@supabase/supabase-js';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres.cgclalfcuehpmkvixaox:Hopekutay064431%21@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    detectSessionInUrl: false
  }
})

async function createTestUser(email: string, password: string, name: string, role: UserRole) {
  try {
    // Supabase Auth'ta kullanıcı oluştur
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      // Kullanıcı zaten var mı kontrol et
      if (authError.message.includes('already been registered')) {
        console.log(`⚠️  ${email} zaten Supabase Auth'ta var, güncelleniyor...`)
        
        // Mevcut kullanıcıyı bul
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === email)
        
        if (existingUser) {
          // Prisma'da güncelle veya oluştur
          await prisma.user.upsert({
            where: { id: existingUser.id },
            update: { name, role },
            create: {
              id: existingUser.id,
              email,
              password,
              name,
              role,
            }
          })
          console.log(`✅ ${email} Prisma'da güncellendi`)
          return existingUser.id
        }
      }
      throw authError
    }

    const supabaseUserId = authData.user.id

    // Prisma'da kullanıcı oluştur
    const user = await prisma.user.upsert({
      where: { id: supabaseUserId },
      update: { name, role },
      create: {
        id: supabaseUserId,
        email,
        password,
        name,
        role,
      }
    })

    // Role göre profil oluştur
    if (role === 'ADVISOR') {
      await prisma.advisorProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          specialization: 'Matematik & Fen Bilimleri',
          experience: 8,
          bio: 'Test danışman',
          maxStudents: 20,
        }
      })
    } else if (role === 'STUDENT') {
      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          grade: '11',
          school: 'Test Lisesi',
          targetUniversity: 'Test Üniversitesi',
          targetScore: 450,
          currentScore: 380,
        }
      })
    }

    console.log(`✅ ${email} oluşturuldu (Supabase Auth + Prisma)`)
    return supabaseUserId

  } catch (error) {
    console.error(`❌ ${email} oluşturulurken hata:`, error)
    throw error
  }
}

async function main() {
  console.log('🔐 Supabase Auth test kullanıcıları oluşturuluyor...')

  // Test kullanıcıları
  const testUsers = [
    { email: 'admin@test.com', password: '123456', name: 'Test Admin', role: UserRole.SUPER_ADMIN },
    { email: 'advisor@test.com', password: '123456', name: 'Test Danışman', role: UserRole.ADVISOR },
    { email: 'student@test.com', password: '123456', name: 'Test Öğrenci', role: UserRole.STUDENT },
  ]

  for (const testUser of testUsers) {
    await createTestUser(testUser.email, testUser.password, testUser.name, testUser.role)
  }

  console.log('🎉 Tüm test kullanıcıları başarıyla oluşturuldu!')
  console.log('\n📋 Giriş Bilgileri:')
  console.log('─────────────────────────────────────')
  testUsers.forEach(user => {
    console.log(`👤 ${user.role}: ${user.email} / ${user.password}`)
  })
  console.log('─────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
