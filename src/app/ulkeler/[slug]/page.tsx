import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  GraduationCap, 
  Globe, 
  MapPin, 
  DollarSign,
  Languages,
  FileText,
  ArrowLeft,
  Home,
  Calendar,
  BookOpen,
  Users,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const country = await prisma.country.findUnique({
    where: { slug },
    include: {
      universities: {
        take: 6,
        orderBy: { ranking: 'asc' }
      }
    }
  });

  if (!country || !country.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <div className="flex items-baseline gap-1">
                <span className="font-serif font-extrabold text-xl tracking-wide text-primary">ATA</span>
                <span className="font-light text-lg tracking-widest text-primary/80">VISION</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900">Ana Sayfa</Link>
              <Link href="/hakkimizda" className="text-gray-700 hover:text-gray-900">Hakkımızda</Link>
              <Link href="/hizmetlerimiz" className="text-gray-700 hover:text-gray-900">Hizmetlerimiz</Link>
              <Link href="/ulkeler" className="text-blue-600 font-medium">Ülkeler</Link>
              <Link href="/iletisim" className="text-gray-700 hover:text-gray-900">İletişim</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Giriş Yap</Button>
              </Link>
              <Link href="/register">
                <Button>Kayıt Ol</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/ulkeler" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Ülkeler</span>
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">{country.name}</h1>
              <p className="text-xl text-gray-600 mb-8">
                {country.language && `Dil: ${country.language}`}
                {country.language && country.currency && ' • '}
                {country.currency && `Para Birimi: ${country.currency}`}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                {country.visaRequired && (
                  <div className="flex items-center space-x-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">Vize Gerekli</span>
                  </div>
                )}
                {country.averageCost && (
                  <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Ortalama Maliyet: ${country.averageCost.toLocaleString()}/yıl
                    </span>
                  </div>
                )}
              </div>

              <Link href="/register">
                <Button size="lg" className="flex items-center space-x-2">
                  <span>{country.name} Eğitimi Hakkında Danışmanlık Al</span>
                </Button>
              </Link>
            </div>

            {country.coverImage && (
              <div className="relative">
                <img
                  src={country.coverImage}
                  alt={country.name}
                  className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Country Content */}
      {country.pageContent && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: country.pageContent }} />
            </div>
          </div>
        </section>
      )}

      {/* Key Information */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Temel Bilgiler</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Konum</h3>
              <p className="text-gray-600">{country.name}</p>
            </div>

            {country.language && (
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Languages className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Dil</h3>
                <p className="text-gray-600">{country.language}</p>
              </div>
            )}

            {country.currency && (
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Para Birimi</h3>
                <p className="text-gray-600">{country.currency}</p>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Vize</h3>
              <p className="text-gray-600">
                {country.visaRequired ? 'Gerekli' : 'Gerekli Değil'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Universities */}
      {country.universities.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Öne Çıkan Üniversiteler</h2>
                <p className="text-xl text-gray-600">{country.name}'daki partner üniversitelerimiz</p>
              </div>
              <Link href="/universities">
                <Button variant="outline">Tümünü Gör</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {country.universities.map((university: any) => (
                <div key={university.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{university.name}</h3>
                      <p className="text-gray-600 flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{university.city}</span>
                      </p>
                    </div>
                    {university.ranking && (
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        #{university.ranking}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {university.type && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Home className="w-4 h-4" />
                        <span>{university.type}</span>
                      </div>
                    )}
                    {university.tuitionFees && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>${university.tuitionFees.toLocaleString()}/yıl</span>
                      </div>
                    )}
                    {university.languageRequirement && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Languages className="w-4 h-4" />
                        <span>{university.languageRequirement}</span>
                      </div>
                    )}
                  </div>

                  <Link href="/register">
                    <Button variant="outline" className="w-full">
                      Danışmanlık Al
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Education System Info */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{country.name} Eğitim Sistemi</h2>
            <p className="text-xl text-blue-100">Dünya standartlarında eğitim kalitesi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur rounded-xl p-8">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">Akademik Mükemmellik</h3>
              <p className="text-blue-100">
                {country.name}'daki üniversiteler dünya sıralamalarında üst sıralarda yer alıyor.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-8">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">Uluslararası Ortam</h3>
              <p className="text-blue-100">
                Farklı kültürlerden öğrencilerle küresel bir ağ oluşturun.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-8">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">Kariyer Fırsatları</h3>
              <p className="text-blue-100">
                Mezuniyet sonrası global kariyer imkanları.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {country.name}'da Eğitim Almaya Hazır mısınız?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Ücretsiz danışmanlık için hemen iletişime geçin, size özel çözümler sunalım.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="flex items-center space-x-2">
                <span>Ücretsiz Danışmanlık Al</span>
              </Button>
            </Link>
            <Link href="/iletisim">
              <Button size="lg" variant="outline">
                İletişime Geçin
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex flex-col mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif font-extrabold text-2xl tracking-wide text-white">ATA</span>
                  <span className="font-light text-xl tracking-widest text-white/80">VISION</span>
                </div>
                <span className="text-[10px] tracking-widest text-gray-400 uppercase mt-1">Eğitim Danışmanlığı</span>
              </div>
              <p className="text-gray-400">
                Yurt dışı eğitim danışmanlığı ile geleceğinizi şekillendirin.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Hızlı Linkler</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white">Ana Sayfa</Link></li>
                <li><Link href="/hakkimizda" className="text-gray-400 hover:text-white">Hakkımızda</Link></li>
                <li><Link href="/hizmetlerimiz" className="text-gray-400 hover:text-white">Hizmetlerimiz</Link></li>
                <li><Link href="/ulkeler" className="text-gray-400 hover:text-white">Ülkeler</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Hizmetler</h3>
              <ul className="space-y-2">
                <li><Link href="/hizmetlerimiz" className="text-gray-400 hover:text-white">Üniversite Seçimi</Link></li>
                <li><Link href="/hizmetlerimiz" className="text-gray-400 hover:text-white">Başvuru Danışmanlığı</Link></li>
                <li><Link href="/hizmetlerimiz" className="text-gray-400 hover:text-white">Vize Destek</Link></li>
                <li><Link href="/hizmetlerimiz" className="text-gray-400 hover:text-white">Burs Danışmanlığı</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">İletişim</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">+90 212 123 45 67</li>
                <li className="text-gray-400">info@nexa.com.tr</li>
                <li className="text-gray-400">İstanbul, Türkiye</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ATA VISION Eğitim Danışmanlığı. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}