"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Clock, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyTask {
  id: string
  title: string
  taskDate: Date
  isCompleted: boolean
  priority: string
}

interface ExamResult {
  id: string
  examName: string
  examDate: Date
  examType: string
}

interface StudentCalendarProps {
  dailyTasks: DailyTask[]
  examResults: ExamResult[]
  examDate?: Date
  targetExam?: string
}

export function StudentCalendar({
  dailyTasks,
  examResults,
  examDate,
  targetExam
}: StudentCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())

  // Create a map of dates to tasks
  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, DailyTask[]>()
    dailyTasks.forEach(task => {
      const dateKey = new Date(task.taskDate).toDateString()
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(task)
    })
    return map
  }, [dailyTasks])

  // Create a map of dates to exams
  const examsByDate = React.useMemo(() => {
    const map = new Map<string, ExamResult[]>()
    examResults.forEach(exam => {
      const dateKey = new Date(exam.examDate).toDateString()
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(exam)
    })
    return map
  }, [examResults])

  // Get tasks for selected date
  const selectedDateTasks = selectedDate ? tasksByDate.get(selectedDate.toDateString()) || [] : []
  const selectedDateExams = selectedDate ? examsByDate.get(selectedDate.toDateString()) || [] : []

  // Custom modifiers for calendar
  const modifiers = {
    hasTasks: (date: Date) => tasksByDate.has(date.toDateString()),
    hasExams: (date: Date) => examsByDate.has(date.toDateString()),
    isExamDate: examDate ? (date: Date) => date.toDateString() === new Date(examDate).toDateString() : () => false
  }

  const modifiersStyles = {
    hasTasks: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
    hasExams: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    isExamDate: { backgroundColor: 'rgba(234, 179, 8, 0.2)', border: '2px solid #eab308' }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Akademik Takvim
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
            />
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500" />
                <span className="text-muted-foreground">Görevler</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500/10 border border-red-500" />
                <span className="text-muted-foreground">Denemeler</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500/20 border-2 border-yellow-500" />
                <span className="text-muted-foreground">Hedef Sınav</span>
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          <div className="space-y-4">
            {selectedDate && (
              <>
                <div>
                  <h3 className="font-semibold mb-3">
                    {selectedDate.toLocaleDateString('tr-TR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  
                  {/* Check if this is the target exam date */}
                  {examDate && selectedDate.toDateString() === new Date(examDate).toDateString() && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Target className="w-4 h-4" />
                        <span className="font-semibold">Hedef Sınav Tarihi</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">{targetExam}</p>
                    </div>
                  )}

                  {/* Tasks */}
                  {selectedDateTasks.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Günlük Görevler ({selectedDateTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedDateTasks.map(task => (
                          <div
                            key={task.id}
                            className={cn(
                              "p-2 rounded-lg border text-sm",
                              task.isCompleted
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className={cn(
                                "font-medium",
                                task.isCompleted ? "line-through text-gray-500" : ""
                              )}>
                                {task.title}
                              </span>
                              <Badge
                                variant={task.isCompleted ? "default" : "outline"}
                                className={cn(
                                  "text-xs",
                                  task.priority === "high" && "bg-red-100 text-red-700",
                                  task.priority === "medium" && "bg-yellow-100 text-yellow-700",
                                  task.priority === "low" && "bg-green-100 text-green-700"
                                )}
                              >
                                {task.priority === "high" ? "Yüksek" : 
                                 task.priority === "medium" ? "Orta" : "Düşük"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exams */}
                  {selectedDateExams.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Deneme Sınavları ({selectedDateExams.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedDateExams.map(exam => (
                          <div
                            key={exam.id}
                            className="p-2 rounded-lg bg-red-50 border border-red-200 text-sm"
                          >
                            <div className="font-medium">{exam.examName}</div>
                            <div className="text-xs text-muted-foreground">{exam.examType}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No events */}
                  {selectedDateTasks.length === 0 && selectedDateExams.length === 0 && !(
                    examDate && selectedDate.toDateString() === new Date(examDate).toDateString()
                  ) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Bu tarihte planlanmış etkinlik yok</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}