/**
 * BDTRAC — Prisma client singleton (Part 2).
 *
 * Prisma 7 has no built-in database driver: the client is constructed with
 * the @prisma/adapter-pg driver adapter over the `pg` pool. The generated
 * client lives in src/generated/prisma (run `npm run db:generate`) and is
 * gitignored — it is regenerated on every install/build, never committed.
 *
 * The singleton is cached on globalThis so Next.js dev hot-reloads do not
 * leak a new pool per reload.
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

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
