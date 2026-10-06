import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default async function SettingsPage() {
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-2">Platform yapılandırması ve yönetim</p>
      </div>

      <div className="space-y-6">
        {/* Platform Settings */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">Platform Ayarları</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Genel platform yapılandırması</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="aiQuota">Global AI Kota Limiti</Label>
              <Input
                id="aiQuota"
                type="number"
                placeholder="1000"
                defaultValue="1000"
                className="max-w-md"
              />
              <p className="text-sm text-gray-500">Her kurum için aylık AI istek limiti</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode">Sistem Bakım Modu</Label>
                <p className="text-sm text-gray-500">Platformu bakım moduna alır</p>
              </div>
              <Switch id="maintenanceMode" />
            </div>

            <Button>Kaydet</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">Güvenlik Ayarları</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Super Admin güvenliği</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mevcut Şifre</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                className="max-w-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                className="max-w-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="max-w-md"
              />
            </div>

            <Button>Şifre Değiştir</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">Bildirim Ayarları</CardTitle>
            <p className="text-sm text-gray-500 mt-1">E-posta bildirimleri</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="newCustomer">Yeni Müşteri Bildirimi</Label>
                <p className="text-sm text-gray-500">Yeni kurum kaydında e-posta gönder</p>
              </div>
              <Switch id="newCustomer" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="expiringSub">Abonelik Bitiş Bildirimi</Label>
                <p className="text-sm text-gray-500">Abonelik bitişinde uyarı gönder</p>
              </div>
              <Switch id="expiringSub" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="paymentAlert">Ödeme Uyarısı</Label>
                <p className="text-sm text-gray-500">Ödeme gecikmesinde bildirim gönder</p>
              </div>
              <Switch id="paymentAlert" defaultChecked />
            </div>

            <Button>Kaydet</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
