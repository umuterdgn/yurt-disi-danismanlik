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
  MapPin,
  Bot,
  Gamepad2,
  Timer,
  Bell,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNavbar } from "@/components/public-navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                Yurt İçi ve Yurt Dışı Eğitimde
                <span className="text-blue-600"> Yapay Zeka Destekli Yeni Dönem</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl">
                İster YKS, DGS ve MSÜ ile Türkiye'nin zirvesini, ister dünyanın en iyi üniversitelerini hedefleyin. ATA VISION'ın oyunlaştırılmış yeni nesil öğrenci paneli ve 7/24 AI eğitim koçluğu ile başarıya giden yolu baştan tasarladık.
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

      {/* ATA VISION Student Platform Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">ATA VISION Öğrenci Platformu</h2>
            <p className="text-xl text-gray-600">Teknolojik farkımızla eğitiminizi yeni nesil bir deneyime dönüştürüyoruz</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-8 hover:shadow-xl transition-all hover:-translate-y-1 border border-purple-100">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">7/24 AI Eğitim Koçu</h3>
              <p className="text-gray-600">
                Groq yapay zeka altyapısıyla deneme analizlerinizi saniyeler içinde yapar, eksik konularınızı belirler ve size özel çalışma stratejileri sunar.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 hover:shadow-xl transition-all hover:-translate-y-1 border border-blue-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Oyunlaştırılmış Deneyim</h3>
              <p className="text-gray-600">
                Sıkıcı çalışma rutinlerine son! Görevleri tamamladıkça XP kazanın, rozetler toplayın, alev serinizi (Streak) koruyun ve liderlik tablosunda yükselin.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 hover:shadow-xl transition-all hover:-translate-y-1 border border-green-100">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
                <Timer className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Entegre Odaklanma Araçları</h3>
              <p className="text-gray-600">
                Sistem içi Pomodoro sayacı, günlük Kanban görev panosu ve hedef sınav geri sayım araçlarıyla zaman yönetimini ustalıkla yapın.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 hover:shadow-xl transition-all hover:-translate-y-1 border border-orange-100">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">İnteraktif Süreç Takibi</h3>
              <p className="text-gray-600">
                Evrak onay döngüsü, anlık bildirim sistemi ve interaktif takvim ile danışmanınızla 7/24 senkronize ilerleyin.
              </p>
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
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Teknolojik Güçlü Yapımız</h2>
            <p className="text-xl text-gray-300">Yapay zeka destekli yeni nesil eğitim platformu</p>
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
              <div className="text-5xl font-bold text-purple-400 mb-2">7/24</div>
              <div className="text-gray-300">AI Eğitim Koçu</div>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Neden ATA VISION?</h2>
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
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Şeffaf ve Anlık İletişim</h3>
                  <p className="text-gray-600">Öğrenci ve veli panelimiz sayesinde evrak süreçlerinizi, net grafiklerinizi ve danışman notlarınızı anlık olarak takip edebilirsiniz.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Yapay Zeka Destekli Eğitim Deneyimini Keşfedin</h2>
          <p className="text-xl text-blue-100 mb-8">
            Yurt içi ve yurt dışı eğitim hedeflerinize ATA VISION'ın teknolojik gücüyle ulaşın. Hemen ücretsiz danışmanlık alın.
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