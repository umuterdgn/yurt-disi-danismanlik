import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function AdminAppointmentsPage() {
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
  let appointments: any[] = [];

  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { role: true, name: true }
      });

      if (dbUser) {
        userName = dbUser.name;

        // SUPER_ADMIN sees all appointments
        if (dbUser.role === 'SUPER_ADMIN') {
          appointments = await prisma.meetingNote.findMany({
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
              }
            },
            orderBy: { meetingDate: 'desc' }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Randevular</h1>
          <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Tüm Randevular</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-600">Tarih</TableHead>
                  <TableHead className="text-gray-600">Öğrenci Adı</TableHead>
                  <TableHead className="text-gray-600">Danışman Adı</TableHead>
                  <TableHead className="text-gray-600">Konu/Not</TableHead>
                  <TableHead className="text-gray-600">Süre</TableHead>
                  <TableHead className="text-gray-600">Motivasyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <p className="text-lg font-medium">Henüz randevu bulunmuyor</p>
                        <p className="text-sm">Sistemde kayıtlı görüşme/randevu yok.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium text-gray-900">
                        {new Date(appointment.meetingDate).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {appointment.studentProfile?.user?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {appointment.studentProfile?.advisor?.user?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate">
                        {appointment.notes || appointment.issues || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {appointment.duration} dk
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          appointment.motivationLevel === 'high' ? 'bg-green-100 text-green-700' :
                          appointment.motivationLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {appointment.motivationLevel === 'high' ? 'Yüksek' :
                           appointment.motivationLevel === 'medium' ? 'Orta' : 'Düşük'}
                        </Badge>
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
