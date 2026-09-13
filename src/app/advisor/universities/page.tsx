import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Building2, Globe, GraduationCap, Sparkles, Target, User } from 'lucide-react';
import { UniversityMatcherForm } from "@/components/university-matcher-form";

export default async function UniversitiesPage() {
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
  
  let universities: any[] = [];
  let countries: any[] = [];
  let userName = 'Danışman';
  let userRole = null;

  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true, name: true }
    });

    if (dbUser) {
      userName = dbUser.name;
      userRole = dbUser.role;
    }
  }

  universities = await prisma.university.findMany({
    include: {
      country: true,
      _count: {
        select: { applications: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  countries = await prisma.country.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { universities: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Get students for assignment functionality
  const students = await prisma.studentProfile.findMany({
    include: { user: true },
    orderBy: { user: { name: 'asc' } }
  });

  // Get common departments/programs
  const departments = [
    'Computer Science',
    'Business Administration',
    'Engineering',
    'Medicine',
    'Law',
    'Arts & Design',
    'Psychology',
    'Economics',
    'Architecture',
    'Data Science'
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">🎓 Üniversite & Ülke Keşfet (AI)</h1>
          </div>
          <p className="text-gray-600">
            Hoş Geldiniz, {userName}! AI ile öğrencileriniz için en uygun üniversiteleri bulun ve hedef olarak atayın.
          </p>
        </div>

        {/* AI Matcher Section - Prominently Displayed */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Üniversite Eşleştirme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Öğrenci İçin Üniversite Bul
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Bir öğrencinin profil bilgilerine göre AI ile en uygun üniversiteleri bulun, ardından çıkan sonuçlardan birini öğrencinin hedefi olarak atayın.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    <span>Akademik profil analiz edilir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    <span>Bütçe ve dil gereksinimleri karşılaştırılır</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    <span>Eşleşme yüzdesi ve öneriler sunulur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    <span>Sonuç öğrencinin hedefi olarak atanabilir</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Mevcut Öğrenciler ({students.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-sm text-gray-500">Henüz öğrenci kaydı bulunmuyor.</p>
                  ) : (
                    students.slice(0, 5).map((student) => (
                      <div key={student.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                          {student.studentSymbol || '🎓'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.user.name}</p>
                          <p className="text-xs text-gray-500">{student.grade}. Sınıf</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-200">
              <UniversityMatcherForm 
                countries={countries}
                departments={departments}
                students={students}
                isAdvisor={true}
                studentId={undefined}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Kayıtlı Öğrenci</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{students.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Countries Grid */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Ülkeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {countries.map((country) => (
                <Card key={country.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Globe className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{country.name}</p>
                        <p className="text-sm text-gray-600">{country.code}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Üniversite:</span>
                        <Badge variant="outline">{country._count.universities}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

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
                  <TableHead className="text-gray-600">Başvuru Tarihi</TableHead>
                  <TableHead className="text-gray-600">Gereksinimler</TableHead>
                  <TableHead className="text-gray-600">Başvuru Sayısı</TableHead>
                  <TableHead className="text-gray-600">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {universities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                      Henüz üniversite kaydı bulunmuyor.
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
                      <TableCell className="text-gray-600">{university.city}</TableCell>
                      <TableCell className="text-gray-600">
                        {university.applicationDeadline 
                          ? new Date(university.applicationDeadline).toLocaleDateString('tr-TR')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate">
                        {university.requirements || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <Badge variant="outline">{university._count.applications}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Detaylar
                        </Button>
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
