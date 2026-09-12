"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, FileText, Globe, CreditCard, Plane } from "lucide-react";

interface ReadinessCriteria {
  name: string;
  value: number;
  icon: any;
  color: string;
  description: string;
}

interface ApplicationReadinessScoreProps {
  applicationReadiness: number;
  criteria: ReadinessCriteria[];
}

export function ApplicationReadinessScore({ applicationReadiness, criteria }: ApplicationReadinessScoreProps) {
  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReadinessBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-700">Mükemmel Hazır</Badge>;
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-700">İyi Hazır</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-700">Hazırlanıyor</Badge>;
    return <Badge className="bg-red-100 text-red-700">Acil Eylem Gerekli</Badge>;
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Başvuru Hazırlık Skoru
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-bold ${getReadinessColor(applicationReadiness)}`}>
              %{applicationReadiness}
            </span>
            {getReadinessBadge(applicationReadiness)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {criteria.map((criterion) => (
            <div key={criterion.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${criterion.color}`}>
                    <criterion.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                    <p className="text-xs text-gray-600">{criterion.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">%{criterion.value}</span>
                  {criterion.value >= 80 ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : criterion.value >= 40 ? (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div 
                  className={`h-full transition-all ${getProgressColor(criterion.value)}`}
                  style={{ width: `${criterion.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Tamamlanan Kriter</p>
              <p className="text-xl font-bold text-green-600">
                {criteria.filter(c => c.value >= 80).length}/{criteria.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Acil Eylem Gereken</p>
              <p className="text-xl font-bold text-red-600">
                {criteria.filter(c => c.value < 40).length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}