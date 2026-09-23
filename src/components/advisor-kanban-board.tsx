"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
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
import { Lightbulb, Sparkles } from "lucide-react";

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
  students: { id: string; name: string }[];
  onTaskMove: (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => Promise<{ success: boolean; error?: string; task?: any }>;
  aiRecommendations?: AIRecommendation[];
}

export function AdvisorKanbanBoard({ tasks, students, onTaskMove, aiRecommendations = [] }: AdvisorKanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);

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

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId as 'TODO' | 'IN_PROGRESS' | 'DONE';
    
    // If moving to DONE, show performance modal
    if (newStatus === 'DONE') {
      const task = localTasks.find(t => t.id === draggableId);
      if (task) {
        setTaskToComplete(task);
        setCompletionModalOpen(true);
        return; // Don't update yet, wait for modal confirmation
      }
    }
    
    // Update local state immediately for better UX
    const updatedTasks = localTasks.map(task => 
      task.id === draggableId ? { ...task, status: newStatus } : task
    );
    setLocalTasks(updatedTasks);

    // Call the server action to update the database
    await onTaskMove(draggableId, newStatus);
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

  const getTasksByStatus = (status: string) => {
    let filteredTasks = localTasks;
    
    // Filter by student
    if (selectedStudent !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.studentProfile?.id === selectedStudent);
    }
    
    // Filter by course/subject
    if (selectedCourse !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.subject === selectedCourse);
    }
    
    // Filter by date
    if (selectedDate) {
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.taskDate).toISOString().split('T')[0];
        return taskDate === selectedDate;
      });
    }
    
    return filteredTasks.filter(task => task.status === status);
  };

  const allCourses = [...new Set(localTasks.map(task => task.subject).filter((subject): subject is string => Boolean(subject)))];

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  };

  const todoTasks = getTasksByStatus('TODO');
  const inProgressTasks = getTasksByStatus('IN_PROGRESS');
  const doneTasks = getTasksByStatus('DONE');

  const unresolvedRecommendations = aiRecommendations.filter(rec => !rec.isResolved && rec.type === 'ACADEMIC');

  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
            <CardTitle className="text-xl font-semibold text-gray-900">Görev Panosu</CardTitle>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
              <div className="w-full md:w-48">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Öğrenci Seç" />
                  </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Öğrenciler</SelectItem>
                  {students.map((student) => (
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
              <div className="w-full md:w-40">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  placeholder="Tarih"
                />
              </div>
            </div>
          </div>
          <AddTaskDialog students={students} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* TODO Column */}
            <Droppable droppableId="TODO">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <h3 className="font-semibold mb-4 text-gray-700">Yapılacak</h3>
                  <div className="space-y-3">
                    {todoTasks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Görev yok</p>
                    ) : (
                      todoTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow cursor-move w-full"
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-medium text-sm">{task.title}</p>
                                <Badge className={getPriorityColor(task.priority)}>
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                              </div>
                              {task.subject && (
                                <Badge className="mt-2 text-xs bg-blue-100 text-blue-700">
                                  {task.subject}
                                </Badge>
                              )}
                              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                                <span className="font-medium">{task.studentProfile?.user?.name || '-'}</span>
                                {task.estimatedPomodoros > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span>🍅</span>
                                    <span>{task.estimatedPomodoros} Pomodoro</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* IN_PROGRESS Column */}
            <Droppable droppableId="IN_PROGRESS">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-blue-50 rounded-lg p-4"
                >
                  <h3 className="font-semibold mb-4 text-blue-700">Devam Ediyor</h3>
                  <div className="space-y-3">
                    {inProgressTasks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Görev yok</p>
                    ) : (
                      inProgressTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow cursor-move w-full"
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-medium text-sm">{task.title}</p>
                                <Badge className={getPriorityColor(task.priority)}>
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                              </div>
                              {task.subject && (
                                <Badge className="mt-2 text-xs bg-blue-100 text-blue-700">
                                  {task.subject}
                                </Badge>
                              )}
                              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                                <span className="font-medium">{task.studentProfile?.user?.name || '-'}</span>
                                {task.estimatedPomodoros > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span>🍅</span>
                                    <span>{task.estimatedPomodoros} Pomodoro</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* DONE Column */}
            <Droppable droppableId="DONE">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-green-50 rounded-lg p-4"
                >
                  <h3 className="font-semibold mb-4 text-green-700">Bitti</h3>
                  <div className="space-y-3">
                    {doneTasks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Görev yok</p>
                    ) : (
                      doneTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-4 rounded border shadow-sm opacity-75 hover:shadow-md transition-shadow cursor-move"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-medium text-sm line-through">{task.title}</p>
                                <Badge className="bg-green-100 text-green-700">✓</Badge>
                              </div>
                              {task.subject && (
                                <Badge className="mt-2 text-xs bg-blue-100 text-blue-700">
                                  {task.subject}
                                </Badge>
                              )}
                              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                                <span className="font-medium">{task.studentProfile?.user?.name || '-'}</span>
                                {task.estimatedPomodoros > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span>🍅</span>
                                    <span>{task.estimatedPomodoros} Pomodoro</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
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
    </DragDropContext>
  );
}