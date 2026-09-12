'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle, AlertTriangle, BookOpen, FileText, TrendingUp } from "lucide-react";
import { resolveRecommendation } from "@/actions/ai-recommendation";
import { useState } from "react";

interface AIRecommendation {
  id: string;
  type: string;
  message: string;
  suggestedAction: string;
  priority: string;
  createdAt: Date;
}

interface AICopilotPanelProps {
  recommendations: AIRecommendation[];
  studentId: string;
}

export function AICopilotPanel({ recommendations, studentId }: AICopilotPanelProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (recommendationId: string) => {
    setResolvingId(recommendationId);
    try {
      await resolveRecommendation(recommendationId);
      // Force page refresh to show updated state
      window.location.reload();
    } catch (error) {
      console.error('Error resolving recommendation:', error);
      setResolvingId(null);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'RISK':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'ACADEMIC':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'APPLICATION':
        return <FileText className="w-5 h-5 text-purple-500" />;
      default:
        return <TrendingUp className="w-5 h-5 text-green-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Acil</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">Yüksek</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Orta</Badge>;
      case 'LOW':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Düşük</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">{priority}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'RISK':
        return 'Risk Uyarısı';
      case 'ACADEMIC':
        return 'Akademik Öneri';
      case 'APPLICATION':
        return 'Başvuru Önerisi';
      default:
        return type;
    }
  };

  if (recommendations.length === 0) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Bot className="w-5 h-5 mr-2 text-green-600" />
            AI Copilot Önerileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mr-3 text-green-500" />
            <p>Şu anda bekleyen öneri yok. Harika gidiyorsun!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="w-5 h-5 mr-2 text-purple-600" />
            AI Copilot Önerileri
          </div>
          <Badge variant="outline" className="text-xs">
            {recommendations.length} Bekleyen
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getRecommendationIcon(recommendation.type)}
                <span className="font-medium text-sm">{getTypeLabel(recommendation.type)}</span>
                {getPriorityBadge(recommendation.priority)}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(recommendation.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
            
            <p className="text-sm text-gray-800 mb-3 font-medium">
              {recommendation.message}
            </p>
            
            <div className="bg-white rounded p-3 mb-3 border">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Önerilen Aksiyon:</span> {recommendation.suggestedAction}
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResolve(recommendation.id)}
                disabled={resolvingId === recommendation.id}
                className="text-xs"
              >
                {resolvingId === recommendation.id ? (
                  <>İşleniyor...</>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Tamamlandı
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}