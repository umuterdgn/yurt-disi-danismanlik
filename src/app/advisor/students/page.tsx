import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { AddStudentDialog } from "@/components/add-student-dialog";

export default async function AdvisorStudentsPage() {
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
  let advisorProfileId = null;
  let userName = 'Danışman';
  
  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: {
          advisorProfile: true
        }
      });
      if (dbUser) {
        userRole = dbUser.role;
        advisorProfileId = dbUser.advisorProfile?.id;
        userName = dbUser.name;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  // Role-based filtering: SUPER_ADMIN sees all, ADVISOR sees only their assigned students
  let students: any[] = [];
  try {
    students = await prisma.studentProfile.findMany({
      include: {
        user: true,
        advisor: {
          include: {
            user: true
          }
        },
      },
      where: userRole === 'SUPER_ADMIN' ? {} : { advisorId: advisorProfileId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    students = [];
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Öğrenci Takibi</h1>
          <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
        </div>
        <div className="flex items-center gap-4">
          {userRole === 'SUPER_ADMIN' && (
            <Badge className="bg-purple-100 text-purple-700">SUPER ADMIN - Tüm Öğrenciler Görüntüleniyor</Badge>
          )}
          <AddStudentDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Öğrenci Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Sınıf</TableHead>
                <TableHead>Alan</TableHead>
                <TableHead>Okul</TableHead>
                <TableHead>Hedef Üniversiteler</TableHead>
                <TableHead>Mevcut Puan</TableHead>
                <TableHead>Hedef Puan</TableHead>
                <TableHead>Danışman</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-lg font-medium">Henüz size atanmış bir öğrenci bulunmamaktadır.</p>
                      <p className="text-sm">Öğrenci eklemek için "Öğrenci Ekle" butonunu kullanabilirsiniz.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.user.name}</TableCell>
                    <TableCell>{student.user.email}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {student.domain || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.school}</TableCell>
                    <TableCell>
                      {student.targetUniversities && student.targetUniversities.length > 0
                        ? student.targetUniversities.slice(0, 2).join(', ') +
                          (student.targetUniversities.length > 2 ? ` (+${student.targetUniversities.length - 2})` : '')
                        : '-'}
                    </TableCell>
                    <TableCell>{student.currentScore}</TableCell>
                    <TableCell>{student.targetScore}</TableCell>
                    <TableCell>
                      {student.advisor ? student.advisor.user?.name : '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/advisor/students/${student.id}`}>
                        <Button variant="outline" size="sm">
                          Detaylar
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
