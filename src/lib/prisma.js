import { PrismaClient } from "@prisma/client";

let prisma;
if (!globalThis.prisma) {
  prisma = new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
  }
} else {
  prisma = globalThis.prisma;
}

export default prisma;
