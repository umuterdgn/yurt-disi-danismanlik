'use server'

import { prisma } from '@/lib/prisma'

export async function getTimeAnalysis(studentId: string) {
  // Get question results with time spent data
  const questionResults = await prisma.questionResult.findMany({
    where: {
      subjectResult: {
        exam: {
          studentProfileId: studentId
        }
      },
      timeSpent: {
        gt: 0 // Only include questions with time data
      }
    },
    include: {
      subjectResult: {
        include: {
          exam: true
        }
      }
    }
  })

  // Group by subject and calculate average time
  const subjectTimeStats = questionResults.reduce((acc, result) => {
    const subject = result.subjectResult.subjectName
    if (!acc[subject]) {
      acc[subject] = {
        totalTime: 0,
        count: 0,
        correctCount: 0,
        wrongCount: 0
      }
    }
    acc[subject].totalTime += result.timeSpent
    acc[subject].count += 1
    if (result.isCorrect) {
      acc[subject].correctCount += 1
    } else {
      acc[subject].wrongCount += 1
    }
    return acc
  }, {} as Record<string, { totalTime: number; count: number; correctCount: number; wrongCount: number }>)

  // Calculate averages and format
  const analysis = Object.entries(subjectTimeStats).map(([subject, stats]) => {
    const avgTimeSeconds = stats.count > 0 ? stats.totalTime / stats.count : 0
    const avgTimeMinutes = Math.floor(avgTimeSeconds / 60)
    const avgTimeSecondsRemainder = Math.round(avgTimeSeconds % 60)
    
    return {
      subject,
      avgTimeSeconds,
      avgTimeFormatted: `${avgTimeMinutes} dk ${avgTimeSecondsRemainder} sn`,
      totalQuestions: stats.count,
      correctRate: stats.count > 0 ? (stats.correctCount / stats.count) * 100 : 0,
      avgTimePerCorrect: stats.correctCount > 0 ? stats.totalTime / stats.correctCount : 0,
      avgTimePerWrong: stats.wrongCount > 0 ? stats.totalTime / stats.wrongCount : 0
    }
  })

  return analysis
}

export async function getEfficiencyAnalysis(studentId: string) {
  // Get study sessions from last 2 weeks
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const studySessions = await prisma.studySession.findMany({
    where: {
      studentProfileId: studentId,
      startTime: {
        gte: twoWeeksAgo
      },
      status: 'COMPLETED'
    }
  })

  // Group study hours by subject
  const subjectStudyHours = studySessions.reduce((acc, session) => {
    const subject = session.subject || 'Diğer'
    if (!acc[subject]) {
      acc[subject] = 0
    }
    acc[subject] += (session.actualDuration || 0) / 60 // Convert to hours
    return acc
  }, {} as Record<string, number>)

  // Get recent exam results (last 2 weeks)
  const recentExams = await prisma.exam.findMany({
    where: {
      studentProfileId: studentId,
      date: {
        gte: twoWeeksAgo
      }
    },
    include: {
      subjectResults: true
    },
    orderBy: { date: 'desc' }
  })

  // Group exam nets by subject
  const subjectExamNets = recentExams.reduce((acc, exam) => {
    exam.subjectResults.forEach(sr => {
      if (!acc[sr.subjectName]) {
        acc[sr.subjectName] = { net: 0, count: 0 }
      }
      acc[sr.subjectName].net += sr.net || 0
      acc[sr.subjectName].count += 1
    })
    return acc
  }, {} as Record<string, { net: number; count: number }>)

  // Calculate average nets
  const subjectAvgNets = Object.entries(subjectExamNets).reduce((acc, [subject, data]) => {
    acc[subject] = data.count > 0 ? data.net / data.count : 0
    return acc
  }, {} as Record<string, number>)

  // Generate efficiency analysis
  const efficiencyAnalysis = Object.keys(subjectStudyHours).map(subject => {
    const studyHours = subjectStudyHours[subject]
    const avgNet = subjectAvgNets[subject] || 0
    const previousExams = recentExams.filter(exam => 
      exam.subjectResults.some(sr => sr.subjectName === subject)
    )
    
    // Calculate net change if we have at least 2 exams
    let netChange = 0
    let netChangeDirection = 'stable'
    if (previousExams.length >= 2) {
      const oldestExam = previousExams[previousExams.length - 1]
      const newestExam = previousExams[0]
      
      const oldestNet = oldestExam.subjectResults.find(sr => sr.subjectName === subject)?.net || 0
      const newestNet = newestExam.subjectResults.find(sr => sr.subjectName === subject)?.net || 0
      
      netChange = newestNet - oldestNet
      netChangeDirection = netChange > 0.5 ? 'improving' : netChange < -0.5 ? 'declining' : 'stable'
    }

    // Generate insight message
    let insight = ''
    if (studyHours > 10 && netChangeDirection === 'declining') {
      insight = `${subject}'e ${studyHours.toFixed(1)} saat efor harcandı ancak netler artmadı. Strateji değişmeli.`
    } else if (studyHours > 10 && netChangeDirection === 'improving') {
      insight = `${subject}'e ${studyHours.toFixed(1)} saat efor harcandı ve netler artıyor. Strateji işe yarıyor.`
    } else if (studyHours < 5 && netChangeDirection === 'declining') {
      insight = `${subject}'e çok az çalışma (${studyHours.toFixed(1)} saat). Artırmak gerekiyor.`
    } else if (studyHours > 5 && netChangeDirection === 'stable') {
      insight = `${subject}'e ${studyHours.toFixed(1)} saat çalışıldı ama netler sabit. Çalışma yöntemi gözden geçirilmeli.`
    } else {
      insight = `${subject} için yeterli veri yok. Daha fazla çalışma ve deneme gerekli.`
    }

    return {
      subject,
      studyHours: studyHours.toFixed(1),
      avgNet: avgNet.toFixed(2),
      netChange: netChange.toFixed(2),
      netChangeDirection,
      insight,
      recentExamsCount: previousExams.length
    }
  })

  return {
    totalStudyHours: Object.values(subjectStudyHours).reduce((sum, hours) => sum + hours, 0).toFixed(1),
    totalSessions: studySessions.length,
    subjectAnalysis: efficiencyAnalysis,
    period: 'Son 2 hafta'
  }
}

export async function getStudySessionLogs(studentId: string) {
  const sessions = await prisma.studySession.findMany({
    where: {
      studentProfileId: studentId
    },
    include: {
      task: true
    },
    orderBy: { startTime: 'desc' },
    take: 50
  })

  return sessions.map(session => {
    const startTime = new Date(session.startTime)
    const endTime = session.endTime ? new Date(session.endTime) : null
    
    // Calculate duration if not provided
    const duration = session.actualDuration || (endTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 60000) : 0)
    
    // Format times
    const startTimeFormatted = startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    const endTimeFormatted = endTime ? endTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Devam ediyor'
    
    // Determine status display
    const statusDisplay = session.status === 'COMPLETED' ? 'Tamamlandı' : 
                         session.status === 'INTERRUPTED' ? 'Yarım kaldı' : 'Devam ediyor'
    
    // Warning conditions
    const hasWarning = session.pauseCount > 3 || session.status === 'INTERRUPTED'
    
    return {
      id: session.id,
      subject: session.subject || session.task?.subject || 'Belirsiz',
      taskTitle: session.task?.title || 'Genel çalışma',
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      pauseCount: session.pauseCount,
      duration: duration,
      status: session.status,
      statusDisplay,
      hasWarning,
      date: startTime.toLocaleDateString('tr-TR'),
      fullStartTime: startTime,
      fullEndTime: endTime
    }
  })
}