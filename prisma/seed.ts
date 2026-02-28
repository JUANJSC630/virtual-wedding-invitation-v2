import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creando datos de prueba...");

  const guests = [
    { code: "AYP001", name: "Mercedes, Marc, Xavier, Claudia", email: "mercedes@ejemplo.com", phone: "+57 300 123 4567", maxGuests: 4 },
    { code: "AYP002", name: "Juan Pérez", email: "juan@ejemplo.com", maxGuests: 2 },
    { code: "AYP003", name: "María García, Carlos López", phone: "+57 301 234 5678", maxGuests: 3 },
    { code: "AYP004", name: "Ana Rodríguez", maxGuests: 1, confirmed: true, confirmedAt: new Date() },
    { code: "AYP005", name: "Pedro Martínez, Lucía Fernández", email: "pedro@ejemplo.com", maxGuests: 5 },
  ];

  for (const guestData of guests) {
    const guest = await prisma.guest.upsert({
      where: { code: guestData.code },
      update: {},
      create: guestData,
    });

    console.log(`✅ Invitado: ${guest.name} (${guest.code})`);

    if (guest.code === "AYP002") {
      await prisma.companion.upsert({
        where: { id: `companion-ayp002` },
        update: {},
        create: { id: `companion-ayp002`, guestId: guest.id, name: "Sofía Pérez", confirmed: true },
      });
      console.log(`   👥 Acompañante: Sofía Pérez`);
    }

    if (guest.code === "AYP003") {
      await prisma.companion.upsert({
        where: { id: `companion-ayp003` },
        update: {},
        create: { id: `companion-ayp003`, guestId: guest.id, name: "Pequeño Carlos" },
      });
      console.log(`   👥 Acompañante: Pequeño Carlos`);
    }
  }

  // Admin con contraseña hasheada
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.admin.upsert({
    where: { email: "admin@ejemplo.com" },
    update: {},
    create: { email: "admin@ejemplo.com", password: hashedPassword, name: "Administrador" },
  });
  console.log(`👤 Admin: ${admin.name} (${admin.email}) — contraseña: admin123`);

  console.log("🎉 ¡Seed completado!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
