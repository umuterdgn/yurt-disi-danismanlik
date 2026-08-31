import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default async function AdminCountriesPage() {
  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ülke Sayfaları</h1>
            <p className="text-gray-600 mt-2">Ülke tanıtım sayfalarını yönetin</p>
          </div>
          <Link href="/admin/content/countries/new">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Yeni Ülke Ekle</span>
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tüm Ülkeler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-600">Ülke Adı</TableHead>
                  <TableHead className="text-gray-600">Slug</TableHead>
                  <TableHead className="text-gray-600">Kod</TableHead>
                  <TableHead className="text-gray-600">Durum</TableHead>
                  <TableHead className="text-gray-600">İçerik</TableHead>
                  <TableHead className="text-gray-600">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.length > 0 ? countries.map((country: any) => (
                  <TableRow key={country.id}>
                    <TableCell className="font-medium text-gray-900">
                      {country.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {country.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <Badge variant="outline">{country.code}</Badge>
                    </TableCell>
                    <TableCell>
                      {country.isActive ? (
                        <Badge variant="default" className="bg-green-600">
                          <Eye className="w-3 h-3 mr-1" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Pasif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {country.pageContent ? (
                        <Badge variant="default">Var</Badge>
                      ) : (
                        <Badge variant="outline">Yok</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link href={`/admin/content/countries/${country.id}/edit`}>
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
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Henüz ülke eklenmemiş. İlk ülkeyi eklemek için "Yeni Ülke Ekle" butonunu kullanın.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Toplam Ülke</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{countries.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aktif Sayfalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {countries.filter((c: any) => c.isActive).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">İçerikli Sayfalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {countries.filter((c: any) => c.pageContent).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}