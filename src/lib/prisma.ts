// Singleton Prisma client for Next.js.
//
// Why a singleton?
// Next.js dev mode hot-reloads modules on every file save, which would create
// a new PrismaClient instance on each reload and quickly exhaust the database
// connection pool. Storing the instance on `globalThis` means only one client
// is ever created per process, even across hot reloads.
//
// Why @prisma/adapter-pg?
// Prisma v7 no longer bundles its own database driver — it requires a "driver
// adapter" for direct connections. PrismaPg wraps the `pg` package and tells
// Prisma how to talk to PostgreSQL. This is the recommended approach for
// self-hosted Postgres in Prisma v7.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
