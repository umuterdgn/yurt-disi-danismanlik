import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  GraduationCap, 
  Globe, 
  MapPin, 
  DollarSign,
  Languages,
  ArrowRight,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CountriesPage() {
  const countries = await prisma.country.findMany({
    where: { isActive: true },
    include: {
      universities: {
        take: 3,
        orderBy: { ranking: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Nexa</span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Eğitim Alabileceğiniz Ülkeler</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dünyanın en iyi eğitim sistemlerine sahip ülkelerini keşfedin. 
            Her ülke için detaylı bilgi ve danışmanlık hizmeti sunuyoruz.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">{countries.length}</div>
              <div className="text-gray-600">Aktif Ülke</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {countries.reduce((sum: number, country: any) => sum + country.universities.length, 0)}
              </div>
              <div className="text-gray-600">Partner Üniversite</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {countries.filter((c: any) => c.visaRequired).length}
              </div>
              <div className="text-gray-600">Vize Gerekli</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {countries.filter((c: any) => c.language).length}
              </div>
              <div className="text-gray-600">Dil Desteği</div>
            </div>
          </div>
        </div>
      </section>

      {/* Countries Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {countries.map((country) => (
              <Link 
                key={country.id} 
                href={`/ulkeler/${country.slug}`}
                className="group"
              >
                <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 group-hover:border-blue-300">
                  {country.coverImage ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={country.coverImage}
                        alt={country.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <Globe className="w-20 h-20 text-white" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {country.name}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      {country.language && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Languages className="w-4 h-4" />
                          <span>{country.language}</span>
                        </div>
                      )}
                      {country.currency && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{country.currency}</span>
                        </div>
                      )}
                      {country.averageCost && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>Ortalama ${country.averageCost.toLocaleString()}/yıl</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{country.universities.length} Üniversite</span>
                      </div>
                      <div className="flex items-center space-x-2 text-blue-600 group-hover:translate-x-1 transition-transform">
                        <span className="text-sm font-medium">Detaylar</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {countries.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Ülke Eklenmemiş</h3>
              <p className="text-gray-600">Yakında daha fazla ülke eklenecek.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Hangi Ülke Sizin İçin İdeal?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Ücretsiz danışmanlık için hemen iletişime geçin, size en uygun ülkeyi belirleyelim.
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="w-8 h-8 text-blue-400" />
                <span className="text-xl font-bold">Nexa</span>
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
            <p>&copy; 2024 Nexa Yurt Dışı Danışmanlık. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}