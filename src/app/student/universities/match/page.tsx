import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { UniversityMatcherForm } from "@/components/university-matcher-form";
import { GraduationCap, Sparkles } from 'lucide-react';

export default async function UniversityMatcherPage() {
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
  
  if (!user?.email) {
    return <div className="p-8">Giriş yapmalısınız</div>;
  }

  // Get student profile
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: { user: true }
  });

  if (!studentProfile) {
    return <div className="p-8">Profil bulunamadı</div>;
  }

  // Get available countries for selection
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI University Matcher</h1>
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-gray-600">
            Hoş geldin {studentProfile.user.name}! Yapay zeka ile sana en uygun üniversiteleri bulalım.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Matcher Form */}
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgilerin</CardTitle>
            </CardHeader>
            <CardContent>
              <UniversityMatcherForm 
                studentProfile={studentProfile}
                countries={countries}
                departments={departments}
                studentId={studentProfile.id}
                isAdvisor={false}
              />
            </CardContent>
          </Card>

          {/* Tips and Info */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">💡 Nasıl Çalışır?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <p className="text-sm text-gray-700">Akademik profilin, bütçen ve hedeflerini gir</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <p className="text-sm text-gray-700">AI binlerce üniversite arasından en uygunlarını analiz eder</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <p className="text-sm text-gray-700">Eşleşme yüzdesi ve nedenleriyle öneriler alırsın</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Mevcut Profilin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sınıf:</span>
                    <span className="text-sm font-medium">{studentProfile.grade || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hedef Puan:</span>
                    <span className="text-sm font-medium">{studentProfile.targetScore || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hedef Üniversite:</span>
                    <span className="text-sm font-medium">{studentProfile.targetUniversities?.[0] || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hedef Sınav:</span>
                    <span className="text-sm font-medium">{studentProfile.targetExam || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-900">⚠️ Önemli Not</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800">
                  AI önerileri referans amaçlıdır. Kesin başvuru kararları için danışmanınla görüş ve üniversitelerin resmi web sitelerini kontrol et.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}