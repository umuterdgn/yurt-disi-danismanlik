"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Plus } from "lucide-react";
import { SUBJECTS } from "@/constants/curriculum";
import { toast } from "sonner";

interface SubjectResult {
  subjectName: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number | null;
}

interface DailyTask {
  subject: string;
  topic: string | null;
  isCompleted: boolean;
  taskType: string;
  completedQuantity: number;
  targetQuantity: number;
}

interface SubjectMasteryPanelProps {
  subjectResults: SubjectResult[];
  dailyTasks: DailyTask[];
  subjectAnalysis: any[];
  studentId?: string;
}

export function SubjectMasteryPanel({ 
  subjectResults, 
  dailyTasks, 
  subjectAnalysis,
  studentId
}: SubjectMasteryPanelProps) {
  
  const convertSuggestionToTask = async (subject: string, suggestion: string) => {
    if (!studentId) {
      toast.error('Öğrenci ID gerekli');
      return;
    }

    try {
      const response = await fetch('/api/advisor/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: studentId,
          title: `${subject} - Önerilen Çalışma`,
          description: suggestion,
          subject: subject,
          taskType: 'REVIEW',
          targetQuantity: 20,
          estimatedPomodoros: 2,
          priority: 'high',
          taskDate: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Görev oluşturulamadı');
      }

      toast.success('Öneri göreve dönüştürüldü!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    }
  };
  
  // Calculate mastery percentage for each subject
  const calculateMastery = (subject: string) => {
    // From exam results (SubjectResult)
    const examResults = subjectResults.filter(sr => sr.subjectName === subject);
    const examTotal = examResults.reduce((sum, sr) => sum + (sr.correct + sr.wrong + sr.empty), 0);
    const examCorrect = examResults.reduce((sum, sr) => sum + sr.correct, 0);
    const examMastery = examTotal > 0 ? (examCorrect / examTotal) * 100 : 0;

    // From daily tasks completion
    const taskResults = dailyTasks.filter(dt => dt.subject === subject);
    const taskTotal = taskResults.reduce((sum, dt) => sum + dt.targetQuantity, 0);
    const taskCompleted = taskResults.reduce((sum, dt) => sum + dt.completedQuantity, 0);
    const taskMastery = taskTotal > 0 ? (taskCompleted / taskTotal) * 100 : 0;

    // From subject analysis (if available)
    const analysis = subjectAnalysis.find(sa => sa.subject === subject);
    const analysisMastery = analysis ? analysis.progressPercent : 0;

    // Weighted average: 40% exam, 30% tasks, 30% analysis
    const weightedMastery = (examMastery * 0.4) + (taskMastery * 0.3) + (analysisMastery * 0.3);
    
    return Math.round(weightedMastery);
  };

  // Get all unique subjects from official curriculum only
  const allSubjects = Array.from(new Set([
    ...subjectResults.map(sr => sr.subjectName),
    ...dailyTasks.map(dt => dt.subject),
    ...subjectAnalysis.map(sa => sa.subject)
  ])).filter(subject => {
    // Filter out 'Genel', undefined, and subjects not in official curriculum
    return subject && 
           subject !== 'Genel' && 
           subject !== 'undefined' && 
           SUBJECTS.includes(subject);
  });

  // Group by subject with mastery data
  const subjectMasteryData = allSubjects.map(subject => {
    const mastery = calculateMastery(subject);
    const examData = subjectResults.filter(sr => sr.subjectName === subject);
    const taskData = dailyTasks.filter(dt => dt.subject === subject);
    const analysisData = subjectAnalysis.find(sa => sa.subject === subject);
    
    // Check if subject has meaningful data
    const hasExamData = examData.length > 0;
    const hasTaskData = taskData.length > 0;
    const hasAnalysisData = analysisData !== undefined;
    const hasNoData = !hasExamData && !hasTaskData && !hasAnalysisData;
    
    return {
      subject,
      mastery,
      examCount: examData.length,
      taskCount: taskData.length,
      proficiency: analysisData?.proficiency || null,
      topics: taskData.map(dt => dt.topic).filter(Boolean),
      hasNoData // Flag for empty state
    };
  }).sort((a, b) => a.mastery - b.mastery); // Sort by mastery (lowest first)

  const getMasteryColor = (mastery: number, hasNoData: boolean) => {
    if (hasNoData) return 'bg-gray-400'; // Gray for no data
    if (mastery >= 80) return 'bg-green-500';
    if (mastery >= 60) return 'bg-blue-500';
    if (mastery >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMasteryLabel = (mastery: number, hasNoData: boolean) => {
    if (hasNoData) return 'Veri Bekleniyor';
    if (mastery >= 80) return 'Mükemmel';
    if (mastery >= 60) return 'İyi';
    if (mastery >= 40) return 'Orta';
    return 'Zayıf';
  };

  const getProficiencyColor = (proficiency: string) => {
    const colors: Record<string, string> = {
      'WEAK': 'bg-red-100 text-red-700',
      'MEDIUM': 'bg-yellow-100 text-yellow-700',
      'GOOD': 'bg-blue-100 text-blue-700',
      'EXCELLENT': 'bg-green-100 text-green-700',
    };
    return colors[proficiency] || 'bg-gray-100 text-gray-700';
  };

  const getProficiencyLabel = (proficiency: string) => {
    const labels: Record<string, string> = {
      'WEAK': 'Zayıf',
      'MEDIUM': 'Orta',
      'GOOD': 'İyi',
      'EXCELLENT': 'Mükemmel',
    };
    return labels[proficiency] || proficiency;
  };

  const averageMastery = subjectMasteryData.length > 0
    ? Math.round(subjectMasteryData.reduce((sum, data) => sum + data.mastery, 0) / subjectMasteryData.length)
    : 0;

  const weakSubjects = subjectMasteryData.filter(data => data.mastery < 50 && !data.hasNoData);
  const strongSubjects = subjectMasteryData.filter(data => data.mastery >= 70 && !data.hasNoData);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Genel Hakimiyet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{averageMastery}%</div>
            <Progress value={averageMastery} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Zayıf Dersler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{weakSubjects.length}</div>
            <p className="text-xs text-gray-500 mt-2">
              {weakSubjects.length > 0 ? weakSubjects.map(s => s.subject).join(', ') : 'Zayıf ders yok'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Güçlü Dersler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{strongSubjects.length}</div>
            <p className="text-xs text-gray-500 mt-2">
              {strongSubjects.length > 0 ? strongSubjects.map(s => s.subject).join(', ') : 'Güçlü ders yok'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Mastery Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Ders Bazlı Hakimiyet Analizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjectMasteryData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz hakimiyet verisi yok. Deneme sonuçları ve görevler analiz edildiğinde burada görünecek.
            </div>
          ) : (
            <div className="space-y-6">
              {subjectMasteryData.map((data) => (
                <div key={data.subject} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900">{data.subject}</h4>
                      {data.proficiency && (
                        <Badge className={getProficiencyColor(data.proficiency)}>
                          {getProficiencyLabel(data.proficiency)}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {getMasteryLabel(data.mastery, data.hasNoData)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        {data.hasNoData ? 'Veri Bekleniyor' : `${data.mastery}%`}
                      </span>
                    </div>
                  </div>
                  
                  <Progress value={data.hasNoData ? 0 : data.mastery} className={getMasteryColor(data.mastery, data.hasNoData)} />
                  
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Deneme:</span> {data.examCount} sınav
                    </div>
                    <div>
                      <span className="font-medium">Görev:</span> {data.taskCount} görev
                    </div>
                    <div>
                      <span className="font-medium">Konular:</span> {data.topics.length > 0 ? `${data.topics.length} konu` : 'Henüz konu eklenmedi'}
                    </div>
                  </div>

                  {/* Topic breakdown with badges */}
                  {data.topics.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex flex-wrap gap-2">
                        {data.topics.slice(0, 5).map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50 border-blue-200">
                            {topic}
                          </Badge>
                        ))}
                        {data.topics.length > 5 && (
                          <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200">
                            +{data.topics.length - 5} daha
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations based on mastery */}
      {weakSubjects.length > 0 && (
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              AI Önerileri - Zayıf Dersler İçin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weakSubjects.map((data) => {
                let suggestion = '';
                if (data.examCount === 0 && data.taskCount === 0) {
                  suggestion = `Bu ders için henüz deneme veya görev verisi yok. Önce temel konulara çalışıp bir deneme çözerek başlangıç seviyenizi belirleyin.`;
                } else if (data.examCount === 0 && data.taskCount > 0) {
                  suggestion = `${data.taskCount} görev tamamlandı ancak deneme verisi eksik. Çalıştığınız konuları pekiştirmek için bir branş denemesi çözün.`;
                } else if (data.examCount > 0 && data.taskCount === 0) {
                  suggestion = `${data.examCount} deneme çözüldü ama görev çalışması yok. Deneme sonuçlarına göre en çok hata yapılan konulara öncelikli görev ekleyin.`;
                } else if (data.examCount > 0 && data.taskCount > 0 && data.topics.length > 0) {
                  suggestion = `${data.topics.slice(0, 2).join(' ve ')} konularında ${data.taskCount} görev tamamladınız. Deneme performansınızı artırmak için bu konuları tekrar edip yeni bir deneme çözün.`;
                } else if (data.examCount > 0 && data.taskCount > 0 && data.topics.length === 0) {
                  suggestion = `${data.examCount} deneme ve ${data.taskCount} görev tamamlandı ancak konu belirtilmemiş. Görevlere konu ekleyerek daha detaylı analiz yapın.`;
                }

                return (
                  <div key={data.subject} className="bg-white p-3 rounded border border-red-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-red-900">{data.subject}</h4>
                          <Badge className="bg-red-100 text-red-700">{data.mastery}% Hakimiyet</Badge>
                        </div>
                        <p className="text-sm text-gray-700">{suggestion}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2 shrink-0"
                        onClick={() => convertSuggestionToTask(data.subject, suggestion)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Göreve Ekle
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}