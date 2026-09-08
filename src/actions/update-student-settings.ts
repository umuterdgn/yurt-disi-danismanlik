'use server';

import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function updateStudentSettings(formData: FormData) {
  try {
    const studentSymbol = formData.get('studentSymbol') as string;
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Get current user from session
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

    // Get student profile from Prisma
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: { studentProfile: true }
    });

    if (!dbUser?.studentProfile) {
      return { success: false, error: 'Öğrenci profili bulunamadı' };
    }

    // Handle password update if provided
    if (newPassword) {
      if (!currentPassword) {
        return { success: false, error: 'Mevcut şifre gereklidir' };
      }

      if (newPassword !== confirmPassword) {
        return { success: false, error: 'Yeni şifreler eşleşmiyor' };
      }

      // Update password in Supabase
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (passwordError) {
        return { success: false, error: 'Şifre güncelleme hatası: ' + passwordError.message };
      }
    }

    // Update student symbol
    if (studentSymbol) {
      await prisma.studentProfile.update({
        where: { id: dbUser.studentProfile.id },
        data: { studentSymbol }
      });
    }

    revalidatePath('/student/settings');

    return { success: true };

  } catch (error) {
    console.error('Update student settings error:', error);
    return { success: false, error: 'Ayarlar güncellenirken bir hata oluştu' };
  }
}
