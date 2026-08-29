# Eğitim ve Yurt Dışı Danışmanlık Yönetim Sistemi

## Proje Özeti
Kapsamlı bir eğitim ve yurt dışı danışmanlık yönetim sistemi. 4 temel rol (Admin, Danışman, Öğrenci, Veli) için farklı modüller içerir.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Prisma ORM)
- **Hosting**: Supabase (Free tier - 1 year)
- **TypeScript**: Full type safety
- **Authentication**: NextAuth.js
- **Calendar Integration**: Google Calendar API
- **Video Integration**: Zoom API

## Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Environment Variables
`.env` dosyasını oluştur ve aşağıdaki değişkenleri doldur:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
ZOOM_API_KEY="your-zoom-api-key"
ZOOM_API_SECRET="your-zoom-api-secret"
```

### 3. Prisma Setup
```bash
# Prisma client oluştur
npx prisma generate

# Database migration oluştur
npx prisma migrate dev --name init

# Prisma Studio (görsel veritabanı yönetimi)
npx prisma studio
```

## Proje Yapısı

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── consultants/          # Danışman işlemleri
│   │   ├── students/             # Öğrenci işlemleri
│   │   ├── parents/              # Veli işlemleri
│   │   ├── admin/                # Admin işlemleri
│   │   ├── meetings/             # Toplantı işlemleri
│   │   └── applications/         # Başvuru işlemleri
│   ├── dashboard/                # Dashboard sayfaları
│   ├── (auth)/                   # Authentication sayfaları
│   └── layout.tsx                # Root layout
├── components/                   # React bileşenleri
│   ├── auth/                     # Auth bileşenleri
│   ├── dashboard/                # Dashboard bileşenleri
│   ├── consultant/               # Danışman paneli bileşenleri
│   ├── student/                  # Öğrenci paneli bileşenleri
│   ├── parent/                   # Veli paneli bileşenleri
│   ├── admin/                    # Admin paneli bileşenleri
│   ├── meetings/                 # Toplantı bileşenleri
│   └── applications/             # Başvuru bileşenleri
├── lib/                          # Utility fonksiyonları
│   ├── prisma.ts                 # Prisma client
│   ├── supabase.ts               # Supabase client
│   ├── auth.ts                   # Auth utility fonksiyonları
│   ├── env-config.ts             # Environment configuration
│   └── types.ts                  # TypeScript tipleri
└── generated/                    # Generated Prisma client
    └── prisma/
```

## Modüller

### 1. Eğitim Koçluğu Modülü
- **Öğrenci Profili**: Sınıf, hedef üniversite, hedef puan bilgileri
- **Günlük Görevler**: Öğrenci panelinde görev işaretleme
- **Deneme Takibi**: Hedef ve gerçekleşen bazlı grafikler
- **Konu Analizi**: Renk kodlu (zayıf, orta, iyi) konu etkinlik analizi
- **Görüşme Notları**: Danışmanlar için görüşme kayıtları

### 2. Yurt Dışı Eğitim Modülü
- **Ülke/Üniversite Filtreleme**: Bütçe ve dil seviyesine göre arama
- **Kanban Takip Sistemi**: Ön görüşmeden vizeye kadar süreç
- **Dijital Dosya Alanı**: Eksik belgelerin işaretlenmesi (CV, Kabul Mektubu vb.)

### 3. Raporlama ve Yönetim
- **Veli Raporları**: Haftalık çalışma süresi, net artışı, soru sayısı
- **Admin Dashboard**: Aktif başvurular, vize süreçleri, aylık gelir

### 4. Toplantı Planlayıcı
- **Entegre Takvim**: Öğrenci boş saatleri ve danışman müsaitliği
- **Zoom Entegrasyonu**: Otomatik toplantı linki oluşturma
- **Google Calendar API**: Takvim senkronizasyonu

## Build Komutları

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Production Start
```bash
npm start
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

## Database Komutları

### Migration Oluşturma
```bash
npx prisma migrate dev --name migration_name
```

### Migration Production'a Uygulama
```bash
npx prisma migrate deploy
```

### Database Reset
```bash
npx prisma migrate reset
```

### Prisma Studio
```bash
npx prisma studio
```

## Rol Tabanlı Erişim

### Admin
- Tüm sisteme tam erişim
- Dashboard ve raporları görüntüleme
- Kullanıcı yönetimi
- Gelir takibi

### Danışman
- Öğrenci profillerini görüntüleme
- Görüşme notları ekleme
- Toplantı planlama
- İlerleme takibi

### Öğrenci
- Kendi profilini görüntüleme
- Günlük görevlerini işaretleme
- Deneme sonuçlarını görüntüleme
- Başvuru süreçlerini takip etme

### Veli
- Çocuklarının ilerlemesini görüntüleme
- Haftalık raporlar
- Toplantı katılımı

## API Endpoints (Planlanan)

### Authentication
- `POST /api/auth/login` - Giriş
- `POST /api/auth/register` - Kayıt
- `POST /api/auth/logout` - Çıkış

### Students
- `GET /api/students/:id` - Öğrenci profili
- `PUT /api/students/:id` - Profil güncelleme
- `GET /api/students/:id/tasks` - Günlük görevler
- `POST /api/students/:id/tasks` - Görev ekleme
- `GET /api/students/:id/exams` - Deneme sınavları
- `POST /api/students/:id/exams` - Deneme ekleme

### Consultants
- `GET /api/consultants/:id` - Danışman profili
- `GET /api/consultants/:id/students` - Danışmanın öğrencileri
- `POST /api/consultants/:id/notes` - Görüşme notu ekleme

### Meetings
- `GET /api/meetings` - Toplantılar
- `POST /api/meetings` - Toplantı oluştur
- `POST /api/meetings/:id/zoom` - Zoom linki oluştur

### Applications
- `GET /api/applications` - Başvurular
- `POST /api/applications` - Başvuru oluştur
- `GET /api/applications/:id/documents` - Belgeler
- `POST /api/applications/:id/documents` - Belge yükle

## Test Planı
- Unit testler için Jest
- E2E testler için Playwright
- Database seed data

## Deployment
- Vercel (Next.js için optimize edilmiş)
- Supabase PostgreSQL database
- Environment variables management