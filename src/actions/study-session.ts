'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function getStudentData() {
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
      studentProfile: true
    }
  })

  return dbUser
}

export async function getStudentPomodoroDuration() {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return 25 // Default value
  }

  return dbUser.studentProfile.pomodoroDuration || 25
}

export async function startStudySession(taskId: string, subject: string) {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return { success: false, error: 'Unauthorized' }
  }

  const session = await prisma.studySession.create({
    data: {
      studentProfileId: dbUser.studentProfile.id,
      taskId,
      subject,
      startTime: new Date(),
      status: 'IN_PROGRESS',
      pauseCount: 0
    }
  })

  revalidatePath('/student/dashboard')
  revalidatePath('/student/tasks')
  
  return { success: true, session }
}

export async function updateStudySession(sessionId: string, pauseCount: number) {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return { success: false, error: 'Unauthorized' }
  }

  const session = await prisma.studySession.update({
    where: {
      id: sessionId,
      studentProfileId: dbUser.studentProfile.id
    },
    data: {
      pauseCount
    }
  })

  revalidatePath('/student/dashboard')
  
  return { success: true, session }
}

export async function completeStudySession(
  sessionId: string, 
  actualDuration: number,
  completeTask: boolean = false
) {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return { success: false, error: 'Unauthorized' }
  }

  const session = await prisma.studySession.update({
    where: {
      id: sessionId,
      studentProfileId: dbUser.studentProfile.id
    },
    data: {
      endTime: new Date(),
      actualDuration,
      status: 'COMPLETED'
    },
    include: {
      task: true
    }
  })

  // If task should be completed, mark it as done
  if (completeTask && session.task) {
    await prisma.dailyTask.update({
      where: { id: session.task.id },
      data: { isCompleted: true }
    })

    // Award XP and check for badges
    const xpGained = Math.floor(actualDuration / 5) * 10 // 10 XP per 5 minutes
    await prisma.studentProfile.update({
      where: { id: dbUser.studentProfile.id },
      data: {
        xp: { increment: xpGained },
        healthScore: { increment: 2 } // Improve health score
      }
    })

    const { checkAndAwardBadges } = await import('./admin')
    await checkAndAwardBadges(dbUser.studentProfile.id)
  }

  revalidatePath('/student/dashboard')
  revalidatePath('/student/tasks')
  revalidatePath('/advisor/dashboard')
  
  return { success: true, session, xpGained: completeTask ? Math.floor(actualDuration / 5) * 10 : 0 }
}

export async function interruptStudySession(sessionId: string, actualDuration: number) {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return { success: false, error: 'Unauthorized' }
  }

  const session = await prisma.studySession.update({
    where: {
      id: sessionId,
      studentProfileId: dbUser.studentProfile.id
    },
    data: {
      endTime: new Date(),
      actualDuration,
      status: 'INTERRUPTED'
    }
  })

  revalidatePath('/student/dashboard')
  revalidatePath('/advisor/dashboard')
  
  return { success: true, session }
}

export async function getStudySessions(studentId?: string) {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return []
  }

  const targetStudentId = studentId || dbUser.studentProfile.id

  const sessions = await prisma.studySession.findMany({
    where: {
      studentProfileId: targetStudentId
    },
    include: {
      task: true
    },
    orderBy: { startTime: 'desc' },
    take: 50
  })

  return sessions
}

export async function getStudySessionsForAdvisor(studentId: string) {
  const sessions = await prisma.studySession.findMany({
    where: {
      studentProfileId: studentId
    },
    include: {
      task: true,
      studentProfile: {
        include: {
          user: true
        }
      }
    },
    orderBy: { startTime: 'desc' },
    take: 100
  })

  return sessions
}

export async function getStudySessionStats(studentId: string, days: number = 14) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const sessions = await prisma.studySession.findMany({
    where: {
      studentProfileId: studentId,
      startTime: {
        gte: startDate
      },
      status: 'COMPLETED'
    }
  })

  const totalDuration = sessions.reduce((sum, session) => sum + (session.actualDuration || 0), 0)
  const totalSessions = sessions.length
  const avgSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0
  const totalPauses = sessions.reduce((sum, session) => sum + session.pauseCount, 0)

  // Group by subject
  const subjectStats = sessions.reduce((acc, session) => {
    const subject = session.subject || 'Diğer'
    if (!acc[subject]) {
      acc[subject] = { duration: 0, sessions: 0 }
    }
    acc[subject].duration += session.actualDuration || 0
    acc[subject].sessions += 1
    return acc
  }, {} as Record<string, { duration: number; sessions: number }>)

  return {
    totalDuration,
    totalSessions,
    avgSessionDuration,
    totalPauses,
    subjectStats
  }
}

export async function updatePomodoroDuration(duration: number) {
  const dbUser = await getStudentData()
  
  if (!dbUser?.studentProfile) {
    return { success: false, error: 'Unauthorized' }
  }

  const updatedProfile = await prisma.studentProfile.update({
    where: { id: dbUser.studentProfile.id },
    data: { pomodoroDuration: duration }
  })

  revalidatePath('/student/dashboard')
  
  return { success: true, pomodoroDuration: updatedProfile.pomodoroDuration }
}