import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DollarSign, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { AddFinanceDialog } from "@/components/add-finance-dialog";

interface FinanceData {
  id: string;
  studentName: string;
  studentEmail: string;
  packageName: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: string;
  overdueInstallments: number;
  nextDueDate?: Date;
}

export default async function AdminFinancePage() {
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
  let financeData: FinanceData[] = [];
  let totalRevenue = 0;
  let pendingCollection = 0;
  let overdueCount = 0;

  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { role: true, name: true }
      });

      if (dbUser) {
        userName = dbUser.name;

        if (dbUser.role === 'SUPER_ADMIN') {
          const financePackages = await prisma.financePackage.findMany({
            include: {
              studentProfile: {
                include: {
                  user: true
                }
              },
              installments: {
                orderBy: { dueDate: 'asc' }
              }
            },
            orderBy: { createdAt: 'desc' }
          });

          financeData = financePackages.map(pkg => {
            const totalAmount = pkg.totalAmount;
            const paidAmount = pkg.paidAmount;
            const remainingAmount = totalAmount - paidAmount;
            
            // Count overdue installments
            const overdueInstallments = pkg.installments.filter(
              inst => inst.status === 'PENDING' && new Date(inst.dueDate) < new Date()
            ).length;

            // Find next due date
            const nextDueDate = pkg.installments.find(
              inst => inst.status === 'PENDING' && new Date(inst.dueDate) >= new Date()
            )?.dueDate;

            return {
              id: pkg.id,
              studentName: pkg.studentProfile.user.name,
              studentEmail: pkg.studentProfile.user.email,
              packageName: pkg.packageName,
              totalAmount,
              paidAmount,
              currency: pkg.currency,
              status: pkg.status,
              overdueInstallments,
              nextDueDate
            };
          });

          // Calculate totals
          totalRevenue = financePackages.reduce((sum, pkg) => sum + pkg.paidAmount, 0);
          pendingCollection = financePackages.reduce((sum, pkg) => sum + (pkg.totalAmount - pkg.paidAmount), 0);
          overdueCount = financeData.reduce((sum, data) => sum + data.overdueInstallments, 0);
        }
      }
    } catch (error) {
      console.error('Error fetching finance data:', error);
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-700">Tamamlandı</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-700">İptal</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-blue-100 text-blue-700">Aktif</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOverdueBadge = (count: number) => {
    if (count === 0) return <Badge variant="outline" className="bg-green-50 text-green-700">Vakitinde</Badge>;
    if (count <= 2) return <Badge className="bg-yellow-100 text-yellow-700">{count} Gecikmiş</Badge>;
    return <Badge className="bg-red-100 text-red-700">{count} Gecikmiş</Badge>;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finans & Muhasebe</h1>
              <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
            </div>
            <AddFinanceDialog onFinanceAdded={() => window.location.reload()} />
          </div>
        </div>

        {/* Toplam Gelir Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Toplam Gelir</CardTitle>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(totalRevenue, 'TRY')}
              </div>
              <p className="text-xs text-gray-500 mt-1">Toplam tahsilat</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Bekleyen Tahsilat</CardTitle>
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {formatCurrency(pendingCollection, 'TRY')}
              </div>
              <p className="text-xs text-gray-500 mt-1">Toplam alacak</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Vadesi Geçen Taksitler</CardTitle>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{overdueCount}</div>
              <p className="text-xs text-gray-500 mt-1">Acil takip gerekli</p>
            </CardContent>
          </Card>
        </div>

        {/* Finans Tablosu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Öğrenci Ödemeleri ve Taksitleri</CardTitle>
          </CardHeader>
          <CardContent>
            {financeData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">Henüz finans kaydı bulunmuyor</p>
                <p className="text-sm">Sistemde ödeme paketi yok.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-600">Öğrenci Adı</TableHead>
                      <TableHead className="text-gray-600">E-posta</TableHead>
                      <TableHead className="text-gray-600">Paket Adı</TableHead>
                      <TableHead className="text-gray-600">Toplam Tutar</TableHead>
                      <TableHead className="text-gray-600">Ödenen</TableHead>
                      <TableHead className="text-gray-600">Kalan</TableHead>
                      <TableHead className="text-gray-600">Durum</TableHead>
                      <TableHead className="text-gray-600">Gecikmiş Taksit</TableHead>
                      <TableHead className="text-gray-600">Sonraki Ödeme</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financeData.map((data) => {
                      const remainingAmount = data.totalAmount - data.paidAmount;
                      return (
                        <TableRow key={data.id}>
                          <TableCell className="font-medium text-gray-900">
                            {data.studentName}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {data.studentEmail}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {data.packageName}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatCurrency(data.totalAmount, data.currency)}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatCurrency(data.paidAmount, data.currency)}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatCurrency(remainingAmount, data.currency)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(data.status)}
                          </TableCell>
                          <TableCell>
                            {getOverdueBadge(data.overdueInstallments)}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {data.nextDueDate ? (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {new Date(data.nextDueDate).toLocaleDateString('tr-TR')}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}