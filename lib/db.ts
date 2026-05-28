import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

if (typeof process !== "undefined") {
  process.on("SIGTERM", () => connectionPool.end());
}

const adapter = new PrismaPg(connectionPool);

// PrismaClient singleton — prevents multiple instances during Next.js hot reload.
const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
