"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Target, BookOpen, TrendingUp, Clock, Filter, BarChart3, Timer, Activity } from "lucide-react";

interface HolisticAnalysisProps {
  subjectAnalysis: any[];
  studentId?: string;
}

export function HolisticAnalysis({ subjectAnalysis, studentId }: HolisticAnalysisProps) {
  const [dataSource, setDataSource] = useState<'ALL' | 'EXAM' | 'TASK'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const calculateHolisticData = () => {
    if (subjectAnalysis.length === 0) {
      return null;
    }

    // Filter by data source
    let filteredAnalysis = subjectAnalysis;
    if (dataSource !== 'ALL') {
      filteredAnalysis = filteredAnalysis.filter(item => {
        if (dataSource === 'EXAM') return item.dataSource === 'EXAM';
        if (dataSource === 'TASK') return item.dataSource === 'TASK';
        return true;
      });
    }

    // Filter by subject
    if (selectedSubject !== 'ALL') {
      filteredAnalysis = filteredAnalysis.filter(item => item.subject === selectedSubject);
    }

    // Filter by date range
    if (startDate || endDate) {
      filteredAnalysis = filteredAnalysis.filter(item => {
        const itemDate = new Date(item.lastStudiedAt || item.createdAt);
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Group by subject and calculate holistic metrics
    const subjectData: Record<string, {
      examNetScore: number;
      examTotalQuestions: number;
      examCorrect: number;
      taskNetScore: number;
      taskTotalQuestions: number;
      taskCorrect: number;
      totalPomodoroMinutes: number;
      studyMethods: string[];
      topics: any[];
    }> = {};

    filteredAnalysis.forEach(item => {
      if (!subjectData[item.subject]) {
        subjectData[item.subject] = {
          examNetScore: 0,
          examTotalQuestions: 0,
          examCorrect: 0,
          taskNetScore: 0,
          taskTotalQuestions: 0,
          taskCorrect: 0,
          totalPomodoroMinutes: 0,
          studyMethods: [],
          topics: []
        };
      }

      const data = subjectData[item.subject];
      
      // Add exam data
      if (item.examNetScore !== null) data.examNetScore += item.examNetScore;
      if (item.examTotalQuestions !== null) data.examTotalQuestions += item.examTotalQuestions;
      if (item.examCorrect !== null) data.examCorrect += item.examCorrect;
      
      // Add task data
      if (item.taskNetScore !== null) data.taskNetScore += item.taskNetScore;
      if (item.taskTotalQuestions !== null) data.taskTotalQuestions += item.taskTotalQuestions;
      if (item.taskCorrect !== null) data.taskCorrect += item.taskCorrect;
      
      // Add pomodoro data
      if (item.totalPomodoroMinutes !== null) data.totalPomodoroMinutes += item.totalPomodoroMinutes;
      
      // Add study methods
      if (item.studyMethods) {
        item.studyMethods.forEach((method: string) => {
          if (!data.studyMethods.includes(method)) {
            data.studyMethods.push(method);
          }
        });
      }
      
      // Add topic
      data.topics.push(item);
    });

    // Calculate final metrics
    const holisticData = Object.entries(subjectData).map(([subject, data]) => {
      const examSuccessRate = data.examTotalQuestions > 0 ? (data.examCorrect / data.examTotalQuestions) * 100 : 0;
      const taskSuccessRate = data.taskTotalQuestions > 0 ? (data.taskCorrect / data.taskTotalQuestions) * 100 : 0;
      const combinedSuccessRate = (data.examTotalQuestions + data.taskTotalQuestions) > 0 
        ? ((data.examCorrect + data.taskCorrect) / (data.examTotalQuestions + data.taskTotalQuestions)) * 100 
        : 0;
      
      return {
        subject,
        examNetScore: data.examNetScore.toFixed(2),
        examSuccessRate: Math.round(examSuccessRate),
        taskNetScore: data.taskNetScore.toFixed(2),
        taskSuccessRate: Math.round(taskSuccessRate),
        combinedSuccessRate: Math.round(combinedSuccessRate),
        totalPomodoroMinutes: data.totalPomodoroMinutes,
        totalPomodoroHours: Math.round(data.totalPomodoroMinutes / 25), // Assuming 25 min per pomodoro
        studyMethods: data.studyMethods,
        topics: data.topics,
        hasExamData: data.examTotalQuestions > 0,
        hasTaskData: data.taskTotalQuestions > 0
      };
    });

    return holisticData;
  };

  const holisticData = calculateHolisticData();

  // Get unique subjects for filter
  const allSubjects = [...new Set(subjectAnalysis.map(item => item.subject))];

  const resetFilters = () => {
    setDataSource('ALL');
    setSelectedSubject('ALL');
    setStartDate('');
    setEndDate('');
  };

  const getStudyMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'VIDEO': 'bg-purple-100 text-purple-700',
      'READING': 'bg-blue-100 text-blue-700',
      'PRACTICE': 'bg-green-100 text-green-700',
      'TEST': 'bg-orange-100 text-orange-700'
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  };

  const getStudyMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'VIDEO': 'Video',
      'READING': 'Okuma',
      'PRACTICE': 'Pratik',
      'TEST': 'Test'
    };
    return labels[method] || method;
  };

  if (!holisticData || holisticData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Bütünleşik Performans Analizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Henüz yeterli veri oluşmadı</p>
            <p className="text-sm mt-2">Deneme ve görev sonuçları girdikçe performans analizi burada görüntülenecek.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Bütünleşik Performans Analizi
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtreleri Sıfırla
          </Button>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <Label className="text-xs text-gray-600">Veri Kaynağı</Label>
            <Select value={dataSource} onValueChange={(value: any) => setDataSource(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tümü</SelectItem>
                <SelectItem value="EXAM">Sadece Denemeler</SelectItem>
                <SelectItem value="TASK">Sadece Görevler</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs text-gray-600">Ders Seçimi</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Dersler</SelectItem>
                {allSubjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs text-gray-600">Başlangıç Tarihi</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs text-gray-600">Bitiş Tarihi</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {holisticData.map((data) => (
            <div key={data.subject} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">{data.subject}</h3>
                <div className="flex items-center gap-2">
                  {data.hasExamData && <Badge className="bg-blue-100 text-blue-700">Deneme</Badge>}
                  {data.hasTaskData && <Badge className="bg-green-100 text-green-700">Görev</Badge>}
                </div>
              </div>

              {/* Combined Success Rate */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Kombine Başarı Oranı</span>
                  <span className="text-lg font-bold text-blue-600">%{data.combinedSuccessRate}</span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <div 
                    className="h-full transition-all bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${data.combinedSuccessRate}%` }}
                  />
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Exam Data */}
                {data.hasExamData && (
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Deneme Performansı</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Net:</span>
                        <span className="font-medium">{data.examNetScore}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Başarı:</span>
                        <span className="font-medium">%{data.examSuccessRate}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Data */}
                {data.hasTaskData && (
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Görev Performansı</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Net:</span>
                        <span className="font-medium">{data.taskNetScore}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Başarı:</span>
                        <span className="font-medium">%{data.taskSuccessRate}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Study Methods */}
              {data.studyMethods.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Çalışma Yöntemleri</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.studyMethods.map((method) => (
                      <Badge key={method} className={getStudyMethodColor(method)}>
                        {getStudyMethodLabel(method)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Pomodoro Time */}
              {data.totalPomodoroMinutes > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Toplam Odaklanma Süresi</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">{data.totalPomodoroHours} Pomodoro</span>
                    <span className="text-gray-600">({data.totalPomodoroMinutes} dakika)</span>
                  </div>
                </div>
              )}

              {/* Topic Breakdown */}
              {data.topics.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Konu Detayları</span>
                  </div>
                  <div className="space-y-2">
                    {data.topics.slice(0, 5).map((topic: any) => (
                      <div key={topic.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="text-sm text-gray-700">{topic.topic}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            topic.proficiency === 'EXCELLENT' ? 'bg-green-100 text-green-700' :
                            topic.proficiency === 'GOOD' ? 'bg-blue-100 text-blue-700' :
                            topic.proficiency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {topic.proficiency}
                          </Badge>
                          <span className="text-sm font-medium">%{topic.progressPercent}</span>
                        </div>
                      </div>
                    ))}
                    {data.topics.length > 5 && (
                      <div className="text-xs text-gray-500 text-center">+{data.topics.length - 5} daha fazla konu</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Toplam Ders</p>
              <p className="text-2xl font-bold text-blue-600">{holisticData.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ortalama Başarı</p>
              <p className="text-2xl font-bold text-green-600">
                %{Math.round(holisticData.reduce((sum, d) => sum + d.combinedSuccessRate, 0) / holisticData.length)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Toplam Pomodoro</p>
              <p className="text-2xl font-bold text-purple-600">
                {holisticData.reduce((sum, d) => sum + d.totalPomodoroHours, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Kullanılan Yöntemler</p>
              <p className="text-2xl font-bold text-orange-600">
                {[...new Set(holisticData.flatMap(d => d.studyMethods))].length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}