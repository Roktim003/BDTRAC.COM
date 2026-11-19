import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * BDTRAC — Prisma 7 configuration (Part 2).
 * In Prisma 7 the database URL lives here, not in schema.prisma, and the
 * CLI no longer loads .env itself — hence the explicit dotenv import.
 * Seed command is declared here too (Prisma 7 removed package.json config).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
