'use server';

import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function addStudent(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const grade = formData.get('grade') as string;
    const targetUniversity = formData.get('targetUniversity') as string;

    // Validation
    if (!name || !email || !password || !grade) {
      return { success: false, error: 'Tüm zorunlu alanları doldurunuz' };
    }

    // Get current advisor from session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return { success: false, error: 'Oturum bulunamadı' };
    }

    // Get advisor profile
    let advisor = null;
    try {
      advisor = await prisma.advisorProfile.findUnique({
        where: { userId: user.id }
      });
    } catch (error) {
      console.error('Prisma error finding advisor:', error);
      return { success: false, error: 'Danışman profili bulunamadı' };
    }

    if (!advisor) {
      return { success: false, error: 'Danışman profili bulunamadı' };
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
    let newUser = null;
    try {
      newUser = await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          password: '', // Password is managed by Supabase Auth
          name,
          role: 'STUDENT'
        }
      });
    } catch (error) {
      console.error('Prisma error creating user:', error);
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
          school: ''
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
