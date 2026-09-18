"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

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
}

export function SubjectMasteryPanel({ 
  subjectResults, 
  dailyTasks, 
  subjectAnalysis 
}: SubjectMasteryPanelProps) {
  
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

  // Get all unique subjects
  const allSubjects = Array.from(new Set([
    ...subjectResults.map(sr => sr.subjectName),
    ...dailyTasks.map(dt => dt.subject),
    ...subjectAnalysis.map(sa => sa.subject)
  ]));

  // Group by subject with mastery data
  const subjectMasteryData = allSubjects.map(subject => {
    const mastery = calculateMastery(subject);
    const examData = subjectResults.filter(sr => sr.subjectName === subject);
    const taskData = dailyTasks.filter(dt => dt.subject === subject);
    const analysisData = subjectAnalysis.find(sa => sa.subject === subject);
    
    return {
      subject,
      mastery,
      examCount: examData.length,
      taskCount: taskData.length,
      proficiency: analysisData?.proficiency || null,
      topics: taskData.map(dt => dt.topic).filter(Boolean)
    };
  }).sort((a, b) => a.mastery - b.mastery); // Sort by mastery (lowest first)

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'bg-green-500';
    if (mastery >= 60) return 'bg-blue-500';
    if (mastery >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMasteryLabel = (mastery: number) => {
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

  const weakSubjects = subjectMasteryData.filter(data => data.mastery < 50);
  const strongSubjects = subjectMasteryData.filter(data => data.mastery >= 70);

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
                        {getMasteryLabel(data.mastery)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">{data.mastery}%</span>
                    </div>
                  </div>
                  
                  <Progress value={data.mastery} className={getMasteryColor(data.mastery)} />
                  
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Deneme:</span> {data.examCount} sınav
                    </div>
                    <div>
                      <span className="font-medium">Görev:</span> {data.taskCount} görev
                    </div>
                    <div>
                      <span className="font-medium">Konular:</span> {data.topics.length > 0 ? data.topics.slice(0, 3).join(', ') : 'Belirtilmemiş'}
                    </div>
                  </div>

                  {/* Topic breakdown if available */}
                  {data.topics.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex flex-wrap gap-2">
                        {data.topics.slice(0, 5).map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {data.topics.length > 5 && (
                          <Badge variant="outline" className="text-xs">
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
              {weakSubjects.map((data) => (
                <div key={data.subject} className="bg-white p-3 rounded border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-red-900">{data.subject}</h4>
                    <Badge className="bg-red-100 text-red-700">{data.mastery}% Hakimiyet</Badge>
                  </div>
                  <p className="text-sm text-gray-700">
                    Bu derste hakimiyet düşük. Temel konulara odaklanarak net artışı hedefleyin. 
                    {data.topics.length > 0 && ` Özellikle ${data.topics.slice(0, 2).join(' ve ')} konularına çalışın.`}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}