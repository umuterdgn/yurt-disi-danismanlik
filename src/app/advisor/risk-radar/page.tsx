import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { AlertTriangle, Activity, Clock, TrendingDown, AlertCircle, CheckCircle, User, Calendar, FileText } from 'lucide-react';

export default async function AdvisorRiskRadar() {
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
  
  let atRiskStudents: any[] = [];
  let userName = 'Danışman';
  let userRole = '';

  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: {
          advisorProfile: true
        }
      });

      if (dbUser) {
        userName = dbUser.name;
        userRole = dbUser.role;

        const whereClause = dbUser.role === 'SUPER_ADMIN' 
          ? { riskStatus: { in: ['RED', 'YELLOW'] } }
          : { 
              advisorId: dbUser.advisorProfile?.id,
              riskStatus: { in: ['RED', 'YELLOW'] }
            };

        atRiskStudents = await prisma.studentProfile.findMany({
          where: whereClause,
          include: {
            user: true,
            advisor: {
              include: {
                user: true
              }
            },
            dailyTasks: {
              where: { isCompleted: false },
              orderBy: { taskDate: 'asc' },
              take: 5
            },
            examResults: {
              orderBy: { examDate: 'desc' },
              take: 3
            },
            aiRecommendations: {
              where: { isResolved: false },
              orderBy: { createdAt: 'desc' },
              take: 3
            }
          },
          orderBy: { healthScore: 'asc' }
        });
      }
    } catch (error) {
      console.error('Error fetching risk data:', error);
    }
  }

  const getRiskBadge = (riskStatus: string) => {
    switch (riskStatus) {
      case 'RED':
        return <Badge className="bg-red-100 text-red-700 border-red-300">🚨 KRİTİK RİSK</Badge>;
      case 'YELLOW':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">⚠️ YÜKSEK RİSK</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-700">GÜVENLİ</Badge>;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'İyi';
    if (score >= 60) return 'Orta';
    if (score >= 40) return 'Düşük';
    return 'Kritik';
  };

  const calculateRiskFactors = (student: any) => {
    const factors = [];
    
    // Health score check
    if (student.healthScore < 50) {
      factors.push({
        type: 'HEALTH',
        icon: <Activity className="w-4 h-4 text-red-600" />,
        message: `Sağlık skoru kritik seviyede (${student.healthScore}/100)`,
        severity: 'HIGH'
      });
    } else if (student.healthScore < 70) {
      factors.push({
        type: 'HEALTH',
        icon: <Activity className="w-4 h-4 text-yellow-600" />,
        message: `Sağlık skoru düşük (${student.healthScore}/100)`,
        severity: 'MEDIUM'
      });
    }

    // Overdue tasks check
    const overdueTasks = student.dailyTasks.filter((task: any) => 
      new Date(task.taskDate) < new Date() && !task.isCompleted
    );
    if (overdueTasks.length > 0) {
      factors.push({
        type: 'TASKS',
        icon: <Clock className="w-4 h-4 text-red-600" />,
        message: `${overdueTasks.length} geçmiş görev tamamlanmamış`,
        severity: 'HIGH'
      });
    }

    // Exam performance trend
    if (student.examResults.length >= 2) {
      const latest = student.examResults[0].actualScore || 0;
      const previous = student.examResults[1].actualScore || 0;
      if (latest < previous) {
        factors.push({
          type: 'PERFORMANCE',
          icon: <TrendingDown className="w-4 h-4 text-red-600" />,
          message: `Son deneme neti düşüş gösterdi (${previous} → ${latest})`,
          severity: 'HIGH'
        });
      }
    }

    // Inactivity check
    if (student.lastActivityDate) {
      const daysSinceActivity = Math.floor(
        (new Date().getTime() - new Date(student.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceActivity > 7) {
        factors.push({
          type: 'INACTIVITY',
          icon: <Clock className="w-4 h-4 text-orange-600" />,
          message: `${daysSinceActivity} gündür aktivite yok`,
          severity: 'MEDIUM'
        });
      }
    }

    return factors;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            Risk Radarı
          </h1>
          <p className="text-gray-600 mt-2">
            RED ve YELLOW risk statüsündeki öğrenciler ve AI müdahale önerileri
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Kritik Risk (RED)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {atRiskStudents.filter(s => s.riskStatus === 'RED').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Yüksek Risk (YELLOW)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {atRiskStudents.filter(s => s.riskStatus === 'YELLOW').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Ortalama Sağlık Skoru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {atRiskStudents.length > 0 
                  ? Math.round(atRiskStudents.reduce((sum, s) => sum + s.healthScore, 0) / atRiskStudents.length)
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* At Risk Students */}
        {atRiskStudents.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Riskli Öğrenci Yok</h3>
                <p className="text-gray-600">
                  Tüm öğrencileriniz şu anda güvenli statüde. Harika gidiyor!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {atRiskStudents.map((student) => {
              const riskFactors = calculateRiskFactors(student);
              
              return (
                <Card key={student.id} className={`border-2 ${
                  student.riskStatus === 'RED' ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                          {student.studentSymbol || '🎓'}
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {student.user.name}
                            {getRiskBadge(student.riskStatus)}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {student.grade}. Sınıf • {student.targetUniversity || 'Hedef belirtilmemiş'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Sağlık Skoru</div>
                        <div className={`text-3xl font-bold ${getHealthScoreColor(student.healthScore)}`}>
                          {student.healthScore}
                          <span className="text-sm font-normal text-gray-600">/100</span>
                        </div>
                        <div className="text-sm text-gray-600">{getHealthScoreLabel(student.healthScore)}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Risk Factors */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Risk Faktörleri
                      </h4>
                      {riskFactors.length === 0 ? (
                        <p className="text-gray-500 text-sm">Belirlenmiş risk faktörü yok</p>
                      ) : (
                        <div className="space-y-2">
                          {riskFactors.map((factor, index) => (
                            <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                              factor.severity === 'HIGH' ? 'bg-red-100 border border-red-200' : 'bg-yellow-100 border border-yellow-200'
                            }`}>
                              {factor.icon}
                              <span className="text-sm font-medium text-gray-900">{factor.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AI Recommendations */}
                    {student.aiRecommendations.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          AI Müdahale Önerileri
                        </h4>
                        <div className="space-y-2">
                          {student.aiRecommendations.map((rec: any) => (
                            <div key={rec.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">{rec.message}</span>
                                <Badge className={
                                  rec.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                  rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }>
                                  {rec.priority}
                                </Badge>
                              </div>
                              {rec.suggestedAction && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <strong>Öneri:</strong> {rec.suggestedAction}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/advisor/students/${student.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Profili Görüntüle
                        </Button>
                      </Link>
                      <Link href={`/advisor/tasks?student=${student.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Görevleri Ata
                        </Button>
                      </Link>
                      <Link href={`/advisor/meetings?student=${student.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Görüşme Planla
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}