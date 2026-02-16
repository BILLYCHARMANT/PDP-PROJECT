/**
 * Prisma 7 CLI config: datasource URL and schema path.
 * Place at project root (next to package.json).
 * Load .env.local (Next.js) and .env so DATABASE_URL is available for migrations/push.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Set DATABASE_URL in .env.local (e.g. from .env.example) for your hosted DB
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/PROGRAMS?schema=public",
  },
});
