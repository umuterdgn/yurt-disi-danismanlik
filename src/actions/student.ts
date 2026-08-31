'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function getStudentData() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    return null
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      studentProfile: {
        include: {
          advisor: {
            include: { user: true }
          }
        }
      }
    }
  })

  return dbUser
}

export async function getDailyTasks() {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const tasks = await prisma.dailyTask.findMany({
    where: {
      studentProfileId: dbUser.studentProfile.id,
      taskDate: {
        gte: today,
        lt: tomorrow
      }
    },
    orderBy: { priority: 'desc' }
  })

  return tasks
}

export async function toggleTaskCompletion(taskId: string, isCompleted: boolean) {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return { success: false, error: 'Unauthorized' }
  }

  const task = await prisma.dailyTask.update({
    where: {
      id: taskId,
      studentProfileId: dbUser.studentProfile.id
    },
    data: { isCompleted }
  })

  revalidatePath('/student/dashboard')
  revalidatePath('/student/tasks')
  
  return { success: true, task }
}

export async function updateTaskProgress(taskId: string, completedQuantity: number) {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return { success: false, error: 'Unauthorized' }
  }

  const task = await prisma.dailyTask.update({
    where: {
      id: taskId,
      studentProfileId: dbUser.studentProfile.id
    },
    data: { completedQuantity }
  })

  revalidatePath('/student/dashboard')
  revalidatePath('/student/tasks')
  
  return { success: true, task }
}

export async function getExamResults() {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return []
  }

  const exams = await prisma.examResult.findMany({
    where: { studentProfileId: dbUser.studentProfile.id },
    orderBy: { examDate: 'asc' }
  })

  return exams
}

export async function getSubjectAnalysis() {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return []
  }

  const analysis = await prisma.subjectAnalysis.findMany({
    where: { studentProfileId: dbUser.studentProfile.id }
  })

  return analysis
}
