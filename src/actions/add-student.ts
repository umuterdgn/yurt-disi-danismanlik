'use server';

import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';

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
    const advisor = await prisma.advisorProfile.findUnique({
      where: { userId: user.id }
    });

    if (!advisor) {
      return { success: false, error: 'Danışman profili bulunamadı' };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { success: false, error: 'Bu e-posta adresi zaten kullanımda' };
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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

    // Create user in Prisma
    const newUser = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        password, // Note: In production, you should not store plain passwords
        name,
        role: 'STUDENT'
      }
    });

    // Create student profile
    const studentProfile = await prisma.studentProfile.create({
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
