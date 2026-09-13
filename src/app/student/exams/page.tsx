import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { TrendingUp, Calendar, Target } from 'lucide-react';
import { MasteryMap } from "@/components/mastery-map";

export default async function StudentExams() {
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

  // Get student profile with exam results
  let studentProfile = null;
  try {
    studentProfile = await prisma.studentProfile.findUnique({
      where: {
        userId: user.id
      },
      include: {
        user: true,
        examResults: {
          orderBy: { examDate: 'desc' }
        },
        exams: {
          include: {
            subjectResults: true
          },
          orderBy: { date: 'desc' }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Veri Yükleme Hatası</h2>
          <p className="text-gray-600">Sınav sonuçları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profil Bulunamadı</h2>
          <p className="text-gray-600">Öğrenci profiliniz bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalExams = studentProfile.examResults?.length || 0;
  const averageScore = totalExams > 0 
    ? studentProfile.examResults.reduce((sum, exam) => sum + (exam.actualScore || 0), 0) / totalExams 
    : 0;
  
  const latestScore = studentProfile.examResults?.[0]?.actualScore || 0;
  const targetScore = studentProfile.targetScore || 0;
  const progress = targetScore > 0 ? Math.round((latestScore / targetScore) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Deneme Sonuçları</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Toplam Deneme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalExams}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Ortalama Net
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{averageScore.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Son Net
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{latestScore}</div>
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
            </CardContent>
          </Card>
        </div>

        {/* Mastery Map */}
        <div className="mb-8">
          <MasteryMap exams={studentProfile.exams || []} />
        </div>

        {/* Exam Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Tüm Deneme Sonuçları</CardTitle>
          </CardHeader>
          <CardContent>
            {studentProfile.examResults?.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz deneme sonucu yok</h3>
                <p className="text-gray-500">Deneme sonuçlarınız burada görüntülenecek.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Deneme Adı</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tarih</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Net</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Hedef Net</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Değişim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentProfile.examResults.map((exam, index) => {
                      const previousExam = studentProfile.examResults[index + 1];
                      const change = previousExam && exam.actualScore != null && previousExam.actualScore != null
                        ? exam.actualScore - previousExam.actualScore
                        : 0;
                      return (
                        <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{exam.examName}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(exam.examDate).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="py-3 px-4 text-gray-900 font-semibold">{exam.actualScore ?? '-'}</td>
                          <td className="py-3 px-4 text-gray-600">{exam.targetScore ?? '-'}</td>
                          <td className="py-3 px-4">
                            <Badge className={change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {change >= 0 ? '+' : ''}{change}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
