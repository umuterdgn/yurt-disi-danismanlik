import Link from "next/link";
import { 
  GraduationCap, 
  Target, 
  Eye, 
  Users, 
  Award,
  Globe,
  Heart,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Hakkımızda</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nexa olarak, öğrencilerin hayallerindeki eğitimi gerçeğe dönüştürmek için 
            yola çıktık. Global kariyer hedeflerinize ulaşmanızda size rehberlik ediyoruz.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Vizyonumuz</h2>
              <p className="text-blue-100 text-lg leading-relaxed">
                Global eğitim danışmanlığı alanında Türkiye'nin lider ve en güvenilir 
                markası olmak. Öğrencilerin dünyanın her yerindeki eğitim fırsatlarına 
                erişimini kolaylaştırarak, küresel yeteneklerin yetişmesine katkıda bulunmak.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 text-white">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Misyonumuz</h2>
              <p className="text-green-100 text-lg leading-relaxed">
                Her öğrencinin bireysel hedeflerini anlamak ve ona özel çözümler sunmak. 
                Şeffaf, profesyonel ve kişiye yaklaşım ile eğitim yolculuklarında 
                güvenilir bir partner olmak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Hikayemiz</h2>
            <p className="text-xl text-gray-600">
              Yolculuğumuz 2015 yılında, bir öğrencinin hayalini gerçeğe dönüştürmekle başladı
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  Nexa'nın kuruluş hikayesi, kendi yurt dışı eğitim deneyimimizden doğdu. 
                  Eğitim sistemlerinin karmaşıklığını, bürokratik süreçlerin zorluklarını 
                  ve doğru bilgiye ulaşmanın ne kadar değerli olduğunu firsthand olarak tecrübe ettik.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  2015 yılında İstanbul'da küçük bir ofis ile başlayan yolculuğumuz, bugün 
                  15+ ülkede, 50+ partner üniversite ile çalışarak 500+ başarılı öğrenciye 
                  hizmet veren bir kuruma dönüştü.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Her başarılı öğrenci hikayesi, bizi daha da motive ediyor. Geleceğin 
                  liderlerini, bilim insanlarını ve sanatçılarını yetiştirmek için çalışıyoruz.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Teknolojiyi ve insan odaklı yaklaşımı birleştirerek, eğitim danışmanlığı 
                  sektöründe yenilikçi çözümler sunmaya devam ediyoruz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Temel Değerlerimiz</h2>
            <p className="text-xl text-gray-600">Her gün çalışırken bizi yönlendiren prensiplerimiz</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Öğrenci Odaklılık</h3>
              <p className="text-gray-600">
                Her kararımızda öğrencilerin çıkarlarını ön planda tutuyoruz.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mükemmellik</h3>
              <p className="text-gray-600">
                Her hizmetimizde en yüksek kalite standartlarını hedefliyoruz.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">İnovasyon</h3>
              <p className="text-gray-600">
                Sürekli gelişim ve yeni çözümler arayışındayız.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Global Bakış</h3>
              <p className="text-gray-600">
                Dünyadaki tüm eğitim fırsatlarını öğrencilerimize sunuyoruz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ekibimiz</h2>
            <p className="text-xl text-gray-600">Uzman ve deneyimli kadromuzla tanışın</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Users className="w-20 h-20 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ahmet Yılmaz</h3>
                <p className="text-blue-600 font-medium mb-3">Kurucu & CEO</p>
                <p className="text-gray-600 text-sm">
                  15+ yıl yurt dışı eğitim deneyimi. Oxford mezunu.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Users className="w-20 h-20 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Elif Kaya</h3>
                <p className="text-green-600 font-medium mb-3">Eğitim Direktörü</p>
                <p className="text-gray-600 text-sm">
                  10+ yıl eğitim danışmanlığı deneyimi. Harvard mezunu.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <Users className="w-20 h-20 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mehmet Demir</h3>
                <p className="text-purple-600 font-medium mb-3">Operasyon Müdürü</p>
                <p className="text-gray-600 text-sm">
                  8+ yıl operasyon ve süreç yönetimi deneyimi.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <Users className="w-20 h-20 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ayşe Yıldız</h3>
                <p className="text-orange-600 font-medium mb-3">Vize Danışmanı</p>
                <p className="text-gray-600 text-sm">
                  7+ yıl vize danışmanlığı ve göç hukuku uzmanlığı.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                <Users className="w-20 h-20 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Can Özkan</h3>
                <p className="text-red-600 font-medium mb-3">Üniversite İlişkileri</p>
                <p className="text-gray-600 text-sm">
                  6+ yıl uluslararası üniversite ilişkileri yönetimi.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <Users className="w-20 h-20 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Zeynep Arslan</h3>
                <p className="text-teal-600 font-medium mb-3">Eğitim Koçu</p>
                <p className="text-gray-600 text-sm">
                  5+ yıl öğrenci koçluğu ve akademik danışmanlık deneyimi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ekibimize Katılmak İster misiniz?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Tutkulu ve deneyimli profesyonelleri ailemize bekliyoruz.
          </p>
          <Link href="/iletisim">
            <Button size="lg" variant="secondary">
              Kariyer Fırsatlarını İncele
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}