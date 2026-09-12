import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Sparkles, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { SOPAssistantForm } from "@/components/sop-assistant-form";

export default function SOPAssistantPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <PenTool className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Nexa Writing Assistant</h1>
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-gray-600">
            AI destekli niyet mektubu (SOP) analizi ve düzeltme asistanı
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  SOP / Motivation Letter Editörü
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SOPAssistantForm />
              </CardContent>
            </Card>
          </div>

          {/* Tips and Guidelines */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">💡 Nasıl Kullanılır?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <p className="text-sm text-gray-700">Taslak SOP metnini editöre yapıştır</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <p className="text-sm text-gray-700">"AI Analizi İste" butonuna tıkla</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <p className="text-sm text-gray-700">AI'dan detaylı geri bildirim al</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                  <p className="text-sm text-gray-700">Önerileri değerlendir ve metni geliştir</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">✅ Güçlü Bir SOP İçin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-sm text-gray-700">Akademik hedefler net ve spesifik olmalı</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-sm text-gray-700">Üniversiteyle bağlantı kurmalı</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-sm text-gray-700">Kişisel deneyimleri dahil etmeli</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-sm text-gray-700">Gelecek planları belirlemeli</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Önemli Not
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800">
                  Bu asistan metni analiz eder ve düzeltme önerileri sunar, ancak metni baştan yazmaz. 
                  Etik kurallar gereği orijinal fikirlerinizi korumanız önemlidir.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}