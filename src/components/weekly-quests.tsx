"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Flame, Star, CheckCircle, Clock } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  targetCount: number;
  type: string;
  difficulty: string;
  currentCount: number;
  isCompleted: boolean;
  completedAt?: string;
}

interface WeeklyQuestsProps {
  studentId: string;
}

export function WeeklyQuests({ studentId }: WeeklyQuestsProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuests();
  }, [studentId]);

  const fetchQuests = async () => {
    try {
      const response = await fetch(`/api/quests?studentId=${studentId}`);
      if (!response.ok) throw new Error("Failed to fetch quests");
      const data = await response.json();
      setQuests(data);
    } catch (error) {
      console.error("Error fetching quests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestIcon = (type: string) => {
    switch (type) {
      case 'POMODORO':
        return <Clock className="w-5 h-5" />;
      case 'TASK':
        return <CheckCircle className="w-5 h-5" />;
      case 'EXAM':
        return <Target className="w-5 h-5" />;
      case 'STUDY_TIME':
        return <Flame className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-700';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700';
      case 'HARD':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'Kolay';
      case 'MEDIUM':
        return 'Orta';
      case 'HARD':
        return 'Zor';
      default:
        return difficulty;
    }
  };

  const getProgress = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Haftalık Meydan Okumalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Haftalık Meydan Okumalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Bu hafta aktif meydan okuma bulunmuyor.</p>
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
          Haftalık Meydan Okumalar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quests.map((quest) => {
            const progress = getProgress(quest.currentCount, quest.targetCount);
            return (
              <div
                key={quest.id}
                className={`p-4 rounded-lg border ${
                  quest.isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {quest.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        getQuestIcon(quest.type)
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{quest.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{quest.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getDifficultyColor(quest.difficulty)}>
                      {getDifficultyLabel(quest.difficulty)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-purple-600 font-medium">
                      <Star className="w-4 h-4" />
                      +{quest.xpReward} XP
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {quest.currentCount}/{quest.targetCount}
                    </span>
                    <span className="text-gray-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {quest.isCompleted && quest.completedAt && (
                  <div className="mt-2 text-xs text-green-600">
                    Tamamlandı: {new Date(quest.completedAt).toLocaleDateString('tr-TR')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}