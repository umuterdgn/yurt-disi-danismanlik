"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen, Target, User } from "lucide-react";

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

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  if (!task) return null;

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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'TODO': 'Yapılacak',
      'IN_PROGRESS': 'Devam Ediyor',
      'DONE': 'Tamamlandı'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'TODO': 'bg-gray-100 text-gray-700',
      'IN_PROGRESS': 'bg-blue-100 text-blue-700',
      'DONE': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
          <DialogDescription>
            Görev detayları ve bilgileri
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Status and Priority */}
          <div className="flex gap-2">
            <Badge className={getStatusColor(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
            <Badge className={getPriorityColor(task.priority)}>
              {getPriorityLabel(task.priority)}
            </Badge>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Açıklama</h4>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
          )}

          {/* Subject and Topic */}
          <div className="grid grid-cols-2 gap-4">
            {task.subject && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Ders
                </h4>
                <p className="text-sm text-gray-600">{task.subject}</p>
              </div>
            )}
            {task.topic && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Konu
                </h4>
                <p className="text-sm text-gray-600">{task.topic}</p>
              </div>
            )}
          </div>

          {/* Date and Student */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Tarih
              </h4>
              <p className="text-sm text-gray-600">
                {new Date(task.taskDate).toLocaleDateString('tr-TR')}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <User className="w-4 h-4" />
                Öğrenci
              </h4>
              <p className="text-sm text-gray-600">{task.studentProfile?.user?.name || '-'}</p>
            </div>
          </div>

          {/* Pomodoro */}
          {task.estimatedPomodoros > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Tahmini Süre
              </h4>
              <p className="text-sm text-gray-600">{task.estimatedPomodoros} Pomodoro</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}