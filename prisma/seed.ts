import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creando datos de prueba...");

  // Crear algunos invitados de ejemplo
  const guests = [
    {
      code: "AYP001",
      name: "Mercedes, Marc, Xavier, Claudia",
      email: "mercedes@ejemplo.com",
      phone: "+57 300 123 4567",
      maxGuests: 4,
    },
    {
      code: "AYP002",
      name: "Juan Pérez",
      email: "juan@ejemplo.com",
      maxGuests: 2,
    },
    {
      code: "AYP003",
      name: "María García, Carlos López",
      phone: "+57 301 234 5678",
      maxGuests: 3,
    },
    {
      code: "AYP004",
      name: "Ana Rodríguez",
      maxGuests: 1,
      confirmed: true,
      confirmedAt: new Date(),
    },
    {
      code: "AYP005",
      name: "Pedro Martínez, Lucía Fernández",
      email: "pedro@ejemplo.com",
      maxGuests: 5,
    },
  ];

  // Crear los invitados
  for (const guestData of guests) {
    const guest = await prisma.guest.create({
      data: guestData,
    });

    console.log(`✅ Invitado creado: ${guest.name} (${guest.code})`);

    // Crear algunos acompañantes para algunos invitados
    if (guest.code === "AYP002") {
      await prisma.companion.create({
        data: {
          guestId: guest.id,
          name: "Sofía Pérez",
          confirmed: true,
        },
      });
      console.log(`   👥 Acompañante agregado: Sofía Pérez`);
    }

    if (guest.code === "AYP003") {
      await prisma.companion.create({
        data: {
          guestId: guest.id,
          name: "Pequeño Carlos",
        },
      });
      console.log(`   👥 Acompañante agregado: Pequeño Carlos`);
    }
  }

  // Crear un admin de ejemplo
  const admin = await prisma.admin.create({
    data: {
      email: "admin@ejemplo.com",
      password: "hashed_password_here", // En producción usar bcrypt
      name: "Administrador",
    },
  });

  console.log(`👤 Admin creado: ${admin.name} (${admin.email})`);

  // Crear algunos registros de acceso
  await prisma.guestAccess.createMany({
    data: [
      {
        guestCode: "AYP001",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0...",
      },
      {
        guestCode: "AYP004",
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0...",
      },
    ],
  });

  console.log("📊 Registros de acceso creados");

  console.log("🎉 ¡Datos de prueba creados exitosamente!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
