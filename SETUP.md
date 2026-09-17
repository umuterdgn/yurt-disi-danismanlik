# Production Setup

Canlı ortamda Supabase Auth kullanıcılarını senkronize etmek için bu endpoint'i kullanın:

## Setup Endpoint

**URL:** `POST /api/setup`

**Request Body:**
```json
{
  "secret": "SETUP_SECRET_12345"
}
```

**cURL komutu:**
```bash
curl -X POST https://your-domain.com/api/setup \
  -H "Content-Type: application/json" \
  -d '{"secret": "SETUP_SECRET_12345"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Setup başarıyla tamamlandı",
  "users": {
    "admin": "admin@test.com",
    "advisor": "advisor@test.com", 
    "student": "student@test.com",
    "parent": "parent@example.com"
  }
}
```

## Kullanıcı Bilgileri

Setup tamamlandıktan sonra şu kullanıcılarla giriş yapabilirsiniz:

| Rol | Email | Şifre | Dashboard |
|-----|-------|-------|-----------|
| Super Admin | admin@test.com | 123456 | /admin/dashboard |
| Advisor | advisor@test.com | 123456 | /advisor/dashboard |
| Student | student@test.com | 123456 | /student/dashboard |
| Parent | parent@example.com | parent123 | /parent/dashboard |

## Güvenlik Notu

- Bu endpoint sadece production ortamında kullanılmalıdır
- Secret anahtarı gerçek production'da environment variable olarak ayarlanmalıdır
- Setup tamamlandıktan sonra bu endpoint kaldırılmalı veya kısıtlanmalıdır