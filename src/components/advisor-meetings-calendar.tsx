"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddMeetingDialog } from "@/components/add-meeting-dialog";
import { RescheduleMeetingDialog } from "@/components/reschedule-meeting-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import Link from 'next/link';

interface Meeting {
  id: string;
  meetingDate: Date;
  duration: number;
  motivationLevel: string;
  achievements?: string;
  issues?: string;
  actionItems?: string;
  notes?: string;
  nextMeetingDate?: Date;
  studentProfile: {
    id: string;
    user: {
      name: string;
    };
  };
}

interface AdvisorMeetingsCalendarProps {
  meetings: Meeting[];
  students: { id: string; name: string }[];
  userName: string;
}

export function AdvisorMeetingsCalendar({ meetings, students, userName }: AdvisorMeetingsCalendarProps) {
  const [localMeetings, setLocalMeetings] = useState<Meeting[]>(meetings);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi'den başla
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const getMotivationColor = (level: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-red-100 text-red-700',
      'medium': 'bg-yellow-100 text-yellow-700',
      'high': 'bg-green-100 text-green-700'
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  const getMotivationLabel = (level: string) => {
    const labels: Record<string, string> = {
      'low': 'Düşük',
      'medium': 'Orta',
      'high': 'Yüksek'
    };
    return labels[level] || level;
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    const daysToAdd = direction === 'next' ? 7 : -7;
    newDate.setDate(newDate.getDate() + daysToAdd);
    setCurrentWeekStart(newDate);
  };

  const getWeekDays = () => {
    const days = [];
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push({
        name: dayNames[i],
        date: date,
        dateString: date.toISOString().split('T')[0]
      });
    }
    
    return days;
  };

  const getMeetingsForDay = (dateString: string) => {
    let filteredMeetings = localMeetings;

    // Filter by student
    if (selectedStudent !== 'all') {
      filteredMeetings = filteredMeetings.filter(meeting => meeting.studentProfile?.id === selectedStudent);
    }

    // Filter by meeting date (only meetings for this specific day)
    return filteredMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.meetingDate).toISOString().split('T')[0];
      return meetingDate === dateString;
    });
  };

  const getFilteredMeetings = () => {
    let filteredMeetings = localMeetings;

    // Filter by student
    if (selectedStudent !== 'all') {
      filteredMeetings = filteredMeetings.filter(meeting => meeting.studentProfile?.id === selectedStudent);
    }

    return filteredMeetings;
  };

  const weekDays = getWeekDays();
  const filteredMeetings = getFilteredMeetings();

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours} saat ${mins} dk` : `${hours} saat`;
    }
    return `${minutes} dk`;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Takvim & Görüşmeler</h1>
          <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Görüşme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{filteredMeetings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Süre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {Math.round(filteredMeetings.reduce((sum: number, m: Meeting) => sum + m.duration, 0) / 60)} saat
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Yüksek Motivasyon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {filteredMeetings.filter((m: Meeting) => m.motivationLevel === 'high').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bu Ay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {filteredMeetings.filter((m: Meeting) => {
                  const meetingDate = new Date(m.meetingDate);
                  const now = new Date();
                  return meetingDate.getMonth() === now.getMonth() && meetingDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar / List View */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
              <CardTitle className="text-xl font-semibold text-gray-900">Görüşme Takvimi</CardTitle>
              
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="h-8"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Takvim
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8"
                >
                  <List className="w-4 h-4 mr-1" />
                  Liste
                </Button>
              </div>

              {/* Week Navigation - Only for Calendar View */}
              {viewMode === 'calendar' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekChange('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium text-gray-600 min-w-[200px] text-center">
                    {weekDays[0].date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - 
                    {weekDays[6].date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekChange('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
              <div className="w-full md:w-48">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Öğrenci Seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Öğrenciler</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AddMeetingDialog students={students} />
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'calendar' ? (
              /* Calendar View */
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 overflow-x-auto">
                {weekDays.map((day) => {
                  const dayMeetings = getMeetingsForDay(day.dateString);
                  const isToday = new Date().toISOString().split('T')[0] === day.dateString;
                  
                  return (
                    <div
                      key={day.dateString}
                      className={`min-w-[200px] ${isToday ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 border'} rounded-lg p-3`}
                    >
                      <div className="flex flex-col items-center mb-3">
                        <h3 className={`font-semibold text-sm ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                          {day.name}
                        </h3>
                        <span className={`text-xs ${isToday ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          {day.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {dayMeetings.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-2">Görüşme yok</p>
                        ) : (
                          dayMeetings.map((meeting) => (
                            <div
                              key={meeting.id}
                              className="bg-white p-3 rounded border shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full"
                            >
                              {/* Time Badge - Most Prominent */}
                              <Badge className="mb-2 text-xs font-medium bg-purple-100 text-purple-700 border-purple-200">
                                {formatTime(meeting.meetingDate)} - {formatDuration(meeting.duration)}
                              </Badge>
                              
                              {/* Student Name */}
                              <p className="text-xs font-medium mb-1 text-gray-900">
                                {meeting.studentProfile?.user?.name || 'Öğrenci'}
                              </p>
                              
                              {/* Motivation Level */}
                              <Badge className={`text-xs ${getMotivationColor(meeting.motivationLevel)}`}>
                                {getMotivationLabel(meeting.motivationLevel)}
                              </Badge>
                              
                              {/* Topic/Notes Preview */}
                              {meeting.achievements && (
                                <p className="text-xs text-gray-500 mt-2 truncate">
                                  {meeting.achievements}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div>
                {filteredMeetings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Henüz görüşme notu bulunmuyor.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredMeetings.map((meeting) => (
                      <div key={meeting.id} className="border rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {meeting.studentProfile?.user?.name || 'Öğrenci'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(meeting.meetingDate).toLocaleDateString('tr-TR')} - {formatDuration(meeting.duration)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getMotivationColor(meeting.motivationLevel)}>
                              {getMotivationLabel(meeting.motivationLevel)}
                            </Badge>
                            <RescheduleMeetingDialog 
                              meetingId={meeting.id}
                              currentMeetingDate={meeting.meetingDate.toISOString()}
                              studentName={meeting.studentProfile?.user?.name || 'Öğrenci'}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          {meeting.achievements && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Başarılar:</h4>
                              <p className="text-sm text-gray-600">{meeting.achievements}</p>
                            </div>
                          )}

                          {meeting.issues && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Sorunlar:</h4>
                              <p className="text-sm text-gray-600">{meeting.issues}</p>
                            </div>
                          )}

                          {meeting.actionItems && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Aksiyonlar:</h4>
                              <p className="text-sm text-gray-600">{meeting.actionItems}</p>
                            </div>
                          )}

                          {meeting.notes && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Notlar:</h4>
                              <p className="text-sm text-gray-600">{meeting.notes}</p>
                            </div>
                          )}

                          {meeting.nextMeetingDate && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Sonraki Görüşme:</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(meeting.nextMeetingDate).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <Link 
                            href={`/advisor/students/${meeting.studentProfileId}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Öğrenci Detayına Git →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}