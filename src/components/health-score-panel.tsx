"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Heart, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'

interface HealthScorePanelProps {
  healthScore: number
  riskStatus: string
  applicationReadiness: number
}

export function HealthScorePanel({ healthScore, riskStatus, applicationReadiness }: HealthScorePanelProps) {
  const getRiskBadge = (status: string) => {
    switch (status) {
      case 'GREEN':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Sorun Yok
          </Badge>
        )
      case 'YELLOW':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Dikkat
          </Badge>
        )
      case 'RED':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <ShieldAlert className="w-3 h-3 mr-1" />
            Kritik Risk
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="border-2 border-purple-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Öğrenci Sağlık Skoru
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">{healthScore}/100</p>
            <p className="text-sm text-gray-600 mt-1">Genel Durum</p>
          </div>
          {getRiskBadge(riskStatus)}
        </div>
        
        <div>
          <Progress value={healthScore} className="h-3" />
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Başvuru Hazırlık</span>
            <span className="text-sm font-semibold text-purple-600">{applicationReadiness}%</span>
          </div>
          <Progress value={applicationReadiness} className="h-2 mt-2" />
        </div>
      </CardContent>
    </Card>
  )
}