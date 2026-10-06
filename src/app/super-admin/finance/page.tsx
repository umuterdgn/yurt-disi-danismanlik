import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

export default async function FinancePage() {
  const cookieStore = await cookies();

  // Check custom auth cookies first (legacy support)
  const userId = cookieStore.get('user_id')?.value;
  const userRole = cookieStore.get('user_role')?.value;

  if (userId && userRole === 'SUPER_ADMIN') {
    // User is authenticated via custom cookies, proceed to render
  } else {
    // Fallback to Supabase auth
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

    if (!user?.email) {
      redirect('/login');
    }

    // Check if user is SUPER_ADMIN
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
      redirect('/');
    }
  }

  // Mock data for finance page
  const mockStats = {
    mrr: 45000,
    totalRevenue: 540000,
    pendingPayments: 12500
  };

  const mockTransactions = [
    { id: 1, customer: 'ATA Vision Danışmanlık', amount: 5000, status: 'paid', date: '2024-10-01' },
    { id: 2, customer: 'Global Education Hub', amount: 7500, status: 'paid', date: '2024-10-05' },
    { id: 3, customer: 'Future Academy', amount: 6000, status: 'pending', date: '2024-10-10' },
    { id: 4, customer: 'EduConsult Pro', amount: 4500, status: 'paid', date: '2024-10-12' },
    { id: 5, customer: 'Study Abroad Experts', amount: 8000, status: 'pending', date: '2024-10-15' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Finans & Lisans</h1>
        <p className="text-gray-600 mt-2">Gelir takibi ve fatura yönetimi</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Aylık Tekrarlayan Gelir (MRR)</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₺{mockStats.mrr.toLocaleString()}</div>
            <div className="text-sm text-green-600 mt-1">+15% geçen aya göre</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Kazanç</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₺{mockStats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Bu yıl</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Bekleyen Ödemeler</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₺{mockStats.pendingPayments.toLocaleString()}</div>
            <div className="text-sm text-orange-600 mt-1">3 fatura bekliyor</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl">Son İşlemler</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Son faturalar ve ödemeler</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Müşteri</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Tutar</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Durum</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{transaction.customer}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">₺{transaction.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${
                        transaction.status === 'paid' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {transaction.status === 'paid' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {transaction.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{transaction.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
