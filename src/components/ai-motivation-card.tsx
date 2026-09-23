"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIMotivationCardProps {
  studentSymbol: string;
  currentXP: number;
  studentName: string;
}

export function AIMotivationCard({ studentSymbol, currentXP, studentName }: AIMotivationCardProps) {
  const [motivation, setMotivation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMotivation() {
      try {
        const response = await fetch('/api/ai/motivation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentSymbol, currentXP, studentName })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setMotivation(data.motivation);
        } else {
          throw new Error(data.error || 'API returned unsuccessful response');
        }
      } catch (error) {
        console.error('Error fetching motivation:', error);
        setMotivation(`${studentSymbol} ${currentXP} XP ile harikasın! Devam et!`);
      } finally {
        setLoading(false);
      }
    }

    fetchMotivation();
  }, [studentSymbol, currentXP, studentName]);

  return (
    <Card className="bg-gradient-to-r from-[#0f2042] to-[#1a3050] text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#c89f65]" />
          Günün Motivasyonu
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse text-sm md:text-lg">Yükleniyor...</div>
        ) : (
          <div className="text-sm md:text-lg font-semibold">{motivation}</div>
        )}
      </CardContent>
    </Card>
  );
}
