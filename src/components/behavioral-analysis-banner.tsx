"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, Brain, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BehavioralAnalysisBannerProps {
  insights: string[];
  fatiguePattern?: string;
  blankBehavior?: string;
}

export function BehavioralAnalysisBanner({ 
  insights, 
  fatiguePattern, 
  blankBehavior 
}: BehavioralAnalysisBannerProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  const getIconForInsight = (insight: string) => {
    if (insight.includes('Fatigue') || insight.includes('Odak')) {
      return <Brain className="w-5 h-5 text-orange-600" />;
    }
    if (insight.includes('Zaman') || insight.includes('Boş')) {
      return <Clock className="w-5 h-5 text-blue-600" />;
    }
    if (insight.includes('Disiplinlerarası') || insight.includes('Kök Neden')) {
      return <TrendingDown className="w-5 h-5 text-purple-600" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  const getColorForInsight = (insight: string) => {
    if (insight.includes('Fatigue') || insight.includes('Odak')) {
      return 'bg-orange-50 border-orange-200';
    }
    if (insight.includes('Zaman') || insight.includes('Boş')) {
      return 'bg-blue-50 border-blue-200';
    }
    if (insight.includes('Disiplinlerarası') || insight.includes('Kök Neden')) {
      return 'bg-purple-50 border-purple-200';
    }
    return 'bg-yellow-50 border-yellow-200';
  };

  return (
    <Card className="mb-6 border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-bold text-gray-900">Davranışsal Analiz Özeti</h3>
        </div>
        
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className={`flex items-start gap-3 p-3 rounded-lg border ${getColorForInsight(insight)}`}
            >
              <div className="mt-0.5">
                {getIconForInsight(insight)}
              </div>
              <p className="text-sm font-medium text-gray-800">{insight}</p>
            </div>
          ))}
        </div>

        {fatiguePattern && (
          <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-orange-700" />
              <span className="text-sm font-semibold text-orange-900">Yorgunluk Analizi</span>
            </div>
            <p className="text-sm text-orange-800 mt-1">{fatiguePattern}</p>
          </div>
        )}

        {blankBehavior && (
          <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              <span className="text-sm font-semibold text-blue-900">Boş Soru Analizi</span>
            </div>
            <p className="text-sm text-blue-800 mt-1">{blankBehavior}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
