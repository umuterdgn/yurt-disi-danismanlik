import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Users, TrendingUp, Heart, Clock, FileText, Calendar } from "lucide-react";
import { AddAdvisorDialog } from "@/components/add-advisor-dialog";

interface AdvisorStats {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  experience?: number;
  maxStudents: number;
  advisorType: string;
  studentCount: number;
  taskCompletionRate: number;
  averageHealthScore: number;
  pendingDocuments: number;
  pendingMeetings: number;
  riskStatus: 'GREEN' | 'YELLOW' | 'RED';
}

export default async function AdminAdvisorsPage() {
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
  
  let userName = 'Admin';
  let advisorStats: AdvisorStats[] = [];

  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { role: true, name: true }
      });

      if (dbUser) {
        userName = dbUser.name;

        // Only SUPER_ADMIN can see advisor analytics
        if (dbUser.role === 'SUPER_ADMIN') {
          const advisors = await prisma.advisorProfile.findMany({
            include: {
              user: true,
              students: {
                include: {
                  user: true,
                  applications: {
                    include: {
                      documents: true
                    }
                  },
                  tasks: true
                }
              },
              tasks: true
            },
            orderBy: { createdAt: 'desc' }
          });

          advisorStats = advisors.map(advisor => {
            const students = advisor.students;
            const studentCount = students.length;
            
            // Calculate task completion rate
            const allTasks = [...students.flatMap(s => s.tasks), ...advisor.tasks];
            const completedTasks = allTasks.filter(t => t.status === 'DONE').length;
            const taskCompletionRate = allTasks.length > 0 
              ? Math.round((completedTasks / allTasks.length) * 100) 
              : 0;

            // Calculate average health score
            const healthScores = students.map(s => s.healthScore);
            const averageHealthScore = healthScores.length > 0
              ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
              : 0;

            // Count pending documents
            const pendingDocuments = students.reduce((acc, student) => {
              return acc + student.applications.reduce((appAcc, app) => {
                return appAcc + app.documents.filter(d => d.status === 'PENDING').length;
              }, 0);
            }, 0);

            // Count pending meetings (appointments that are scheduled)
            const pendingMeetings = students.reduce((acc, student) => {
              return acc + student.applications.reduce((appAcc, app) => {
                return appAcc + (app.status === 'LEAD' || app.status === 'SUBMITTED' ? 1 : 0);
              }, 0);
            }, 0);

            // Determine overall risk status based on student performance
            const riskyStudents = students.filter(s => s.riskStatus === 'RED' || s.riskStatus === 'YELLOW').length;
            let riskStatus: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
            if (riskyStudents > studentCount * 0.5) {
              riskStatus = 'RED';
            } else if (riskyStudents > studentCount * 0.25) {
              riskStatus = 'YELLOW';
            }

            return {
              id: advisor.id,
              name: advisor.user.name,
              email: advisor.user.email,
              specialization: advisor.specialization ?? undefined,
              experience: advisor.experience ?? undefined,
              maxStudents: advisor.maxStudents,
              advisorType: advisor.advisorType,
              studentCount,
              taskCompletionRate,
              averageHealthScore,
              pendingDocuments,
              pendingMeetings,
              riskStatus
            };
          });
        }
      }
    } catch (error) {
      console.error('Error fetching advisor analytics:', error);
    }
  }

  const getRiskBadge = (status: string) => {
    switch (status) {
      case 'GREEN':
        return <Badge className="bg-green-100 text-green-700">Yeşil</Badge>;
      case 'YELLOW':
        return <Badge className="bg-yellow-100 text-yellow-700">Sarı</Badge>;
      case 'RED':
        return <Badge className="bg-red-100 text-red-700">Kırmızı</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBorderColor = (status: string) => {
    switch (status) {
      case 'GREEN':
        return 'border-l-green-500';
      case 'YELLOW':
        return 'border-l-yellow-500';
      case 'RED':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getAdvisorTypeLabel = (type: string) => {
    switch (type) {
      case 'COACH':
        return 'Koç';
      case 'CONSULTANT':
        return 'Danışman';
      case 'BOTH':
        return 'Koç & Danışman';
      default:
        return type;
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Danışman Analitiği</h1>
              <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
            </div>
            <AddAdvisorDialog />
          </div>
        </div>

        {advisorStats.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium text-gray-900">Henüz danışman bulunmuyor</p>
              <p className="text-sm text-gray-500">Sistemde kayıtlı danışman yok.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advisorStats.map((advisor) => (
              <Card key={advisor.id} className={`border-l-4 ${getRiskBorderColor(advisor.riskStatus)} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {advisor.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{advisor.email}</p>
                    </div>
                    {getRiskBadge(advisor.riskStatus)}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {getAdvisorTypeLabel(advisor.advisorType)}
                    </Badge>
                    {advisor.specialization && (
                      <Badge variant="outline" className="text-xs">
                        {advisor.specialization}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Student Count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Öğrenci Sayısı</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">{advisor.studentCount}</span>
                      <span className="text-xs text-gray-500">/ {advisor.maxStudents}</span>
                    </div>
                  </div>

                  {/* Task Completion Rate */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Görev Tamamlama</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{advisor.taskCompletionRate}%</span>
                  </div>

                  {/* Average Health Score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-gray-600">Ort. Sağlık Skoru</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{advisor.averageHealthScore}</span>
                  </div>

                  {/* Pending Documents */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-gray-600">Bekleyen Evrak</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{advisor.pendingDocuments}</span>
                  </div>

                  {/* Pending Meetings */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-600">Bekleyen Görüşme</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{advisor.pendingMeetings}</span>
                  </div>

                  {/* Capacity Indicator */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Kapasite</span>
                      <span className="text-xs text-gray-700 font-medium">
                        {Math.round((advisor.studentCount / advisor.maxStudents) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (advisor.studentCount / advisor.maxStudents) > 0.9 
                            ? 'bg-red-500' 
                            : (advisor.studentCount / advisor.maxStudents) > 0.7 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((advisor.studentCount / advisor.maxStudents) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}