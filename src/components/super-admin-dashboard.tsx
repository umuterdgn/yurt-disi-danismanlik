"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  Users, BookOpen, Zap, Clock, Plus, Copy, RefreshCw, Settings, Power, 
  MoreVertical, ArrowUpRight, ArrowDownRight, BarChart3, Building2, LayoutDashboard,
  TrendingUp, DollarSign, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface Advisor {
  id: string;
  name: string;
  email: string;
  subscriptionEndsAt: Date | null;
  studentQuota: number;
  isSubscriptionActive: boolean;
  aiUsageCount: number;
  advisorProfile: {
    students: any[];
  } | null;
}

interface SuperAdminDashboardProps {
  stats: {
    totalAdmins: number;
    totalStudents: number;
    totalAIUsage: number;
    expiringSoon: number;
  };
  advisors: Advisor[];
}

export function SuperAdminDashboard({ stats, advisors }: SuperAdminDashboardProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [studentQuota, setStudentQuota] = useState('30');
  const [subscriptionDuration, setSubscriptionDuration] = useState('1');

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(password);
  };

  const handleCreateAdvisor = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/super-admin/advisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          studentQuota: parseInt(studentQuota),
          subscriptionDuration: parseInt(subscriptionDuration)
        })
      });

      if (!response.ok) {
        throw new Error('Koç oluşturulamadı');
      }

      const data = await response.json();
      
      const loginInfo = `Merhaba ${name}, platform hesabınız hazırlandı! Giriş Linki: ${window.location.origin}/login | E-posta: ${email} | Şifre: ${password}. İyi çalışmalar dileriz.`;
      
      toast.success('Koç başarıyla oluşturuldu!');
      setOpen(false);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(loginInfo);
      toast.success('Giriş bilgileri kopyalandı!');
      
      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error('Error creating advisor:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (subscriptionEndsAt: Date | null) => {
    if (!subscriptionEndsAt) return null;
    const now = new Date();
    const end = new Date(subscriptionEndsAt);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getFormattedDate = (subscriptionEndsAt: Date | null) => {
    if (!subscriptionEndsAt) return null;
    const end = new Date(subscriptionEndsAt);
    return end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const addDays = async (advisorId: string, days: number) => {
    try {
      const response = await fetch('/api/super-admin/advisors/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisorId, days })
      });

      if (!response.ok) throw new Error('İşlem başarısız');
      
      toast.success(`${days} gün eklendi`);
      window.location.reload();
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  const toggleSubscription = async (advisorId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/super-admin/advisors/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisorId, isActive })
      });

      if (!response.ok) throw new Error('İşlem başarısız');
      
      toast.success('Abonelik durumu güncellendi');
      window.location.reload();
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  const copyLoginInfo = (advisor: Advisor) => {
    const loginInfo = `E-posta: ${advisor.email}\nKurum: ${advisor.name}`;
    navigator.clipboard.writeText(loginInfo);
    toast.success('Giriş bilgileri kopyalandı!');
  };

  const SidebarItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
      active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
    }`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 hidden lg:block">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Nexa</h1>
          <p className="text-sm text-gray-500">Super Admin Panel</p>
        </div>
        
        <nav className="space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
          <SidebarItem icon={Building2} label="Müşteriler" />
          <SidebarItem icon={DollarSign} label="Finans & Lisans" />
          <SidebarItem icon={Settings} label="Ayarlar" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">B2B müşteri yönetimi ve abonelik takibi</p>
          </div>

          {/* Premium Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Aktif Kurum</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalAdmins}</div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+12% geçen aya göre</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Toplam Öğrenci</CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+8% geçen aya göre</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">AI İstek</CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalAIUsage}</div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+24% geçen aya göre</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Süresi Yaklaşan</CardTitle>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats.expiringSoon}</div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <ArrowDownRight className="w-4 h-4" />
                      <span>7 gün içinde bitecek</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rich Data Table */}
          <Card className="shadow-lg border-0">
            <CardHeader className="flex items-center justify-between border-b border-gray-100">
              <div>
                <CardTitle className="text-xl">Müşteriler</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Aktif kurumlar ve abonelik durumları</p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Kurum Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
                  <DialogHeader>
                    <DialogTitle>Yeni Kurum Ekle</DialogTitle>
                    <DialogDescription>
                      Platforma yeni bir kurum ekleyin
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Kurum Adı</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Örn: ATA Vision Danışmanlık"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@kurum.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Başlangıç Şifresi</Label>
                      <div className="flex gap-2">
                        <Input
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Rastgele şifre üretin"
                        />
                        <Button type="button" variant="outline" onClick={generatePassword}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+90 555 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentQuota">Öğrenci Kotası</Label>
                      <Select value={studentQuota} onValueChange={setStudentQuota}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 Öğrenci</SelectItem>
                          <SelectItem value="50">50 Öğrenci</SelectItem>
                          <SelectItem value="100">100 Öğrenci</SelectItem>
                          <SelectItem value="custom">Özel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscriptionDuration">Abonelik Süresi</Label>
                      <Select value={subscriptionDuration} onValueChange={setSubscriptionDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Ay</SelectItem>
                          <SelectItem value="3">3 Ay</SelectItem>
                          <SelectItem value="6">6 Ay</SelectItem>
                          <SelectItem value="12">1 Yıl</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateAdvisor} disabled={loading} className="w-full">
                      {loading ? 'Oluşturuluyor...' : 'Kurum Oluştur'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Müşteri</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Durum</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Kota Kullanımı</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Kalan Süre</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">AI Kullanımı</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisors.map((advisor) => {
                      const studentCount = advisor.advisorProfile?.students?.length || 0;
                      const daysRemaining = getDaysRemaining(advisor.subscriptionEndsAt);
                      const progressPercent = (studentCount / advisor.studentQuota) * 100;
                      const formattedDate = getFormattedDate(advisor.subscriptionEndsAt);
                      
                      return (
                        <tr key={advisor.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                          setSelectedAdvisor(advisor);
                          setDrawerOpen(true);
                        }}>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{advisor.name}</div>
                              <div className="text-sm text-gray-500">{advisor.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant={advisor.isSubscriptionActive ? "default" : "secondary"}
                              className={advisor.isSubscriptionActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}
                            >
                              {advisor.isSubscriptionActive ? 'Aktif' : 'Süresi Dolmuş'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{studentCount}</span>
                                <span className="text-gray-500">/</span>
                                <span className="text-gray-500">{advisor.studentQuota}</span>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                              <div className="text-xs text-gray-500">%{(progressPercent).toFixed(0)} doluluk</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {formattedDate && daysRemaining !== null ? (
                              <div>
                                <div className={`font-medium ${daysRemaining <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                                  Bitiş: {formattedDate}
                                </div>
                                <div className={`text-sm ${daysRemaining <= 5 ? 'text-red-600' : 'text-gray-500'}`}>
                                  {daysRemaining} gün kaldı
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Sonsuz</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-purple-500" />
                              <span className="font-semibold text-gray-900">{advisor.aiUsageCount}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addDays(advisor.id, 30); }}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  30 Gün Uzat
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addDays(advisor.id, 90); }}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  90 Gün Uzat
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyLoginInfo(advisor); }}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Giriş Bilgilerini Kopyala
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleSubscription(advisor.id, !advisor.isSubscriptionActive); }}>
                                  <Power className="w-4 h-4 mr-2" />
                                  {advisor.isSubscriptionActive ? 'Hesabı Askıya Al' : 'Hesabı Aktifleştir'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedAdvisor && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">{selectedAdvisor.name}</SheetTitle>
                <p className="text-sm text-gray-500">{selectedAdvisor.email}</p>
              </SheetHeader>
              
              <Separator className="my-6" />
              
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Hızlı Aksiyonlar</h3>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => copyLoginInfo(selectedAdvisor)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Giriş Bilgilerini Panoya Kopyala
                  </Button>
                </div>

                <Separator />

                {/* Students List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Öğrenciler ({selectedAdvisor.advisorProfile?.students?.length || 0})</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedAdvisor.advisorProfile?.students?.length ? (
                      selectedAdvisor.advisorProfile.students.map((student: any) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{student.grade}</div>
                            <div className="text-sm text-gray-500">
                              Kayıt: {new Date(student.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Henüz öğrenci eklenmemiş
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* AI Usage */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">AI Kullanımı</h3>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{selectedAdvisor.aiUsageCount}</div>
                      <div className="text-sm text-gray-600">Toplam AI İstek</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Subscription Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Abonelik Bilgileri</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Durum</span>
                      <Badge className={selectedAdvisor.isSubscriptionActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {selectedAdvisor.isSubscriptionActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Öğrenci Kotası</span>
                      <span className="font-medium">{selectedAdvisor.studentQuota}</span>
                    </div>
                    {selectedAdvisor.subscriptionEndsAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bitiş Tarihi</span>
                        <span className="font-medium">{getFormattedDate(selectedAdvisor.subscriptionEndsAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
