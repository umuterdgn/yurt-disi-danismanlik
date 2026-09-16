import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { AddMeetingDialog } from "@/components/add-meeting-dialog";
import { RescheduleMeetingDialog } from "@/components/reschedule-meeting-dialog";

export default async function MeetingsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  let meetingNotes: any[] = [];
  let students: { id: string; name: string }[] = [];
  let userName = 'Danışman';

  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        advisorProfile: true
      }
    });

    if (dbUser) {
      userName = dbUser.name;

      // Get students for the dialog
      if (dbUser.role === 'SUPER_ADMIN') {
        const allStudents = await prisma.studentProfile.findMany({
          include: { user: true }
        });
        students = allStudents.map(s => ({ id: s.id, name: s.user.name }));
        
        meetingNotes = await prisma.meetingNote.findMany({
          include: {
            studentProfile: {
              include: {
                user: true
              }
            }
          },
          orderBy: { meetingDate: 'desc' }
        });
      } else if (dbUser.advisorProfile) {
        const advisorStudents = await prisma.studentProfile.findMany({
          where: { advisorId: dbUser.advisorProfile.id },
          include: { user: true }
        });
        students = advisorStudents.map(s => ({ id: s.id, name: s.user.name }));
        
        meetingNotes = await prisma.meetingNote.findMany({
          where: {
            studentProfile: {
              advisorId: dbUser.advisorProfile.id
            }
          },
          include: {
            studentProfile: {
              include: {
                user: true
              }
            }
          },
          orderBy: { meetingDate: 'desc' }
        });
      }
    }
  }

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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Görüşme Geçmişi</h1>
          <p className="text-gray-600 mt-2">Hoş Geldiniz, {userName}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Görüşme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{meetingNotes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Süre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {Math.round(meetingNotes.reduce((sum: number, m: any) => sum + m.duration, 0) / 60)} saat
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Yüksek Motivasyon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {meetingNotes.filter((m: any) => m.motivationLevel === 'high').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bu Ay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {meetingNotes.filter((m: any) => {
                  const meetingDate = new Date(m.meetingDate);
                  const now = new Date();
                  return meetingDate.getMonth() === now.getMonth() && meetingDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meeting Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">Görüşme Notları</CardTitle>
            <AddMeetingDialog students={students} />
          </CardHeader>
          <CardContent>
            {meetingNotes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henüz görüşme notu bulunmuyor.</p>
            ) : (
              <div className="space-y-4">
                {meetingNotes.map((meeting: any) => (
                  <div key={meeting.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {meeting.studentProfile?.user?.name || 'Öğrenci'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(meeting.meetingDate).toLocaleDateString('tr-TR')} - {meeting.duration} dakika
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
