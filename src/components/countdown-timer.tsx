"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Target } from "lucide-react";

interface CountdownTimerProps {
  examDate?: Date | string;
  examName?: string;
}

export function CountdownTimer({ examDate, examName }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!examDate) return;

    const targetDate = new Date(examDate);
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [examDate]);

  if (!examDate) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-8 h-8" />
            <div>
              <h3 className="text-lg font-bold">{examName || 'Hedef Sınav'}</h3>
              <p className="text-sm text-orange-100">Sınava kalan süre</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Clock className="w-6 h-6" />
            <div className="flex space-x-3 text-center">
              <div>
                <div className="text-3xl font-bold">{timeLeft.days}</div>
                <div className="text-xs text-orange-100">Gün</div>
              </div>
              <div className="text-2xl">:</div>
              <div>
                <div className="text-3xl font-bold">{timeLeft.hours}</div>
                <div className="text-xs text-orange-100">Saat</div>
              </div>
              <div className="text-2xl">:</div>
              <div>
                <div className="text-3xl font-bold">{timeLeft.minutes}</div>
                <div className="text-xs text-orange-100">Dakika</div>
              </div>
              <div className="text-2xl">:</div>
              <div>
                <div className="text-3xl font-bold">{timeLeft.seconds}</div>
                <div className="text-xs text-orange-100">Saniye</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}