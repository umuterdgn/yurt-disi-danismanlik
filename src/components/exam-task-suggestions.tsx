"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { addSuggestedTask } from "@/actions/add-task";

interface WeakTopicRecommendation {
  type: 'topic_review';
  subject: string;
  topic: string | null;
  subtopic: string | null;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedAction: string;
  sourceExamId: string;
}

interface ExamTaskSuggestionsProps {
  suggestions: WeakTopicRecommendation[];
  studentProfileId: string;
  onClose?: () => void;
}

export function ExamTaskSuggestions({ suggestions, studentProfileId, onClose }: ExamTaskSuggestionsProps) {
  const [addingTask, setAddingTask] = useState<string | null>(null);

  const handleAddTask = async (recommendation: WeakTopicRecommendation) => {
    setAddingTask(recommendation.topic || 'unknown');
    
    try {
      const result = await addSuggestedTask(studentProfileId, recommendation);
      
      if (result.success) {
        toast.success(`${recommendation.topic} görevi eklendi!`);
      } else {
        toast.error(result.error || 'Görev eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding suggested task:', error);
      toast.error('Görev eklenirken hata oluştu');
    } finally {
      setAddingTask(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-red-100 text-red-700',
      'medium': 'bg-yellow-100 text-yellow-700',
      'low': 'bg-green-100 text-green-700'
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

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-[#c89f65] bg-gradient-to-r from-[#0f2042]/5 to-[#c89f65]/5">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-[#c89f65]" />
          Yapay Zeka Çalışma Önerileri
        </CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Deneme analizi sonrası AI tarafından oluşturulan çalışma önerileri. 
          Bu önerileri görev olarak eklemek için "Görev Olarak Ekle" butonunu kullanın.
        </p>
        <div className="space-y-3">
          {suggestions.map((recommendation, index) => (
            <div
              key={`${recommendation.topic}-${index}`}
              className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {recommendation.topic}
                    </h4>
                    <Badge className={getPriorityColor(recommendation.priority)}>
                      {getPriorityLabel(recommendation.priority)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{recommendation.reason}</p>
                  <p className="text-sm text-gray-500 italic">{recommendation.suggestedAction}</p>
                </div>
                <Button
                  onClick={() => handleAddTask(recommendation)}
                  disabled={addingTask === (recommendation.topic || 'unknown')}
                  size="sm"
                  className="ml-4 bg-[#c89f65] hover:bg-[#c89f65]/90 text-[#0f2042]"
                >
                  {addingTask === (recommendation.topic || 'unknown') ? (
                    'Ekleniyor...'
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Görev Olarak Ekle
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}