"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const timeSlots = [
  { id: 1, time: "09:00", available: true },
  { id: 2, time: "10:00", available: true },
  { id: 3, time: "11:00", available: false },
  { id: 4, time: "12:00", available: true },
  { id: 5, time: "14:00", available: true },
  { id: 6, time: "14:30", available: true },
  { id: 7, time: "15:00", available: false },
  { id: 8, time: "16:00", available: true },
  { id: 9, time: "16:30", available: true },
  { id: 10, time: "17:00", available: true }
];

const upcomingMeetings = [
  { id: 1, student: "Ahmet Yılmaz", date: "29.08.2026", time: "10:00", type: "Eğitim Koçluğu", status: "confirmed", zoomUrl: "https://zoom.us/j/123456789" },
  { id: 2, student: "Elif Demir", date: "29.08.2026", time: "14:30", type: "Yurt Dışı Danışmanlık", status: "confirmed", zoomUrl: "https://zoom.us/j/987654321" },
  { id: 3, student: "Mehmet Kaya", date: "30.08.2026", time: "11:00", type: "Eğitim Koçluğu", status: "pending", zoomUrl: "https://zoom.us/j/456789123" },
  { id: 4, student: "Ayşe Çelik", date: "30.08.2026", time: "16:00", type: "Veli Görüşmesi", status: "confirmed", zoomUrl: "https://zoom.us/j/789123456" },
  { id: 5, student: "Can Özkan", date: "31.08.2026", time: "09:00", type: "Yurt Dışı Danışmanlık", status: "confirmed", zoomUrl: "https://zoom.us/j/321654987" },
  { id: 6, student: "Zeynep Arslan", date: "31.08.2026", time: "15:00", type: "Eğitim Koçluğu", status: "pending", zoomUrl: "https://zoom.us/j/654987321" }
];

const getStatusBadge = (status: string) => {
  if (status === "confirmed") {
    return <Badge className="bg-green-500 hover:bg-green-600">Onaylandı</Badge>;
  }
  return <Badge variant="outline">Beklemede</Badge>;
};

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentBooked, setAppointmentBooked] = useState(false);

  const handleTimeSlotClick = (time: string, available: boolean) => {
    if (!available) return;
    setSelectedTime(time);
    setAppointmentBooked(false);
  };

  const handleBookAppointment = () => {
    if (selectedTime) {
      setAppointmentBooked(true);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Tarih seçin";
    return date.toLocaleDateString("tr-TR", { 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Randevu Yönetimi</h1>
        
        <Tabs defaultValue="student" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Randevu Al (Öğrenci)</TabsTrigger>
            <TabsTrigger value="advisor">Yaklaşan Toplantılar (Danışman)</TabsTrigger>
          </TabsList>

          {/* Student View - Calendar and Time Slot Selection */}
          <TabsContent value="student" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Tarih Seçin</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Seçilen Tarih:</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(selectedDate)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Müsait Saatler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleTimeSlotClick(slot.time, slot.available)}
                        disabled={!slot.available}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          !slot.available
                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                            : selectedTime === slot.time
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-gray-300 text-gray-900 hover:border-blue-500 hover:bg-blue-50"
                        }`}
                      >
                        <p className="font-medium">{slot.time}</p>
                        {!slot.available && (
                          <p className="text-xs mt-1">Dolu</p>
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedTime && (
                    <div className="mt-6 space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <span className="font-semibold">Seçilen Saat:</span> {selectedTime}
                        </p>
                      </div>
                      
                      {!appointmentBooked ? (
                        <Button
                          onClick={handleBookAppointment}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          Randevu Al
                        </Button>
                      ) : (
                        <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                          <p className="text-green-800 font-semibold text-center">
                            ✓ Randevunuz başarıyla alındı!
                          </p>
                          <p className="text-green-700 text-sm text-center mt-1">
                            {formatDate(selectedDate)} - {selectedTime}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advisor View - Upcoming Meetings */}
          <TabsContent value="advisor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Yaklaşan Toplantılar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-600">Öğrenci</TableHead>
                        <TableHead className="text-gray-600">Tarih</TableHead>
                        <TableHead className="text-gray-600">Saat</TableHead>
                        <TableHead className="text-gray-600">Toplantı Türü</TableHead>
                        <TableHead className="text-gray-600">Durum</TableHead>
                        <TableHead className="text-gray-600">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingMeetings.map((meeting) => (
                        <TableRow key={meeting.id}>
                          <TableCell className="font-medium text-gray-900">{meeting.student}</TableCell>
                          <TableCell className="text-gray-600">{meeting.date}</TableCell>
                          <TableCell className="text-gray-600">{meeting.time}</TableCell>
                          <TableCell className="text-gray-600">{meeting.type}</TableCell>
                          <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                          <TableCell>
                            {meeting.status === "confirmed" && (
                              <Button className="bg-blue-600 hover:bg-blue-700">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                Zoom'a Katıl
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Toplam Toplantı</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-700">{upcomingMeetings.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Onaylanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-700">
                    {upcomingMeetings.filter(m => m.status === "confirmed").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-700">Bekleyen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-700">
                    {upcomingMeetings.filter(m => m.status === "pending").length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
