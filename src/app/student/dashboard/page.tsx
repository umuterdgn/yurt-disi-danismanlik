import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { FileText, CheckCircle, Clock, AlertCircle, TrendingUp, BookOpen, Upload, Trophy } from 'lucide-react';
import { StudentDailyTasks } from "@/components/student-daily-tasks";
import { FileUploadButton } from "@/components/file-upload-button";
import { AIMotivationCard } from "@/components/ai-motivation-card";

export default async function StudentDashboard() {
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

  // Get student profile with security check
  let studentProfile = null;
  try {
    studentProfile = await prisma.studentProfile.findUnique({
      where: {
        userId: user.id
      },
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
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          orderBy: { taskDate: 'desc' }
        },
        examResults: {
          orderBy: { examDate: 'desc' },
          take: 10
        },
        subjectAnalysis: {
          orderBy: { subject: 'asc' }
        },
        applications: {
          include: {
            documents: {
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Veri Yükleme Hatası</h2>
          <p className="text-gray-600">Öğrenci bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
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

  // Flatten documents from all applications
  const allDocuments = studentProfile.applications?.flatMap((app: any) => app.documents) || [];

  // Calculate progress
  const progress = studentProfile.targetScore && studentProfile.targetScore > 0 
    ? Math.round(((studentProfile.currentScore || 0) / studentProfile.targetScore) * 100) 
    : 0;

  // Calculate level from XP (every 500 XP = 1 level)
  const level = Math.floor((studentProfile.xp || 0) / 500) + 1;
  const xpInCurrentLevel = (studentProfile.xp || 0) % 500;
  const xpProgress = (xpInCurrentLevel / 500) * 100;

  // Get leaderboard (top 5 students by XP)
  const leaderboard = await prisma.studentProfile.findMany({
    include: { user: true },
    orderBy: { xp: 'desc' },
    take: 5
  });

  // Group subject analysis
  const groupedSubjects = studentProfile.subjectAnalysis.reduce((acc, analysis) => {
    if (!acc[analysis.subject]) {
      acc[analysis.subject] = [];
    }
    acc[analysis.subject].push(analysis);
    return acc;
  }, {} as Record<string, typeof studentProfile.subjectAnalysis>);

  const getProficiencyColor = (level: string) => {
    const colors: Record<string, string> = {
      'WEAK': 'bg-red-100 text-red-700',
      'BASIC': 'bg-orange-100 text-orange-700',
      'INTERMEDIATE': 'bg-yellow-100 text-yellow-700',
      'ADVANCED': 'bg-blue-100 text-blue-700',
      'PROFICIENT': 'bg-green-100 text-green-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  const getProficiencyLabel = (level: string) => {
    const labels: Record<string, string> = {
      'WEAK': 'Zayıf',
      'BASIC': 'Temel',
      'INTERMEDIATE': 'Orta',
      'ADVANCED': 'İyi',
      'PROFICIENT': 'Mükemmel',
    };
    return labels[level] || level;
  };

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

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'REJECTED':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Öğrenci Paneli</h1>
        
        {/* AI Motivation Card */}
        <AIMotivationCard 
          studentSymbol={studentProfile.studentSymbol || '🎓'}
          currentXP={studentProfile.xp || 0}
          studentName={studentProfile.user.name}
        />

        {/* Student Profile Summary with Gamification */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Profil Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <p className="text-sm text-blue-100 mb-1">Öğrenci Adı</p>
                <p className="text-2xl font-bold">{studentProfile.user.name}</p>
                <p className="text-sm text-blue-100">{studentProfile.grade}. Sınıf</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Sembol</p>
                <p className="text-4xl">{studentProfile.studentSymbol || '🎓'}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Seviye</p>
                <p className="text-3xl font-bold">{level}</p>
                <p className="text-sm text-blue-100 mt-1">XP: {studentProfile.xp || 0}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Hedef Üniversite</p>
                <p className="text-lg font-semibold">{studentProfile.targetUniversity || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Mevcut Puan</p>
                <p className="text-3xl font-bold">{studentProfile.currentScore || 0}</p>
                <p className="text-sm text-blue-100 mt-1">İlerleme: %{progress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* XP Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              XP İlerlemesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Seviye {level}</span>
                <span className="text-gray-600">{xpInCurrentLevel}/500 XP</span>
              </div>
              <Progress value={xpProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Liderlik Tablosu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((student, index) => (
                <div 
                  key={student.id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    student.id === studentProfile.id ? 'bg-purple-100 border-2 border-purple-500' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                    <span className="text-2xl">{student.studentSymbol || '🎓'}</span>
                    <span className="font-medium">{student.user.name}</span>
                  </div>
                  <span className="font-bold text-purple-600">{student.xp || 0} XP</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Tasks and Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Günlük Görevler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentDailyTasks tasks={studentProfile.dailyTasks || []} />
            </CardContent>
          </Card>

          {/* Document Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Evrak Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Henüz evrak yüklenmemiş.</p>
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Evrak Yükle
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {allDocuments.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getDocumentStatusIcon(doc.status)}
                        <div>
                          <p className="font-medium">{doc.documentType || doc.type}</p>
                          <p className="text-sm text-gray-600">{doc.status}</p>
                        </div>
                      </div>
                      <FileUploadButton 
                        documentId={doc.id}
                        filePath={doc.filePath}
                        documentName={doc.documentType || doc.type}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Exam Results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Deneme Sonuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentProfile.examResults?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Henüz deneme sonucu bulunmuyor.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deneme Adı</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Hedef Net</TableHead>
                    <TableHead>Değişim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentProfile.examResults.map((exam, index) => {
                    const previousExam = studentProfile.examResults[index + 1];
                    const change = previousExam && exam.actualScore != null && previousExam.actualScore != null
                      ? exam.actualScore - previousExam.actualScore
                      : 0;
                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.examName}</TableCell>
                        <TableCell>{new Date(exam.examDate).toLocaleDateString('tr-TR')}</TableCell>
                        <TableCell>{exam.actualScore ?? '-'}</TableCell>
                        <TableCell>{exam.targetScore ?? '-'}</TableCell>
                        <TableCell className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {change >= 0 ? '+' : ''}{change}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Subject Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Konu Etkinliği Analizi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(groupedSubjects).length === 0 ? (
              <p className="text-gray-500 text-center py-4">Henüz konu analizi bulunmuyor.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(groupedSubjects).map(([subject, topics]) => (
                  <div key={subject} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 text-lg">{subject}</h3>
                    <div className="space-y-2">
                      {topics.map((topic) => (
                        <div key={topic.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{topic.topic}</span>
                          <Badge className={getProficiencyColor(topic.proficiency)}>
                            {getProficiencyLabel(topic.proficiency)}
                          </Badge>
                        </div>
                      ))}
                    </div>
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
