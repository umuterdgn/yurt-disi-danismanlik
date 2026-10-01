'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Calendar, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface StudentRisk {
  id: string;
  name: string;
  grade: string;
  targetUniversities: string[];
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  riskFactors: string[];
  healthScore: number;
}

interface RiskSummary {
  critical: number;
  warning: number;
  safe: number;
}

export default function AdvisorRiskRadar() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<RiskSummary>({ critical: 0, warning: 0, safe: 0 });
  const [students, setStudents] = useState<StudentRisk[]>([]);

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      const response = await fetch('/api/advisor/risk-assessment');
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Yüksek Risk</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Takip Gerektiriyor</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-700">Güvende</Badge>;
    }
  };

  const getRiskBorderColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'border-red-300 bg-red-50';
      case 'MEDIUM':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return 'border-green-300 bg-green-50';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            Risk Radarı
          </h1>
          <p className="text-gray-600 mt-2">
            Erken Uyarı Sistemi - Öğrenci risk durumlarını takip edin
          </p>
        </div>

        {/* Summary Stats - Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-red-200 bg-red-50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Kritik Riskli Öğrenciler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">
                {summary.critical}
              </div>
              <p className="text-xs text-red-700 mt-1">Acil müdahale gerekli</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Takip Gerektirenler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600">
                {summary.warning}
              </div>
              <p className="text-xs text-yellow-700 mt-1">Yakın takip önerilir</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Güvende Olanlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {summary.safe}
              </div>
              <p className="text-xs text-green-700 mt-1">İyi gidiyor</p>
            </CardContent>
          </Card>
        </div>

        {/* At Risk Students - Grid Layout */}
        {students.length === 0 ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-16">
              <div className="text-center">
                <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Harika iş çıkarıyorsunuz!</h3>
                <p className="text-gray-600 text-lg">
                  Şu an risk radarında hiçbir öğrenci bulunmuyor.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card key={student.id} className={`border-2 ${getRiskBorderColor(student.riskLevel)} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                        {student.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        {getRiskBadge(student.riskLevel)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {student.grade}. Sınıf
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Auto-generated Risk Reason */}
                  <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {student.riskFactors.length > 0 
                        ? student.riskFactors.join('. ')
                        : 'Risk faktörü belirtilmemiş'}
                    </p>
                  </div>

                  {/* Call to Action Buttons */}
                  <div className="space-y-3">
                    <Link href={`/advisor/meetings?student=${student.id}`} className="block">
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                        <Calendar className="w-4 h-4 mr-2" />
                        Hemen Görüşme Planla
                      </Button>
                    </Link>
                    <Link href={`/advisor/students/${student.id}`} className="block">
                      <Button variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Detaylara Git
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}