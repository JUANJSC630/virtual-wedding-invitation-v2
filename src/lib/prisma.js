import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const sql = neon(connectionString);
  const adapter = new PrismaNeon(sql);
  return new PrismaClient({ adapter });
}

let prisma;
if (!globalThis.prisma) {
  prisma = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
  }
} else {
  prisma = globalThis.prisma;
}

export default prisma;
