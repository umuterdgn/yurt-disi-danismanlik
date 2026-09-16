import { prisma } from '../src/lib/prisma';

async function checkUserSchema() {
  try {
    // Tüm user'ları al ve field'ları kontrol et
    const users = await prisma.user.findMany({
      take: 1
    });

    if (users.length > 0) {
      console.log('User model fields:', Object.keys(users[0]));
      console.log('Sample user:', users[0]);
    } else {
      console.log('No users found in database');
    }

    // Örnek bir user oluşturarak test edelim
    console.log('\nCreating test user to check schema...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'test123',
        name: 'Test User',
        role: 'STUDENT',
        isApproved: false,
        isActive: true
      }
    });

    console.log('Test user created successfully:', testUser);

    // Cleanup
    await prisma.user.delete({
      where: { id: testUser.id }
    });

    console.log('Test user deleted. Schema is valid!');

  } catch (error) {
    console.error('Error checking user schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSchema();