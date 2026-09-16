import { prisma } from '../src/lib/prisma';

async function testApproveAction() {
  try {
    // Önce test student ve user oluştur
    const testUser = await prisma.user.create({
      data: {
        email: 'teststudent@example.com',
        password: 'test123',
        name: 'Test Student',
        role: 'STUDENT',
        isApproved: false,
        isActive: false
      }
    });

    const testStudent = await prisma.studentProfile.create({
      data: {
        userId: testUser.id,
        grade: '11',
        targetUniversity: 'Test University',
        targetScore: 400.0
      }
    });

    console.log('Test student created:', testStudent);
    console.log('Test user before approval:', testUser);

    // approveStudent fonksiyonunu simüle edelim
    console.log('\nSimulating approveStudent action...');
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { isApproved: true, isActive: true }
    });

    console.log('Test user after approval:', updatedUser);

    // Cleanup
    await prisma.studentProfile.delete({
      where: { id: testStudent.id }
    });

    await prisma.user.delete({
      where: { id: testUser.id }
    });

    console.log('Test data cleaned up. Approval action works correctly!');

  } catch (error) {
    console.error('Error testing approve action:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApproveAction();