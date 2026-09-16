import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function AdminStudentsPage() {
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
  
  let userName = 'Admin';
  let students: any[] = [];

  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { role: true, name: true }
      });

      if (dbUser) {
        userName = dbUser.name;

        // SUPER_ADMIN sees ALL students (no advisorId filter)
        if (dbUser.role === 'SUPER_ADMIN') {
          students = await prisma.studentProfile.findMany({
            include: {
              user: true,
              advisor: {
                include: {
                  user: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tüm Öğrenciler</h1>
          <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Sistemdeki Tüm Öğrenciler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-600">Öğrenci Adı</TableHead>
                  <TableHead className="text-gray-600">E-posta</TableHead>
                  <TableHead className="text-gray-600">Sınıf</TableHead>
                  <TableHead className="text-gray-600">Okul</TableHead>
                  <TableHead className="text-gray-600">Hedef Üniversite</TableHead>
                  <TableHead className="text-gray-600">Mevcut Puan</TableHead>
                  <TableHead className="text-gray-600">Hedef Puan</TableHead>
                  <TableHead className="text-gray-600">Bağlı Olduğu Danışman</TableHead>
                  <TableHead className="text-gray-600">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <p className="text-lg font-medium">Henüz öğrenci bulunmuyor</p>
                        <p className="text-sm">Sistemde kayıtlı öğrenci yok.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium text-gray-900">
                        {student.user.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {student.user.email}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {student.grade}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {student.school}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {student.targetUniversity}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {student.currentScore}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {student.targetScore}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {student.advisor ? student.advisor.user?.name : '-'}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/students/${student.id}`}>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
                            Detaylar
                          </Badge>
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
    </div>
  );
}
