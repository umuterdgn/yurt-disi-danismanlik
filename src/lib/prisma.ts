import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Güvenlik için fallback (yedek) URL'mizi de doğrudan burada tanımlıyoruz (Pooler portu 6543)
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres.cgclalfcuehpmkvixaox:Hopekutay064431%21@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

// Prisma 7 için adapter kullanımı
const adapter = new PrismaPg({ connectionString: databaseUrl })
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma