import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { FileText, AlertCircle, CheckCircle, Clock, ArrowRight, AlertTriangle, TrendingUp, Calendar, Target, BookOpen, MessageSquare, Brain } from 'lucide-react';

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  
  // Get student data
  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      advisor: {
        include: {
          user: true
        }
      },
      applications: {
        include: {
          university: true,
          country: true
        },
        orderBy: { createdAt: 'desc' }
      },
      documents: {
        orderBy: { createdAt: 'desc' }
      },
      meetingNotes: {
        orderBy: { meetingDate: 'desc' },
        take: 10
      },
      dailyTasks: {
        orderBy: { taskDate: 'desc' },
        take: 20
      },
      examResults: {
        orderBy: { examDate: 'desc' },
        take: 10
      },
      subjectAnalysis: {
        orderBy: { subject: 'asc' }
      }
    }
  });

  if (!student) {
    return <div className="p-8">Öğrenci bulunamadı</div>;
  }

  // Group subject analysis by subject
  const groupedSubjects = student.subjectAnalysis.reduce((acc, item) => {
    if (!acc[item.subject]) {
      acc[item.subject] = [];
    }
    acc[item.subject].push(item);
    return acc;
  }, {} as Record<string, typeof student.subjectAnalysis>);

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

  const getApplicationStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'IN_PROGRESS': 'bg-blue-100 text-blue-700',
      'SUBMITTED': 'bg-purple-100 text-purple-700',
      'ACCEPTED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Calculate document completion
  const totalDocuments = student.documents?.length || 0;
  const completedDocuments = student.documents?.filter((d: any) => d.status === 'UPLOADED' || d.status === 'VERIFIED').length || 0;
  const documentProgress = totalDocuments > 0 ? (completedDocuments / totalDocuments) * 100 : 0;

  // Calculate exam average (filter null scores)
  const validExamScores = student.examResults?.filter((e: any) => e.actualScore != null) || [];
  const averageScore = validExamScores.length > 0 
    ? Math.round(validExamScores.reduce((sum: number, e: any) => sum + e.actualScore!, 0) / validExamScores.length)
    : 0;

  // Generate reminder alerts
  const reminders = student.applications
    ?.filter((app: any) => app.university?.applicationDeadline && new Date(app.university.applicationDeadline) > new Date())
    .map((app: any) => {
      const daysUntil = Math.ceil((new Date(app.university.applicationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return {
        message: `${student.user.name}'ın ${app.university?.name || 'üniversite'} başvurusu ${daysUntil} gün sonra`,
        urgency: daysUntil <= 7 ? 'high' : daysUntil <= 14 ? 'medium' : 'low'
      };
    }) || [];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/advisor/dashboard" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Ana Panele Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{student.user.name}</h1>
          <p className="text-gray-600 mt-2">{student.school} - {student.grade}. Sınıf</p>
        </div>

        {/* Reminder Alerts */}
        {reminders.length > 0 && (
          <div className="mb-6 space-y-2">
            {reminders.map((reminder, idx) => (
              <div key={idx} className={`p-4 rounded-lg flex items-center ${
                reminder.urgency === 'high' ? 'bg-red-50 border border-red-200' :
                reminder.urgency === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <AlertTriangle className={`w-5 h-5 mr-3 ${
                  reminder.urgency === 'high' ? 'text-red-600' :
                  reminder.urgency === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <span className="text-sm font-medium">{reminder.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Mevcut Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{student.currentScore || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Hedef Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{student.targetScore || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Evrak Durumu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{Math.round(documentProgress)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${documentProgress}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Başvurular</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{student.applications?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="abroad" className="space-y-6">
          <TabsList>
            <TabsTrigger value="abroad">Yurt Dışı & Evraklar</TabsTrigger>
            <TabsTrigger value="coaching">Koçluk & Görevler</TabsTrigger>
            <TabsTrigger value="exams">Deneme & Analiz</TabsTrigger>
            <TabsTrigger value="meetings">Görüşmeler & AI Rapor</TabsTrigger>
          </TabsList>

          {/* Tab 1: Yurt Dışı & Evraklar */}
          <TabsContent value="abroad">
            <div className="space-y-6">
              {/* Personal Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Öğrenci Profili & Hedefler
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Kişisel Bilgiler</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-600">Ad Soyad:</span> {student.user.name}</p>
                        <p><span className="text-gray-600">E-posta:</span> {student.user.email}</p>
                        <p><span className="text-gray-600">Sınıf:</span> {student.grade}</p>
                        <p><span className="text-gray-600">Okul:</span> {student.school}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Hedefler</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-600">Hedef Üniversite:</span> {student.targetUniversity}</p>
                        <p><span className="text-gray-600">Hedef Puan:</span> {student.targetScore}</p>
                        <p><span className="text-gray-600">Mevcut Puan:</span> {student.currentScore}</p>
                        <p><span className="text-gray-600">Danışman:</span> {student.advisor?.user?.name || 'Atanmamış'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document System */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Evrak Sistemi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {student.documents?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz evrak yüklenmemiş.</p>
                  ) : (
                    <div className="space-y-3">
                      {student.documents?.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getDocumentStatusIcon(doc.status)}
                            <div>
                              <p className="font-medium">{doc.documentType || doc.type}</p>
                              <p className="text-sm text-gray-600">{doc.status}</p>
                            </div>
                          </div>
                          <Badge className={
                            doc.status === 'UPLOADED' || doc.status === 'VERIFIED' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }>
                            {doc.status === 'PENDING' ? 'Eksik' : doc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Kanban-style Application Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Başvuru Takip Panosu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {student.applications?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz başvuru bulunmuyor.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'ACCEPTED'].map((status) => (
                        <div key={status} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 text-sm text-gray-700">
                            {status === 'PENDING' ? 'Başlangıç' :
                             status === 'IN_PROGRESS' ? 'İşlemde' :
                             status === 'SUBMITTED' ? 'Gönderildi' : 'Kabul'}
                          </h4>
                          <div className="space-y-2">
                            {student.applications
                              ?.filter((app: any) => app.status === status)
                              .map((app: any) => (
                                <div key={app.id} className="bg-white p-3 rounded border">
                                  <p className="font-medium text-sm">{app.university?.name || 'Üniversite'}</p>
                                  <p className="text-xs text-gray-600">{app.country?.name || 'Ülke'}</p>
                                  {app.university?.applicationDeadline && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(app.university.applicationDeadline).toLocaleDateString('tr-TR')}
                                    </p>
                                  )}
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
          </TabsContent>

          {/* Tab 2: Koçluk & Görevler */}
          <TabsContent value="coaching">
            <div className="space-y-6">
              {/* Daily Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Günlük Görevler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {student.dailyTasks?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz görev atanmamış.</p>
                  ) : (
                    <div className="space-y-3">
                      {student.dailyTasks?.map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border ${
                              task.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                            } flex items-center justify-center`}>
                              {task.isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-gray-600">{task.subject} - {task.targetQuantity} {task.taskType}</p>
                            </div>
                          </div>
                          <Badge className={
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }>
                            {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subject Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Konu Etkinliği Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(groupedSubjects).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz konu analizi bulunmuyor.</p>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedSubjects).map(([subject, topics]) => (
                        <div key={subject}>
                          <h3 className="font-semibold mb-3">{subject}</h3>
                          <div className="space-y-2">
                            {topics.map((topic) => (
                              <div key={topic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="flex-1">{topic.topic}</span>
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
          </TabsContent>

          {/* Tab 3: Deneme & Analiz */}
          <TabsContent value="exams">
            <div className="space-y-6">
              {/* Exam Results Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Deneme Sonuçları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {student.examResults?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz deneme sonucu bulunmuyor.</p>
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
                        {student.examResults?.map((exam: any, index: number) => {
                          const previousExam = student.examResults?.[index + 1];
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

              {/* Progress Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Gelişim Özeti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ortalama Net</p>
                      <p className="text-2xl font-bold text-blue-600">{averageScore}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Toplam Deneme</p>
                      <p className="text-2xl font-bold text-green-600">{student.examResults.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Hedefe Uzaklık</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {student.targetScore && student.currentScore 
                          ? Math.max(0, student.targetScore - student.currentScore).toFixed(1)
                          : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 4: Görüşmeler & AI Rapor */}
          <TabsContent value="meetings">
            <div className="space-y-6">
              {/* Meeting Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Görüşme Geçmişi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {student.meetingNotes?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz görüşme notu bulunmuyor.</p>
                  ) : (
                    <div className="space-y-4">
                      {student.meetingNotes?.map((meeting: any) => (
                        <div key={meeting.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold">{new Date(meeting.meetingDate).toLocaleDateString('tr-TR')}</h3>
                              <p className="text-sm text-gray-600">{meeting.duration} dakika</p>
                            </div>
                            <Badge className={
                              meeting.motivationLevel === 'high' ? 'bg-green-100 text-green-700' :
                              meeting.motivationLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {meeting.motivationLevel === 'high' ? 'Yüksek' : meeting.motivationLevel === 'medium' ? 'Orta' : 'Düşük'}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            {meeting.achievements && (
                              <p><strong>Başarılar:</strong> {meeting.achievements}</p>
                            )}
                            {meeting.issues && (
                              <p><strong>Sorunlar:</strong> {meeting.issues}</p>
                            )}
                            {meeting.actionItems && (
                              <p><strong>Aksiyonlar:</strong> {meeting.actionItems}</p>
                            )}
                            {meeting.notes && (
                              <p><strong>Notlar:</strong> {meeting.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Report Infrastructure */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Otomatik Rapor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                      Öğrencinin haftalık çalışma süresi, çözülen soru sayısı, deneme netleri ve önceliklerini derleyip Groq AI API'sine göndererek otomatik analiz rapor oluşturun.
                    </p>
                    <Button className="w-full">
                      <Brain className="w-4 h-4 mr-2" />
                      AI Rapor Oluştur
                    </Button>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Not:</strong> Bu özellik Groq API entegrasyonu gerektirir. API anahtarı .env dosyasında GROQ_API_KEY olarak tanımlanmalıdır.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
