import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function NewUniversityPage() {
  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' }
  });

  async function createUniversity(formData: FormData) {
    'use server';

    const name = formData.get('name') as string;
    const countryId = formData.get('countryId') as string;
    const city = formData.get('city') as string;
    const baseScore = formData.get('baseScore') as string;
    const ranking = formData.get('ranking') as string;
    const type = formData.get('type') as string;
    const tuitionFees = formData.get('tuitionFees') as string;
    const languageRequirement = formData.get('languageRequirement') as string;
    const requiredScore = formData.get('requiredScore') as string;
    const website = formData.get('website') as string;
    const description = formData.get('description') as string;
    const departments = formData.get('departments') as string;
    const applicationDeadline = formData.get('applicationDeadline') as string;
    const requirements = formData.get('requirements') as string;

    if (!name || !countryId) {
      return { success: false, error: 'Üniversite adı ve ülke seçimi zorunludur' };
    }

    try {
      await prisma.university.create({
        data: {
          name,
          countryId,
          city: city || null,
          baseScore: baseScore ? parseFloat(baseScore) : null,
          ranking: ranking ? parseInt(ranking) : null,
          type: type || null,
          tuitionFees: tuitionFees ? parseFloat(tuitionFees) : null,
          languageRequirement: languageRequirement || null,
          requiredScore: requiredScore ? parseFloat(requiredScore) : null,
          website: website || null,
          description: description || null,
          departments: departments ? departments.split(',').map(d => d.trim()) : [],
          applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
          requirements: requirements || null
        }
      });

      revalidatePath('/admin/universities');
      revalidatePath('/advisor/universities');

      return { success: true };
    } catch (error) {
      console.error('Error creating university:', error);
      return { success: false, error: 'Üniversite oluşturulurken bir hata oluştu' };
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
            <form action={createUniversity} className="space-y-6">
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

              <div className="flex justify-end gap-3">
                <Link href="/admin/universities">
                  <Button variant="outline">İptal</Button>
                </Link>
                <Button type="submit">Üniversite Ekle</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}