'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function approveStudent(studentId: string) {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!student) {
      return { success: false, error: 'Öğrenci bulunamadı' };
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: { isApproved: true, isActive: true }
    });

    revalidatePath('/admin/students/[id]');
    return { success: true, message: 'Öğrenci hesabı onaylandı' };
  } catch (error) {
    console.error('Error approving student:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

export async function rejectStudent(studentId: string) {
  try {
    await prisma.studentProfile.delete({
      where: { id: studentId }
    });

    revalidatePath('/admin/students/[id]');
    revalidatePath('/admin/students');
    return { success: true, message: 'Öğrenci başvurusu reddedildi' };
  } catch (error) {
    console.error('Error rejecting student:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

export async function freezeStudent(studentId: string) {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!student) {
      return { success: false, error: 'Öğrenci bulunamadı' };
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: false }
    });

    revalidatePath('/admin/students/[id]');
    return { success: true, message: 'Öğrenci hesabı donduruldu' };
  } catch (error) {
    console.error('Error freezing student:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}

export async function activateStudent(studentId: string) {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!student) {
      return { success: false, error: 'Öğrenci bulunamadı' };
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: true }
    });

    revalidatePath('/admin/students/[id]');
    return { success: true, message: 'Öğrenci hesabı aktifleştirildi' };
  } catch (error) {
    console.error('Error activating student:', error);
    return { success: false, error: 'Bir hata oluştu' };
  }
}