import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

export default async function EditCountryPage({ params }: { params: { id: string } }) {
  const country = await prisma.country.findUnique({
    where: { id: params.id }
  });

  if (!country) {
    notFound();
  }

  async function updateCountry(formData: FormData) {
    "use server";
    
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const slug = formData.get("slug") as string;
    const pageContent = formData.get("pageContent") as string;
    const coverImage = formData.get("coverImage") as string;
    const isActive = formData.get("isActive") === "true";
    const currency = formData.get("currency") as string;
    const language = formData.get("language") as string;
    const visaRequired = formData.get("visaRequired") === "true";
    const averageCost = formData.get("averageCost") as string;

    // Generate slug from name if not provided
    const finalSlug = slug || name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    try {
      await prisma.country.update({
        where: { id: params.id },
        data: {
          name,
          code: code.toUpperCase(),
          slug: finalSlug,
          pageContent: pageContent || null,
          coverImage: coverImage || null,
          isActive,
          currency: currency || null,
          language: language || null,
          visaRequired,
          averageCost: averageCost ? parseFloat(averageCost) : null,
        }
      });

      redirect("/admin/content/countries");
    } catch (error) {
      console.error("Error updating country:", error);
      throw new Error("Ülke güncellenirken bir hata oluştu.");
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/admin/content/countries">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ülke Düzenle: {country.name}</h1>
            <p className="text-gray-600 mt-2">Ülke tanıtım sayfasını güncelleyin</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ülke Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateCountry} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Ülke Adı *</label>
                  <input
                    id="name"
                    name="name"
                    defaultValue={country.name}
                    placeholder="Örn: Almanya"
                    required
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium">Ülke Kodu *</label>
                  <input
                    id="code"
                    name="code"
                    defaultValue={country.code}
                    placeholder="Örn: DE"
                    maxLength={2}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="slug" className="text-sm font-medium">URL Slug</label>
                  <input
                    id="slug"
                    name="slug"
                    defaultValue={country.slug || ""}
                    placeholder="Otomatik oluşturulur (boş bırakın)"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500">
                    Boş bırakılırsa ülke adından otomatik oluşturulur
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="currency" className="text-sm font-medium">Para Birimi</label>
                  <input
                    id="currency"
                    name="currency"
                    defaultValue={country.currency || ""}
                    placeholder="Örn: EUR"
                    maxLength={3}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium">Dil</label>
                  <input
                    id="language"
                    name="language"
                    defaultValue={country.language || ""}
                    placeholder="Örn: Almanca"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="averageCost" className="text-sm font-medium">Ortalama Maliyet (USD)</label>
                  <input
                    id="averageCost"
                    name="averageCost"
                    type="number"
                    step="0.01"
                    defaultValue={country.averageCost || ""}
                    placeholder="Örn: 15000"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input 
                    type="checkbox" 
                    id="visaRequired" 
                    name="visaRequired" 
                    value="true" 
                    defaultChecked={country.visaRequired}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="visaRequired" className="text-sm font-medium">Vize Gerekli</label>
                </div>

                <div className="flex items-center space-x-4">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    name="isActive" 
                    value="true" 
                    defaultChecked={country.isActive}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">Sayfa Aktif</label>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="coverImage" className="text-sm font-medium">Kapak Fotoğrafı URL</label>
                <input
                  id="coverImage"
                  name="coverImage"
                  defaultValue={country.coverImage || ""}
                  placeholder="https://example.com/image.jpg"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pageContent" className="text-sm font-medium">Sayfa İçeriği (HTML/Markdown)</label>
                <Textarea
                  id="pageContent"
                  name="pageContent"
                  defaultValue={country.pageContent || ""}
                  placeholder="<h2>Eğitim Sistemi</h2><p>Detaylı açıklama...</p>"
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-gray-500">
                  HTML formatında içerik ekleyebilirsiniz. Başlıklar, paragraflar, listeler vb.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/admin/content/countries">
                  <Button variant="outline">İptal</Button>
                </Link>
                <Button type="submit" className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Güncelle</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}