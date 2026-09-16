import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, MapPin, Award } from "lucide-react";

interface DreamBoardProps {
  targetUniversity?: string;
  targetCountry?: string;
  targetProgram?: string;
}

export function DreamBoard({ targetUniversity, targetCountry, targetProgram }: DreamBoardProps) {
  if (!targetUniversity) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-[#0f2042] to-[#1a3050] text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#c89f65]" />
          Hayalimdeki Üniversite
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <GraduationCap className="w-6 h-6 mt-1 flex-shrink-0 text-[#c89f65]" />
            <div>
              <p className="text-sm text-[#c89f65]/80">Hedef Üniversite</p>
              <p className="text-xl font-bold">{targetUniversity}</p>
            </div>
          </div>

          {targetCountry && (
            <div className="flex items-start space-x-3">
              <MapPin className="w-6 h-6 mt-1 flex-shrink-0 text-[#c89f65]" />
              <div>
                <p className="text-sm text-[#c89f65]/80">Ülke</p>
                <p className="text-lg font-semibold">{targetCountry}</p>
              </div>
            </div>
          )}

          {targetProgram && (
            <div className="flex items-start space-x-3">
              <Award className="w-6 h-6 mt-1 flex-shrink-0 text-[#c89f65]" />
              <div>
                <p className="text-sm text-[#c89f65]/80">Program</p>
                <p className="text-lg font-semibold">{targetProgram}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}