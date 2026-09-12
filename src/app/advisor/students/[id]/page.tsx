import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { FileText, AlertCircle, CheckCircle, Clock, ArrowRight, MessageSquare, Plus, TrendingUp, History, BookOpen, GraduationCap, Timer, Activity, BarChart3 } from 'lucide-react';
import { AIAnalysisButton } from "@/components/ai-analysis-button";
import { AdvisorNoteForm } from "@/components/advisor-note-form";
import { DocumentAddDialog } from "@/components/document-add-dialog";
import { ApplicationAddDialog } from "@/components/application-add-dialog";
import { MeetingNoteForm } from "@/components/meeting-note-form";
import { StudentHealthScore } from "@/components/student-health-score";
import { AICopilotPanel } from "@/components/ai-copilot-panel";
import { AddAdvancedExamDialog } from "@/components/advanced-exam-dialog";
import { ExamErrorAnalysis } from "@/components/exam-error-analysis";
import { MasteryMap } from "@/components/mastery-map";
import { StudySessionLogs } from "@/components/study-session-logs";
import { TimeAnalysisCard } from "@/components/time-analysis-card";
import { EfficiencyAnalysisCard } from "@/components/efficiency-analysis-card";
import { getTimeAnalysis, getEfficiencyAnalysis, getStudySessionLogs } from "@/actions/advisor-analytics";

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
      user: {
        include: {
          auditLogs: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      },
      advisor: {
        include: {
          user: true
        }
      },
      applications: {
        include: {
          university: {
            include: {
              country: true
            }
          },
          documents: true,
          visaProcesses: true
        },
        orderBy: { createdAt: 'desc' }
      },
      meetingNotes: {
        orderBy: { meetingDate: 'desc' },
        take: 5
      },
      dailyTasks: {
        orderBy: { createdAt: 'desc' }
      },
      aiRecommendations: {
        where: { isResolved: false },
        orderBy: { createdAt: 'desc' }
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

  if (!student) {
    return <div className="p-8">Öğrenci bulunamadı</div>;
  }

  // Get subject analysis
  const subjectAnalysis = await prisma.subjectAnalysis.findMany({
    where: { studentProfileId: id },
    orderBy: { subject: 'asc' }
  });

  // Get study session analytics
  const studySessionLogs = await getStudySessionLogs(id);
  const timeAnalysis = await getTimeAnalysis(id);
  const efficiencyAnalysis = await getEfficiencyAnalysis(id);

  // Group subject analysis by subject
  const groupedSubjects = subjectAnalysis.reduce((acc, item) => {
    if (!acc[item.subject]) {
      acc[item.subject] = [];
    }
    acc[item.subject].push(item);
    return acc;
  }, {} as Record<string, typeof subjectAnalysis>);

  const getProficiencyColor = (level: string) => {
    const colors: Record<string, string> = {
      'WEAK': 'bg-red-100 text-red-700',
      'MEDIUM': 'bg-yellow-100 text-yellow-700',
      'GOOD': 'bg-blue-100 text-blue-700',
      'EXCELLENT': 'bg-green-100 text-green-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  const getProficiencyLabel = (level: string) => {
    const labels: Record<string, string> = {
      'WEAK': 'Zayıf',
      'MEDIUM': 'Orta',
      'GOOD': 'İyi',
      'EXCELLENT': 'Mükemmel',
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
  const allDocuments = student.applications.flatMap((app: any) => app.documents || []);
  const totalDocuments = allDocuments.length;
  const completedDocuments = allDocuments.filter((d: any) => d.status === 'UPLOADED' || d.status === 'VERIFIED').length;
  const documentProgress = totalDocuments > 0 ? (completedDocuments / totalDocuments) * 100 : 0;

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

        {/* Hero Section - Health Score & AI Copilot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StudentHealthScore
            healthScore={student.healthScore}
            riskStatus={student.riskStatus}
            applicationReadiness={student.applicationReadiness}
          />
          <AICopilotPanel
            recommendations={student.aiRecommendations}
            studentId={id}
          />
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Mevcut Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{student.currentScore}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Hedef Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{student.targetScore}</div>
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
              <div className="text-3xl font-bold text-orange-600">{student.applications.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs - 360° Profile */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Genel Bakış
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Eğitim
            </TabsTrigger>
            <TabsTrigger value="study-efficiency" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Çalışma & Efor
            </TabsTrigger>
            <TabsTrigger value="application" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Başvuru & Vize
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Zaman Çizelgesi
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Student Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Öğrenci Profili</CardTitle>
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
                        <p><span className="text-gray-600">Hedef Sınav:</span> {student.targetExam || '-'}</p>
                        <p><span className="text-gray-600">Sınav Tarihi:</span> {student.examDate ? new Date(student.examDate).toLocaleDateString('tr-TR') : '-'}</p>
                        <p><span className="text-gray-600">Danışman:</span> {student.advisor?.user?.name || 'Atanmamış'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kanban Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Görevler (Kanban)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* TODO Column */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-4 text-gray-700">Yapılacak</h3>
                      <div className="space-y-3">
                        {student.dailyTasks.filter((t: any) => t.status === 'TODO').map((task: any) => (
                          <div key={task.id} className="bg-white p-3 rounded border shadow-sm">
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && <p className="text-xs text-gray-600 mt-1">{task.description}</p>}
                            {task.subject && <Badge className="mt-2 text-xs">{task.subject}</Badge>}
                          </div>
                        ))}
                        {student.dailyTasks.filter((t: any) => t.status === 'TODO').length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">Görev yok</p>
                        )}
                      </div>
                    </div>

                    {/* IN_PROGRESS Column */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-4 text-blue-700">Devam Ediyor</h3>
                      <div className="space-y-3">
                        {student.dailyTasks.filter((t: any) => t.status === 'IN_PROGRESS').map((task: any) => (
                          <div key={task.id} className="bg-white p-3 rounded border shadow-sm">
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && <p className="text-xs text-gray-600 mt-1">{task.description}</p>}
                            {task.subject && <Badge className="mt-2 text-xs">{task.subject}</Badge>}
                          </div>
                        ))}
                        {student.dailyTasks.filter((t: any) => t.status === 'IN_PROGRESS').length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">Görev yok</p>
                        )}
                      </div>
                    </div>

                    {/* DONE Column */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-4 text-green-700">Bitti</h3>
                      <div className="space-y-3">
                        {student.dailyTasks.filter((t: any) => t.status === 'DONE').map((task: any) => (
                          <div key={task.id} className="bg-white p-3 rounded border shadow-sm">
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && <p className="text-xs text-gray-600 mt-1">{task.description}</p>}
                            {task.subject && <Badge className="mt-2 text-xs">{task.subject}</Badge>}
                          </div>
                        ))}
                        {student.dailyTasks.filter((t: any) => t.status === 'DONE').length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">Görev yok</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Exam Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Son Deneme Netleri</CardTitle>
                </CardHeader>
                <CardContent>
                  {student.exams.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz deneme sonucu yok.</p>
                  ) : (
                    <div className="space-y-4">
                      {student.exams.map((exam: any) => (
                        <div key={exam.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">{exam.title}</h4>
                            <span className="text-sm text-gray-600">
                              {new Date(exam.date).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-600">Toplam Net:</span>
                              <span className="ml-2 font-bold text-blue-600">{exam.totalNet || '-'}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Toplam Puan:</span>
                              <span className="ml-2 font-bold text-green-600">{exam.totalScore || '-'}</span>
                            </div>
                          </div>
                          {exam.subjectResults && exam.subjectResults.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <h5 className="text-sm font-medium mb-2">Ders Detayları:</h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {exam.subjectResults.map((subject: any) => (
                                  <div key={subject.id} className="text-xs bg-gray-50 p-2 rounded">
                                    <span className="font-medium">{subject.subjectName}:</span>
                                    <span className="ml-1 text-blue-600">{subject.net || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <AdvisorNoteForm 
                studentId={id}
                currentNote={student.advisorNote}
              />
            </div>
          </TabsContent>

          {/* Academic Tab */}
          <TabsContent value="academic">
            <div className="space-y-6">
              {/* Add Advanced Exam Button */}
              <div className="flex justify-end">
                <AddAdvancedExamDialog students={[{ id, name: student.user.name }]} studentId={id} />
              </div>

              {/* Mastery Map */}
              <MasteryMap exams={student.exams as any} />

              {/* Subject Analysis (AI) */}
              <Card>
                <CardHeader>
                  <CardTitle>Konu Analizi (AI)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <AIAnalysisButton 
                      studentId={id}
                      examResults={[]}
                      subjectAnalysis={subjectAnalysis}
                    />
                    
                    {Object.keys(groupedSubjects).length > 0 && (
                      <div className="space-y-6">
                        <h3 className="font-semibold">Mevcut Konu Analizi</h3>
                        {Object.entries(groupedSubjects).map(([subject, topics]) => (
                          <div key={subject}>
                            <h4 className="font-medium mb-3">{subject}</h4>
                            <div className="space-y-2">
                              {topics.map((topic: any) => (
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
                  </div>
                </CardContent>
              </Card>

              {/* Full Exam History */}
              <Card>
                <CardHeader>
                  <CardTitle>Tüm Deneme Geçmişi</CardTitle>
                </CardHeader>
                <CardContent>
                  {student.exams.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz deneme sonucu yok.</p>
                  ) : (
                    <div className="space-y-4">
                      {student.exams.map((exam: any) => (
                        <div key={exam.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h4 className="font-semibold">{exam.title}</h4>
                              <p className="text-sm text-gray-600">{exam.examType || 'Genel'}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-gray-600">
                                {new Date(exam.date).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <span className="text-sm text-gray-600">Toplam Net:</span>
                              <span className="ml-2 font-bold text-blue-600">{exam.totalNet || '-'}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Toplam Puan:</span>
                              <span className="ml-2 font-bold text-green-600">{exam.totalScore || '-'}</span>
                            </div>
                          </div>
                          {exam.subjectResults && exam.subjectResults.length > 0 && (
                            <div className="bg-gray-50 rounded p-3 mb-3">
                              <h5 className="text-sm font-medium mb-2">Ders Detayları:</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {exam.subjectResults.map((subject: any) => (
                                  <div key={subject.id} className="text-xs bg-white p-2 rounded border">
                                    <div className="font-medium">{subject.subjectName}</div>
                                    <div className="flex justify-between mt-1">
                                      <span className="text-green-600">+{subject.correct}</span>
                                      <span className="text-red-600">-{subject.wrong}</span>
                                      <span className="text-gray-600">Boş: {subject.empty}</span>
                                    </div>
                                    <div className="text-blue-600 font-bold mt-1">Net: {subject.net || '-'}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <ExamErrorAnalysis exam={exam} studentId={id} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Meeting Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Görüşme Notları</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <MeetingNoteForm studentId={id} />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Geçmiş Notlar</h3>
                    {student.meetingNotes.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Henüz görüşme notu yok.</p>
                    ) : (
                      student.meetingNotes.map((note: any) => (
                        <div key={note.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm">
                              {new Date(note.meetingDate).toLocaleDateString('tr-TR')}
                            </p>
                            {note.motivationLevel && (
                              <Badge className="text-xs">{note.motivationLevel}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{note.notes}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Study Efficiency & Effort Tab */}
          <TabsContent value="study-efficiency">
            <div className="space-y-6">
              {/* Study Session Logs */}
              <StudySessionLogs studySessionLogs={studySessionLogs} />

              {/* Time Analysis */}
              <TimeAnalysisCard timeAnalysis={timeAnalysis} />

              {/* Efficiency Analysis */}
              <EfficiencyAnalysisCard efficiencyAnalysis={efficiencyAnalysis as any} />
            </div>
          </TabsContent>

          {/* Application & Visa Tab */}
          <TabsContent value="application">
            <div className="space-y-6">
              {/* Applications with Timeline */}
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Başvuru Takip Sistemi (Application OS)</CardTitle>
                  <ApplicationAddDialog studentId={id} />
                </CardHeader>
                <CardContent>
                  {student.applications.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz başvuru bulunmuyor.</p>
                  ) : (
                    <div className="space-y-6">
                      {student.applications.map((app: any) => (
                        <div key={app.id} className="border rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{app.university?.name || 'Üniversite'}</h3>
                              <p className="text-sm text-gray-600">{app.country || 'Ülke'} - {app.program}</p>
                            </div>
                            <Badge className={getApplicationStatusColor(app.status)}>
                              {app.status}
                            </Badge>
                          </div>

                          {/* Application Timeline */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>Lead</span>
                              <span>Submitted</span>
                              <span>Offer</span>
                              <span>Deposit</span>
                              <span>Visa</span>
                              <span>Enrolled</span>
                            </div>
                            <div className="relative">
                              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>
                              <div className="relative flex justify-between">
                                {['LEAD', 'SUBMITTED', 'OFFER', 'DEPOSIT', 'VISA', 'ENROLLED'].map((status, index) => {
                                  const statusOrder = ['LEAD', 'SUBMITTED', 'OFFER', 'DEPOSIT', 'VISA', 'ENROLLED'];
                                  const currentIndex = statusOrder.indexOf(app.status);
                                  const isActive = index <= currentIndex;
                                  const isCurrent = status === app.status;
                                  
                                  return (
                                    <div
                                      key={status}
                                      className={`w-6 h-6 rounded-full border-2 z-10 ${
                                        isActive 
                                          ? isCurrent 
                                            ? 'bg-blue-500 border-blue-500' 
                                            : 'bg-green-500 border-green-500'
                                          : 'bg-white border-gray-300'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Application Details */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <span className="text-sm text-gray-600">Başvuru Tarihi:</span>
                              <span className="ml-2 text-sm">
                                {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString('tr-TR') : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Son Tarih:</span>
                              <span className="ml-2 text-sm">
                                {app.deadline ? new Date(app.deadline).toLocaleDateString('tr-TR') : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Dil Testi:</span>
                              <span className="ml-2 text-sm">{app.languageTest || '-'}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Dil Puanı:</span>
                              <span className="ml-2 text-sm">{app.languageScore || '-'}</span>
                            </div>
                          </div>

                          {/* Visa Process */}
                          {app.visaProcesses && app.visaProcesses.length > 0 && (
                            <div className="bg-blue-50 rounded p-4 mb-4">
                              <h4 className="font-medium mb-2">Vize Süreci</h4>
                              {app.visaProcesses.map((visa: any) => (
                                <div key={visa.id} className="text-sm">
                                  <div className="flex justify-between items-center mb-1">
                                    <span>Durum:</span>
                                    <Badge className={
                                      visa.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                      visa.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }>
                                      {visa.status}
                                    </Badge>
                                  </div>
                                  {visa.appointmentDate && (
                                    <div className="text-gray-600">
                                      Randevu: {new Date(visa.appointmentDate).toLocaleDateString('tr-TR')}
                                    </div>
                                  )}
                                  {visa.missingDocuments && visa.missingDocuments.length > 0 && (
                                    <div className="mt-2">
                                      <span className="font-medium text-red-600">Eksik Belgeler:</span>
                                      <ul className="list-disc list-inside text-xs mt-1">
                                        {visa.missingDocuments.map((doc: string, i: number) => (
                                          <li key={i}>{doc}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Documents */}
                          {app.documents && app.documents.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Belgeler</h4>
                              <div className="space-y-2">
                                {app.documents.map((doc: any) => (
                                  <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <div className="flex items-center space-x-2">
                                      {getDocumentStatusIcon(doc.status)}
                                      <span>{doc.documentName}</span>
                                    </div>
                                    <Badge className={
                                      doc.status === 'UPLOADED' || doc.status === 'VERIFIED' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-yellow-100 text-yellow-700'
                                    }>
                                      {doc.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents System */}
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Evrak Sistemi</CardTitle>
                  <DocumentAddDialog studentId={id} applications={student.applications} />
                </CardHeader>
                <CardContent>
                  {allDocuments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz evrak yüklenmemiş.</p>
                  ) : (
                    <div className="space-y-3">
                      {allDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getDocumentStatusIcon(doc.status)}
                            <div>
                              <p className="font-medium">{doc.documentName}</p>
                              <p className="text-sm text-gray-600">{doc.documentType}</p>
                            </div>
                          </div>
                          <Badge className={doc.status === 'UPLOADED' || doc.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {doc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit History Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Zaman Çizelgesi (Audit History)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.user?.auditLogs && student.user.auditLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Henüz işlem geçmişi yok.</p>
                ) : (
                  <div className="space-y-4">
                    {student.user?.auditLogs?.map((log: any) => (
                      <div key={log.id} className="border-l-4 border-l-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{log.action}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        {log.entityType && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Varlık:</span> {log.entityType}
                            {log.entityId && <span className="ml-1">({log.entityId})</span>}
                          </div>
                        )}
                        {log.details && (
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Detay:</span> {log.details}
                          </div>
                        )}
                        {log.user && (
                          <div className="text-xs text-gray-500 mt-1">
                            İşlemi yapan: {log.user.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
