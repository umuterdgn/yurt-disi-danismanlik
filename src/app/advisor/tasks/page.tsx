import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { AddTaskDialog } from "@/components/add-task-dialog";
import { AddExamDialog } from "@/components/add-exam-dialog";

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
  let examResults: any[] = [];
  let students: { id: string; name: string }[] = [];
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
        examResults = await prisma.examResult.findMany({
          include: {
            studentProfile: {
              include: {
                user: true
              }
            }
          },
          orderBy: { examDate: 'desc' }
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
        examResults = await prisma.examResult.findMany({
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
          orderBy: { examDate: 'desc' }
        });
      }
    }
  }

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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Görevler & Denemeler</h1>
          <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Görev</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{tasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tamamlanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{tasks.filter((t: any) => t.completed).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Deneme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{examResults.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ortalama Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {(() => {
                  const validScores = examResults.filter((e: any) => e.actualScore != null);
                  return validScores.length > 0 
                    ? Math.round(validScores.reduce((sum: number, e: any) => sum + e.actualScore, 0) / validScores.length)
                    : 0;
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Table */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">Görev Listesi</CardTitle>
            <AddTaskDialog students={students} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-600">Öğrenci</TableHead>
                  <TableHead className="text-gray-600">Görev</TableHead>
                  <TableHead className="text-gray-600">Ders</TableHead>
                  <TableHead className="text-gray-600">Hedef</TableHead>
                  <TableHead className="text-gray-600">Durum</TableHead>
                  <TableHead className="text-gray-600">Öncelik</TableHead>
                  <TableHead className="text-gray-600">Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                      Henüz görev atanmamış.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task: any) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-gray-900">
                        {task.studentProfile?.user?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">{task.title}</TableCell>
                      <TableCell className="text-gray-600">{task.subject}</TableCell>
                      <TableCell className="text-gray-600">{task.targetQuantity}</TableCell>
                      <TableCell>
                        <Badge className={task.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {task.completed ? 'Tamamlandı' : 'Devam Ediyor'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(task.taskDate).toLocaleDateString('tr-TR')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Exam Results Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">Deneme Sonuçları</CardTitle>
            <AddExamDialog students={students} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-600">Öğrenci</TableHead>
                  <TableHead className="text-gray-600">Deneme Adı</TableHead>
                  <TableHead className="text-gray-600">Tarih</TableHead>
                  <TableHead className="text-gray-600">Net</TableHead>
                  <TableHead className="text-gray-600">Hedef Net</TableHead>
                  <TableHead className="text-gray-600">Değişim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      Henüz deneme sonucu bulunmuyor.
                    </TableCell>
                  </TableRow>
                ) : (
                  examResults.map((exam: any, index: number) => {
                    const previousExam = examResults[index + 1];
                    const currentScore = exam.actualScore ?? 0;
                    const previousScore = previousExam?.actualScore ?? 0;
                    const change = previousExam ? currentScore - previousScore : 0;
                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium text-gray-900">
                          {exam.studentProfile?.user?.name || '-'}
                        </TableCell>
                        <TableCell className="text-gray-600">{exam.examName}</TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(exam.examDate).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-gray-600">{currentScore}</TableCell>
                        <TableCell className="text-gray-600">{exam.targetScore}</TableCell>
                        <TableCell className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {change >= 0 ? '+' : ''}{change}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
