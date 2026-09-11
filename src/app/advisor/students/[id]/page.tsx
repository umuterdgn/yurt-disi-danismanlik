import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { FileText, AlertCircle, CheckCircle, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import { AIAnalysisButton } from "@/components/ai-analysis-button";
import { AdvisorNoteForm } from "@/components/advisor-note-form";

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
          university: {
            include: {
              country: true
            }
          },
          documents: true
        },
        orderBy: { createdAt: 'desc' }
      },
      meetingNotes: {
        orderBy: { meetingDate: 'desc' },
        take: 5
      },
      dailyTasks: {
        orderBy: { createdAt: 'desc' }
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

        {/* Summary Cards */}
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

        {/* Main Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profil & Hedefler</TabsTrigger>
            <TabsTrigger value="tasks">Görevler (Kanban)</TabsTrigger>
            <TabsTrigger value="analysis">Konu Analizi (AI)</TabsTrigger>
            <TabsTrigger value="meeting-notes">Görüşme Notları</TabsTrigger>
            <TabsTrigger value="documents">Evrak Sistemi</TabsTrigger>
            <TabsTrigger value="applications">Başvuru Takibi</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
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

              <AdvisorNoteForm 
                studentId={id}
                currentNote={student.advisorNote}
              />
            </div>
          </TabsContent>

          {/* Tasks Tab (Kanban) */}
          <TabsContent value="tasks">
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
          </TabsContent>

          {/* Subject Analysis Tab (AI) */}
          <TabsContent value="analysis">
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
          </TabsContent>

          {/* Meeting Notes Tab */}
          <TabsContent value="meeting-notes">
            <Card>
              <CardHeader>
                <CardTitle>Görüşme Notları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3">Yeni Görüşme Notu Ekle</h3>
                  <div className="space-y-3">
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      placeholder="Tarih"
                    />
                    <textarea
                      className="w-full p-2 border rounded"
                      rows={4}
                      placeholder="Görüşme notları..."
                    />
                    <Button className="w-full">Not Ekle</Button>
                  </div>
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
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Evrak Sistemi</CardTitle>
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
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Başvuru Takip Sistemi</CardTitle>
              </CardHeader>
              <CardContent>
                {student.applications.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Henüz başvuru bulunmuyor.</p>
                ) : (
                  <div className="space-y-4">
                    {student.applications.map((app: any) => (
                      <div key={app.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{app.university?.name || 'Üniversite'}</h3>
                            <p className="text-sm text-gray-600">{app.country?.name || 'Ülke'}</p>
                          </div>
                          <Badge className={getApplicationStatusColor(app.status)}>
                            {app.status}
                          </Badge>
                        </div>
                        {app.deadline && (
                          <p className="text-sm text-gray-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Son Tarih: {new Date(app.deadline).toLocaleDateString('tr-TR')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subject Analysis Tab */}
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Konu Etkinliği Analizi</CardTitle>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
