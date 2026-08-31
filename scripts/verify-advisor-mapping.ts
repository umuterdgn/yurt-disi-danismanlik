// scripts/verify-advisor-mapping.ts
import "dotenv/config";
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres.cgclalfcuehpmkvixaox:Hopekutay064431%21@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔍 Advisor-Öğrenci eşleşmesi kontrol ediliyor...')

  // Advisor kullanıcısını bul
  const advisor = await prisma.user.findUnique({
    where: { email: 'advisor@example.com' },
    include: {
      advisorProfile: true
    }
  })

  if (!advisor || !advisor.advisorProfile) {
    console.error('❌ Advisor veya advisorProfile bulunamadı')
    process.exit(1)
  }

  console.log(`✅ Advisor: ${advisor.name} (${advisor.email})`)
  console.log(`📋 AdvisorProfile ID: ${advisor.advisorProfile.id}`)

  // Bu advisor'a atanmış öğrencileri bul
  const students = await prisma.studentProfile.findMany({
    where: { advisorId: advisor.advisorProfile.id },
    include: {
      user: true
    }
  })

  console.log(`📋 Atanan öğrenci sayısı: ${students.length}`)

  if (students.length === 0) {
    console.log('⚠️  Bu advisora atanmış öğrenci yok!')
    
    // Tüm öğrencileri ve advisorId'lerini kontrol et
    const allStudents = await prisma.studentProfile.findMany({
      include: {
        user: true
      }
    })
    
    console.log(`\n📋 Veritabanındaki tüm öğrenciler (${allStudents.length}):`)
    for (const student of allStudents) {
      console.log(`  - ${student.user.name} (${student.user.email}): advisorId = ${student.advisorId || 'NULL'}`)
    }
  } else {
    console.log('\n📋 Atanan öğrenciler:')
    for (const student of students) {
      console.log(`  - ${student.user.name} (${student.user.email})`)
      console.log(`    Sınıf: ${student.grade}, Okul: ${student.school}`)
      console.log(`    Mevcut: ${student.currentScore}, Hedef: ${student.targetScore}`)
    }
  }

  // Ayşe Demir'i advisor'a ata (eğer atanmamışsa)
  const ayseStudent = await prisma.studentProfile.findFirst({
    where: {
      user: {
        email: 'student@example.com'
      }
    },
    include: {
      user: true
    }
  })

  if (ayseStudent && !ayseStudent.advisorId) {
    console.log(`\n🔄 Ayşe Demir advisor'a atanıyor...`)
    await prisma.studentProfile.update({
      where: { id: ayseStudent.id },
      data: { advisorId: advisor.advisorProfile.id }
    })
    console.log(`✅ Ayşe Demir başarıyla advisor'a atandı`)
  } else if (ayseStudent && ayseStudent.advisorId) {
    console.log(`\nℹ️  Ayşe Demir zaten bir advisora atanmış (ID: ${ayseStudent.advisorId})`)
  }

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('❌ Script çalışırken hata oluştu:', error)
  process.exit(1)
})
