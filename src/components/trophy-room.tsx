import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Zap, Target, BookOpen, Flame } from "lucide-react";

interface TrophyRoomProps {
  badges?: string[];
  xp?: number;
}

const badgeConfig: Record<string, { icon: any; label: string; description: string; color: string }> = {
  'odak_ustasi': { icon: Target, label: 'Odak Ustası', description: '10 tam Pomodoro', color: 'bg-purple-500' },
  'gorev_canavari': { icon: Zap, label: 'Görev Canavarı', description: '50 görev tamamlandı', color: 'bg-yellow-500' },
  'kitap_kurdu': { icon: BookOpen, label: 'Kitap Kurdu', description: '100 saat çalışma', color: 'bg-blue-500' },
  'ates_ustasi': { icon: Flame, label: 'Ateş Ustası', description: '7 günlük streak', color: 'bg-orange-500' },
  'yildiz_ogrenci': { icon: Star, label: 'Yıldız Öğrenci', description: '1000 XP', color: 'bg-green-500' },
  'bilge_ustasi': { icon: Trophy, label: 'Bilge Ustası', description: '5000 XP', color: 'bg-red-500' },
};

export function TrophyRoom({ badges = [], xp = 0 }: TrophyRoomProps) {
  const earnedBadges = badges.filter(badge => badgeConfig[badge]);
  const lockedBadges = Object.keys(badgeConfig).filter(badge => !badges.includes(badge));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Kupa Odası
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* XP Summary */}
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Trophy className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-700">Toplam XP</p>
                  <p className="text-2xl font-bold text-yellow-900">{xp}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-yellow-700">Kazanılan Rozet</p>
                <p className="text-2xl font-bold text-yellow-900">{earnedBadges.length}/{Object.keys(badgeConfig).length}</p>
              </div>
            </div>
          </div>

          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Kazanılan Rozetler</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {earnedBadges.map((badge) => {
                  const config = badgeConfig[badge];
                  const Icon = config.icon;
                  return (
                    <div key={badge} className={`p-3 rounded-lg ${config.color} text-white`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="w-5 h-5" />
                        <span className="font-semibold text-sm">{config.label}</span>
                      </div>
                      <p className="text-xs opacity-90">{config.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Locked Badges */}
          {lockedBadges.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Kilitli Rozetler</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {lockedBadges.map((badge) => {
                  const config = badgeConfig[badge];
                  const Icon = config.icon;
                  return (
                    <div key={badge} className="p-3 rounded-lg bg-gray-100 text-gray-500 opacity-60">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="w-5 h-5" />
                        <span className="font-semibold text-sm">{config.label}</span>
                      </div>
                      <p className="text-xs">{config.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">🔒 Kilitli</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {earnedBadges.length === 0 && lockedBadges.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Henüz rozet kazanmadın. Görevleri tamamlayarak rozet kazan!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}