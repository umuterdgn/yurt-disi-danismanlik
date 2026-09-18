import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { AlertTriangle, Activity, Clock, TrendingDown, AlertCircle, CheckCircle, User, Calendar, FileText, Heart } from 'lucide-react';

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

    // Burnout Protection: Weekly Check-in Analysis
    if (student.weeklyCheckIns && student.weeklyCheckIns.length > 0) {
      const latestCheckIn = student.weeklyCheckIns[0];
      const previousCheckIn = student.weeklyCheckIns[1];

      // Current risk assessment
      const isCurrentlyAtRisk = latestCheckIn.stressLevel >= 4 || latestCheckIn.motivationLevel <= 2;
      
      if (isCurrentlyAtRisk) {
        const riskType = latestCheckIn.stressLevel >= 4 ? 'Stres' : 'Motivasyon';
        const riskValue = latestCheckIn.stressLevel >= 4 ? latestCheckIn.stressLevel : latestCheckIn.motivationLevel;
        
        factors.push({
          type: 'BURNOUT',
          icon: <AlertCircle className="w-4 h-4 text-red-600" />,
          message: `Tükenmişlik Riski: ${riskType} seviyesi kritik (${riskValue}/5)`,
          severity: 'HIGH'
        });
      }

      // Consecutive risk check for critical status
      if (previousCheckIn && isCurrentlyAtRisk) {
        const wasPreviouslyAtRisk = previousCheckIn.stressLevel >= 4 || previousCheckIn.motivationLevel <= 2;
        
        if (wasPreviouslyAtRisk) {
          factors.push({
            type: 'CRITICAL_BURNOUT',
            icon: <AlertTriangle className="w-4 h-4 text-red-700" />,
            message: 'Kritik Tükenmişlik Riski: Art arda 2 hafta riskli durum',
            severity: 'CRITICAL'
          });
        }
      }

      // Check if student hasn't submitted check-in recently
      const currentWeek = Math.ceil(new Date().getDate() / 7);
      const currentYear = new Date().getFullYear();
      const hasCurrentWeekCheckIn = student.weeklyCheckIns.some(
        (checkIn: any) => checkIn.weekNumber === currentWeek && checkIn.year === currentYear
      );

      if (!hasCurrentWeekCheckIn) {
        factors.push({
          type: 'MISSING_CHECKIN',
          icon: <Clock className="w-4 h-4 text-orange-600" />,
          message: 'Bu hafta durum bildirimi yapılmamış',
          severity: 'MEDIUM'
        });
      }
    } else {
      // No check-ins at all
      factors.push({
        type: 'NO_CHECKINS',
        icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
        message: 'Henüz durum bildirimi yapılmamış',
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
            },
            weeklyCheckIns: {
              orderBy: { createdAt: 'desc' },
              take: 4
            }
          },
          orderBy: { healthScore: 'asc' }
        });

        // Sort students by burnout risk (students with burnout risk factors first)
        atRiskStudents.sort((a, b) => {
          const aFactors = calculateRiskFactors(a);
          const bFactors = calculateRiskFactors(b);
          
          const aHasBurnout = aFactors.some(f => f.type === 'BURNOUT' || f.type === 'CRITICAL_BURNOUT');
          const bHasBurnout = bFactors.some(f => f.type === 'BURNOUT' || f.type === 'CRITICAL_BURNOUT');
          
          if (aHasBurnout && !bHasBurnout) return -1;
          if (!aHasBurnout && bHasBurnout) return 1;
          
          const aHasCritical = aFactors.some(f => f.type === 'CRITICAL_BURNOUT');
          const bHasCritical = bFactors.some(f => f.type === 'CRITICAL_BURNOUT');
          
          if (aHasCritical && !bHasCritical) return -1;
          if (!aHasCritical && bHasCritical) return 1;
          
          return a.healthScore - b.healthScore;
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
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

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-900 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Tükenmişlik Riski
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {atRiskStudents.filter(s => {
                  const factors = calculateRiskFactors(s);
                  return factors.some(f => f.type === 'BURNOUT' || f.type === 'CRITICAL_BURNOUT');
                }).length}
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
              const hasBurnoutRisk = riskFactors.some(f => f.type === 'BURNOUT' || f.type === 'CRITICAL_BURNOUT');
              const isCriticalBurnout = riskFactors.some(f => f.type === 'CRITICAL_BURNOUT');
              
              return (
                <Card key={student.id} className={`border-2 ${
                  isCriticalBurnout ? 'border-red-500 bg-red-100' :
                  hasBurnoutRisk ? 'border-orange-400 bg-orange-50' :
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
                            {isCriticalBurnout && (
                              <Badge className="bg-red-600 text-white border-red-800 animate-pulse">
                                🔥 KRİTİK TÜKENMELİK
                              </Badge>
                            )}
                            {hasBurnoutRisk && !isCriticalBurnout && (
                              <Badge className="bg-orange-500 text-white border-orange-700">
                                ⚠️ Tükenmişlik Riski
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {student.grade}. Sınıf • {student.targetUniversities?.join(', ') || 'Hedef belirtilmemiş'}
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
                              factor.severity === 'CRITICAL' ? 'bg-red-200 border-2 border-red-500' :
                              factor.severity === 'HIGH' ? 'bg-red-100 border border-red-200' : 
                              factor.severity === 'MEDIUM' ? 'bg-yellow-100 border border-yellow-200' : 'bg-gray-100 border border-gray-200'
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
                        <Button 
                          variant={hasBurnoutRisk ? "default" : "outline"} 
                          size="sm" 
                          className={`flex items-center gap-2 ${hasBurnoutRisk ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        >
                          <Calendar className="w-4 h-4" />
                          {hasBurnoutRisk ? 'Acil Görüşme Planla' : 'Görüşme Planla'}
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