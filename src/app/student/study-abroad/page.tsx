import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cookies } from 'next/headers';
import { FileUploadButton } from "@/components/file-upload-button";
import { CloudUpload, FileText, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default async function StudentStudyAbroadPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  const userRole = cookieStore.get('user_role')?.value;

  if (!userId || userRole !== 'STUDENT') {
    return <div className="p-8">Giriş yapmalısınız</div>;
  }

  // Get student profile with applications and documents
  let studentProfile = null;
  try {
    studentProfile = await prisma.studentProfile.findUnique({
      where: {
        userId: userId
      },
      include: {
        user: true,
        applications: {
          include: {
            university: true,
            documents: {
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Veri Yükleme Hatası</h2>
          <p className="text-gray-600">Öğrenci bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profil Bulunamadı</h2>
          <p className="text-gray-600">Öğrenci profiliniz bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.</p>
        </div>
      </div>
    );
  }

  // Flatten documents from all applications
  const allDocuments = studentProfile.applications?.flatMap((app: any) => app.documents) || [];

  // Get the most recent application for profile display
  const recentApplication = studentProfile.applications?.[0];

  const getDocumentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'UPLOADED': { label: 'Yüklendi', className: 'bg-green-500 hover:bg-green-600' },
      'APPROVED': { label: 'Onaylandı', className: 'bg-blue-500 hover:bg-blue-600' },
      'REJECTED': { label: 'Reddedildi', className: 'bg-red-500 hover:bg-red-600' },
      'MISSING': { label: 'Eksik', className: 'bg-gray-500 hover:bg-gray-600' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500 hover:bg-gray-600' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'REJECTED':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getApplicationStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'INITIAL_INTERVIEW': { label: 'Ön Görüşme', className: 'bg-blue-100 text-blue-800' },
      'DOCUMENT_COLLECTION': { label: 'Evrak Toplama', className: 'bg-yellow-100 text-yellow-800' },
      'SUBMITTED': { label: 'Başvuruldu', className: 'bg-green-100 text-green-800' },
      'ACCEPTED': { label: 'Kabul Edildi', className: 'bg-green-500 text-white' },
      'PAYMENT': { label: 'Ödeme', className: 'bg-purple-100 text-purple-800' },
      'VISA': { label: 'Vize', className: 'bg-orange-100 text-orange-800' },
      'ACCOMMODATION': { label: 'Konaklama', className: 'bg-pink-100 text-pink-800' },
      'COMPLETED': { label: 'Tamamlandı', className: 'bg-green-500 text-white' },
      'REJECTED': { label: 'Reddedildi', className: 'bg-red-500 text-white' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Yurt Dışı Başvuru Süreci</h1>
        
        {/* Student Profile Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Yurt Dışı Profil Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-blue-100 mb-1">Öğrenci</p>
                <p className="text-xl font-semibold">{studentProfile.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Hedef Üniversite</p>
                <p className="text-xl font-semibold">{recentApplication?.university?.name || studentProfile.targetUniversities?.[0] || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Program</p>
                <p className="text-lg font-semibold">{recentApplication?.program || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Dil Puanı</p>
                <p className="text-lg font-semibold">{recentApplication?.languageTest ? `${recentApplication.languageTest} ${recentApplication.languageScore || ''}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Bütçe</p>
                <p className="text-lg font-semibold">{recentApplication?.estimatedBudget ? `${recentApplication.estimatedBudget} USD` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Başvuru Durumu</p>
                <p className="text-lg font-semibold">
                  {recentApplication ? getApplicationStatusBadge(recentApplication.status) : <Badge className="bg-gray-500">Başvuru Yok</Badge>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Section */}
        {studentProfile.applications && studentProfile.applications.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Başvurularım</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentProfile.applications.map((application: any) => (
                  <div key={application.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{application.university?.name || 'Bilinmeyen Üniversite'}</h3>
                        <p className="text-sm text-gray-600">{application.program} - {application.year}</p>
                      </div>
                      {getApplicationStatusBadge(application.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Başvuru Tarihi</p>
                        <p className="font-medium">{application.applicationDate ? new Date(application.applicationDate).toLocaleDateString('tr-TR') : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Dil Testi</p>
                        <p className="font-medium">{application.languageTest || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Dil Puanı</p>
                        <p className="font-medium">{application.languageScore || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Evrak Durumu</p>
                        <p className="font-medium">{application.documents?.length || 0} evrak</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">Evraklarım</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Yüklendi: {allDocuments.filter((d: any) => d.status === "UPLOADED" || d.status === "APPROVED").length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">Eksik: {allDocuments.filter((d: any) => d.status === "MISSING").length}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {allDocuments.length === 0 ? (
              <div className="text-center py-8">
                <CloudUpload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Henüz evrak yüklenmemiş.</p>
                <Button variant="outline" className="w-full">
                  <CloudUpload className="w-4 h-4 mr-2" />
                  Evrak Yükle
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-600">Evrak Adı</TableHead>
                        <TableHead className="text-gray-600">Tür</TableHead>
                        <TableHead className="text-gray-600">Durum</TableHead>
                        <TableHead className="text-gray-600">Yükleme Tarihi</TableHead>
                        <TableHead className="text-gray-600">Son Kullanma</TableHead>
                        <TableHead className="text-gray-600">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allDocuments.map((doc: any) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium text-gray-900">{doc.documentName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.documentType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getDocumentStatusIcon(doc.status)}
                              {getDocumentStatusBadge(doc.status)}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('tr-TR') : '-'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('tr-TR') : '-'}
                          </TableCell>
                          <TableCell>
                            <FileUploadButton 
                              documentId={doc.id}
                              filePath={doc.filePath}
                              documentName={doc.documentName}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Document Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">Tamamlanan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-700">
                        {allDocuments.filter((d: any) => d.status === "UPLOADED" || d.status === "APPROVED").length}/{allDocuments.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-red-700">Eksik Evrak</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-red-700">
                        {allDocuments.filter((d: any) => d.status === "MISSING").length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">Bekleyen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-700">
                        {allDocuments.filter((d: any) => d.status === "UPLOADED").length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-purple-700">Onaylı</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-700">
                        {allDocuments.filter((d: any) => d.status === "APPROVED").length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Urgent Documents Alert */}
                {allDocuments.filter((d: any) => d.status === "MISSING").length > 0 && (
                  <Card className="mt-6 bg-red-50 border-red-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-red-100 rounded-full">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-900 mb-1">Acil Eksik Evraklar</h3>
                          <p className="text-sm text-red-800 mb-2">
                            Başvurunuzun tamamlanması için aşağıdaki evrakları en kısa sürede yüklemeniz gerekmektedir:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {allDocuments.filter((d: any) => d.status === "MISSING").map((doc: any) => (
                              <Badge key={doc.id} variant="outline" className="border-red-300 text-red-700">
                                {doc.documentName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
