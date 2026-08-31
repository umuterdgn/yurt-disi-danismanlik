import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres.cgclalfcuehpmkvixaox:Hopekutay064431%21@aws-0-eu-central-1.pooler.supabase.com:5432/postgres",
  },
});