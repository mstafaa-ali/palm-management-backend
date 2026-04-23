/**
 * prisma.ts — Singleton Prisma Client
 *
 * Dibuat sebagai singleton agar koneksi database tidak dibuat ulang
 * di setiap file yang mengimport PrismaClient.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "warn", "error"]
      : ["warn", "error"],
});

export default prisma;
