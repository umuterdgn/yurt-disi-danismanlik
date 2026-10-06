'use server';

import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

// Helper function to generate random password
function generatePassword(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
  return `Nexa${randomDigits}`;
}

export async function addStudent(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    let password = formData.get('password') as string;
    const grade = formData.get('grade') as string;
    const domain = formData.get('domain') as string;
    const targetUniversitiesJson = formData.get('targetUniversities') as string;
    const targetScore = formData.get('targetScore') as string;
    const studentSymbol = formData.get('studentSymbol') as string;
    const serviceType = formData.get('serviceType') as string || 'BOTH';

    // Validation (password is now optional)
    if (!name || !email || !grade || !domain) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' };
    }

    // Generate password if not provided
    const generatedPassword = password || generatePassword();
    const plainPassword = generatedPassword; // Keep plain password for response

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Parse target universities array
    let targetUniversities: string[] = [];
    if (targetUniversitiesJson) {
      try {
        targetUniversities = JSON.parse(targetUniversitiesJson);
      } catch (error) {
        console.error('Error parsing target universities:', error);
      }
    }

    // Get current advisor from session using Supabase Server Client with cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    console.log('Attempting to get Supabase session...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Supabase user:', user);
    console.log('Supabase user error:', userError);

    if (userError) {
      console.error('Supabase Auth error:', userError);
      return { success: false, error: `Oturum hatası: ${userError.message}` };
    }

    if (!user) {
      console.error('No user found in Supabase session');
      return { success: false, error: 'Oturum bulunamadı - Kullanıcı girişi yapılmamış' };
    }

    if (!user.email) {
      console.error('User found but no email in session');
      return { success: false, error: 'Oturum hatası - E-posta bilgisi eksik' };
    }

    console.log('Session user found:', user.email, 'ID:', user.id);

    // Sync current user to Prisma User table (upsert to avoid foreign key errors)
    // Use email as unique key to handle duplicate IDs from previous tests
    let dbUser = null;
    try {
      console.log('Upserting Prisma user for:', user.email);
      dbUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {}, // User exists, just return it
        create: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email,
          role: (user.user_metadata?.role as any) || 'ADVISOR',
          password: ''
        }
      });
      console.log('Prisma user upserted:', dbUser.id, 'Role:', dbUser.role);
    } catch (error) {
      console.error('Prisma error upserting advisor user:', error);
      return { success: false, error: 'Kullanıcı senkronizasyon hatası: ' + (error instanceof Error ? error.message : String(error)) };
    }

    // Check if user has proper role
    if (dbUser.role !== 'ADVISOR' && dbUser.role !== 'SUPER_ADMIN') {
      console.error('User does not have ADVISOR or SUPER_ADMIN role:', dbUser.role);
      return { success: false, error: `Yetki hatası: Bu işlem için ADVISOR veya SUPER_ADMIN rolü gereklidir. Mevcut rol: ${dbUser.role}` };
    }

    // Get or create advisor profile (upsert for safety)
    // Use dbUser.id to ensure correct foreign key relationship
    let advisor = null;
    try {
      console.log('Upserting advisor profile for user:', dbUser.id);
      advisor = await prisma.advisorProfile.upsert({
        where: { userId: dbUser.id },
        update: {},
        create: {
          userId: dbUser.id,
          specialization: 'GENERAL'
        }
      });
      console.log('Advisor profile upserted:', advisor.id);
    } catch (error) {
      console.error('Prisma error upserting advisor profile:', error);
      return { success: false, error: 'Danışman profili oluşturma hatası: ' + (error instanceof Error ? error.message : String(error)) };
    }

    // Check student quota (only for ADVISOR role, not SUPER_ADMIN)
    if (dbUser.role === 'ADVISOR') {
      const currentStudentCount = await prisma.studentProfile.count({
        where: { advisorId: advisor.id }
      });

      if (currentStudentCount >= (dbUser.studentQuota || 30)) {
        return { success: false, error: 'Öğrenci Kotanız Dolmuştur. Lütfen limitinizi artırmak için Nexa Edu ile iletişime geçin.' };
      }
    }

    // Check if email already exists in Prisma
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email }
      });
    } catch (error) {
      console.error('Prisma error checking existing user:', error);
    }

    if (existingUser) {
      return { success: false, error: 'Bu e-posta adresi zaten kullanımda' };
    }

    // Create user in Supabase Auth using service role for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: plainPassword, // Use plain password for Supabase Auth
      email_confirm: true,
      user_metadata: {
        name,
        role: 'STUDENT'
      }
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return { success: false, error: 'Kullanıcı oluşturma hatası: ' + authError.message };
    }

    console.log('Supabase user created with ID:', authData.user.id);

    // Create user in Prisma with hashed password AND student profile in one transaction
    // Using nested create to ensure both records are created together
    let newUser = null;
    try {
      newUser = await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          password: hashedPassword, // Store hashed password in Prisma
          name,
          role: 'STUDENT',
          isApproved: true, // Auto-approve students added by advisors
          studentProfile: {
            create: {
              advisorId: advisor.id,
              grade,
              domain: domain as any,
              targetUniversities: targetUniversities,
              targetScore: targetScore ? parseFloat(targetScore) : 0,
              currentScore: 0,
              school: '',
              studentSymbol: studentSymbol || '🎓',
              xp: 0,
              streak: 0,
              serviceType: serviceType as any
            }
          }
        },
        include: {
          studentProfile: true
        }
      });
      console.log('Prisma user and student profile created successfully');
      console.log('StudentProfile ID:', newUser.studentProfile?.id);
    } catch (error) {
      console.error('Prisma error creating user with student profile:', error);
      // Rollback: Delete Supabase user if Prisma creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('Rolled back: Deleted Supabase user due to Prisma error');
      } catch (rollbackError) {
        console.error('Failed to rollback Supabase user:', rollbackError);
      }
      return { success: false, error: 'Kullanıcı kaydı oluşturma hatası: ' + (error instanceof Error ? error.message : String(error)) };
    }

    // Revalidate the advisor dashboard to show the new student
    revalidatePath('/advisor/dashboard');
    revalidatePath('/advisor/students');

    return {
      success: true,
      student: {
        id: newUser.studentProfile!.id,
        name: newUser.name,
        email: newUser.email,
        grade: newUser.studentProfile!.grade,
        domain: newUser.studentProfile!.domain,
        targetUniversities: newUser.studentProfile!.targetUniversities
      },
      generatedPassword: plainPassword // Return the plain password for display
    };

  } catch (error) {
    console.error('Add student error:', error);
    return { success: false, error: 'Öğrenci eklenirken bir hata oluştu' };
  }
}
