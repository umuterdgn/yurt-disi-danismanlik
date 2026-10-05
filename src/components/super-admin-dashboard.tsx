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
import { Users, BookOpen, Zap, Clock, Plus, Copy, RefreshCw, Settings, Power } from "lucide-react";
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
    totalAdvisors: number;
    totalStudents: number;
    totalAIUsage: number;
    expiringSoon: number;
  };
  advisors: Advisor[];
}

export function SuperAdminDashboard({ stats, advisors }: SuperAdminDashboardProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  
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
      setCopiedText(loginInfo);
      
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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Paneli</h1>
          <p className="text-gray-600 mt-2">Koç ve abonelik yönetimi</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Aktif Koç Sayısı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalAdvisors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Toplam Öğrenci
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI İstek Sayısı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.totalAIUsage}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Süresi Yaklaşanlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.expiringSoon}</div>
            </CardContent>
          </Card>
        </div>

        {/* Advisors Table */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Koçlar</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Koç Tanımla
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
                <DialogHeader>
                  <DialogTitle>Yeni Koç Tanımla</DialogTitle>
                  <DialogDescription>
                    Platforma yeni bir koç ekleyin
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ahmet Yılmaz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ahmet@example.com"
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
                    {loading ? 'Oluşturuluyor...' : 'Koç Oluştur'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {advisors.map((advisor) => {
                const studentCount = advisor.advisorProfile?.students?.length || 0;
                const daysRemaining = getDaysRemaining(advisor.subscriptionEndsAt);
                const progressPercent = (studentCount / advisor.studentQuota) * 100;
                
                return (
                  <div key={advisor.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{advisor.name}</h3>
                          <Badge variant={advisor.isSubscriptionActive ? "default" : "secondary"}>
                            {advisor.isSubscriptionActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{advisor.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={advisor.isSubscriptionActive ? "default" : "outline"}
                        onClick={() => toggleSubscription(advisor.id, !advisor.isSubscriptionActive)}
                      >
                        <Power className="w-4 h-4 mr-1" />
                        {advisor.isSubscriptionActive ? 'Aktif' : 'Pasif'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Öğrenci Durumu</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={progressPercent} className="flex-1" />
                          <span className="font-medium">{studentCount}/{advisor.studentQuota}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600">Kalan Süre</p>
                        <p className={`font-medium mt-1 ${daysRemaining !== null && daysRemaining <= 5 ? 'text-red-600' : ''}`}>
                          {daysRemaining !== null ? `${daysRemaining} Gün Kaldı` : 'Sonsuz'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">AI İstek</p>
                        <p className="font-medium mt-1">{advisor.aiUsageCount}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addDays(advisor.id, 30)}
                        >
                          +30 Gün
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addDays(advisor.id, 90)}
                        >
                          +90 Gün
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
