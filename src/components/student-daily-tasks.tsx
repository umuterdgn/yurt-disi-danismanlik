"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle } from 'lucide-react';
import { toggleTaskCompletion } from "@/actions/toggle-task-completion";
import { TaskIntegratedPomodoro } from "@/components/task-integrated-pomodoro";
import { toast } from "sonner";

interface DailyTask {
  id: string;
  title: string;
  subject: string;
  taskType: string;
  targetQuantity: number;
  completedQuantity: number;
  isCompleted: boolean;
  priority: string;
}

interface StudentDailyTasksProps {
  tasks: DailyTask[];
}

export function StudentDailyTasks({ tasks }: StudentDailyTasksProps) {
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

  const handleToggle = async (taskId: string) => {
    const result = await toggleTaskCompletion(taskId);
    
    if (result.success && result.task) {
      toast.success(result.task.isCompleted ? "Görev tamamlandı!" : "Görev durumu güncellendi");
      window.location.reload();
    } else {
      toast.error(result.error || "Bir hata oluştu");
    }
  };

  if (tasks.length === 0) {
    return <p className="text-gray-500 text-center py-4">Bugün için görev atanmamış.</p>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg ${
          task.isCompleted ? 'bg-green-50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            {task.isCompleted ? (
              <div className="w-5 h-5 rounded bg-green-500 border-green-500 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            ) : (
              <TaskIntegratedPomodoro 
                taskId={task.id}
                taskTitle={task.title}
                subject={task.subject}
                onTaskComplete={() => window.location.reload()}
              />
            )}
            <div className="flex-1">
              <p className={`font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {task.title}
              </p>
              <p className="text-sm text-gray-600">{task.subject} - {task.completedQuantity}/{task.targetQuantity} {task.taskType}</p>
            </div>
          </div>
          <Badge className={getPriorityColor(task.priority)}>
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>
      ))}
    </div>
  );
}
