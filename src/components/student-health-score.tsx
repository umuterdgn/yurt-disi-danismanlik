import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

interface StudentHealthScoreProps {
  healthScore: number;
  riskStatus: string;
  applicationReadiness: number;
}

export function StudentHealthScore({ healthScore, riskStatus, applicationReadiness }: StudentHealthScoreProps) {
  const getRiskBadge = (status: string) => {
    switch (status) {
      case 'GREEN':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sorun Yok
          </Badge>
        );
      case 'YELLOW':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Dikkat
          </Badge>
        );
      case 'RED':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Kritik Risk
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-300">
            Bilinmiyor
          </Badge>
        );
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'bg-blue-500';
    if (score >= 60) return 'bg-blue-400';
    if (score >= 40) return 'bg-blue-300';
    return 'bg-blue-200';
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Öğrenci Sağlık Skoru</span>
          {getRiskBadge(riskStatus)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Genel Sağlık Skoru</span>
            <span className="text-2xl font-bold text-gray-900">{healthScore}/100</span>
          </div>
          <Progress value={healthScore} className="h-3" />
        </div>

        {/* Application Readiness */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Başvuru Hazırlık</span>
            <span className="text-2xl font-bold text-blue-600">{applicationReadiness}%</span>
          </div>
          <Progress value={applicationReadiness} className="h-3" />
        </div>

        {/* Risk Status Description */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-600">
            {riskStatus === 'GREEN' && 'Öğrenci iyi ilerleme kaydediyor, kritik sorun yok.'}
            {riskStatus === 'YELLOW' && 'Bazı alanlarda dikkat gerektiren durumlar var.'}
            {riskStatus === 'RED' && 'Acil müdahale gerektiren kritik riskler tespit edildi.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}