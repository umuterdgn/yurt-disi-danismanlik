import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import CountryChart from "./chart";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AlertBanner } from "@/components/notifications/alert-banner";

export default async function AdminDashboard() {
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
  
  // Get user name from Prisma
  let userName = 'Admin';
  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { name: true }
      });
      if (dbUser?.name) {
        userName = dbUser.name;
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  }

  // 1. Özet İstatistikleri Veritabanından Çekiyoruz
  let totalStudents = 0;
  let activeApplications = 0;
  let visaProcessCount = 0;
  let completedConsultations = 0;
  let allApplications: any[] = [];
  let recentActivities: any[] = [];

  try {
    totalStudents = await prisma.user.count({
      where: { role: 'STUDENT' }
    });
  } catch (error) {
    console.error('Error counting students:', error);
  }

  try {
    activeApplications = await prisma.application.count({
      where: { 
        status: { notIn: ['COMPLETED', 'REJECTED'] } 
      }
    });
  } catch (error) {
    console.error('Error counting active applications:', error);
  }

  try {
    visaProcessCount = await prisma.application.count({
      where: { status: 'VISA' }
    });
  } catch (error) {
    console.error('Error counting visa processes:', error);
  }

  try {
    completedConsultations = await prisma.appointment.count({
      where: { status: 'completed' }
    });
  } catch (error) {
    console.error('Error counting completed consultations:', error);
  }

  // 2. Ülkelere Göre Başvuru Dağılımını Hesaplıyoruz
  try {
    allApplications = await prisma.application.findMany({
      include: { university: { include: { country: true } } }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    allApplications = [];
  }

  const countryCountMap: Record<string, number> = {};
  allApplications.forEach(app => {
    const countryName = app.university.country.name;
    countryCountMap[countryName] = (countryCountMap[countryName] || 0) + 1;
  });

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"];
  const countryData = Object.keys(countryCountMap).map((country, index) => ({
    country,
    count: countryCountMap[country],
    color: colors[index % colors.length]
  }));

  // 3. Son Aktiviteleri (Başvuruları) Çekiyoruz
  try {
    recentActivities = await prisma.application.findMany({
      take: 8,
      orderBy: { updatedAt: 'desc' },
      include: {
        studentProfile: { include: { user: true } },
        university: { include: { country: true } }
      }
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    recentActivities = [];
  }

  // Durum rozetleri için yardımcı fonksiyonlar
  const getStatusText = (status: ApplicationStatus) => {
    const map: Record<string, string> = {
      INITIAL_INTERVIEW: "Ön Görüşme",
      DOCUMENT_COLLECTION: "Belge Toplama",
      SUBMITTED: "Başvuru Yapıldı",
      ACCEPTED: "Kabul Edildi",
      PAYMENT: "Ödeme Bekliyor",
      VISA: "Vize Sürecinde",
      ACCOMMODATION: "Konaklama",
      COMPLETED: "Tamamlandı",
      REJECTED: "Reddedildi"
    };
    return map[status] || status;
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'VISA':
      case 'ACCEPTED':
      case 'COMPLETED':
        return <Badge variant="default">{getStatusText(status)}</Badge>;
      case 'DOCUMENT_COLLECTION':
      case 'INITIAL_INTERVIEW':
        return <Badge variant="secondary">{getStatusText(status)}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">{getStatusText(status)}</Badge>;
      default:
        return <Badge variant="outline">{getStatusText(status)}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nexa Yönetici Paneli</h1>
        <p className="text-gray-600 mb-8">Hoş Geldiniz, {userName}</p>
        
        <AlertBanner />
        
        {/* Özet Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Öğrenci</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aktif Başvuru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{activeApplications}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vize Sürecinde</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{visaProcessCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tamamlanan Danışmanlık</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedConsultations}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Grafik Bölümü */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Ülkelere Göre Dağılım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <CountryChart data={countryData} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              {countryData.map((item) => (
                <div key={item.country} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.country}: {item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Son Aktiviteler Tablosu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Son Aktiviteler / Başvurular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-600">Öğrenci Adı</TableHead>
                    <TableHead className="text-gray-600">Hedef Ülke</TableHead>
                    <TableHead className="text-gray-600">Başvuru Durumu</TableHead>
                    <TableHead className="text-gray-600">Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.length > 0 ? recentActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium text-gray-900">
                        {activity.studentProfile.user.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {activity.university.country.name}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(activity.status)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(activity.updatedAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        Henüz başvuru bulunmamaktadır.
                      </TableCell>
                    </TableRow>
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