import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, GraduationCap, Calendar, User, AlertCircle, CheckCircle, Clock, Shield, Power, XCircle } from 'lucide-react';
import Link from 'next/link';
import { AdminStudentActions } from "@/components/admin-student-actions";

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
          university: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      examResults: {
        orderBy: { examDate: 'desc' },
        take: 5
      },
      meetingNotes: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!student) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/students" className="inline-flex items-center text-primary hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tüm Öğrencilere Dön
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{student.user.name}</h1>
              <p className="text-gray-600 mt-1">{student.user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={student.user.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                {student.user.isApproved ? "Onaylı" : "Onay Bekliyor"}
              </Badge>
              <Badge className={(student.user.isActive ?? true) ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}>
                {(student.user.isActive ?? true) ? "Aktif" : "Dondurulmuş"}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <AdminStudentActions
              studentId={id}
              isApproved={student.user.isApproved}
              isActive={student.user.isActive}
            />
          </div>
        </div>

        {/* Student Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Öğrenci Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Sınıf</p>
                <p className="font-medium">{student.grade}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Okul</p>
                <p className="font-medium">{student.school || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hedef Üniversite</p>
                <p className="font-medium">{student.targetUniversity || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hizmet Türü</p>
                <Badge variant="outline">{student.serviceType}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Akademik Durum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Mevcut Puan</p>
                <p className="font-medium text-2xl">{student.currentScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hedef Puan</p>
                <p className="font-medium text-2xl">{student.targetScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">XP</p>
                <p className="font-medium">{student.xp}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Streak</p>
                <p className="font-medium">{student.streak} gün</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Danışman Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.advisor ? (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Danışman</p>
                    <p className="font-medium">{student.advisor.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">E-posta</p>
                    <p className="font-medium">{student.advisor.user?.email}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Danışman atanmamış</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Son Başvurular</CardTitle>
            </CardHeader>
            <CardContent>
              {student.applications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Henüz başvuru yok</p>
              ) : (
                <div className="space-y-3">
                  {student.applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{app.university?.name}</p>
                        <p className="text-sm text-gray-500">{app.program}</p>
                      </div>
                      <Badge variant="outline">{app.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Son Sınav Sonuçları</CardTitle>
            </CardHeader>
            <CardContent>
              {student.examResults.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Henüz sınav sonucu yok</p>
              ) : (
                <div className="space-y-3">
                  {student.examResults.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{exam.examName}</p>
                        <p className="text-sm text-gray-500">{exam.examDate.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{exam.actualScore}</p>
                        <p className="text-sm text-gray-500">Hedef: {exam.targetScore}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Meeting Notes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Son Görüşme Notları</CardTitle>
          </CardHeader>
          <CardContent>
            {student.meetingNotes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Henüz görüşme notu yok</p>
            ) : (
              <div className="space-y-3">
                {student.meetingNotes.map((note) => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Görüşme Notu</p>
                      <p className="text-sm text-gray-500">{note.createdAt.toLocaleDateString()}</p>
                    </div>
                    <p className="text-gray-600">{note.notes || 'Not eklenmemiş'}</p>
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