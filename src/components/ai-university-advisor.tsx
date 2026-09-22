"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, GraduationCap, Globe, DollarSign, BookOpen, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface UniversityRecommendation {
  universityName: string;
  country: string;
  city: string;
  estimatedCost: string;
  currency: string;
  admissionRequirements: string[];
  applicationProcess: string;
  languageRequirements: string;
  matchScore: number;
  reason: string;
}

interface AIUniversityAdvisorProps {
  studentId: string;
  academicPerformance: any[];
  currentScore: number | null;
  targetScore: number | null;
  targetMajor?: string | null;
  targetUniversity?: string | null;
}

export function AIUniversityAdvisor({
  studentId,
  academicPerformance,
  currentScore,
  targetScore,
  targetMajor,
  targetUniversity
}: AIUniversityAdvisorProps) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<UniversityRecommendation[]>([]);
  const [formData, setFormData] = useState({
    targetMajor: targetMajor || '',
    targetCountry: '',
    budget: '',
    languageLevel: 'IELTS 6.0'
  });

  const handleGetRecommendations = async () => {
    if (!formData.targetMajor || !formData.budget) {
      toast.error('Lütfen hedef bölüm ve bütçe bilgilerini girin');
      return;
    }

    setLoading(true);
    try {
      // Prepare academic performance data
      const performanceData = academicPerformance.map(perf => ({
        subject: perf.subject,
        successRate: perf.progressPercent || 0,
        proficiency: perf.proficiency,
        isStrong: perf.proficiency === 'EXCELLENT' || perf.proficiency === 'GOOD'
      }));

      const response = await fetch('/api/ai/university-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicPerformance: performanceData,
          targetMajor: formData.targetMajor,
          targetScore: targetScore || 0,
          currentScore: currentScore || 0,
          budget: formData.budget,
          languageLevel: formData.languageLevel,
          targetCountry: formData.targetCountry || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations);
        toast.success('Üniversite önerileri alındı!');
      } else {
        toast.error(data.error || 'Öneriler alınamadı');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'Çok Uygun';
    if (score >= 60) return 'Uygun';
    if (score >= 40) return 'Orta Uygun';
    return 'Düşük Uygun';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Üniversite Öneri Motoru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Input Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetMajor">Hedef Bölüm</Label>
                <Input
                  id="targetMajor"
                  value={formData.targetMajor}
                  onChange={(e) => setFormData({ ...formData, targetMajor: e.target.value })}
                  placeholder="Örn: Computer Science, Business Administration"
                />
              </div>
              <div>
                <Label htmlFor="targetCountry">Hedef Ülke (Opsiyonel)</Label>
                <Input
                  id="targetCountry"
                  value={formData.targetCountry}
                  onChange={(e) => setFormData({ ...formData, targetCountry: e.target.value })}
                  placeholder="Örn: İngiltere, Almanya, Kanada"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Yıllık Bütçe</Label>
                <Input
                  id="budget"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="Örn: 15.000-20.000 EUR, 20.000-25.000 USD"
                />
              </div>
              <div>
                <Label htmlFor="languageLevel">Dil Seviyesi</Label>
                <Select 
                  value={formData.languageLevel}
                  onValueChange={(value) => setFormData({ ...formData, languageLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IELTS 5.0">IELTS 5.0 (Orta)</SelectItem>
                    <SelectItem value="IELTS 6.0">IELTS 6.0 (İyi)</SelectItem>
                    <SelectItem value="IELTS 6.5">IELTS 6.5 (Çok İyi)</SelectItem>
                    <SelectItem value="IELTS 7.0">IELTS 7.0 (Mükemmel)</SelectItem>
                    <SelectItem value="TOEFL 80">TOEFL 80</SelectItem>
                    <SelectItem value="TOEFL 90">TOEFL 90</SelectItem>
                    <SelectItem value="TOEFL 100">TOEFL 100+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleGetRecommendations} 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? 'Öneriler Alınıyor...' : 'AI Üniversite Önerisi Al'}
            </Button>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Önerilen Üniversiteler</h3>
              {recommendations.map((rec, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <GraduationCap className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-lg">{rec.universityName}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            <span>{rec.city}, {rec.country}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{rec.estimatedCost}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="relative h-2 w-24 overflow-hidden rounded-full bg-gray-200 mb-1">
                          <div 
                            className={`h-full ${getMatchScoreColor(rec.matchScore)}`}
                            style={{ width: `${rec.matchScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">%{rec.matchScore} {getMatchScoreLabel(rec.matchScore)}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">Kabul Şartları</span>
                        </div>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {rec.admissionRequirements.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Dil Gereksinimi</span>
                        </div>
                        <p className="text-sm text-gray-600">{rec.languageRequirements}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">Başvuru Süreci</span>
                        </div>
                        <p className="text-sm text-gray-600">{rec.applicationProcess}</p>
                      </div>

                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-blue-900">
                          <span className="font-medium">Neden bu üniversite?</span> {rec.reason}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {recommendations.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Üniversite önerisi almak için formu doldurun</p>
              <p className="text-sm mt-2">AI motoru öğrencinin akademik performansına en uygun üniversiteleri önerecek.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}