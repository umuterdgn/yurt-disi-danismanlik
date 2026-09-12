"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Timer, Play, Pause, RotateCcw, Sparkles, CheckCircle, X } from "lucide-react";
import { 
  getStudentPomodoroDuration, 
  startStudySession, 
  updateStudySession, 
  completeStudySession, 
  interruptStudySession 
} from "@/actions/study-session";
import { toast } from "sonner";

interface TaskIntegratedPomodoroProps {
  taskId: string;
  taskTitle: string;
  subject: string;
  onTaskComplete?: () => void;
}

export function TaskIntegratedPomodoro({ taskId, taskTitle, subject, onTaskComplete }: TaskIntegratedPomodoroProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [duration, setDuration] = useState(25);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [actualDuration, setActualDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load student's pomodoro duration when component opens
  useEffect(() => {
    if (isOpen) {
      loadPomodoroDuration();
    }
  }, [isOpen]);

  const loadPomodoroDuration = async () => {
    try {
      const studentDuration = await getStudentPomodoroDuration();
      setDuration(studentDuration);
      setMinutes(studentDuration);
      setSeconds(0);
    } catch (error) {
      console.error('Error loading pomodoro duration:', error);
    }
  };

  useEffect(() => {
    if (isActive && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setActualDuration(prev => prev + 1); // Track actual duration in seconds
        
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

  const handleStartSession = async () => {
    try {
      const result = await startStudySession(taskId, subject);
      if (result.success && result.session) {
        setSessionId(result.session.id);
        setIsActive(true);
        toast.success("Çalışma oturumu başlatıldı!", {
          description: `${subject} - ${taskTitle}`
        });
      } else {
        toast.error("Oturum başlatılamadı");
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error("Bir hata oluştu");
    }
  };

  const handlePause = async () => {
    setIsActive(false);
    setPauseCount(prev => prev + 1);
    
    if (sessionId) {
      try {
        await updateStudySession(sessionId, pauseCount + 1);
      } catch (error) {
        console.error('Error updating session:', error);
      }
    }
    
    toast.info("Mola verildi", {
      description: `Toplam molalar: ${pauseCount + 1}`
    });
  };

  const handleResume = () => {
    setIsActive(true);
  };

  const handlePomodoroComplete = async () => {
    if (!sessionId) return;
    
    try {
      const durationInMinutes = Math.floor(actualDuration / 60);
      const result = await completeStudySession(sessionId, durationInMinutes, true);
      
      if (result.success) {
        toast.success("Tebrikler! 🎉", {
          description: `Çalışma tamamlandı! +${result.xpGained} XP kazandın!`,
          icon: <Sparkles className="w-5 h-5 text-yellow-500" />
        });
        
        if (onTaskComplete) {
          onTaskComplete();
        }
        
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error("Bir hata oluştu");
    }
  };

  const handleEarlyComplete = async () => {
    if (!sessionId) return;
    
    try {
      const durationInMinutes = Math.floor(actualDuration / 60);
      const result = await completeStudySession(sessionId, durationInMinutes, true);
      
      if (result.success) {
        toast.success("Çalışma tamamlandı!", {
          description: `Erken bitirdin! +${result.xpGained} XP kazandın!`
        });
        
        if (onTaskComplete) {
          onTaskComplete();
        }
        
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error("Bir hata oluştu");
    }
  };

  const handleInterrupt = async () => {
    if (!sessionId) return;
    
    try {
      const durationInMinutes = Math.floor(actualDuration / 60);
      const result = await interruptStudySession(sessionId, durationInMinutes);
      
      if (result.success) {
        toast.warning("Çalışma yarıda kaldı", {
          description: "Oturum kesinti olarak kaydedildi"
        });
        
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error interrupting session:', error);
      toast.error("Bir hata oluştu");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    resetTimer();
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsCompleted(false);
    setMinutes(duration);
    setSeconds(0);
    setPauseCount(0);
    setActualDuration(0);
    setSessionId(null);
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatActualDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins} dk ${secs} sn`;
  };

  const progress = ((duration * 60 - (minutes * 60 + seconds)) / (duration * 60)) * 100;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
        size="sm"
      >
        <Timer className="w-4 h-4 mr-2" />
        Çalışmaya Başla
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Pomodoro Çalışma Oturumu
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Task Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-900">{taskTitle}</p>
              <p className="text-sm text-gray-600">{subject}</p>
            </div>

            {/* Timer Display */}
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold font-mono text-gray-900">
                {formatTime(minutes, seconds)}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Gerçek Süre</p>
                  <p className="font-semibold text-gray-900">{formatActualDuration(actualDuration)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Mola Sayısı</p>
                  <p className="font-semibold text-gray-900">{pauseCount}</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-3">
              {!isActive && !isCompleted && !sessionId && (
                <Button
                  onClick={handleStartSession}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Başla
                </Button>
              )}

              {isActive && (
                <Button
                  onClick={handlePause}
                  variant="outline"
                  size="lg"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Mola Ver
                </Button>
              )}

              {!isActive && sessionId && !isCompleted && (
                <Button
                  onClick={handleResume}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Devam Et
                </Button>
              )}

              {sessionId && !isCompleted && (
                <Button
                  onClick={handleEarlyComplete}
                  variant="default"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Erken Bitir
                </Button>
              )}

              {sessionId && (
                <Button
                  onClick={handleInterrupt}
                  variant="destructive"
                  size="lg"
                >
                  <X className="w-4 h-4 mr-2" />
                  İptal
                </Button>
              )}
            </div>

            {isCompleted && (
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <Sparkles className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <p className="font-semibold text-green-900">🎉 Tebrikler! Çalışma tamamlandı!</p>
                <p className="text-sm text-green-700">Görev işaretlendi ve XP kazandın.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleClose}
              variant="outline"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}