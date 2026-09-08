import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { updateStudentSettings } from "@/actions/update-student-settings";
import StudentSettingsClient from "./client";

const SYMBOLS = [
  { emoji: "🎓", name: "Mezun" },
  { emoji: "🚀", name: "Roket" },
  { emoji: "🦁", name: "Aslan" },
  { emoji: "🦉", name: "Baykuş" },
  { emoji: "⚡", name: "Yıldırım" },
  { emoji: "🔥", name: "Alev" },
  { emoji: "🌟", name: "Yıldız" },
  { emoji: "💎", name: "Elmas" },
  { emoji: "🎯", name: "Hedef" },
  { emoji: "🏆", name: "Kupa" },
  { emoji: "🎨", name: "Sanat" },
  { emoji: "🎸", name: "Müzik" },
];

export default async function StudentSettingsPage() {
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
  
  let studentProfile = null;
  let userName = 'Öğrenci';

  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { studentProfile: true }
      });

      if (dbUser?.studentProfile) {
        studentProfile = dbUser.studentProfile;
        userName = dbUser.name;
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Profil Ayarları</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentSettingsClient 
              studentProfile={studentProfile}
              symbols={SYMBOLS}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
