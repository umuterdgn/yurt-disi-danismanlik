import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, AlertCircle, Clock, FileText, User } from "lucide-react";
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

  // NEXA COMMAND CENTER DATA
  let activeStudentsCount = 0;
  let riskyStudentsCount = 0;
  let criticalUrgencyCount = 0;
  let immediateAttentionItems: any[] = [];

  try {
    // Active students (healthScore > 70 and riskStatus = GREEN)
    activeStudentsCount = await prisma.studentProfile.count({
      where: {
        healthScore: { gt: 70 },
        riskStatus: 'GREEN'
      }
    });
  } catch (error) {
    console.error('Error counting active students:', error);
  }

  try {
    // Risky students (riskStatus = RED or YELLOW)
    riskyStudentsCount = await prisma.studentProfile.count({
      where: {
        riskStatus: { in: ['RED', 'YELLOW'] }
      }
    });
  } catch (error) {
    console.error('Error counting risky students:', error);
  }

  try {
    // Critical urgency: Students with RED risk status
    criticalUrgencyCount = await prisma.studentProfile.count({
      where: {
        riskStatus: 'RED'
      }
    });
  } catch (error) {
    console.error('Error counting critical urgency:', error);
  }

  // Immediate Attention Items
  try {
    // 1. Students with RED risk status
    const redRiskStudents = await prisma.studentProfile.findMany({
      where: { riskStatus: 'RED' },
      include: { user: true },
      take: 10
    });

    const redRiskItems = redRiskStudents.map(student => ({
      type: 'RISKY_STUDENT',
      studentId: student.id,
      studentName: student.user.name,
      studentEmail: student.user.email,
      riskLevel: 'RED',
      healthScore: student.healthScore,
      message: `${student.user.name} - Kritik Risk Durumu (Skor: ${student.healthScore})`,
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      urgency: 'high'
    }));

    // 2. Applications with deadline less than 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const urgentApplications = await prisma.application.findMany({
      where: {
        deadline: {
          lte: sevenDaysFromNow,
          gte: new Date()
        },
        status: { notIn: ['ENROLLED', 'REJECTED'] }
      },
      include: {
        studentProfile: { include: { user: true } },
        university: { include: { country: true } }
      },
      take: 10
    });

    const urgentAppItems = urgentApplications.map(app => {
      const daysUntilDeadline = Math.ceil((new Date(app.deadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return {
        type: 'URGENT_APPLICATION',
        applicationId: app.id,
        studentName: app.studentProfile.user.name,
        university: app.university.name,
        country: app.university.country.name,
        deadline: app.deadline,
        daysUntilDeadline,
        message: `${app.studentProfile.user.name} - ${app.university.name} (${app.university.country.name}) başvurusu ${daysUntilDeadline} gün içinde sona eriyor`,
        icon: <Clock className="w-5 h-5 text-orange-600" />,
        urgency: daysUntilDeadline <= 3 ? 'critical' : 'high'
      };
    });

    // 3. Documents pending for more than 5 days
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const pendingDocuments = await prisma.document.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lte: fiveDaysAgo }
      },
      include: {
        application: {
          include: {
            studentProfile: { include: { user: true } },
            university: { include: { country: true } }
          }
        }
      },
      take: 10
    });

    const pendingDocItems = pendingDocuments.map(doc => {
      const daysPending = Math.ceil((new Date().getTime() - new Date(doc.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return {
        type: 'PENDING_DOCUMENT',
        documentId: doc.id,
        studentName: doc.application.studentProfile.user.name,
        documentType: doc.documentType,
        documentName: doc.documentName,
        university: doc.application.university.name,
        daysPending,
        message: `${doc.application.studentProfile.user.name} - ${doc.documentName} (${doc.documentType}) belgesi ${daysPending} gündür bekliyor`,
        icon: <FileText className="w-5 h-5 text-yellow-600" />,
        urgency: daysPending > 10 ? 'high' : 'medium'
      };
    });

    // Combine all immediate attention items
    immediateAttentionItems = [...redRiskItems, ...urgentAppItems, ...pendingDocItems]
      .sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2 };
        return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder];
      })
      .slice(0, 15); // Limit to top 15 items

  } catch (error) {
    console.error('Error fetching immediate attention items:', error);
  }

  // Legacy statistics for compatibility
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
        status: { notIn: ['ENROLLED', 'REJECTED'] } 
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
      case 'OFFER':
      case 'ENROLLED':
        return <Badge variant="default">{getStatusText(status)}</Badge>;
      case 'LEAD':
      case 'SUBMITTED':
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nexa Command Center</h1>
        <p className="text-gray-600 mb-8">Hoş Geldiniz, {userName}</p>
        
        <AlertBanner />
        
        {/* NEXA COMMAND CENTER - Big Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">🟢 Aktif Öğrenci Sayısı</CardTitle>
                <Activity className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{activeStudentsCount}</div>
              <p className="text-xs text-gray-500 mt-1">Sağlıklı ve aktif öğrenciler</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">🟡 Riskli Öğrenciler</CardTitle>
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600">{riskyStudentsCount}</div>
              <p className="text-xs text-gray-500 mt-1">Yüksek veya orta risk altında</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">🔴 Kritik Aciliyet</CardTitle>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">{criticalUrgencyCount}</div>
              <p className="text-xs text-gray-500 mt-1">Acil müdahale gerektiren durumlar</p>
            </CardContent>
          </Card>
        </div>

        {/* Immediate Attention List */}
        <Card className="mb-8 border-2 border-red-200">
          <CardHeader className="bg-red-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Immediate Attention - Acil Müdahale Gerekenler
              </CardTitle>
              <Badge variant="destructive" className="text-sm">
                {immediateAttentionItems.length} öğe
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {immediateAttentionItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">Acil müdahale gerektiren durum yok</p>
                <p className="text-sm">Sistem stabil durumda.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {immediateAttentionItems.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      item.urgency === 'critical' ? 'bg-red-50' : 
                      item.urgency === 'high' ? 'bg-orange-50' : 'bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{item.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{item.message}</p>
                          <Badge 
                            variant={item.urgency === 'critical' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {item.urgency === 'critical' ? 'KRİTİK' : 
                             item.urgency === 'high' ? 'YÜKSEK' : 'ORTA'}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {item.type === 'RISKY_STUDENT' && (
                            <span>Öğrenci ID: {item.studentId} | Sağlık Skoru: {item.healthScore}</span>
                          )}
                          {item.type === 'URGENT_APPLICATION' && (
                            <span>Başvuru ID: {item.applicationId} | Son Tarih: {new Date(item.deadline).toLocaleDateString('tr-TR')}</span>
                          )}
                          {item.type === 'PENDING_DOCUMENT' && (
                            <span>Belge ID: {item.documentId} | {item.daysPending} gün bekliyor</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Legacy Statistics Row */}
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