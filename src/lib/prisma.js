import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

let prisma;

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient();
  }
  prisma = globalThis.prisma;
}

export default prisma;
