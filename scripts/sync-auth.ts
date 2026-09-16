// scripts/sync-auth.ts
import "dotenv/config";
import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

// Polyfill WebSocket for Node.js
(global as any).WebSocket = WebSocket

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres.cgclalfcuehpmkvixaox:Hopekutay064431%21@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key"

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === "https://your-project.supabase.co") {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY environment değişkenleri eksik')
  console.log('Lütfen .env.local dosyasında bu değişkenleri tanımlayın:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your-supabase-url')
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

async function main() {
  console.log('🔄 Prisma kullanıcıları Supabase Auth sistemine senkronize ediliyor...')

  // Prisma'dan tüm kullanıcıları çek
  const users = await prisma.user.findMany()
  console.log(`📋 Prisma'da ${users.length} kullanıcı bulundu`)

  let successCount = 0
  let errorCount = 0
  let deletedCount = 0

  // Supabase'deki mevcut kullanıcıları listele
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('❌ Supabase kullanıcıları listelenirken hata:', listError)
    process.exit(1)
  }

  console.log(`📋 Supabase'de ${existingUsers.users.length} kullanıcı bulundu`)

  // Test kullanıcılarını Supabase'den sil
  const testEmails = ['admin@test.com', 'advisor@test.com', 'student@test.com', 'student2@example.com', 'student3@example.com', 'parent@example.com']
  for (const user of existingUsers.users) {
    if (user.email && testEmails.includes(user.email) && user.id) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      if (deleteError) {
        console.error(`❌ ${user.email} silinirken hata:`, deleteError.message)
      } else {
        console.log(`🗑️  ${user.email} Supabase'den silindi`)
        deletedCount++
      }
    }
  }

  // Prisma kullanıcılarını Supabase'de oluştur
  for (const user of users) {
    try {
      // Şifre belirleme mantığı
      let password = user.password
      if (!password) {
        switch (user.role) {
          case UserRole.SUPER_ADMIN:
            password = 'superadmin123'
            break
          case UserRole.ADVISOR:
            password = 'advisor123'
            break
          case UserRole.STUDENT:
            password = 'student123'
            break
          case UserRole.PARENT:
            password = 'parent123'
            break
          default:
            password = 'password123'
        }
      }

      // Supabase'de kullanıcı oluştur
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      })

      if (createError) {
        console.error(`❌ ${user.email} oluşturulurken hata:`, createError.message)
        errorCount++
      } else {
        console.log(`✅ ${user.email} (${user.name}) başarıyla oluşturuldu`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ ${user.email} işlenirken beklenmeyen hata:`, error)
      errorCount++
    }
  }

  console.log('\n📊 Özet:')
  console.log(`�️  Silinen: ${deletedCount}`)
  console.log(`✅ Yeni oluşturulan: ${successCount}`)
  console.log(`❌ Hatalı: ${errorCount}`)
  console.log(`📋 Toplam: ${users.length}`)

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('❌ Script çalışırken hata oluştu:', error)
  process.exit(1)
})
