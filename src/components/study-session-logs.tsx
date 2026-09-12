import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Timer, AlertTriangle, CheckCircle } from "lucide-react";

interface StudySessionLog {
  id: string;
  subject: string;
  taskTitle: string;
  startTime: string;
  endTime: string;
  pauseCount: number;
  duration: number;
  status: string;
  statusDisplay: string;
  hasWarning: boolean;
  date: string;
}

interface StudySessionLogsProps {
  studySessionLogs: StudySessionLog[];
}

export function StudySessionLogs({ studySessionLogs }: StudySessionLogsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'INTERRUPTED':
        return 'bg-red-100 text-red-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} saat ${mins} dk`;
    }
    return `${mins} dk`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Çalışma Logları & Efor
        </CardTitle>
      </CardHeader>
      <CardContent>
        {studySessionLogs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Henüz çalışma oturumu kaydı yok.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {studySessionLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-4 rounded-lg border ${
                  log.hasWarning ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{log.subject}</h4>
                      {log.hasWarning && (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{log.taskTitle}</p>
                  </div>
                  <Badge className={getStatusColor(log.status)}>
                    {log.statusDisplay}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Tarih</p>
                    <p className="font-medium">{log.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Başlangıç</p>
                    <p className="font-medium">{log.startTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Bitiş</p>
                    <p className="font-medium">{log.endTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Süre</p>
                    <p className="font-medium">{formatDuration(log.duration)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Mola Sayısı:</span>
                    <span className={`font-medium ${log.pauseCount > 3 ? 'text-red-600' : 'text-gray-900'}`}>
                      {log.pauseCount}
                    </span>
                  </div>
                  {log.pauseCount > 3 && (
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                      Yüksek mola sayısı
                    </span>
                  )}
                </div>

                {log.hasWarning && (
                  <div className="mt-3 p-2 bg-red-100 rounded-lg">
                    <p className="text-sm text-red-700">
                      {log.status === 'INTERRUPTED' 
                        ? 'Bu oturum yarıda bırakıldı. Öğrenci motivasyonu kontrol edilmeli.'
                        : 'Bu oturumda çok fazla mola verildi. Odak süresi artırılmalı.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}