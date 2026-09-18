// prisma/seed.ts
import "dotenv/config";
import { PrismaClient, UserRole, ProficiencyLevel, ApplicationStatus, DocumentStatus, NotificationType } from '@prisma/client'
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
  console.log('Varsayılan değerler kullanılamaz, lütfen gerçek değerleri girin.')
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
  console.log('🌱 Seed verileri oluşturuluyor...')

  // Önce Supabase'deki mevcut kullanıcıları temizle
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('❌ Supabase kullanıcıları listelenirken hata:', listError)
  } else {
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
        }
      }
    }
  }

  // Super Admin kullanıcısı
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password: '123456' },
    create: {
      email: 'admin@test.com',
      password: '123456',
      name: 'Test Admin',
      role: UserRole.SUPER_ADMIN,
      isApproved: true,
      isActive: true,
    },
  })
  console.log('✅ Super Admin kullanıcısı oluşturuldu:', superAdmin.email)

  // Supabase'de Super Admin oluştur
  const { data: superAdminAuth, error: superAdminError } = await supabase.auth.admin.createUser({
    email: 'admin@test.com',
    password: '123456',
    email_confirm: true,
    user_metadata: {
      name: 'Test Admin',
      role: 'SUPER_ADMIN'
    }
  })
  if (superAdminError) {
    console.error('❌ Super Admin Supabase auth oluşturma hatası:', superAdminError)
  } else {
    console.log('✅ Super Admin Supabase auth kullanıcısı oluşturuldu')
  }

  // Advisor kullanıcısı
  const advisor = await prisma.user.upsert({
    where: { email: 'advisor@test.com' },
    update: { password: '123456' },
    create: {
      email: 'advisor@test.com',
      password: '123456',
      name: 'Test Danışman',
      role: UserRole.ADVISOR,
      isApproved: true,
      isActive: true,
    },
  })
  console.log('✅ Advisor kullanıcısı oluşturuldu:', advisor.email)

  // Supabase'de Advisor oluştur
  const { data: advisorAuth, error: advisorError } = await supabase.auth.admin.createUser({
    email: 'advisor@test.com',
    password: '123456',
    email_confirm: true,
    user_metadata: {
      name: 'Test Danışman',
      role: 'ADVISOR'
    }
  })
  if (advisorError) {
    console.error('❌ Advisor Supabase auth oluşturma hatası:', advisorError)
  } else {
    console.log('✅ Advisor Supabase auth kullanıcısı oluşturuldu')
  }
  
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
  console.log('✅ Advisor kullanıcısı oluşturuldu:', advisor.email)

  // Öğrenci kullanıcısı
  const student = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: { password: '123456' },
    create: {
      email: 'student@test.com',
      password: '123456',
      name: 'Test Öğrenci',
      role: UserRole.STUDENT,
      isApproved: true,
      isActive: true,
    },
  })
  console.log('✅ Öğrenci kullanıcısı oluşturuldu:', student.email)

  // Supabase'de Student oluştur
  const { data: studentAuth, error: studentError } = await supabase.auth.admin.createUser({
    email: 'student@test.com',
    password: '123456',
    email_confirm: true,
    user_metadata: {
      name: 'Test Öğrenci',
      role: 'STUDENT'
    }
  })
  if (studentError) {
    console.error('❌ Student Supabase auth oluşturma hatası:', studentError)
  } else {
    console.log('✅ Student Supabase auth kullanıcısı oluşturuldu')
  }
  
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
  console.log('✅ Öğrenci kullanıcısı oluşturuldu:', student.email)

  // İkinci öğrenci
  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      email: 'student2@example.com',
      password: 'student123',
      name: 'Emre Kaya',
      role: UserRole.STUDENT,
      isApproved: true,
      isActive: true,
    },
  })
  console.log('✅ İkinci öğrenci oluşturuldu:', student2.email)

  // Supabase'de Student2 oluştur
  const { data: student2Auth, error: student2Error } = await supabase.auth.admin.createUser({
    email: 'student2@example.com',
    password: 'student123',
    email_confirm: true,
    user_metadata: {
      name: 'Emre Kaya',
      role: 'STUDENT'
    }
  })
  if (student2Error) {
    console.error('❌ Student2 Supabase auth oluşturma hatası:', student2Error)
  } else {
    console.log('✅ Student2 Supabase auth kullanıcısı oluşturuldu')
  }
  
  const studentProfile2 = await prisma.studentProfile.upsert({
    where: { userId: student2.id },
    update: {},
    create: {
      userId: student2.id,
      grade: '12',
      school: 'Galatasaray Lisesi',
      targetUniversity: 'Orta Doğu Teknik Üniversitesi',
      targetScore: 480,
      currentScore: 410,
      advisorId: advisorProfile.id,
    }
  })
  console.log('✅ İkinci öğrenci profili oluşturuldu')

  // Üçüncü öğrenci
  const student3 = await prisma.user.upsert({
    where: { email: 'student3@example.com' },
    update: {},
    create: {
      email: 'student3@example.com',
      password: 'student123',
      name: 'Zeynep Yıldız',
      role: UserRole.STUDENT,
      isApproved: true,
      isActive: true,
    },
  })
  console.log('✅ Üçüncü öğrenci oluşturuldu:', student3.email)

  // Supabase'de Student3 oluştur
  const { data: student3Auth, error: student3Error } = await supabase.auth.admin.createUser({
    email: 'student3@example.com',
    password: 'student123',
    email_confirm: true,
    user_metadata: {
      name: 'Zeynep Yıldız',
      role: 'STUDENT'
    }
  })
  if (student3Error) {
    console.error('❌ Student3 Supabase auth oluşturma hatası:', student3Error)
  } else {
    console.log('✅ Student3 Supabase auth kullanıcısı oluşturuldu')
  }
  
  const studentProfile3 = await prisma.studentProfile.upsert({
    where: { userId: student3.id },
    update: {},
    create: {
      userId: student3.id,
      grade: '11',
      school: 'Kabataş Erkek Lisesi',
      targetUniversity: 'İstanbul Teknik Üniversitesi',
      targetScore: 470,
      currentScore: 395,
      advisorId: advisorProfile.id,
    }
  })
  console.log('✅ Üçüncü öğrenci oluşturuldu:', student3.email)

  // Veli kullanıcısı
  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: {
      email: 'parent@example.com',
      password: 'parent123',
      name: 'Mehmet Demir',
      role: UserRole.PARENT,
      isApproved: true,
      isActive: true,
    },
  })
  console.log('✅ Veli kullanıcısı oluşturuldu:', parent.email)

  // Supabase'de Parent oluştur
  const { data: parentAuth, error: parentError } = await supabase.auth.admin.createUser({
    email: 'parent@example.com',
    password: 'parent123',
    email_confirm: true,
    user_metadata: {
      name: 'Mehmet Demir',
      role: 'PARENT'
    }
  })
  if (parentError) {
    console.error('❌ Parent Supabase auth oluşturma hatası:', parentError)
  } else {
    console.log('✅ Parent Supabase auth kullanıcısı oluşturuldu')
  }
  
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
  console.log('✅ Veli kullanıcısı oluşturuldu:', parent.email)

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

  // Ülkeler
  const countries = await Promise.all([
    prisma.country.upsert({
      where: { code: 'TR' },
      update: {
        slug: 'turkiye',
        pageContent: '<h2>Türkiye Eğitim Sistemi</h2><p>Türkiye, kaliteli eğitim imkanları ve kültürel zenginliği ile öğrencilere harika bir öğrenim ortamı sunar.</p>',
        coverImage: '/images/turkey-cover.jpg',
        isActive: true,
      },
      create: {
        name: 'Türkiye',
        code: 'TR',
        slug: 'turkiye',
        flag: '🇹🇷',
        currency: 'TRY',
        language: 'Türkçe',
        visaRequired: false,
        averageCost: 5000,
        pageContent: '<h2>Türkiye Eğitim Sistemi</h2><p>Türkiye, kaliteli eğitim imkanları ve kültürel zenginliği ile öğrencilere harika bir öğrenim ortamı sunar.</p>',
        coverImage: '/images/turkey-cover.jpg',
        isActive: true,
      }
    }),
    prisma.country.upsert({
      where: { code: 'US' },
      update: {
        slug: 'amerika-birlesik-devletleri',
        pageContent: '<h2>Amerika Eğitim Sistemi</h2><p>ABD, dünya standartlarında üniversiteleri ve geniş burs imkanları ile öğrencilere eşsiz bir eğitim deneyimi sunar.</p>',
        coverImage: '/images/usa-cover.jpg',
        isActive: true,
      },
      create: {
        name: 'Amerika Birleşik Devletleri',
        code: 'US',
        slug: 'amerika-birlesik-devletleri',
        flag: '🇺🇸',
        currency: 'USD',
        language: 'İngilizce',
        visaRequired: true,
        averageCost: 50000,
        pageContent: '<h2>Amerika Eğitim Sistemi</h2><p>ABD, dünya standartlarında üniversiteleri ve geniş burs imkanları ile öğrencilere eşsiz bir eğitim deneyimi sunar.</p>',
        coverImage: '/images/usa-cover.jpg',
        isActive: true,
      }
    }),
    prisma.country.upsert({
      where: { code: 'GB' },
      update: {
        slug: 'birlesik-krallik',
        pageContent: '<h2>İngiltere Eğitim Sistemi</h2><p>İngiltere, tarihi üniversiteleri ve kısa eğitim süresi ile öğrencilere hızlı ve kaliteli bir eğitim sunar.</p>',
        coverImage: '/images/uk-cover.jpg',
        isActive: true,
      },
      create: {
        name: 'Birleşik Krallık',
        code: 'GB',
        slug: 'birlesik-krallik',
        flag: '🇬🇧',
        currency: 'GBP',
        language: 'İngilizce',
        visaRequired: true,
        averageCost: 35000,
        pageContent: '<h2>İngiltere Eğitim Sistemi</h2><p>İngiltere, tarihi üniversiteleri ve kısa eğitim süresi ile öğrencilere hızlı ve kaliteli bir eğitim sunar.</p>',
        coverImage: '/images/uk-cover.jpg',
        isActive: true,
      }
    }),
    prisma.country.upsert({
      where: { code: 'DE' },
      update: {
        slug: 'almanya',
        pageContent: '<h2>Almanya Eğitim Sistemi</h2><p>Almanya, ücretsiz eğitim imkanları ve güçlü endüstriyel bağlantıları ile öğrencilere mükemmel bir gelecek sunar.</p>',
        coverImage: '/images/germany-cover.jpg',
        isActive: true,
      },
      create: {
        name: 'Almanya',
        code: 'DE',
        slug: 'almanya',
        flag: '🇩🇪',
        currency: 'EUR',
        language: 'Almanca',
        visaRequired: true,
        averageCost: 15000,
        pageContent: '<h2>Almanya Eğitim Sistemi</h2><p>Almanya, ücretsiz eğitim imkanları ve güçlü endüstriyel bağlantıları ile öğrencilere mükemmel bir gelecek sunar.</p>',
        coverImage: '/images/germany-cover.jpg',
        isActive: true,
      }
    }),
  ])
  console.log('✅ Ülkeler oluşturuldu:', countries.length)

  // Üniversiteler
  const universities = await Promise.all([
    prisma.university.upsert({
      where: { id: 'bogazici-uni' },
      update: {},
      create: {
        id: 'bogazici-uni',
        countryId: countries[0].id,
        name: 'Boğaziçi Üniversitesi',
        city: 'İstanbul',
        ranking: 1,
        type: 'Devlet',
        tuitionFees: 2000,
        languageRequirement: 'YDS/TOEFL',
        requiredScore: 80,
        website: 'https://www.boun.edu.tr',
        description: 'Türkiyenin en prestijli üniversitelerinden biri',
        departments: ['Bilgisayar Mühendisliği', 'Elektrik-Elektronik Mühendisliği', 'İşletme'],
        applicationDeadline: new Date('2024-06-30'),
        requirements: 'TOEFL 80, YDS 80, Lise diploması',
      }
    }),
    prisma.university.upsert({
      where: { id: 'mit' },
      update: {},
      create: {
        id: 'mit',
        countryId: countries[1].id,
        name: 'Massachusetts Institute of Technology',
        city: 'Cambridge',
        ranking: 1,
        type: 'Özel',
        tuitionFees: 55000,
        languageRequirement: 'TOEFL/IELTS',
        requiredScore: 100,
        website: 'https://www.mit.edu',
        description: 'Dünyanın en iyi teknik üniversitesi',
        departments: ['Computer Science', 'Electrical Engineering', 'Physics'],
        applicationDeadline: new Date('2024-12-15'),
        requirements: 'TOEFL 100, IELTS 7.5, SAT Math 750+',
      }
    }),
    prisma.university.upsert({
      where: { id: 'oxford' },
      update: {},
      create: {
        id: 'oxford',
        countryId: countries[2].id,
        name: 'University of Oxford',
        city: 'Oxford',
        ranking: 2,
        type: 'Devlet',
        tuitionFees: 38000,
        languageRequirement: 'IELTS',
        requiredScore: 7.5,
        website: 'https://www.ox.ac.uk',
        description: 'İngilterenin en eski ve prestijli üniversitesi',
        departments: ['Computer Science', 'Economics', 'Medicine'],
        applicationDeadline: new Date('2024-10-15'),
        requirements: 'IELTS 7.5, A-levels AAA',
      }
    }),
  ])
  console.log('✅ Üniversiteler oluşturuldu:', universities.length)

  // Örnek günlük görevler
  await prisma.dailyTask.create({
    data: {
      studentProfileId: studentProfile.id,
      title: 'Matematik soru çözümü',
      description: 'Türev konusu 40 soru',
      subject: 'Matematik',
      topic: 'Türev',
      taskType: 'TEST',
      targetQuantity: 40,
      completedQuantity: 25,
      correctCount: 20,
      wrongCount: 5,
      isCompleted: false,
      taskDate: new Date(),
      priority: 'high',
    }
  })

  await prisma.dailyTask.create({
    data: {
      studentProfileId: studentProfile.id,
      title: 'Fizik tekrarı',
      description: 'Kuvvet ve hareket konusu',
      subject: 'Fizik',
      topic: 'Kuvvet ve Hareket',
      taskType: 'VIDEO',
      targetQuantity: 2,
      completedQuantity: 0,
      correctCount: 0,
      wrongCount: 0,
      isCompleted: false,
      taskDate: new Date(),
      priority: 'medium',
    }
  })
  console.log('✅ Örnek günlük görevler oluşturuldu')

  // Örnek deneme sonuçları
  await prisma.examResult.create({
    data: {
      studentProfileId: studentProfile.id,
        examName: 'ÖSYM Deneme Sınavı 1',
        examType: 'TYT',
        examDate: new Date(),
        targetScore: 400,
        actualScore: 380,
        scoreDifference: -20,
        turkishScore: 85,
        mathScore: 90,
        scienceScore: 95,
        socialScore: 110,
        notes: 'Matematik bölümünde daha fazla çalışma gerekli',
      }
    })

    await prisma.examResult.create({
      data: {
        studentProfileId: studentProfile.id,
        examName: 'ÖSYM Deneme Sınavı 2',
        examType: 'AYT',
        examDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 hafta önce
        targetScore: 350,
        actualScore: 360,
        scoreDifference: 10,
        mathScore: 85,
        notes: 'İyi ilerleme, fizik tekrarı gerekli',
      }
    })
    console.log('✅ Örnek deneme sonuçları oluşturuldu')

  // Örnek konu etkinliği analizi
  await prisma.subjectAnalysis.upsert({
    where: {
      studentProfileId_subject_topic: {
        studentProfileId: studentProfile.id,
        subject: 'Matematik',
        topic: 'Türev'
      }
    },
    update: {},
    create: {
      studentProfileId: studentProfile.id,
      subject: 'Matematik',
      topic: 'Türev',
      proficiency: ProficiencyLevel.MEDIUM,
      progressPercent: 60,
      lastStudiedAt: new Date(),
      totalHours: 12,
    }
  })

  await prisma.subjectAnalysis.upsert({
    where: {
      studentProfileId_subject_topic: {
        studentProfileId: studentProfile.id,
        subject: 'Matematik',
        topic: 'İntegral'
      }
    },
    update: {},
    create: {
      studentProfileId: studentProfile.id,
      subject: 'Matematik',
      topic: 'İntegral',
      proficiency: ProficiencyLevel.WEAK,
      progressPercent: 30,
      lastStudiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      totalHours: 5,
    }
  })

  await prisma.subjectAnalysis.upsert({
    where: {
      studentProfileId_subject_topic: {
        studentProfileId: studentProfile.id,
        subject: 'Fizik',
        topic: 'Kuvvet ve Hareket'
      }
    },
    update: {},
    create: {
      studentProfileId: studentProfile.id,
      subject: 'Fizik',
      topic: 'Kuvvet ve Hareket',
      proficiency: ProficiencyLevel.GOOD,
      progressPercent: 75,
      lastStudiedAt: new Date(),
      totalHours: 18,
    }
  })
  console.log('✅ Örnek konu etkinliği analizi oluşturuldu')

  // Örnek görüşme notları
  await prisma.meetingNote.create({
    data: {
      studentProfileId: studentProfile.id,
        meetingDate: new Date(),
        duration: 45,
        motivationLevel: 'high',
        issues: 'Sınav stresi artıyor, özellikle matematikten endişeli',
        achievements: 'Fizikte iyi ilerleme, deneme sınavlarında artış',
        actionItems: 'Matematik türev konusu için ek çalışma programı, stres yönetimi teknikleri',
        nextMeetingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: 'Öğrenci genel olarak motive, sadece matematik konularında daha fazla desteğe ihtiyaç duyuyor. Öğrenme stratejileri üzerine çalışma önerildi.',
      }
    })
    console.log('✅ Örnek görüşme notları oluşturuldu')

  // Örnek başvuru
  const application = await prisma.application.create({
    data: {
      studentProfileId: studentProfile.id,
        universityId: universities[1].id, // MIT
        program: 'Lisans',
        semester: 'Fall',
        year: 2025,
        status: ApplicationStatus.SUBMITTED,
        applicationDate: new Date(),
        estimatedBudget: 60000,
        languageTest: 'TOEFL',
        languageScore: 95,
        notes: 'Öğrenci MIT için başvuru sürecinde, doküman toplama aşamasında',
      }
    })
    console.log('✅ Örnek başvuru oluşturuldu')

  // Örnek belgeler
  await prisma.document.create({
      data: {
        applicationId: application.id,
        documentType: 'Pasaport',
        documentName: 'Pasaport Fotokopisi',
        filePath: null,
        isUploaded: false,
        status: DocumentStatus.MISSING,
      }
    })

    await prisma.document.create({
      data: {
        applicationId: application.id,
        documentType: 'Transkript',
        documentName: 'Lise Transkripti',
        filePath: 'https://storage.supabase.co/documents/transcript.pdf',
        isUploaded: true,
        uploadDate: new Date(),
        status: DocumentStatus.UPLOADED,
      }
    })

    await prisma.document.create({
      data: {
        applicationId: application.id,
        documentType: 'Motivation Letter',
        documentName: 'Motivation Mektubu',
        filePath: 'https://storage.supabase.co/documents/motivation_letter.pdf',
        isUploaded: true,
        uploadDate: new Date(),
        status: DocumentStatus.APPROVED,
      }
    })
    console.log('✅ Örnek belgeler oluşturuldu')

  // Örnek randevu
  const appointment = await prisma.appointment.create({
    data: {
      creatorId: advisor.id,
      title: 'Haftalık Koçluk Görüşmesi',
      description: 'Haftalık ilerleme değerlendirmesi ve yeni hedef belirleme',
      appointmentType: 'consultancy',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 gün sonra
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 dakika
      location: 'Online (Zoom)',
      zoomMeetingUrl: 'https://zoom.us/j/123456789',
      status: 'scheduled',
    }
  })
  console.log('✅ Örnek randevu oluşturuldu')

  // Randevu katılımcısı
  await prisma.appointmentParticipant.create({
    data: {
      appointmentId: appointment.id,
      userId: student.id,
      status: 'accepted',
    }
  })
  console.log('✅ Randevu katılımcısı oluşturuldu')

  // Örnek bildirimler
  await prisma.notification.create({
    data: {
      userId: student.id,
      title: 'Eksik Belge Hatırlatması',
      message: 'MIT başvurunuz için pasaport belgesi eksik. Lütfen yükleyiniz.',
      type: NotificationType.MISSING_DOCUMENT,
      relatedEntityType: 'Document',
      relatedEntityId: 'doc-1',
    }
  })

  await prisma.notification.create({
    data: {
      userId: student.id,
      title: 'Randevu Hatırlatması',
      message: 'Haftalık koçluk görüşmeniz 2 gün sonra saat 14:00\'te.',
      type: NotificationType.MEETING_REMINDER,
      relatedEntityType: 'Appointment',
      relatedEntityId: appointment.id,
    }
  })
  console.log('✅ Örnek bildirimler oluşturuldu')

  console.log('🎉 Seed verileri başarıyla oluşturuldu!')
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })