"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { TaskCompletionModal } from "@/components/task-completion-modal";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeTaskWithPerformance } from "@/actions/add-task";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  topic?: string;
  priority: string;
  estimatedPomodoros: number;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  taskDate: Date;
  studentProfile: {
    id: string;
    user: {
      name: string;
    };
  };
}

interface AIRecommendation {
  id: string;
  type: string;
  message: string;
  suggestedAction: string;
  priority: string;
  isResolved: boolean;
}

interface AdvisorKanbanBoardProps {
  tasks: Task[];
  students: { id: string; name: string; grade: string }[];
  onTaskMove: (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => Promise<{ success: boolean; error?: string; task?: any }>;
  aiRecommendations?: AIRecommendation[];
  allStudents?: { id: string; name: string; grade: string }[];
}

export function AdvisorKanbanBoard({ tasks, students, onTaskMove, aiRecommendations = [] }: AdvisorKanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi'den başla
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-red-100 text-red-700',
      'medium': 'bg-yellow-100 text-yellow-700',
      'low': 'bg-green-100 text-green-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'high': 'Yüksek',
      'medium': 'Orta',
      'low': 'Düşük'
    };
    return labels[priority] || priority;
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    const daysToAdd = direction === 'next' ? 7 : -7;
    newDate.setDate(newDate.getDate() + daysToAdd);
    setCurrentWeekStart(newDate);
  };

  const getWeekDays = () => {
    const days = [];
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push({
        name: dayNames[i],
        date: date,
        dateString: date.toISOString().split('T')[0]
      });
    }
    
    return days;
  };

  const getTasksForDay = (dateString: string) => {
    let filteredTasks = localTasks;

    // Filter by grade first
    if (selectedGrade !== 'all') {
      filteredTasks = filteredTasks.filter(task => {
        const student = students.find(s => s.id === task.studentProfile?.id);
        return student?.grade === selectedGrade;
      });
    }

    // Filter by student
    if (selectedStudent !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.studentProfile?.id === selectedStudent);
    }

    // Filter by course/subject
    if (selectedCourse !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.subject === selectedCourse);
    }

    // Filter by task date (only tasks for this specific day)
    return filteredTasks.filter(task => {
      const taskDate = new Date(task.taskDate).toISOString().split('T')[0];
      return taskDate === dateString;
    });
  };

  const getUnscheduledTasks = () => {
    let filteredTasks = localTasks;

    // Filter by grade first
    if (selectedGrade !== 'all') {
      filteredTasks = filteredTasks.filter(task => {
        const student = students.find(s => s.id === task.studentProfile?.id);
        return student?.grade === selectedGrade;
      });
    }

    // Filter by student
    if (selectedStudent !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.studentProfile?.id === selectedStudent);
    }

    // Filter by course/subject
    if (selectedCourse !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.subject === selectedCourse);
    }

    // Return tasks without a valid date
    return filteredTasks.filter(task => !task.taskDate || task.taskDate === null);
  };

  const handleTaskCompletion = async (correct: number, wrong: number, empty: number) => {
    if (!taskToComplete) return;

    setIsCompleting(true);
    
    try {
      // Call the new server action with performance data
      const result = await completeTaskWithPerformance(taskToComplete.id, correct, wrong, empty);
      
      if (result.success) {
        // Update local state
        const updatedTasks = localTasks.map(task => 
          task.id === taskToComplete.id ? { ...task, status: 'DONE' as const } : task
        );
        setLocalTasks(updatedTasks);
        
        // Also call the original onTaskMove for consistency
        await onTaskMove(taskToComplete.id, 'DONE');
      }
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setIsCompleting(false);
      setCompletionModalOpen(false);
      setTaskToComplete(null);
    }
  };

  const allCourses = [...new Set(localTasks.map(task => task.subject).filter((subject): subject is string => Boolean(subject)))];

  // Filter students based on selected grade
  const filteredStudents = selectedGrade === 'all'
    ? students
    : students.filter(student => student.grade === selectedGrade);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  };

  const weekDays = getWeekDays();
  const unscheduledTasks = getUnscheduledTasks();
  const unresolvedRecommendations = aiRecommendations.filter(rec => !rec.isResolved && rec.type === 'ACADEMIC');

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Matematik': 'bg-blue-100 text-blue-700 border-blue-200',
      'Türkçe': 'bg-green-100 text-green-700 border-green-200',
      'Fizik': 'bg-purple-100 text-purple-700 border-purple-200',
      'Kimya': 'bg-orange-100 text-orange-700 border-orange-200',
      'Biyoloji': 'bg-pink-100 text-pink-700 border-pink-200',
      'Tarih': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Coğrafya': 'bg-teal-100 text-teal-700 border-teal-200',
      'Felsefe': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Edebiyat': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return colors[subject] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <>
      {/* AI Recommendations for Weak Question Types */}
      {unresolvedRecommendations.length > 0 && showRecommendations && (
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Sparkles className="w-5 h-5" />
              AI Önerileri - Soru Tipi Analizi
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowRecommendations(false)}
            >
              Gizle
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unresolvedRecommendations.slice(0, 5).map((recommendation) => (
                <div key={recommendation.id} className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={
                          recommendation.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          recommendation.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }>
                          {recommendation.priority === 'HIGH' ? 'Yüksek Öncelik' :
                           recommendation.priority === 'MEDIUM' ? 'Orta Öncelik' :
                           'Düşük Öncelik'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">{recommendation.message}</p>
                      <p className="text-sm text-gray-600">{recommendation.suggestedAction}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
            <CardTitle className="text-xl font-semibold text-gray-900">Haftalık Çalışma Programı</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekChange('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-600 min-w-[200px] text-center">
                {weekDays[0].date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - 
                {weekDays[6].date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekChange('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
            <div className="w-full md:w-48">
              <Select value={selectedGrade} onValueChange={(value) => { setSelectedGrade(value); setSelectedStudent('all'); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sınıf Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Sınıflar</SelectItem>
                  <SelectItem value="9">9. Sınıf</SelectItem>
                  <SelectItem value="10">10. Sınıf</SelectItem>
                  <SelectItem value="11">11. Sınıf</SelectItem>
                  <SelectItem value="12">12. Sınıf</SelectItem>
                  <SelectItem value="Mezun">Mezun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Öğrenci Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Öğrenciler</SelectItem>
                  {filteredStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Ders Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Dersler</SelectItem>
                  {allCourses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AddTaskDialog students={students} />
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekly Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 overflow-x-auto">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDay(day.dateString);
              const isToday = new Date().toISOString().split('T')[0] === day.dateString;
              
              return (
                <div
                  key={day.dateString}
                  className={`min-w-[200px] ${isToday ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 border'} rounded-lg p-3`}
                >
                  <div className="flex flex-col items-center mb-3">
                    <h3 className={`font-semibold text-sm ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                      {day.name}
                    </h3>
                    <span className={`text-xs ${isToday ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      {day.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {dayTasks.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">Görev yok</p>
                    ) : (
                      dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`bg-white p-3 rounded border shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full ${task.status === 'DONE' ? 'opacity-60' : ''}`}
                          onClick={() => handleTaskClick(task)}
                        >
                          {/* Subject Badge - Most Prominent */}
                          {task.subject && (
                            <Badge className={`mb-2 text-xs font-medium border ${getSubjectColor(task.subject)}`}>
                              {task.subject}
                            </Badge>
                          )}
                          
                          {/* Task Title */}
                          <p className={`text-xs font-medium mb-1 ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </p>
                          
                          {/* Topic */}
                          {task.topic && (
                            <p className="text-xs text-gray-500 mb-2 truncate">
                              {task.topic}
                            </p>
                          )}
                          
                          {/* Footer Info */}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="truncate max-w-[80px]">
                              {task.studentProfile?.user?.name?.split(' ')[0] || '-'}
                            </span>
                            <div className="flex items-center gap-1">
                              {task.estimatedPomodoros > 0 && (
                                <span className="flex items-center gap-1">
                                  <span>🍅</span>
                                  <span>{task.estimatedPomodoros}</span>
                                </span>
                              )}
                              {task.status === 'DONE' && (
                                <span className="text-green-500">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unscheduled Tasks */}
          {unscheduledTasks.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Planlanmamış Görevler</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-3 rounded border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      {task.subject && (
                        <Badge className={`mb-2 text-xs font-medium border ${getSubjectColor(task.subject)}`}>
                          {task.subject}
                        </Badge>
                      )}
                      
                      <p className="text-xs font-medium mb-1 text-gray-900">
                        {task.title}
                      </p>
                      
                      {task.topic && (
                        <p className="text-xs text-gray-500 mb-2 truncate">
                          {task.topic}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="truncate max-w-[80px]">
                          {task.studentProfile?.user?.name?.split(' ')[0] || '-'}
                        </span>
                        {task.estimatedPomodoros > 0 && (
                          <span className="flex items-center gap-1">
                            <span>🍅</span>
                            <span>{task.estimatedPomodoros}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <TaskCompletionModal
        isOpen={completionModalOpen}
        onClose={() => {
          setCompletionModalOpen(false);
          setTaskToComplete(null);
        }}
        onConfirm={handleTaskCompletion}
        taskTitle={taskToComplete?.title || ''}
        isLoading={isCompleting}
      />
      
      <TaskDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
      />
    </>
  );
}