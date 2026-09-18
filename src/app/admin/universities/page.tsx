import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Building2, Globe } from "lucide-react";
import Link from "next/link";

export default async function AdminUniversitiesPage() {
  const universities = await prisma.university.findMany({
    include: {
      country: true,
      _count: {
        select: { applications: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Üniversite & Ülke Veritabanı</h1>
            <p className="text-gray-600 mt-2">Üniversite ve ülke verilerini yönetin, taban puanları belirleyin</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/content/countries/new">
              <Button variant="outline" className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Yeni Ülke Ekle</span>
              </Button>
            </Link>
            <Link href="/admin/universities/new">
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Yeni Üniversite Ekle</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Ülke</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{countries.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Üniversite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{universities.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aktif Başvuru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {universities.reduce((sum, u) => sum + u._count.applications, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Universities Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Üniversiteler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-600">Üniversite</TableHead>
                  <TableHead className="text-gray-600">Ülke</TableHead>
                  <TableHead className="text-gray-600">Şehir</TableHead>
                  <TableHead className="text-gray-600">Taban Puanı</TableHead>
                  <TableHead className="text-gray-600">Başvuru Sayısı</TableHead>
                  <TableHead className="text-gray-600">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {universities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Henüz üniversite kaydı bulunmuyor. İlk üniversiteyi eklemek için "Yeni Üniversite Ekle" butonunu kullanın.
                    </TableCell>
                  </TableRow>
                ) : (
                  universities.map((university) => (
                    <TableRow key={university.id}>
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-600" />
                          <span>{university.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <Badge className="bg-blue-100 text-blue-700">
                          {university.country.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{university.city || '-'}</TableCell>
                      <TableCell className="text-gray-600">
                        {university.baseScore ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {university.baseScore.toFixed(2)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500">
                            Belirtilmemiş
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <Badge variant="outline">{university._count.applications}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/admin/universities/${university.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}