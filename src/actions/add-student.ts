'use server';

import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function addStudent(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const grade = formData.get('grade') as string;
    const targetUniversity = formData.get('targetUniversity') as string;
    const studentSymbol = formData.get('studentSymbol') as string;
    const serviceType = formData.get('serviceType') as string || 'BOTH';

    // Validation
    if (!name || !email || !password || !grade) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' };
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      console.error('Auth error:', userError);
      return { success: false, error: 'Oturum bulunamadı' };
    }

    // Sync current user to Prisma User table (upsert to avoid foreign key errors)
    // Use email as unique key to handle duplicate IDs from previous tests
    let dbUser = null;
    try {
      dbUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {}, // User exists, just return it
        create: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email,
          role: 'ADVISOR',
          password: ''
        }
      });
    } catch (error) {
      console.error('Prisma error upserting advisor user:', error);
      return { success: false, error: 'Kullanıcı senkronizasyon hatası' };
    }

    // Get or create advisor profile (upsert for safety)
    // Use dbUser.id to ensure correct foreign key relationship
    let advisor = null;
    try {
      advisor = await prisma.advisorProfile.upsert({
        where: { userId: dbUser.id },
        update: {},
        create: {
          userId: dbUser.id,
          specialization: 'GENERAL'
        }
      });
    } catch (error) {
      console.error('Prisma error upserting advisor profile:', error);
      return { success: false, error: 'Danışman profili oluşturma hatası' };
    }

    // Check if email already exists
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
      password,
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

    // Create user in Prisma (password hash is handled by Supabase, we store a placeholder)
    // Use upsert to handle edge cases where user might already exist
    let newUser = null;
    try {
      newUser = await prisma.user.upsert({
        where: { id: authData.user.id },
        update: { isApproved: true }, // Ensure approval is set even in update case
        create: {
          id: authData.user.id,
          email,
          password: '', // Password is managed by Supabase Auth
          name,
          role: 'STUDENT',
          isApproved: true // Auto-approve students added by advisors
        }
      });
    } catch (error) {
      console.error('Prisma error upserting student user:', error);
      return { success: false, error: 'Kullanıcı kaydı oluşturma hatası' };
    }

    // Create student profile
    let studentProfile = null;
    try {
      studentProfile = await prisma.studentProfile.create({
        data: {
          userId: newUser.id,
          advisorId: advisor.id,
          grade,
          targetUniversity: targetUniversity || null,
          targetScore: 0,
          currentScore: 0,
          school: '',
          studentSymbol: studentSymbol || '🎓',
          xp: 0,
          streak: 0,
          serviceType: serviceType as any
        }
      });
    } catch (error) {
      console.error('Prisma error creating student profile:', error);
      return { success: false, error: 'Öğrenci profili oluşturma hatası' };
    }

    // Revalidate the advisor dashboard to show the new student
    revalidatePath('/advisor/dashboard');
    revalidatePath('/advisor/students');

    return {
      success: true,
      student: {
        id: studentProfile.id,
        name: newUser.name,
        email: newUser.email,
        grade: studentProfile.grade,
        targetUniversity: studentProfile.targetUniversity
      }
    };

  } catch (error) {
    console.error('Add student error:', error);
    return { success: false, error: 'Öğrenci eklenirken bir hata oluştu' };
  }
}
