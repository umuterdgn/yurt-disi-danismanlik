import Link from "next/link";
import { GraduationCap, Phone, Mail, MapPin } from "lucide-react";

export function PublicFooter() {
  return (
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
              <li className="flex items-center space-x-2 text-gray-400">
                <Phone className="w-4 h-4" />
                <span>+90 212 123 45 67</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span>info@nxa.com.tr</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>İskenderun, Hatay</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 ATA VISION Eğitim Danışmanlığı. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
