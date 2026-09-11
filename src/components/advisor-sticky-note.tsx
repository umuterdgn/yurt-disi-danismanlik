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
    <Card className="bg-yellow-100 border-yellow-300 shadow-lg transform rotate-1 hover:rotate-0 transition-transform">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <MessageSquare className="w-5 h-5 text-yellow-700 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-yellow-900">Danışman Notu</h4>
              {advisorName && (
                <span className="text-sm text-yellow-700">{advisorName}</span>
              )}
            </div>
            <p className="text-yellow-800 whitespace-pre-wrap font-handwriting">
              {advisorNote}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}