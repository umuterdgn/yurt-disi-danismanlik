"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown, GraduationCap, AlertCircle } from "lucide-react";

interface GoalProgressProps {
  currentScore: number | null;
  targetScore: number | null;
  targetUniversity?: string | null;
  targetMajor?: string | null;
  examHistory?: { date: Date; score: number }[];
}

export function GoalProgress({ 
  currentScore, 
  targetScore, 
  targetUniversity, 
  targetMajor,
  examHistory = [] 
}: GoalProgressProps) {
  
  const calculateProgress = () => {
    if (!currentScore || !targetScore) {
      return {
        percentage: 0,
        scoreGap: 0,
        progressText: 'Hedef puan belirlenmemiş',
        status: 'neutral' as const
      };
    }

    const scoreGap = targetScore - currentScore;
    const percentage = Math.min(100, Math.max(0, (currentScore / targetScore) * 100));
    
    let progressText = '';
    let status: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';

    if (scoreGap > 0) {
      progressText = `Hedef puana ${scoreGap.toFixed(1)} net daha gerekiyor`;
      status = scoreGap > 20 ? 'danger' : scoreGap > 10 ? 'warning' : 'neutral';
    } else if (scoreGap < 0) {
      progressText = `Hedef puandan ${Math.abs(scoreGap).toFixed(1)} net üstündesiniz`;
      status = 'success';
    } else {
      progressText = 'Hedef puana ulaştınız';
      status = 'success';
    }

    return { percentage, scoreGap, progressText, status };
  };

  const calculateTrend = () => {
    if (examHistory.length < 2) {
      return null;
    }

    const recentExams = examHistory.slice(-5); // Last 5 exams
    const firstExam = recentExams[0];
    const lastExam = recentExams[recentExams.length - 1];
    
    const scoreChange = lastExam.score - firstExam.score;
    const numExams = recentExams.length;
    const averageChangePerExam = scoreChange / (numExams - 1);
    
    return {
      scoreChange,
      averageChangePerExam,
      trend: scoreChange > 0 ? 'up' : scoreChange < 0 ? 'down' : 'stable'
    };
  };

  const progress = calculateProgress();
  const trend = calculateTrend();

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getProgressTextColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const estimateTimeToGoal = () => {
    if (!trend || !targetScore || !currentScore) return null;
    
    const scoreGap = targetScore - currentScore;
    if (scoreGap <= 0) return null;
    
    if (trend.averageChangePerExam <= 0) return null;
    
    const examsNeeded = Math.ceil(scoreGap / trend.averageChangePerExam);
    return examsNeeded;
  };

  const examsNeeded = estimateTimeToGoal();

  if (!currentScore && !targetScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Hedefe Yaklaşım
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Hedef bilgisi belirtilmemiş</p>
            <p className="text-sm mt-2">Öğrencinin hedef puanı ve üniversite bilgisi girilirse ilerleme takibi yapılabilir.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Hedefe Yaklaşım
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Target Info */}
          {(targetUniversity || targetMajor) && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Hedef</span>
              </div>
              {targetUniversity && (
                <p className="text-sm text-gray-900 font-medium">{targetUniversity}</p>
              )}
              {targetMajor && (
                <p className="text-xs text-gray-600">{targetMajor}</p>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">İlerleme</span>
              <span className={`text-lg font-bold ${getProgressTextColor(progress.status)}`}>
                %{progress.percentage.toFixed(0)}
              </span>
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
              <div 
                className={`h-full transition-all ${getProgressColor(progress.status)}`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{progress.progressText}</p>
          </div>

          {/* Score Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Mevcut Puan</p>
              <p className="text-2xl font-bold text-blue-600">
                {currentScore !== null ? currentScore.toFixed(1) : '-'}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Hedef Puan</p>
              <p className="text-2xl font-bold text-purple-600">
                {targetScore !== null ? targetScore.toFixed(1) : '-'}
              </p>
            </div>
          </div>

          {/* Trend Analysis */}
          {trend && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Son Performans Trendi</span>
                <Badge className={
                  trend.trend === 'up' ? 'bg-green-100 text-green-700' :
                  trend.trend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }>
                  {trend.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                  {trend.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                  {trend.trend === 'up' ? 'Artış' : trend.trend === 'down' ? 'Düşüş' : 'Stabil'}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Son 5 denemede <span className="font-medium">{trend.scoreChange > 0 ? '+' : ''}{trend.scoreChange.toFixed(1)}</span> net değişim
                (deneme başına ortalama <span className="font-medium">{trend.averageChangePerExam.toFixed(2)}</span> net)
              </div>
            </div>
          )}

          {/* Time to Goal Estimate */}
          {examsNeeded !== null && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Hedefe Ulaşma Tahmini</span>
              </div>
              <p className="text-sm text-gray-600">
                Mevcut trend ile yaklaşık <span className="font-bold text-orange-600">{examsNeeded}</span> deneme daha gerekiyor
              </p>
            </div>
          )}

          {/* Call to Action */}
          {progress.status === 'danger' && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Öneri</span>
              </div>
              <p className="text-sm text-red-600">
                Hedefe ulaşmak için yoğun çalışma programı ve ekstra deneme sınavları gerekebilir.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}