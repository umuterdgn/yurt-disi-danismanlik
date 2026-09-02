import Link from "next/link";
import { 
  GraduationCap, 
  Globe, 
  Users, 
  Target, 
  CheckCircle, 
  Award,
  ArrowRight,
  FileText,
  Plane,
  Home,
  BookOpen,
  Search,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNavbar } from "@/components/public-navbar";

export default function ServicesPage() {
  const services = [
    {
      icon: Search,
      title: "Üniversite Seçimi",
      description: "Akademik hedeflerinize en uygun üniversiteleri belirliyoruz.",
      color: "blue",
      features: [
        "Akademik profil analizi",
        "Üniversite araştırması ve karşılaştırma",
        "Sıralama ve akreditasyon değerlendirmesi",
        "Kampüs ve şehir incelemeleri",
        "Maliyet analizi ve burs araştırması"
      ]
    },
    {
      icon: FileText,
      title: "Başvuru Danışmanlığı",
      description: "Belgelerden mülakatlara kadar tüm başvuru sürecinde profesyonel destek.",
      color: "green",
      features: [
        "Başvuru stratejisi oluşturma",
        "Kişisel statement ve essay hazırlığı",
        "Referans mektubu koordinasyonu",
        "CV ve portfolyo düzenlemesi",
        "Online başvuru yönetimi"
      ]
    },
    {
      icon: Plane,
      title: "Vize Destek",
      description: "Öğrenci vizesi başvurularınızda uzman ekibimizle yanınızdayız.",
      color: "purple",
      features: [
        "Vize türü belirleme",
        "Gerekli belgelerin hazırlanması",
        "Başvuru formu doldurma",
        "Mülakat hazırlığı",
        "Vize takibi ve sonuçlandırma"
      ]
    },
    {
      icon: Award,
      title: "Burs Danışmanlığı",
      description: "Uygun burs fırsatlarını araştırıyor ve başvurularınızda destek oluyoruz.",
      color: "orange",
      features: [
        "Burs araştırması ve eşleştirme",
        "Burs başvuru stratejisi",
        "Essay ve motivation letter hazırlığı",
        "Burs mülakatı hazırlığı",
        "Burs takibi ve raporlama"
      ]
    },
    {
      icon: GraduationCap,
      title: "Eğitim Koçluğu",
      description: "Eğitim hayatınız boyunca size özel koçluk ve akademik destek.",
      color: "red",
      features: [
        "Akademik planlama",
        "Ders seçimi danışmanlığı",
        "Çalışma programı oluşturma",
        "Sınav hazırlık stratejisi",
        "Performans takibi ve raporlama"
      ]
    },
    {
      icon: Home,
      title: "Konaklama Desteği",
      description: "Yurt dışı konaklama seçeneklerinde size en uygun çözümleri sunuyoruz.",
      color: "teal",
      features: [
        "Yurt ve apartman araştırması",
        "Konaklama bütçesi planlaması",
        "Kira sözleşmesi destek",
        "Ev arkadaşı eşleştirme",
        "Yerleşim yardımı"
      ]
    },
    {
      icon: Globe,
      title: "Dil Hazırlık",
      description: "IELTS, TOEFL ve diğer dil sınavlarına hazırlık programları.",
      color: "indigo",
      features: [
        "Dil seviyesi tespiti",
        "Kişiye özel hazırlık programı",
        "Deneme sınavları",
        "Speaking ve writing coaching",
        "Sınav kayıt ve strateji"
      ]
    },
    {
      icon: BookOpen,
      title: "Akademik Danışmanlık",
      description: "Üniversite hayatınız boyunca akademik başarı için rehberlik.",
      color: "pink",
      features: [
        "Bölüm ve ders seçimi",
        "Akademik hedef belirleme",
        "Proje ve tez danışmanlığı",
        "Staj ve kariyer planlama",
        "Mezuniyet sonrası hedefler"
      ]
    },
    {
      icon: CheckSquare,
      title: "Ön Hazırlık",
      description: "Yurt dışı eğitime başlamadan önce kapsamlı hazırlık programı.",
      color: "yellow",
      features: [
        "Kültürel uyum eğitimi",
        "Yaşam becerileri workshops",
        "Akademik dil becerileri",
        "Sosyal entegrasyon desteği",
        "Mentorluk programı"
      ]
    }
  ];

  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", gradient: "from-blue-600 to-blue-800" },
    green: { bg: "bg-green-100", text: "text-green-600", gradient: "from-green-600 to-green-800" },
    purple: { bg: "bg-purple-100", text: "text-purple-600", gradient: "from-purple-600 to-purple-800" },
    orange: { bg: "bg-orange-100", text: "text-orange-600", gradient: "from-orange-600 to-orange-800" },
    red: { bg: "bg-red-100", text: "text-red-600", gradient: "from-red-600 to-red-800" },
    teal: { bg: "bg-teal-100", text: "text-teal-600", gradient: "from-teal-600 to-teal-800" },
    indigo: { bg: "bg-indigo-100", text: "text-indigo-600", gradient: "from-indigo-600 to-indigo-800" },
    pink: { bg: "bg-pink-100", text: "text-pink-600", gradient: "from-pink-600 to-pink-800" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-600", gradient: "from-yellow-600 to-yellow-800" }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Hizmetlerimiz</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Eğitim yolculuğunuzun her aşamasında kapsamlı danışmanlık hizmetleri sunuyoruz. 
            Başvurudan mezuniyete kadar yanınızdayız.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              const colors = colorClasses[service.color as keyof typeof colorClasses];
              
              return (
                <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
                  <div className="p-8">
                    <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-6`}>
                      <Icon className={`w-7 h-7 ${colors.text}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    
                    <ul className="space-y-3">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <CheckCircle className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Çalışma Sürecimiz</h2>
            <p className="text-xl text-gray-600">Başvurudan yerleşmeye kadar adım adım rehberlik</p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="space-y-8">
              {[
                { step: "1", title: "İlk Danışmanlık", description: "Hedeflerinizi belirliyor ve size uygun eğitim planı oluşturuyoruz." },
                { step: "2", title: "Üniversite Seçimi", description: "Akademik profilinize en uygun üniversiteleri araştırıyoruz." },
                { step: "3", title: "Başvuru Hazırlığı", description: "Gerekli belgeleri hazırlıyor ve başvurunuzu yönetiyoruz." },
                { step: "4", title: "Vize İşlemleri", description: "Vize başvurunuzda profesyonel destek sağlıyoruz." },
                { step: "5", title: "Yerleşme", description: "Yurt dışı yaşamınıza kolaylıkla uyum sağlamanıza yardımcı oluyoruz." }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{item.step}</span>
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Size Özel Hizmet Planı Oluşturalım</h2>
          <p className="text-xl text-blue-100 mb-8">
            Ücretsiz danışmanlık için hemen iletişime geçin, ihtiyaçlarınızı analiz edelim.
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