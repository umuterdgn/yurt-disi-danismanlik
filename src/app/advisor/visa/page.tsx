import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisaKanbanBoard } from "@/components/visa-kanban-board";
import { Plane, FileText, AlertCircle } from 'lucide-react';

export default async function AdvisorVisaPage() {
  // Get all visa processes with application details
  const visaProcesses = await prisma.visaProcess.findMany({
    include: {
      application: {
        include: {
          studentProfile: {
            include: { user: true }
          },
          university: {
            include: { country: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Serialize Date objects for client-side
  const serializedVisaProcesses = visaProcesses.map((process: any) => ({
    ...process,
    appointmentDate: process.appointmentDate?.toISOString() || null,
    createdAt: process.createdAt?.toISOString() || null,
    updatedAt: process.updatedAt?.toISOString() || null,
    application: {
      ...process.application,
      applicationDate: process.application.applicationDate?.toISOString() || null,
      deadline: process.application.deadline?.toISOString() || null,
      decisionDate: process.application.decisionDate?.toISOString() || null,
      createdAt: process.application.createdAt?.toISOString() || null,
      updatedAt: process.application.updatedAt?.toISOString() || null,
    }
  }));

  // Calculate statistics
  const totalProcesses = visaProcesses.length;
  const approvedCount = visaProcesses.filter(p => p.status === 'APPROVED').length;
  const pendingCount = visaProcesses.filter(p => p.status === 'RESULT_PENDING').length;
  const rejectedCount = visaProcesses.filter(p => p.status === 'REJECTED').length;
  const upcomingAppointments = visaProcesses.filter(p => 
    p.appointmentDate && new Date(p.appointmentDate) > new Date()
  ).length;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Plane className="w-8 h-8" />
            Vize Süreci Yönetimi
          </h1>
          <p className="text-gray-600 mt-1">Öğrenci vize başvuru süreçlerini takip edin ve yönetin</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Süreç</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalProcesses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Onaylanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{approvedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sonuç Bekleyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Yaklaşan Randevular</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{upcomingAppointments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts for urgent issues */}
        {rejectedCount > 0 && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertCircle className="w-5 h-5" />
                Dikkat: Reddedilen Başvurular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                {rejectedCount} adet vize başvurusu reddedildi. Lütfen bu başvuruları gözden geçirin.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Visa Kanban Board */}
        {totalProcesses > 0 ? (
          <VisaKanbanBoard visaProcesses={serializedVisaProcesses} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Vize Süreçleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Plane className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz vize süreci bulunmuyor</h3>
                <p className="text-sm">Öğrenci başvuruları vize aşamasına geldiğinde burada görüntülenecek.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}