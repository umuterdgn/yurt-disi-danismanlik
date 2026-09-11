import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface StreakDisplayProps {
  streak: number;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  if (streak === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Flame className="w-8 h-8" />
            {streak >= 7 && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                🔥
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-orange-100">Günlük Seri</p>
            <p className="text-2xl font-bold">{streak} Gün</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}