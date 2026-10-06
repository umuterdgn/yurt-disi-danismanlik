import { prisma } from "@/lib/prisma";
import { DocumentStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { FileUploadButton } from "@/components/file-upload-button";
import { DocumentApprovalActions } from "@/components/document-approval-actions";
import { DocumentAddDialog } from "@/components/document-add-dialog";

export default async function DocumentsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  const userRole = cookieStore.get('user_role')?.value;

  let advisorProfileId = null;
  let userName = 'Danışman';

  if (userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          advisorProfile: true
        }
      });
      if (dbUser) {
        advisorProfileId = dbUser.advisorProfile?.id;
        userName = dbUser.name;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  let documents: any[] = [];
  let students: any[] = [];

  if (userRole === 'SUPER_ADMIN') {
    documents = await prisma.document.findMany({
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

    students = await prisma.studentProfile.findMany({
      select: {
        id: true,
        user: { select: { name: true } }
      }
    });
  } else if (advisorProfileId) {
    documents = await prisma.document.findMany({
      where: {
        application: {
          studentProfile: {
            advisorId: advisorProfileId
          }
        }
      },
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

    students = await prisma.studentProfile.findMany({
      where: { advisorId: advisorProfileId },
      select: {
        id: true,
        user: { select: { name: true } }
      }
    });
  }

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'MISSING':
        return (
          <Badge className="bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Eksik
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Beklemede
          </Badge>
        );
      case 'UPLOADED':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Yüklendi
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Onaylandı
          </Badge>
        );
      case 'REVISION_REQUIRED':
        return (
          <Badge className="bg-orange-100 text-orange-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Revizyon Gerekiyor
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Reddedildi
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const missingDocuments = documents.filter((d: any) => d.status === 'MISSING');
  const pendingDocuments = documents.filter((d: any) => d.status === 'PENDING' || d.status === 'UPLOADED');

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Evrak Yönetimi</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Hoş Geldiniz, {userName}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Toplam Evrak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{documents.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Eksik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-red-600">{missingDocuments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Bekleyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-yellow-600">{pendingDocuments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Onaylanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-green-600">
                {documents.filter((d: any) => d.status === 'APPROVED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Missing Documents Alert */}
        {missingDocuments.length > 0 && (
          <Card className="mb-6 md:mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center text-base md:text-lg">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Eksik Evraklar ({missingDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {missingDocuments.map((doc: any) => (
                  <div key={doc.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 bg-white rounded border gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm md:text-base">{doc.application?.studentProfile?.user?.name}</p>
                      <p className="text-xs md:text-sm text-gray-600">{doc.documentType} - {doc.application?.university?.name}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700 text-xs md:text-sm">Eksik</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents Table */}
        <Card>
         <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Evrak Listesi</CardTitle>
            <DocumentAddDialog students={students} />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Öğrenci</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Evrak Tipi</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Başvuru</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Üniversite</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Durum</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Son Tarih</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-gray-500 text-sm">
                        Henüz evrak kaydı bulunmuyor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium text-gray-900 text-xs md:text-sm">
                          {doc.application?.studentProfile?.user?.name || '-'}
                        </TableCell>
                        <TableCell className="text-gray-600 text-xs md:text-sm">{doc.documentType}</TableCell>
                        <TableCell className="text-gray-600 text-xs md:text-sm">{doc.documentName}</TableCell>
                        <TableCell className="text-gray-600 text-xs md:text-sm">
                          {doc.application?.university?.name || '-'}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">{getStatusBadge(doc.status)}</TableCell>
                        <TableCell className="text-gray-600 text-xs md:text-sm">
                          {doc.expiryDate 
                            ? new Date(doc.expiryDate).toLocaleDateString('tr-TR')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <DocumentApprovalActions
                            documentId={doc.id}
                            currentStatus={doc.status}
                            documentType={doc.documentType}
                            studentName={doc.application?.studentProfile?.user?.name || 'Öğrenci'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
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
