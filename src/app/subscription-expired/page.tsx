import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function SubscriptionExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="max-w-md w-full border-2 border-red-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Abonelik Süreniz Doldu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm text-red-800 font-medium">
                  Platform kullanım aboneliğiniz sona ermiştir.
                </p>
                <p className="text-sm text-red-700">
                  Hesabınızı kullanmaya devam etmek için lütfen paketinizi yenileyin veya yöneticinizle iletişime geçin.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full bg-red-600 hover:bg-red-700" asChild>
              <Link href="/advisor/contact">
                <RefreshCw className="w-4 h-4 mr-2" />
                Yöneticiyle İletişime Geç
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">
                Çıkış Yap
              </Link>
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            <p>Yardım için: destek@platform.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
