"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewUniversityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countries, setCountries] = useState<any[]>([]);

  // Fetch countries on component mount
  useEffect(() => {
    async function fetchCountries() {
      try {
        const response = await fetch('/api/admin/countries');
        if (response.ok) {
          const data = await response.json();
          setCountries(data.countries || []);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    }
    fetchCountries();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/admin/universities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          countryId: formData.get('countryId'),
          city: formData.get('city'),
          baseScore: formData.get('baseScore'),
          ranking: formData.get('ranking'),
          type: formData.get('type'),
          tuitionFees: formData.get('tuitionFees'),
          languageRequirement: formData.get('languageRequirement'),
          requiredScore: formData.get('requiredScore'),
          website: formData.get('website'),
          description: formData.get('description'),
          departments: formData.get('departments'),
          applicationDeadline: formData.get('applicationDeadline'),
          requirements: formData.get('requirements')
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Üniversite başarıyla eklendi!");
        router.push('/admin/universities');
      } else {
        toast.error(result.error || "Bir hata oluştu");
        setError(result.error || "Bir hata oluştu");
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating university:', error);
      toast.error("Üniversite oluşturulurken bir hata oluştu");
      setError("Üniversite oluşturulurken bir hata oluştu");
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/universities">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Yeni Üniversite Ekle</h1>
          </div>
          <p className="text-gray-600">
            Üniversite bilgilerini ve taban puanlarını girin. Bu bilgiler öğrenci hedef puanı hesaplamalarında kullanılacaktır.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Üniversite Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Üniversite Adı *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Örn: Boğaziçi Üniversitesi"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryId">Ülke *</Label>
                  <Select name="countryId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Ülke seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Şehir</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Örn: İstanbul"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseScore">Geçen Yılki Taban Puanı (Base Score) *</Label>
                  <Input
                    id="baseScore"
                    name="baseScore"
                    type="number"
                    step="0.01"
                    placeholder="Örn: 350.50"
                    required
                  />
                  <p className="text-xs text-gray-500">Bu puan öğrenci hedef puanı hesaplamalarında kullanılacaktır</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ranking">Dünya Sıralaması</Label>
                  <Input
                    id="ranking"
                    name="ranking"
                    type="number"
                    placeholder="Örn: 500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Üniversite Türü</Label>
                  <Select name="type">
                    <SelectTrigger>
                      <SelectValue placeholder="Tür seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Devlet">Devlet</SelectItem>
                      <SelectItem value="Özel">Özel</SelectItem>
                      <SelectItem value="Vakıf">Vakıf</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tuitionFees">Yıllık Ücret (USD)</Label>
                  <Input
                    id="tuitionFees"
                    name="tuitionFees"
                    type="number"
                    step="0.01"
                    placeholder="Örn: 15000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languageRequirement">Dil Gereksinimi</Label>
                  <Input
                    id="languageRequirement"
                    name="languageRequirement"
                    placeholder="Örn: IELTS 6.5, TOEFL 80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredScore">Gereken Puan</Label>
                  <Input
                    id="requiredScore"
                    name="requiredScore"
                    type="number"
                    step="0.01"
                    placeholder="Örn: 6.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Web Sitesi</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.edu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationDeadline">Başvuru Son Tarihi</Label>
                  <Input
                    id="applicationDeadline"
                    name="applicationDeadline"
                    type="date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departments">Bölümler (virgülle ayırın)</Label>
                <Input
                  id="departments"
                  name="departments"
                  placeholder="Örn: Bilgisayar Mühendisliği, İşletme, Hukuk"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Üniversite hakkında genel bilgi..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Başvuru Şartları</Label>
                <Textarea
                  id="requirements"
                  name="requirements"
                  rows={4}
                  placeholder="Başvuru için gerekli belgeler ve şartlar..."
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 mb-4">{error}</div>
              )}

              <div className="flex justify-end gap-3">
                <Link href="/admin/universities">
                  <Button variant="outline">İptal</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? "Ekleniyor..." : "Üniversite Ekle"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}