import { prisma } from '../src/lib/prisma';

async function seedCurriculum() {
  console.log('Starting curriculum seed...');

  // Create Grade Levels
  const grade9 = await prisma.gradeLevel.upsert({
    where: { name: '9. Sınıf' },
    update: {},
    create: {
      name: '9. Sınıf',
      displayName: 'Lise 9. Sınıf',
      isActive: true,
      order: 1
    }
  });

  const grade10 = await prisma.gradeLevel.upsert({
    where: { name: '10. Sınıf' },
    update: {},
    create: {
      name: '10. Sınıf',
      displayName: 'Lise 10. Sınıf',
      isActive: true,
      order: 2
    }
  });

  const grade11 = await prisma.gradeLevel.upsert({
    where: { name: '11. Sınıf' },
    update: {},
    create: {
      name: '11. Sınıf',
      displayName: 'Lise 11. Sınıf',
      isActive: true,
      order: 3
    }
  });

  const grade12 = await prisma.gradeLevel.upsert({
    where: { name: '12. Sınıf' },
    update: {},
    create: {
      name: '12. Sınıf',
      displayName: 'Lise 12. Sınıf',
      isActive: true,
      order: 4
    }
  });

  console.log('Grade levels created');

  // Create Subjects for 10. Sınıf (example)
  const turkish = await prisma.subject.upsert({
    where: { 
      gradeLevelId_name: {
        gradeLevelId: grade10.id,
        name: 'Türkçe'
      }
    },
    update: {},
    create: {
      gradeLevelId: grade10.id,
      name: 'Türkçe',
      code: 'TR',
      displayName: 'Türkçe Dili ve Edebiyatı',
      isActive: true,
      order: 1
    }
  });

  const math = await prisma.subject.upsert({
    where: { 
      gradeLevelId_name: {
        gradeLevelId: grade10.id,
        name: 'Matematik'
      }
    },
    update: {},
    create: {
      gradeLevelId: grade10.id,
      name: 'Matematik',
      code: 'MAT',
      displayName: 'Matematik',
      isActive: true,
      order: 2
    }
  });

  const physics = await prisma.subject.upsert({
    where: { 
      gradeLevelId_name: {
        gradeLevelId: grade10.id,
        name: 'Fizik'
      }
    },
    update: {},
    create: {
      gradeLevelId: grade10.id,
      name: 'Fizik',
      code: 'FZK',
      displayName: 'Fizik',
      isActive: true,
      order: 3
    }
  });

  const chemistry = await prisma.subject.upsert({
    where: { 
      gradeLevelId_name: {
        gradeLevelId: grade10.id,
        name: 'Kimya'
      }
    },
    update: {},
    create: {
      gradeLevelId: grade10.id,
      name: 'Kimya',
      code: 'KMY',
      displayName: 'Kimya',
      isActive: true,
      order: 4
    }
  });

  const biology = await prisma.subject.upsert({
    where: { 
      gradeLevelId_name: {
        gradeLevelId: grade10.id,
        name: 'Biyoloji'
      }
    },
    update: {},
    create: {
      gradeLevelId: grade10.id,
      name: 'Biyoloji',
      code: 'BYO',
      displayName: 'Biyoloji',
      isActive: true,
      order: 5
    }
  });

  const history = await prisma.subject.upsert({
    where: { 
      gradeLevelId_name: {
        gradeLevelId: grade10.id,
        name: 'Tarih'
      }
    },
    update: {},
    create: {
      gradeLevelId: grade10.id,
      name: 'Tarih',
      code: 'TRH',
      displayName: 'Tarih',
      isActive: true,
      order: 6
    }
  });

  const geography = await prisma.subject.upsert({
    where: { 
      gradeLevelId_name: {
        gradeLevelId: grade10.id,
        name: 'Coğrafya'
      }
    },
    update: {},
    create: {
      gradeLevelId: grade10.id,
      name: 'Coğrafya',
      code: 'CGF',
      displayName: 'Coğrafya',
      isActive: true,
      order: 7
    }
  });

  console.log('Subjects created');

  // Create Topics for Mathematics
  const mathTopics = [
    { name: 'Fonksiyonlar', code: 'MAT-FN-01', order: 1 },
    { name: 'Polinomlar', code: 'MAT-PL-01', order: 2 },
    { name: 'Denklem Çözme', code: 'MAT-DNK-01', order: 3 },
    { name: 'Üslü Sayılar', code: 'MAT-US-01', order: 4 },
    { name: 'Köklü Sayılar', code: 'MAT-KK-01', order: 5 },
    { name: 'Logaritma', code: 'MAT-LOG-01', order: 6 },
    { name: 'Trigonometri', code: 'MAT-TRG-01', order: 7 },
    { name: 'Diziler', code: 'MAT-DZ-01', order: 8 },
    { name: 'Limit', code: 'MAT-LMT-01', order: 9 },
    { name: 'Türev', code: 'MAT-TV-01', order: 10 },
    { name: 'İntegral', code: 'MAT-INT-01', order: 11 },
    { name: 'Olasılık', code: 'MAT-OL-01', order: 12 },
    { name: 'İstatistik', code: 'MAT-IST-01', order: 13 }
  ];

  for (const topicData of mathTopics) {
    await prisma.topic.upsert({
      where: { 
        subjectId_name: {
          subjectId: math.id,
          name: topicData.name
        }
      },
      update: {},
      create: {
        subjectId: math.id,
        name: topicData.name,
        code: topicData.code,
        isActive: true,
        order: topicData.order
      }
    });
  }

  // Create Topics for Turkish
  const turkishTopics = [
    { name: 'Paragraf', code: 'TR-PRG-01', order: 1 },
    { name: 'Sözcük Anlamı', code: 'TR-SZK-01', order: 2 },
    { name: 'Cümle Anlamı', code: 'TR-CML-01', order: 3 },
    { name: 'Ses Bilgisi', code: 'TR-SES-01', order: 4 },
    { name: 'Yazım Kuralları', code: 'TR-YZM-01', order: 5 },
    { name: 'Noktalama', code: 'TR-NKT-01', order: 6 },
    { name: 'Anlatım Bozuklukları', code: 'TR-ANT-01', order: 7 },
    { name: 'Sözcükte Anlam', code: 'TR-SZK-02', order: 8 },
    { name: 'Cümlede Anlam', code: 'TR-CML-02', order: 9 },
    { name: 'Metin Bilgisi', code: 'TR-MTN-01', order: 10 }
  ];

  for (const topicData of turkishTopics) {
    await prisma.topic.upsert({
      where: { 
        subjectId_name: {
          subjectId: turkish.id,
          name: topicData.name
        }
      },
      update: {},
      create: {
        subjectId: turkish.id,
        name: topicData.name,
        code: topicData.code,
        isActive: true,
        order: topicData.order
      }
    });
  }

  console.log('Topics created');

  // Create Question Types for all topics
  const questionTypes = [
    { name: 'Çoktan Seçmeli', code: 'CS' },
    { name: 'Klasik', code: 'KLASIK' },
    { name: 'Boşluk Doldurma', code: 'BD' },
    { name: 'Doğru Yanlış', code: 'DY' },
    { name: 'Eşleştirme', code: 'ES' }
  ];

  // Get all topics
  const allTopics = await prisma.topic.findMany();
  
  for (const topic of allTopics) {
    for (const qtData of questionTypes) {
      await prisma.questionType.upsert({
        where: { 
          topicId_name: {
            topicId: topic.id,
            name: qtData.name
          }
        },
        update: {},
        create: {
          topicId: topic.id,
          name: qtData.name,
          code: qtData.code,
          isActive: true,
          order: 0
        }
      });
    }
  }

  console.log('Question types created');
  console.log('Curriculum seed completed successfully!');
}

seedCurriculum()
  .catch((e) => {
    console.error('Error seeding curriculum:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });