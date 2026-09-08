import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function AdminApplicationsPage() {
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
  let applications: any[] = [];

  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { role: true, name: true }
      });

      if (dbUser) {
        userName = dbUser.name;

        // SUPER_ADMIN sees all applications
        if (dbUser.role === 'SUPER_ADMIN') {
          applications = await prisma.application.findMany({
            include: {
              studentProfile: {
                include: {
                  user: true,
                  advisor: {
                    include: {
                      user: true
                    }
                  }
                }
              },
              country: true,
              university: true
            },
            orderBy: { createdAt: 'desc' }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'IN_PROGRESS': 'bg-blue-100 text-blue-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDING': 'Beklemede',
      'IN_PROGRESS': 'Devam Ediyor',
      'COMPLETED': 'Tamamlandı',
      'REJECTED': 'Reddedildi'
    };
    return labels[status] || status;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Başvuru Yönetimi</h1>
          <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Tüm Başvurular</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-600">Öğrenci Adı</TableHead>
                  <TableHead className="text-gray-600">Hedef Ülke</TableHead>
                  <TableHead className="text-gray-600">Üniversite</TableHead>
                  <TableHead className="text-gray-600">Bölüm</TableHead>
                  <TableHead className="text-gray-600">Başvuru Durumu</TableHead>
                  <TableHead className="text-gray-600">İlgilenen Danışman</TableHead>
                  <TableHead className="text-gray-600">Başvuru Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <p className="text-lg font-medium">Henüz başvuru bulunmuyor</p>
                        <p className="text-sm">Sistemde kayıtlı yurt dışı başvurusu yok.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium text-gray-900">
                        {application.studentProfile?.user?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {application.country?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {application.university?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {application.program || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(application.status)}>
                          {getStatusLabel(application.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {application.studentProfile?.advisor?.user?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(application.createdAt).toLocaleDateString('tr-TR')}
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
