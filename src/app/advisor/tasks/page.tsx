import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AdvisorKanbanBoard } from "@/components/advisor-kanban-board";
import { updateTaskStatus } from "@/actions/add-task";
import { AIWeeklySchedulerDialog } from "@/components/ai-weekly-scheduler-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default async function TasksPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  let tasks: any[] = [];
  let students: { id: string; name: string }[] = [];
  let aiRecommendations: any[] = [];
  let userName = 'Danışman';

  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        advisorProfile: true
      }
    });

    if (dbUser) {
      userName = dbUser.name;

      // Get students for the dialog
      if (dbUser.role === 'SUPER_ADMIN') {
        const allStudents = await prisma.studentProfile.findMany({
          include: { user: true }
        });
        students = allStudents.map(s => ({ id: s.id, name: s.user.name }));
        
        tasks = await prisma.dailyTask.findMany({
          include: {
            studentProfile: {
              include: {
                user: true
              }
            }
          },
          orderBy: { taskDate: 'desc' }
        });

        // Get AI recommendations for all students
        aiRecommendations = await prisma.aIRecommendation.findMany({
          where: {
            studentId: { in: allStudents.map(s => s.id) },
            isResolved: false
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
      } else if (dbUser.advisorProfile) {
        const advisorStudents = await prisma.studentProfile.findMany({
          where: { advisorId: dbUser.advisorProfile.id },
          include: { user: true }
        });
        students = advisorStudents.map(s => ({ id: s.id, name: s.user.name }));
        
        tasks = await prisma.dailyTask.findMany({
          where: {
            studentProfile: {
              advisorId: dbUser.advisorProfile.id
            }
          },
          include: {
            studentProfile: {
              include: {
                user: true
              }
            }
          },
          orderBy: { taskDate: 'desc' }
        });

        // Get AI recommendations for advisor's students
        aiRecommendations = await prisma.aIRecommendation.findMany({
          where: {
            studentId: { in: advisorStudents.map(s => s.id) },
            isResolved: false
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
      }
    }
  }

  // Ensure tasks have status field (set default to TODO if missing)
  const normalizedTasks = tasks.map(task => ({
    ...task,
    status: (task.status as 'TODO' | 'IN_PROGRESS' | 'DONE') || 'TODO'
  }));

  const todoTasks = normalizedTasks.filter((t: any) => t.status === 'TODO');
  const inProgressTasks = normalizedTasks.filter((t: any) => t.status === 'IN_PROGRESS');
  const doneTasks = normalizedTasks.filter((t: any) => t.status === 'DONE');

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Görevler & Pomodoro</h1>
            <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
          </div>
          {students.length > 0 && (
            <div className="flex items-center gap-2">
              <Select defaultValue={students[0].id}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AIWeeklySchedulerDialog 
                studentId={students[0].id} 
                studentName={students[0].name}
              />
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Görev</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{normalizedTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tamamlanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{doneTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Devam Eden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{todoTasks.length + inProgressTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Kanban Board */}
        <AdvisorKanbanBoard 
          tasks={normalizedTasks} 
          students={students}
          onTaskMove={updateTaskStatus}
          aiRecommendations={aiRecommendations}
        />
      </div>
    </div>
  );
}
