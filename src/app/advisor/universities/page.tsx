import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Sparkles, Target, User } from 'lucide-react';
import { UniversityMatcherForm } from "@/components/university-matcher-form";

export default async function UniversitiesPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  const userRole = cookieStore.get('user_role')?.value;

  let advisorProfileId = null;
  let userName = 'Danışman';

  if (userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, advisorProfile: { select: { id: true } } }
      });

      if (dbUser) {
        userName = dbUser.name;
        advisorProfileId = dbUser.advisorProfile?.id;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  // Get students for assignment functionality (filtered by role)
  const students = await prisma.studentProfile.findMany({
    include: { user: true },
    where: userRole === 'SUPER_ADMIN' ? {} : { advisorId: advisorProfileId },
    orderBy: { user: { name: 'asc' } }
  });

  // Get countries for the AI matcher
  const countries = await prisma.country.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
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
      </div>
    </div>
  );
}
