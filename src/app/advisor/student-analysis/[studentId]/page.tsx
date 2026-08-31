import { prisma } from "@/lib/prisma";
import { ProficiencyLevel } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function AdvisorStudentAnalysisPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  
  // Get current user from Supabase
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
  
  // Get user role and ID from Prisma
  let userRole = null;
  let userId = null;
  
  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true, id: true }
    });
    if (dbUser) {
      userRole = dbUser.role;
      userId = dbUser.id;
    }
  }

  // Get student profile
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      advisor: {
        include: { user: true }
      }
    }
  });

  if (!student) {
    return <div>Öğrenci bulunamadı</div>;
  }

  // Check access: SUPER_ADMIN or assigned ADVISOR
  if (userRole !== 'SUPER_ADMIN' && student.advisorId !== userId) {
    return <div>Bu öğrenciye erişim izniniz yok</div>;
  }

  // Get exam results
  const examResults = await prisma.examResult.findMany({
    where: { studentProfileId: studentId },
    orderBy: { examDate: 'desc' }
  });

  // Get subject analysis
  const subjectAnalysis = await prisma.subjectAnalysis.findMany({
    where: { studentProfileId: studentId }
  });

  // Get meeting notes
  const meetingNotes = await prisma.meetingNote.findMany({
    where: { studentProfileId: studentId },
    orderBy: { meetingDate: 'desc' }
  });

  // Prepare chart data for exam results
  const examChartData = examResults.map(result => ({
    name: result.examName,
    targetScore: result.targetScore,
    actualScore: result.actualScore,
    date: new Date(result.examDate).toLocaleDateString('tr-TR')
  }));

  // Prepare chart data for subject analysis
  const subjectChartData = subjectAnalysis.map(analysis => ({
    subject: `${analysis.subject} - ${analysis.topic}`,
    progress: analysis.progressPercent,
    hours: analysis.totalHours
  }));

  const getProficiencyBadge = (level: ProficiencyLevel) => {
    const colors: Record<ProficiencyLevel, string> = {
      WEAK: 'bg-red-100 text-red-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      GOOD: 'bg-green-100 text-green-700',
      EXCELLENT: 'bg-blue-100 text-blue-700'
    };
    const labels: Record<ProficiencyLevel, string> = {
      WEAK: 'Zayıf',
      MEDIUM: 'Orta',
      GOOD: 'İyi',
      EXCELLENT: 'Mükemmel'
    };
    return (
      <Badge className={colors[level]}>
        {labels[level]}
      </Badge>
    );
  };

  const getMotivationBadge = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-green-100 text-green-700'
    };
    const labels: Record<string, string> = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek'
    };
    return (
      <Badge className={colors[level] || 'bg-gray-100 text-gray-700'}>
        {labels[level] || level}
      </Badge>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Öğrenci Analizi</h1>
        <p className="text-gray-600 mt-2">{student.user.name} - {student.school}</p>
      </div>

      {/* Student Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Öğrenci Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Sınıf</p>
              <p className="font-semibold">{student.grade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hedef Üniversite</p>
              <p className="font-semibold">{student.targetUniversity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hedef Puan</p>
              <p className="font-semibold">{student.targetScore} (Mevcut: {student.currentScore})</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Results Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Deneme Sınav Sonuçları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#ffffff", 
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                />
                <Line type="monotone" dataKey="targetScore" stroke="#10b981" strokeWidth={2} name="Hedef Puan" />
                <Line type="monotone" dataKey="actualScore" stroke="#3b82f6" strokeWidth={2} name="Gerçek Puan" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject Analysis Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Konu Analizi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#ffffff", 
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="progress" fill="#3b82f6" radius={[4, 4, 0, 0]} name="İlerleme %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject Analysis Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Konu Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectAnalysis.map((analysis) => (
              <div key={analysis.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{analysis.subject} - {analysis.topic}</h3>
                    <p className="text-sm text-gray-600">Son çalışma: {analysis.lastStudiedAt ? new Date(analysis.lastStudiedAt).toLocaleDateString('tr-TR') : '-'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getProficiencyBadge(analysis.proficiency)}
                    <Badge variant="outline">{analysis.totalHours} saat</Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${analysis.progressPercent}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">%{analysis.progressPercent} tamamlandı</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meeting Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Görüşme Notları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meetingNotes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{new Date(note.meetingDate).toLocaleDateString('tr-TR')}</h3>
                    <p className="text-sm text-gray-600">{note.duration} dakika</p>
                  </div>
                  {getMotivationBadge(note.motivationLevel)}
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Sorunlar:</strong> {note.issues}</p>
                  <p><strong>Başarılar:</strong> {note.achievements}</p>
                  <p><strong>Aksiyonlar:</strong> {note.actionItems}</p>
                  <p><strong>Notlar:</strong> {note.notes}</p>
                  {note.nextMeetingDate && (
                    <p><strong>Sonraki Görüşme:</strong> {note.nextMeetingDate ? new Date(note.nextMeetingDate).toLocaleDateString('tr-TR') : '-'}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
