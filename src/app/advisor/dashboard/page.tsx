import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { AlertBanner } from "@/components/notifications/alert-banner";
import { AddStudentDialog } from "@/components/add-student-dialog";
import { WorksheetUploadDialog } from "@/components/worksheet-upload-dialog";

interface Student {
  id: string;
  name: string;
  grade: string;
  targetUniversity: string;
  currentScore: number;
  targetScore: number;
  lastMeetingDate?: Date;
}

export default async function AdvisorDashboard() {
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
  
  let students: any[] = [];
  let userName = 'Danışman';
  let userRole = '';

  if (user?.email) {
    try {
      // Get user role and name from Prisma
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: {
          advisorProfile: true
        }
      });

      if (dbUser) {
        userName = dbUser.name;
        userRole = dbUser.role;

        // Get students based on role
        if (dbUser.role === 'SUPER_ADMIN') {
          students = await prisma.studentProfile.findMany({
            include: {
              user: true
            },
            orderBy: { user: { createdAt: 'desc' } }
          });
        } else if (dbUser.advisorProfile) {
          students = await prisma.studentProfile.findMany({
            where: { advisorId: dbUser.advisorProfile.id },
            include: {
              user: true
            },
            orderBy: { user: { createdAt: 'desc' } }
          });
        } else {
          // User has no advisor profile - show empty state
          students = [];
        }
      } else {
        // User not found in Prisma - show empty state
        students = [];
      }
    } catch (error) {
      console.error('Error fetching advisor data:', error);
      students = [];
    }
  }

  // Transform students to match interface
  const transformedStudents: Student[] = students.map(s => ({
    id: s.id,
    name: s.user.name,
    grade: s.grade,
    targetUniversity: s.targetUniversity,
    currentScore: s.currentScore,
    targetScore: s.targetScore,
    lastMeetingDate: undefined as Date | undefined
  }));

  // Get last meeting dates for each student
  for (const student of transformedStudents) {
    try {
      const lastMeeting = await prisma.meetingNote.findFirst({
        where: { studentProfileId: student.id },
        orderBy: { meetingDate: 'desc' }
      });
      if (lastMeeting) {
        student.lastMeetingDate = lastMeeting.meetingDate;
      }
    } catch (error) {
      console.error('Error fetching meeting notes:', error);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ana Panel</h1>
              <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
            </div>
            <AddStudentDialog />
          </div>
        </div>
        <AlertBanner />
        {userRole === 'SUPER_ADMIN' && (
          <div className="mb-6">
            <Badge className="bg-[#c89f65]/20 text-[#c89f65]">SUPER ADMIN - Tüm Öğrenciler Görüntüleniyor</Badge>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Öğrenci</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{transformedStudents.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ortalama Mevcut Puan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#c89f65]">
                {transformedStudents.length > 0
                  ? Math.round(transformedStudents.reduce((sum, s) => sum + s.currentScore, 0) / transformedStudents.length)
                  : 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Hedefe Ulaşan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0f2042]">
                {transformedStudents.filter(s => s.currentScore >= s.targetScore).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bu Hafta Görüşme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#c89f65]">
                {transformedStudents.filter(s => {
                  if (!s.lastMeetingDate) return false;
                  const lastMeeting = new Date(s.lastMeetingDate);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return lastMeeting >= weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold text-gray-900">Öğrenci Listesi</CardTitle>
            {transformedStudents.length > 0 && (
              <WorksheetUploadDialog 
                studentId={transformedStudents[0].id}
                trigger={
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    📄 Yaprak Test Yükle
                  </Button>
                }
              />
            )}
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-600">Öğrenci Adı</TableHead>
                    <TableHead className="text-gray-600">Sınıf</TableHead>
                    <TableHead className="text-gray-600">Hedef Üniversite/Bölüm</TableHead>
                    <TableHead className="text-gray-600">Mevcut Net</TableHead>
                    <TableHead className="text-gray-600">Hedef Net</TableHead>
                    <TableHead className="text-gray-600">İlerleme</TableHead>
                    <TableHead className="text-gray-600">Son Görüşme</TableHead>
                    <TableHead className="text-gray-600">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transformedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-900 font-medium mb-1">Henüz Öğrenci Yok</p>
                            <p className="text-gray-500 text-sm">
                              {userRole === 'SUPER_ADMIN' 
                                ? 'Sistemde henüz kayıtlı öğrenci bulunmuyor.' 
                                : 'Henüz size atanmış öğrenci bulunmuyor. "Yeni Öğrenci Ekle" butonunu kullanarak öğrenci ekleyebilirsiniz.'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transformedStudents.map((student) => {
                      const progress = student.targetScore > 0 
                        ? Math.round((student.currentScore / student.targetScore) * 100) 
                        : 0;
                      
                      return (
                        <TableRow 
                          key={student.id} 
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <TableCell className="font-medium text-gray-900">{student.name}</TableCell>
                          <TableCell className="text-gray-600">{student.grade}</TableCell>
                          <TableCell className="text-gray-600">{student.targetUniversity}</TableCell>
                          <TableCell className="text-gray-600">{student.currentScore}</TableCell>
                          <TableCell className="text-gray-600">{student.targetScore}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-[#c89f65] h-2 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">%{progress}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {student.lastMeetingDate 
                              ? new Date(student.lastMeetingDate).toLocaleDateString('tr-TR')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/advisor/students/${student.id}`}
                              className="text-[#c89f65] hover:text-[#c89f65]/80 font-medium"
                            >
                              Detaylar
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
