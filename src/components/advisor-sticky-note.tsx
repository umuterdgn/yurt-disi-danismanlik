import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface AdvisorStickyNoteProps {
  advisorNote?: string | null;
  advisorName?: string;
}

export function AdvisorStickyNote({ advisorNote, advisorName }: AdvisorStickyNoteProps) {
  if (!advisorNote) {
    return null;
  }

  return (
    <Card className="bg-[#c89f65]/20 border-[#c89f65]/40 shadow-lg transform rotate-1 hover:rotate-0 transition-transform">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <MessageSquare className="w-5 h-5 text-[#0f2042] mt-1 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-[#0f2042]">Danışman Notu</h4>
              {advisorName && (
                <span className="text-sm text-[#0f2042]">{advisorName}</span>
              )}
            </div>
            <p className="text-[#0f2042] whitespace-pre-wrap font-handwriting">
              {advisorNote}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}