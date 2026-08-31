import Link from "next/link";
import { 
  GraduationCap, 
  Globe, 
  Users, 
  Target, 
  CheckCircle, 
  Award,
  ArrowRight,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                Hayallerinizdeki Eğitim,
                <span className="text-blue-600">Global Kariyer</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl">
                Yurt dışı eğitim danışmanlığı ile geleceğinizi şekillendirin. 
                Nexa ile dünyanın en iyi üniversitelerine adım atın.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row w-full gap-4 justify-center md:justify-start">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="flex items-center space-x-2 w-full sm:w-auto">
                    <span>Ücretsiz Danışmanlık Al</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/hizmetlerimiz" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Hizmetlerimizi Keşfedin
                  </Button>
                </Link>
                <Link href="/iletisim" className="w-full sm:w-auto">
                  <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" size="lg">
                    Hemen Bize Ulaşın
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">500+</div>
                    <div className="text-blue-100">Başarılı Öğrenci</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">50+</div>
                    <div className="text-blue-100">Partner Üniversite</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">15+</div>
                    <div className="text-blue-100">Ülke</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">%98</div>
                    <div className="text-blue-100">Başarı Oranı</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Öne Çıkan Hizmetlerimiz</h2>
            <p className="text-xl text-gray-600">Kapsamlı danışmanlık hizmetlerimizle eğitiminizde size rehberlik ediyoruz</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Üniversite Seçimi</h3>
              <p className="text-gray-600">
                Akademik hedeflerinize en uygun üniversiteleri belirliyor ve başvuru sürecinizi yönetiyoruz.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Başvuru Danışmanlığı</h3>
              <p className="text-gray-600">
                Belgelerden mülakatlara kadar tüm başvuru sürecinde profesyonel destek sağlıyoruz.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Vize Destek</h3>
              <p className="text-gray-600">
                Öğrenci vizesi başvurularınızda uzman ekibimizle yanınızdayız.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Eğitim Koçluğu</h3>
              <p className="text-gray-600">
                Eğitim hayatınız boyunca size özel koçluk ve akademik destek sunuyoruz.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Burs Danışmanlığı</h3>
              <p className="text-gray-600">
                Uygun burs fırsatlarını araştırıyor ve başvurularınızda destek oluyoruz.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Konaklama Desteği</h3>
              <p className="text-gray-600">
                Yurt dışı konaklama seçeneklerinde size en uygun çözümleri sunuyoruz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Başarılarımız</h2>
            <p className="text-xl text-gray-300">Yılların deneyimi ve binlerce başarılı öğrenci</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-400 mb-2">500+</div>
              <div className="text-gray-300">Başarılı Öğrenci</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-400 mb-2">50+</div>
              <div className="text-gray-300">Partner Üniversite</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-400 mb-2">15+</div>
              <div className="text-gray-300">Ülke</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-400 mb-2">%98</div>
              <div className="text-gray-300">Başarı Oranı</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Neden Nexa?</h2>
            <p className="text-xl text-gray-600">Eğitim yolculuğunuzda size eşlik eden güvenilir partneriniz</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Uzman Danışman Kadrosu</h3>
                  <p className="text-gray-600">Alanında uzman, deneyimli danışmanlarımızla size özel çözümler sunuyoruz.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Geniş Üniversite Ağı</h3>
                  <p className="text-gray-600">Dünyanın önde gelen 50+ üniversitesi ile güçlü partnerships ilişkileri.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Kişiye Özel Yaklaşım</h3>
                  <p className="text-gray-600">Her öğrencinin hedefleri ve ihtiyaçları farklı, biliyoruz ve buna göre hareket ediyoruz.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Yüksek Başarı Oranı</h3>
                  <p className="text-gray-600">%98 başarı oranı ile öğrencilerimizi hayallerine ulaştırıyoruz.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Sürekli Destek</h3>
                  <p className="text-gray-600">Başvuru sürecinden mezuniyete kadar yanınızdayız.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Şeffaf İşleyiş</h3>
                  <p className="text-gray-600">Tüm süreçlerde şeffaf ve güvenilir iletişim sağlıyoruz.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Eğitim Hayatınızı Şekillendirmeye Hazır mısınız?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Ücretsiz danışmanlık için hemen iletişime geçin, size özel çözümler sunalım.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="flex items-center space-x-2">
                <span>Ücretsiz Danışmanlık Al</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/iletisim">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                İletişime Geçin
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}