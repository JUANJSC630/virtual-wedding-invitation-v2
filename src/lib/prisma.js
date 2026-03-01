import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

let prisma;

if (process.env.NODE_ENV === "production") {
  const sql = neon(process.env.DATABASE_URL);
  const adapter = new PrismaNeonHTTP(sql);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient();
  }
  prisma = globalThis.prisma;
}

export default prisma;
