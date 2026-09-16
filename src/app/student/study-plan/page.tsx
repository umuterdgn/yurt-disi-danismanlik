import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Calendar, Clock, Target, TrendingUp, BookOpen, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export default async function StudentStudyPlan() {
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

  // Get student profile with system-generated tasks
  const studentProfile = await prisma.studentProfile.findUnique({
    where: {
      userId: user.id
    },
    include: {
      user: true,
      dailyTasks: {
        orderBy: { taskDate: 'asc' }
      },
      exams: {
        include: {
          subjectResults: true
        },
        orderBy: { date: 'desc' },
        take: 3
      }
    }
  });

  if (!studentProfile) {
    return <div className="p-8">Profil bulunamadı</div>;
  }

  // Group tasks by date for calendar view
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

  // Get today's tasks
  const today = new Date().toLocaleDateString('tr-TR');
  const todayTasks = tasksByDate[today] || [];

  // Analyze weakest subjects from latest exam
  const latestExam = studentProfile.exams[0];
  let weakestSubjects: string[] = [];
  let analysisReason = '';

  if (latestExam && latestExam.subjectResults) {
    const subjectAnalysis = latestExam.subjectResults
      .map(sr => ({
        subjectName: sr.subjectName,
        net: sr.net || 0
      }))
      .sort((a, b) => a.net - b.net);
    
    weakestSubjects = subjectAnalysis.slice(0, 2).map(s => s.subjectName);
    analysisReason = `Son deneme (${latestExam.title}) sonuçlarına göre en zayıf konular: ${weakestSubjects.join(', ')}`;
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Haftalık Çalışma Programım
          </h1>
          <p className="text-gray-600 mt-2">
            Danışmanınız ve sistem algoritmamız tarafından size özel hazırlanmış çalışma programınız
          </p>
        </div>

        {/* Gelişim Analizi Özeti */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Gelişim Analiziniz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gelişim Alanları</h3>
                  <p className="text-gray-600 text-sm">{analysisReason || 'Henüz deneme sonucu yok'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-secondary/10 rounded-full p-2">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Aralıklı Tekrar Sistemi</h3>
                  <p className="text-gray-600 text-sm">Görevler 2, 7 ve 14 gün aralıklarla atanarak kalıcı öğrenme sağlanıyor</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sistem Önerileri</h3>
                  <p className="text-gray-600 text-sm">Toplam {studentProfile.dailyTasks.length} görev atanmış durumda</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Bugünün Görevleri ({today})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Bugün için görev bulunmuyor</p>
                <p className="text-sm text-gray-400">Deneme sonuçlarına göre yeni görevler atanacak</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {task.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {task.targetQuantity} {task.taskType}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          🍅 {task.estimatedPomodoros} Pomodoro
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {task.completedQuantity}/{task.targetQuantity}
                      </span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${(task.completedQuantity / task.targetQuantity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Haftalık Takvim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sortedDates.map((date) => {
                const isToday = date === today;
                const dateTasks = tasksByDate[date];
                
                return (
                  <div key={date} className={`p-4 rounded-lg border ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {isToday && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Bugün</span>}
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
                  <p className="text-sm text-gray-400">Deneme sonuçlarına göre sistem otomatik görev atayacak</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}