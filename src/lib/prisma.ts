/**
 * BDTRAC — Prisma client singleton (Part 2, lazy since Part 4).
 *
 * Prisma 7 has no built-in database driver: the client is constructed with
 * the @prisma/adapter-pg driver adapter over the `pg` pool. The generated
 * client lives in src/generated/prisma (run `npm run db:generate`) and is
 * gitignored — it is regenerated on every install/build, never committed.
 *
 * The client is created LAZILY via getPrismaClient() so importing this
 * module never throws: routes that need the database call the getter
 * inside their handler and can answer 503 when DATABASE_URL is unset,
 * instead of taking down the whole app at import time. The instance is
 * cached on globalThis so Next.js dev hot-reloads do not leak pools.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set — Prisma data layer cannot start. " +
        "Set it in .env.local (see .env.example).",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** True when a database connection string is configured. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
