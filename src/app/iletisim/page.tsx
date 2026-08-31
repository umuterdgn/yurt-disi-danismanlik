"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Clock, MapPin, MessageCircle } from "lucide-react";
import { PublicNavbar } from "@/components/public-navbar";
import { PublicFooter } from "@/components/public-footer";

export default function IletisimPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const message = `Merhaba, adım ${formData.name}. ${formData.service} hakkında ön görüşme talep ediyorum. Telefonum: ${formData.phone}. Mesajım: ${formData.message}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/905300781478?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">İletişim</h1>
            <p className="text-lg text-gray-600">Bizimle iletişime geçin, geleceğinizi birlikte planlayalım</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">E-posta</h3>
                    <p className="text-gray-600">info@nxa.com.tr</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Çalışma Saatleri</h3>
                    <p className="text-gray-600">Pazartesi - Cuma: 09:00 - 18:00</p>
                    <p className="text-gray-600">Cumartesi: 10:00 - 14:00</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Konum</h3>
                    <p className="text-gray-600">İskenderun, Hatay</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">Neden Bizi Seçmelisiniz?</h3>
                <ul className="space-y-2 text-blue-50">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                    10+ yıllık deneyim
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                    500+ başarılı öğrenci
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                    Kişiye özel danışmanlık
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                    Güçlü üniversite ağları
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Consultation Request Form */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Ön Görüşme Talep Et</CardTitle>
              <p className="text-gray-600 mt-2">Formu doldurun, WhatsApp üzerinden size ulaşalım</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad *</Label>
                  <Input
                    id="name"
                    placeholder="Adınız Soyadınız"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon Numarası *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">İlgilenilen Hizmet *</Label>
                  <Select value={formData.service} onValueChange={(value) => handleChange("service", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Hizmet seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yurt Dışı Danışmanlığı">Yurt Dışı Danışmanlığı</SelectItem>
                      <SelectItem value="Eğitim Koçluğu">Eğitim Koçluğu</SelectItem>
                      <SelectItem value="Her İkisi">Her İkisi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Eklemek İstedikleriniz</Label>
                  <Textarea
                    id="message"
                    placeholder="Mesajınızı buraya yazın..."
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp ile Gönder
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}
