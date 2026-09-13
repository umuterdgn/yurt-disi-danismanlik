"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddTaskDialog } from "@/components/add-task-dialog";

interface Task {
  id: string;
  title: string;
  subject?: string;
  priority: string;
  estimatedPomodoros: number;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  studentProfile: {
    user: {
      name: string;
    };
  };
}

interface AdvisorKanbanBoardProps {
  tasks: Task[];
  students: { id: string; name: string }[];
  onTaskMove: (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => Promise<{ success: boolean; error?: string; task?: any }>;
}

export function AdvisorKanbanBoard({ tasks, students, onTaskMove }: AdvisorKanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

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
    
    // Update local state immediately for better UX
    const updatedTasks = localTasks.map(task => 
      task.id === draggableId ? { ...task, status: newStatus } : task
    );
    setLocalTasks(updatedTasks);

    // Call the server action to update the database
    await onTaskMove(draggableId, newStatus);
  };

  const getTasksByStatus = (status: string) => {
    return localTasks.filter(task => task.status === status);
  };

  const todoTasks = getTasksByStatus('TODO');
  const inProgressTasks = getTasksByStatus('IN_PROGRESS');
  const doneTasks = getTasksByStatus('DONE');

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">Görev Panosu</CardTitle>
          <AddTaskDialog students={students} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                              className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow cursor-move"
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
                              className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow cursor-move"
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
    </DragDropContext>
  );
}