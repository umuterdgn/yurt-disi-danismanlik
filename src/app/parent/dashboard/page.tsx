import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Clock, TrendingUp, BookOpen, AlertTriangle, CheckCircle, Calendar, Target } from 'lucide-react';

export default async function ParentDashboard() {
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

  // Get parent profile with security check
  let dbUser = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, name: true, role: true }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Veri Yükleme Hatası</h2>
          <p className="text-gray-600">Kullanıcı bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Kullanıcı Bulunamadı</h2>
          <p className="text-gray-600">Kullanıcı bilgileriniz bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.</p>
        </div>
      </div>
    );
  }

  let parentProfile = null;
  try {
    parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: dbUser.id },
      include: {
        user: true,
        students: {
          include: {
            user: true,
            advisor: {
              include: {
                user: true
              }
            },
            dailyTasks: {
              where: {
                taskDate: {
                  gte: new Date(new Date().setDate(new Date().getDate() - 7))
                }
              },
              orderBy: { taskDate: 'desc' }
            },
            examResults: {
              orderBy: { examDate: 'desc' },
              take: 5
            },
            subjectAnalysis: {
              orderBy: { subject: 'asc' }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Veri Yükleme Hatası</h2>
          <p className="text-gray-600">Veli profili yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  if (!parentProfile) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Veli Profili Bulunamadı</h2>
          <p className="text-gray-600">Veli profiliniz bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.</p>
        </div>
      </div>
    );
  }

  if (parentProfile.students.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Öğrenci Atanmamış</h2>
          <p className="text-gray-600">Henüz size atanmış bir öğrenci bulunmuyor. Sistem yöneticisi ile iletişime geçin.</p>
        </div>
      </div>
    );
  }

  // Get first student for summary
  const student = parentProfile.students[0];

  // Calculate weekly stats
  const weeklyTasks = student.dailyTasks?.filter((task: any) => 
    new Date(task.taskDate) >= new Date(new Date().setDate(new Date().getDate() - 7))
  ) || [];
  const completedTasks = weeklyTasks.filter((task: any) => task.isCompleted);
  const totalStudyHours = weeklyTasks.reduce((sum: number, task: any) => {
    if (task.taskType === 'saat') {
      return sum + task.completedQuantity;
    }
    return sum;
  }, 0);

  // Calculate exam progress
  const recentExams = student.examResults?.slice(0, 3) || [];
  const examCount = recentExams.length;
  let scoreChange = 0;
  if (recentExams.length >= 2) {
    const latest = recentExams[0].actualScore || 0;
    const previous = recentExams[recentExams.length - 1].actualScore || 0;
    scoreChange = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
  }

  // Find weak subjects
  const weakSubjects = student.subjectAnalysis
    ?.filter((analysis: any) => analysis.proficiency === 'WEAK' || analysis.proficiency === 'BASIC' || analysis.proficiency === 'INTERMEDIATE')
    .map((analysis: any) => analysis.subject)
    .filter((subject: string, index: number, self: string[]) => self.indexOf(subject) === index) || [];

  // Calculate progress to target
  const progress = student.targetScore && student.targetScore > 0 
    ? Math.round(((student.currentScore || 0) / student.targetScore) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Veli Paneli</h1>
        
        {/* Parent Info */}
        <Card className="mb-8 bg-gradient-to-r from-green-500 to-teal-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Hoş Geldiniz, {parentProfile.user.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-green-100 mb-1">Öğrenci</p>
                <p className="text-2xl font-bold">{student.user.name}</p>
                <p className="text-sm text-green-100">{student.grade}. Sınıf - {student.school}</p>
              </div>
              <div>
                <p className="text-sm text-green-100 mb-1">Hedef Üniversite</p>
                <p className="text-lg font-semibold">{student.targetUniversity || '-'}</p>
                <p className="text-sm text-green-100 mt-1">Danışman: {student.advisor?.user?.name || 'Atanmamış'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Haftalık Çalışma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalStudyHours} saat</div>
              <p className="text-sm text-gray-500 mt-1">Bu hafta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Deneme Sayısı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{examCount}</div>
              <p className="text-sm text-gray-500 mt-1">Son 3 deneme</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Net Değişimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {scoreChange >= 0 ? '+' : ''}{scoreChange.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-500 mt-1">Son denemeler</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Hedefe Uzaklık
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{100 - progress}%</div>
              <p className="text-sm text-gray-500 mt-1">Kalan</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Haftalık Performans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Tamamlanan Görevler</p>
                      <p className="text-sm text-gray-600">{completedTasks.length}/{weeklyTasks.length} görev</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    {weeklyTasks.length > 0 ? Math.round((completedTasks.length / weeklyTasks.length) * 100) : 0}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Çalışma Süresi</p>
                      <p className="text-sm text-gray-600">Bu hafta toplam</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">
                    {totalStudyHours} saat
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Mevcut Net</p>
                      <p className="text-sm text-gray-600">Hedef: {student.targetScore || 0}</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">
                    {student.currentScore || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Desteğe İhtiyaç Duyulan Konular
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weakSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <p className="text-gray-600">Harika! Tüm konularda iyi ilerleme kaydediyor.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {weakSubjects.map((subject: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-medium text-gray-900">{subject}</p>
                          <p className="text-sm text-gray-600">Desteğe ihtiyaç var</p>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-700">
                        Zayıf
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Exam Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Son Deneme Sonuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.examResults?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Henüz deneme sonucu bulunmuyor.</p>
            ) : (
              <div className="space-y-3">
                {student.examResults?.slice(0, 5).map((exam: any, index: number) => {
                  const previousExam = student.examResults?.[index + 1];
                  const change = previousExam && exam.actualScore != null && previousExam.actualScore != null
                    ? exam.actualScore - previousExam.actualScore
                    : 0;
                  return (
                    <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{exam.examName}</p>
                        <p className="text-sm text-gray-600">{new Date(exam.examDate).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net</p>
                          <p className="text-xl font-bold">{exam.actualScore ?? '-'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Hedef</p>
                          <p className="text-xl font-bold">{exam.targetScore ?? '-'}</p>
                        </div>
                        <Badge className={change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {change >= 0 ? '+' : ''}{change}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
