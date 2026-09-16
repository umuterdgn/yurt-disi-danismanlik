"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AITaskSuggestion {
  id: string;
  title: string;
  description: string;
  subject: string;
  estimatedPomodoros: number;
  priority: string;
  suggestedDate: string;
}

interface AITaskSuggestionsProps {
  studentId: string;
  studentName: string;
}

export function AITaskSuggestions({ studentId, studentName }: AITaskSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AITaskSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, [studentId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/task-suggestions?studentId=${studentId}`);
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      toast.error("AI önerileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const generateNewSuggestions = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-task-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });

      if (!response.ok) throw new Error("Failed to generate suggestions");

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      toast.success("Yeni AI önerileri oluşturuldu!");
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("AI önerileri oluşturulurken hata oluştu");
    } finally {
      setGenerating(false);
    }
  };

  const approveTask = async (suggestion: AITaskSuggestion) => {
    try {
      const response = await fetch('/api/advisor/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          title: suggestion.title,
          description: suggestion.description,
          subject: suggestion.subject,
          estimatedPomodoros: suggestion.estimatedPomodoros,
          priority: suggestion.priority,
          taskDate: suggestion.suggestedDate
        })
      });

      if (!response.ok) throw new Error("Failed to create task");

      toast.success("Görev öğrenciye eklendi!");
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      console.error("Error approving task:", error);
      toast.error("Görev eklenirken hata oluştu");
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-red-100 text-red-700',
      'medium': 'bg-[#c89f65]/20 text-[#c89f65]',
      'low': 'bg-[#0f2042]/20 text-[#0f2042]'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'high': 'Yüksek',
      'medium': 'Orta',
      'low': 'Düşük'
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Görev Önerileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#c89f65]" />
          AI Görev Önerileri
        </CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={generateNewSuggestions}
            disabled={generating}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            Yeni Öneriler
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">Henüz AI önerisi yok</p>
            <Button
              onClick={generateNewSuggestions}
              disabled={generating}
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Öneriler Oluştur
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 border rounded-lg bg-gradient-to-r from-[#0f2042]/5 to-[#c89f65]/5 hover:from-[#0f2042]/10 hover:to-[#c89f65]/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {getPriorityLabel(suggestion.priority)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Ders:</span> {suggestion.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Süre:</span> {suggestion.estimatedPomodoros} Pomodoro
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Tarih:</span> {new Date(suggestion.suggestedDate).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => approveTask(suggestion)}
                      size="sm"
                      className="bg-[#c89f65] hover:bg-[#c89f65]/90 text-[#0f2042]"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Onayla ve Ekle
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}