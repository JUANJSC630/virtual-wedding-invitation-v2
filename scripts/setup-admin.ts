/**
 * Script para crear o actualizar el admin principal.
 * Uso: pnpm setup-admin
 *
 * Lee ADMIN_EMAIL y ADMIN_PASSWORD del .env o de las variables de entorno.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Administrador";

  if (!email || !password) {
    console.error("❌ Define ADMIN_EMAIL y ADMIN_PASSWORD en tu .env");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { password: hashedPassword, name },
    create: { email, password: hashedPassword, name },
  });

  console.log(`✅ Admin listo: ${admin.name} (${admin.email})`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
