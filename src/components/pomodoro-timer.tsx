"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { addStudentXP } from "@/actions/admin";
import { toast } from "sonner";

export function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !isCompleted) {
      intervalRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer completed
            clearInterval(intervalRef.current!);
            setIsActive(false);
            setIsCompleted(true);
            handlePomodoroComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, minutes, seconds, isCompleted]);

  const handlePomodoroComplete = async () => {
    try {
      // Get current user from localStorage or session
      const userData = localStorage.getItem('userProfile');
      if (userData) {
        const user = JSON.parse(userData);
        const result = await addStudentXP(user.studentId, 20);
        
        if (result.success) {
          toast.success("Tebrikler! 🎉", {
            description: "25 dakika odaklı çalıştın! +20 XP kazandın!",
            icon: <Sparkles className="w-5 h-5 text-yellow-500" />
          });
        }
      }
    } catch (error) {
      console.error('XP reward error:', error);
    }
  };

  const toggleTimer = () => {
    if (isCompleted) {
      resetTimer();
    } else {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsCompleted(false);
    setMinutes(25);
    setSeconds(0);
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((25 - minutes) / 25) * 100;

  return (
    <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Pomodoro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <div className="text-6xl font-bold font-mono">
            {formatTime(minutes, seconds)}
          </div>
          
          <div className="w-full bg-green-700 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-center space-x-3">
            <Button
              onClick={toggleTimer}
              className="bg-white text-green-600 hover:bg-green-50"
              size="lg"
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Duraklat
                </>
              ) : isCompleted ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Yeniden Başla
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Başlat
                </>
              )}
            </Button>
            
            <Button
              onClick={resetTimer}
              variant="outline"
              className="bg-green-700 text-white hover:bg-green-800 border-green-500"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Sıfırla
            </Button>
          </div>
          
          {isCompleted && (
            <div className="bg-green-700 p-3 rounded-lg">
              <p className="text-sm font-semibold">🎉 Tamamlandı! +20 XP</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}