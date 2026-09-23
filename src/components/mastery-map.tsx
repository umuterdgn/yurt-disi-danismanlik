"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target, BookOpen, TrendingUp, Filter, X } from "lucide-react";

interface SubjectResult {
  subjectName: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number | null;
}

interface Exam {
  id: string;
  title?: string;
  date?: Date | string;
  totalNet?: number | null;
  subjectResults?: SubjectResult[];
}

interface MasteryMapProps {
  exams: Exam[];
  studentId?: string;
  subjectAnalysis?: any[];
}

export function MasteryMap({ exams, studentId, subjectAnalysis }: MasteryMapProps) {
  const [dataSource, setDataSource] = useState<'ALL' | 'EXAM' | 'TASK'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [topicModalOpen, setTopicModalOpen] = useState(false);

  const calculateMasteryData = () => {
    if (exams.length === 0 && !subjectAnalysis) {
      return null;
    }

    // Filter by data source
    let filteredAnalysis = subjectAnalysis || [];
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

    // If we have subject analysis data, use it
    if (filteredAnalysis.length > 0) {
      const subjectMastery: Record<string, { totalPercent: number; count: number; topics: any[] }> = {};

      filteredAnalysis.forEach(item => {
        if (!subjectMastery[item.subject]) {
          subjectMastery[item.subject] = { totalPercent: 0, count: 0, topics: [] };
        }
        subjectMastery[item.subject].totalPercent += item.progressPercent;
        subjectMastery[item.subject].count += 1;
        subjectMastery[item.subject].topics.push(item);
      });

      const masteryData = Object.entries(subjectMastery).map(([subject, data]) => {
        const percentage = data.count > 0 ? data.totalPercent / data.count : 0;
        
        return {
          subject,
          percentage: Math.round(percentage),
          avgNet: 'N/A',
          totalQuestions: data.topics.length,
          totalCorrect: data.topics.filter(t => t.proficiency === 'GOOD' || t.proficiency === 'EXCELLENT').length,
          dataSource: dataSource,
          topics: data.topics
        };
      });

      return masteryData;
    }

    // Fallback to exam data if no subject analysis
    if (exams.length === 0) {
      return null;
    }

    // Group by subject and calculate mastery percentages
    const subjectMastery: Record<string, { correct: number; total: number; net: number }> = {};

    exams.forEach(exam => {
      if (!exam.subjectResults) return;
      
      exam.subjectResults.forEach(subject => {
        if (!subjectMastery[subject.subjectName]) {
          subjectMastery[subject.subjectName] = { correct: 0, total: 0, net: 0 };
        }
        subjectMastery[subject.subjectName].correct += subject.correct;
        subjectMastery[subject.subjectName].total += subject.correct + subject.wrong + subject.empty;
        subjectMastery[subject.subjectName].net += subject.net || 0;
      });
    });

    // Calculate percentages
    const masteryData = Object.entries(subjectMastery).map(([subject, data]) => {
      const percentage = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      const avgNet = exams.length > 0 ? data.net / exams.length : 0;
      
      return {
        subject,
        percentage: Math.round(percentage),
        avgNet: avgNet.toFixed(2),
        totalQuestions: data.total,
        totalCorrect: data.correct,
        dataSource: 'EXAM',
        topics: []
      };
    });

    return masteryData;
  };

  const masteryData = calculateMasteryData();

  // Get unique subjects for filter
  const allSubjects = subjectAnalysis 
    ? [...new Set(subjectAnalysis.map(item => item.subject))]
    : [];

  const resetFilters = () => {
    setDataSource('ALL');
    setSelectedSubject('ALL');
    setStartDate('');
    setEndDate('');
  };

  const getMasteryColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMasteryLabel = (percentage: number) => {
    if (percentage >= 80) return 'Mükemmel';
    if (percentage >= 60) return 'İyi';
    if (percentage >= 40) return 'Orta';
    return 'Zayıf';
  };

  const getMasteryEmoji = (percentage: number) => {
    if (percentage >= 80) return '🟢';
    if (percentage >= 60) return '🔵';
    if (percentage >= 40) return '🟡';
    return '🔴';
  };

  const handleTopicClick = (topic: any) => {
    setSelectedTopic(topic);
    setTopicModalOpen(true);
  };

  if (!masteryData || masteryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Konu Hakimiyet Haritası
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Henüz yeterli veri oluşmadı</p>
            <p className="text-sm mt-2">Deneme sonuçları girdikçe konu hakimiyetiniz burada görüntülenecek.</p>
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
            <Target className="w-5 h-5" />
            Konu Hakimiyet Haritası
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
        <div className="space-y-4">
          {masteryData.map((data) => (
            <div key={data.subject} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className={`w-5 h-5 ${getMasteryColor(data.percentage).replace('bg-', 'text-')}`} />
                  <div>
                    <h4 className="font-semibold text-gray-900">{data.subject}</h4>
                    <p className="text-xs text-gray-600">
                      {data.totalCorrect}/{data.totalQuestions} konu • Ort. Net: {data.avgNet}
                      {data.dataSource !== 'EXAM' && <span className="ml-2">• Kaynak: {data.dataSource === 'TASK' ? 'Görevler' : 'Tümü'}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getMasteryColor(data.percentage).replace('bg-', 'bg-opacity-100 text-white ')}>
                    {getMasteryLabel(data.percentage)}
                  </Badge>
                  <span className="text-sm font-semibold text-gray-700">%{data.percentage}</span>
                </div>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div 
                  className={`h-full transition-all ${getMasteryColor(data.percentage)}`}
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
              
              {/* Show topic breakdown if available */}
              {data.topics && data.topics.length > 0 && (
                <div className="mt-2 pl-4 space-y-1">
                  {data.topics.slice(0, 3).map((topic: any) => (
                    <div 
                      key={topic.id} 
                      className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50 p-1 rounded"
                      onClick={() => handleTopicClick(topic)}
                    >
                      <span className="text-gray-600">{topic.topic}</span>
                      <span className="font-medium">%{topic.progressPercent}</span>
                    </div>
                  ))}
                  {data.topics.length > 3 && (
                    <div className="text-xs text-gray-500">+{data.topics.length - 3} daha fazla konu</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Toplam Ders</p>
              <p className="text-2xl font-bold text-blue-600">{masteryData.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ortalama Başarı</p>
              <p className="text-2xl font-bold text-green-600">
                %{Math.round(masteryData.reduce((sum, d) => sum + d.percentage, 0) / masteryData.length)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Güçlü Dersler</p>
              <p className="text-2xl font-bold text-purple-600">
                {masteryData.filter(d => d.percentage >= 60).length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Topic Detail Modal */}
      <Dialog open={topicModalOpen} onOpenChange={setTopicModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Konu Detayları
            </DialogTitle>
            <DialogDescription>
              Konu hakimiyet ve çalışma detayları
            </DialogDescription>
          </DialogHeader>
          
          {selectedTopic && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-lg font-semibold">{selectedTopic.topic}</h4>
                <p className="text-sm text-gray-600">{selectedTopic.subject}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Başarı Oranı</p>
                  <p className="text-2xl font-bold text-blue-600">%{selectedTopic.progressPercent}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Seviye</p>
                  <p className="text-lg font-semibold">{selectedTopic.proficiency}</p>
                </div>
              </div>
              
              {selectedTopic.lastStudiedAt && (
                <div>
                  <p className="text-xs text-gray-600">Son Çalışma Tarihi</p>
                  <p className="text-sm">{new Date(selectedTopic.lastStudiedAt).toLocaleDateString('tr-TR')}</p>
                </div>
              )}
              
              {selectedTopic.totalHours && (
                <div>
                  <p className="text-xs text-gray-600">Toplam Çalışma Süresi</p>
                  <p className="text-sm">{selectedTopic.totalHours} saat</p>
                </div>
              )}
              
              {selectedTopic.studyMethods && selectedTopic.studyMethods.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Kullanılan Çalışma Yöntemleri</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopic.studyMethods.map((method: string) => (
                      <Badge key={method} variant="outline">{method}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}