"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar, Clock, BookOpen, Target, Trash2, Plus, Edit2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ScheduleTask {
  subject: string;
  topic: string;
  studyMethod: string;
  pomodoros: number;
  duration: number;
  priority: string;
}

interface ScheduleDay {
  day: string;
  date: string;
  tasks: ScheduleTask[];
}

interface AIWeeklySchedulerDialogProps {
  studentId: string;
  studentName: string;
}

export function AIWeeklySchedulerDialog({ studentId, studentName }: AIWeeklySchedulerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [level, setLevel] = useState<'Zero' | 'Medium' | 'Advanced'>('Medium');
  const [dailyTargetHours, setDailyTargetHours] = useState('6');
  const [examType, setExamType] = useState('TYT');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Schedule state
  const [schedule, setSchedule] = useState<{ days: ScheduleDay[] } | null>(null);
  const [editingTask, setEditingTask] = useState<{ dayIndex: number; taskIndex: number } | null>(null);

  const generateSchedule = async () => {
    setGenerating(true);
    try {
      // Get student data for subject analysis and recent tasks
      const studentResponse = await fetch(`/api/advisor/students/${studentId}`);
      const studentData = await studentResponse.json();

      // Get recent tasks (last 2 weeks)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const tasksResponse = await fetch(`/api/advisor/students/${studentId}/tasks?since=${twoWeeksAgo.toISOString()}`);
      const tasksData = await tasksResponse.json();

      const response = await fetch('/api/ai/weekly-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          level,
          dailyTargetHours: parseInt(dailyTargetHours),
          subjectAnalysis: studentData.subjectAnalysis || [],
          recentTasks: tasksData.tasks || [],
          examType,
          startDate,
          learningDNA: studentData.learningDNA || null,
          burnoutRiskScore: studentData.simulationProfile?.burnoutRiskScore || 0,
          targetUniversity: studentData.simulationProfile?.targetUniversity || null,
          ghostCompetitorGap: studentData.simulationProfile?.ghostCompetitorGap || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Program oluşturulamadı');
      }

      const data = await response.json();
      setSchedule(data.schedule);
      setGenerated(true);

      if (data.metadata.isDeLoadWeek) {
        toast.warning('De-Load Haftası: Tükenmişlik riski yüksek, program yükü %40 azaltıldı');
      } else {
        toast.success('Haftalık program başarıyla oluşturuldu!');
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast.error(error instanceof Error ? error.message : 'Program oluşturulurken hata oluştu');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditTask = (dayIndex: number, taskIndex: number) => {
    if (editingTask?.dayIndex === dayIndex && editingTask?.taskIndex === taskIndex) {
      setEditingTask(null);
    } else {
      setEditingTask({ dayIndex, taskIndex });
    }
  };

  const handleUpdateTask = (dayIndex: number, taskIndex: number, field: keyof ScheduleTask, value: string | number) => {
    if (!schedule) return;
    
    const updatedSchedule = { ...schedule };
    updatedSchedule.days[dayIndex].tasks[taskIndex] = {
      ...updatedSchedule.days[dayIndex].tasks[taskIndex],
      [field]: value
    };
    setSchedule(updatedSchedule);
  };

  const handleDeleteTask = (dayIndex: number, taskIndex: number) => {
    if (!schedule) return;
    
    const updatedSchedule = { ...schedule };
    updatedSchedule.days[dayIndex].tasks = updatedSchedule.days[dayIndex].tasks.filter((_, i) => i !== taskIndex);
    setSchedule(updatedSchedule);
  };

  const handleAddTask = (dayIndex: number) => {
    if (!schedule) return;
    
    const newTask: ScheduleTask = {
      subject: 'Matematik',
      topic: 'Seçilmedi',
      studyMethod: 'PRACTICE',
      pomodoros: 2,
      duration: 50,
      priority: 'medium'
    };
    
    const updatedSchedule = { ...schedule };
    updatedSchedule.days[dayIndex].tasks = [...updatedSchedule.days[dayIndex].tasks, newTask];
    setSchedule(updatedSchedule);
  };

  const handleSaveSchedule = async () => {
    if (!schedule) return;
    
    setSaving(true);
    try {
      // Convert schedule to DailyTask format and bulk create
      const tasksToCreate = schedule.days.flatMap((day, dayIndex) => 
        day.tasks.map((task, taskIndex) => ({
          studentProfileId: studentId,
          title: `${task.subject} - ${task.topic}`,
          description: `${task.studyMethod} yöntemiyle çalışma`,
          subject: task.subject,
          topic: task.topic,
          taskType: 'REVIEW',
          studyMethod: task.studyMethod,
          targetQuantity: task.duration,
          estimatedPomodoros: task.pomodoros,
          priority: task.priority,
          taskDate: day.date,
          isCompleted: false,
          status: 'TODO'
        }))
      );

      const response = await fetch('/api/advisor/tasks/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasksToCreate })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Görevler kaydedilemedi');
      }

      toast.success('Haftalık program başarıyla öğrenciye atandı!');
      setOpen(false);
      setGenerated(false);
      setSchedule(null);
      router.refresh();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error(error instanceof Error ? error.message : 'Program kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-red-100 text-red-700',
      'medium': 'bg-yellow-100 text-yellow-700',
      'low': 'bg-green-100 text-green-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getStudyMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'VIDEO': 'bg-purple-100 text-purple-700',
      'READING': 'bg-blue-100 text-blue-700',
      'PRACTICE': 'bg-green-100 text-green-700',
      'TEST': 'bg-orange-100 text-orange-700',
      'REVIEW': 'bg-pink-100 text-pink-700'
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Sparkles className="w-4 h-4 mr-2" />
          ✨ AI Haftalık Program Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Haftalık Program Oluşturucu
          </DialogTitle>
          <DialogDescription>
            {studentName} için optimize edilmiş çalışma programı
          </DialogDescription>
        </DialogHeader>
        
        {!generated ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level">Öğrenci Seviyesi</Label>
                <Select value={level} onValueChange={(value: any) => setLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zero">Sıfır</SelectItem>
                    <SelectItem value="Medium">Orta</SelectItem>
                    <SelectItem value="Advanced">İleri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dailyTargetHours">Günlük Hedef Saat</Label>
                <Input
                  id="dailyTargetHours"
                  type="number"
                  min="1"
                  max="12"
                  value={dailyTargetHours}
                  onChange={(e) => setDailyTargetHours(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="examType">Sınav Türü</Label>
                <Select value={examType} onValueChange={(value: any) => setExamType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TYT">TYT</SelectItem>
                    <SelectItem value="AYT">AYT</SelectItem>
                    <SelectItem value="YDT">YDT</SelectItem>
                    <SelectItem value="12. Sınıf">12. Sınıf</SelectItem>
                    <SelectItem value="11. Sınıf">11. Sınıf</SelectItem>
                    <SelectItem value="10. Sınıf">10. Sınıf</SelectItem>
                    <SelectItem value="9. Sınıf">9. Sınıf</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={generateSchedule} 
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {generating ? 'Oluşturuluyor...' : 'Program Oluştur'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Taslak Program</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGenerated(false)}
              >
                Yeniden Oluştur
              </Button>
            </div>
            
            {schedule && schedule.days.map((day, dayIndex) => (
              <Card key={dayIndex} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {day.day}
                    </CardTitle>
                    <Badge variant="outline">{day.date}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {day.tasks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">Bu gün için görev yok</p>
                    ) : (
                      day.tasks.map((task, taskIndex) => {
                        const isEditing = editingTask?.dayIndex === dayIndex && editingTask?.taskIndex === taskIndex;
                        
                        return (
                          <div 
                            key={taskIndex}
                            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg gap-3"
                          >
                            {isEditing ? (
                              <div className="flex-1 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Ders</Label>
                                    <Input
                                      value={task.subject}
                                      onChange={(e) => handleUpdateTask(dayIndex, taskIndex, 'subject', e.target.value)}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Konu</Label>
                                    <Input
                                      value={task.topic}
                                      onChange={(e) => handleUpdateTask(dayIndex, taskIndex, 'topic', e.target.value)}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Yöntem</Label>
                                    <Select value={task.studyMethod} onValueChange={(value) => handleUpdateTask(dayIndex, taskIndex, 'studyMethod', value)}>
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="VIDEO">VIDEO</SelectItem>
                                        <SelectItem value="READING">READING</SelectItem>
                                        <SelectItem value="PRACTICE">PRACTICE</SelectItem>
                                        <SelectItem value="TEST">TEST</SelectItem>
                                        <SelectItem value="REVIEW">REVIEW</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Süre (dk)</Label>
                                    <Input
                                      type="number"
                                      value={task.duration}
                                      onChange={(e) => handleUpdateTask(dayIndex, taskIndex, 'duration', parseInt(e.target.value))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Pomodoro</Label>
                                    <Input
                                      type="number"
                                      value={task.pomodoros}
                                      onChange={(e) => handleUpdateTask(dayIndex, taskIndex, 'pomodoros', parseInt(e.target.value))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Öncelik</Label>
                                    <Select value={task.priority} onValueChange={(value) => handleUpdateTask(dayIndex, taskIndex, 'priority', value)}>
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="high">Yüksek</SelectItem>
                                        <SelectItem value="medium">Orta</SelectItem>
                                        <SelectItem value="low">Düşük</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => setEditingTask(null)}
                                  className="w-full"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Kaydet
                                </Button>
                              </div>
                            ) : (
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                                  </Badge>
                                  <Badge className={getStudyMethodColor(task.studyMethod)}>
                                    {task.studyMethod}
                                  </Badge>
                                </div>
                                <div className="font-medium text-sm">{task.subject} - {task.topic}</div>
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {task.duration} dk
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {task.pomodoros} pomodoro
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => isEditing ? setEditingTask(null) : handleEditTask(dayIndex, taskIndex)}
                              >
                                {isEditing ? <CheckCircle className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTask(dayIndex, taskIndex)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleAddTask(dayIndex)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Görev Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setGenerated(false)}
                disabled={saving}
              >
                İptal
              </Button>
              <Button
                onClick={handleSaveSchedule}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-600 to-teal-600"
              >
                {saving ? 'Kaydediliyor...' : 'Programı Onayla ve Öğrenciye Ata'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}