import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default async function StudentCalendarPage() {
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

  if (!user?.email) {
    return <div className="p-8">Giriş yapmalısınız</div>;
  }

  // Get student profile with tasks and meetings
  const studentProfile = await prisma.studentProfile.findUnique({
    where: {
      userId: user.id
    },
    include: {
      user: true,
      dailyTasks: {
        orderBy: { taskDate: 'asc' }
      },
      meetingNotes: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!studentProfile) {
    return <div className="p-8">Profil bulunamadı</div>;
  }

  // Group tasks by date
  const tasksByDate = studentProfile.dailyTasks.reduce((acc, task) => {
    const dateKey = new Date(task.taskDate).toLocaleDateString('tr-TR');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, typeof studentProfile.dailyTasks>);

  // Sort dates
  const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Takvimim
          </h1>
          <p className="text-gray-600 mt-2">
            Görevlerinizi ve görüşmelerinizi takip edin
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Toplam Görev
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{studentProfile.dailyTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Görüşme Notları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{studentProfile.meetingNotes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Aktif Günler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{sortedDates.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Görev Takvimi
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">Eylül 2024</span>
                <Button variant="outline" size="icon">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sortedDates.map((date) => {
                const isToday = date === new Date().toLocaleDateString('tr-TR');
                const dateTasks = tasksByDate[date];

                return (
                  <div key={date} className={`p-4 rounded-lg border ${isToday ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {isToday && <span className="bg-primary text-white text-xs px-2 py-1 rounded">Bugün</span>}
                        {date}
                      </h3>
                      <span className="text-sm text-gray-500">{dateTasks.length} görev</span>
                    </div>
                    <div className="space-y-2">
                      {dateTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded border shadow-sm">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{task.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>{task.subject}</span>
                              <span>{task.targetQuantity} {task.taskType}</span>
                              <span>🍅 {task.estimatedPomodoros} Pomodoro</span>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(task.priority)} variant="outline">
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {sortedDates.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Henüz planlanmış görev yok</p>
                  <p className="text-sm text-gray-400">Danışmanınız görevler atadığında burada görünecek</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Son Görüşme Notları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentProfile.meetingNotes.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Henüz görüşme notu yok</p>
                <p className="text-sm text-gray-400">Danışmanınızla yaptığınız görüşmeler burada görünecek</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentProfile.meetingNotes.map((note) => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Görüşme Notu</p>
                      <p className="text-sm text-gray-500">{note.createdAt.toLocaleDateString('tr-TR')}</p>
                    </div>
                    <p className="text-gray-600 text-sm">{note.notes || 'Not eklenmemiş'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}