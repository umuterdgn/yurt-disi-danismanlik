"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Circle, Plus, Calendar, Clock, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { toast } from "sonner";

interface DailyTask {
  id: string;
  title: string;
  description: string;
  subject: string;
  taskType: string;
  targetQuantity: number;
  completedQuantity: number;
  isCompleted: boolean;
  taskDate: Date;
  priority: string;
}

export default function StudentTasksPage() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Öğrenci');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
    loadUserName();
  }, []);

  const loadUserName = async () => {
    try {
      // Get user from localStorage (custom auth system)
      const authUserStr = localStorage.getItem('auth_user');
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        if (authUser.name) {
          setUserName(authUser.name);
        }
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/student/tasks');
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date as "6 Ekim 2026, Salı"
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('tr-TR', options);
  };

  // Get today's date for display
  const today = new Date();

  const toggleTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    // If marking as completed, show feedback dialog first
    if (isCompleted && !tasks.find(t => t.id === taskId)?.isCompleted) {
      setPendingTaskId(taskId);
      setFeedbackDialogOpen(true);
      return;
    }

    try {
      const response = await fetch('/api/student/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, isCompleted })
      });

      if (response.ok) {
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, isCompleted } : task
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const submitTaskFeedback = async (feedback: 'EASY' | 'HARD' | 'MODERATE') => {
    if (!pendingTaskId) return;

    try {
      const response = await fetch('/api/student/tasks/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: pendingTaskId, feedback })
      });

      if (response.ok) {
        toast.success('Geri bildiriminiz kaydedildi!');
        // Now mark the task as completed
        await fetch('/api/student/tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: pendingTaskId, isCompleted: true })
        });

        setTasks(tasks.map(task =>
          task.id === pendingTaskId ? { ...task, isCompleted: true } : task
        ));
      } else {
        toast.error('Geri bildirim kaydedilemedi');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setFeedbackDialogOpen(false);
      setPendingTaskId(null);
    }
  };

  const updateTaskProgress = async (taskId: string, completedQuantity: number) => {
    try {
      const response = await fetch('/api/student/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completedQuantity })
      });

      if (response.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, completedQuantity } : task
        ));
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    const labels: Record<string, string> = {
      high: 'Yüksek',
      medium: 'Orta',
      low: 'Düşük'
    };
    return (
      <Badge className={colors[priority] || 'bg-gray-100 text-gray-700'}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  const getProgressPercentage = (target: number, completed: number) => {
    return target > 0 ? Math.round((completed / target) * 100) : 0;
  };

  if (loading) {
    return <div className="p-8">Yükleniyor...</div>;
  }

  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const totalTasks = tasks.length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Günlük Görevler</h1>
            <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Bugün</p>
            <p className="text-lg font-semibold text-gray-900">{formatDate(today)}</p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Günlük İlerleme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{completedTasks}</p>
                <p className="text-sm text-gray-600">Tamamlandı</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{totalTasks}</p>
                <p className="text-sm text-gray-600">Toplam</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">%{overallProgress}</p>
              <p className="text-sm text-gray-600">Genel İlerleme</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <p>Henüz görev atanmamış.</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => {
            const progressPercent = getProgressPercentage(task.targetQuantity, task.completedQuantity);
            
            return (
              <Card key={task.id} className={task.isCompleted ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <button
                          onClick={() => toggleTaskCompletion(task.id, !task.isCompleted)}
                          className="focus:outline-none"
                        >
                          {task.isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                        </button>
                        <h3 className={`font-semibold text-lg ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        {getPriorityBadge(task.priority)}
                      </div>
                      
                      <p className="text-gray-600 mb-3 ml-9">{task.description}</p>
                      
                      <div className="flex items-center space-x-4 ml-9 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(task.taskDate).toLocaleDateString('tr-TR')}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{task.taskType}</span>
                        </span>
                        <Badge variant="outline">{task.subject}</Badge>
                      </div>

                      {!task.isCompleted && task.targetQuantity > 0 && (
                        <div className="ml-9 mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              İlerleme: {task.completedQuantity} / {task.targetQuantity}
                            </span>
                            <span className="text-sm font-semibold">%{progressPercent}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTaskProgress(task.id, Math.max(0, task.completedQuantity - 1))}
                              disabled={task.completedQuantity <= 0}
                            >
                              -
                            </Button>
                            <span className="text-sm font-medium">{task.completedQuantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTaskProgress(task.id, Math.min(task.targetQuantity, task.completedQuantity + 1))}
                              disabled={task.completedQuantity >= task.targetQuantity}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Task Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Görev Geri Bildirimi</DialogTitle>
            <DialogDescription>
              Bu görev sizin için nasıldı? AI size gelecekte daha iyi görevler hazırlamak için bu bilgiyi kullanacak.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() => submitTaskFeedback('EASY')}
              className="flex items-center gap-2 h-12 text-base"
              variant="outline"
            >
              <ThumbsUp className="w-5 h-5 text-green-600" />
              <span>Kolaydı</span>
            </Button>
            <Button
              onClick={() => submitTaskFeedback('MODERATE')}
              className="flex items-center gap-2 h-12 text-base"
              variant="outline"
            >
              <Minus className="w-5 h-5 text-yellow-600" />
              <span>Tam Kararındaydı</span>
            </Button>
            <Button
              onClick={() => submitTaskFeedback('HARD')}
              className="flex items-center gap-2 h-12 text-base"
              variant="outline"
            >
              <ThumbsDown className="w-5 h-5 text-red-600" />
              <span>Zordu</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
