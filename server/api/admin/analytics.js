import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === "GET") {
      // Obtener analytics de accesos
      console.log("Getting access analytics...");

      // 1. Últimos accesos (10 más recientes)
      const recentAccesses = await prisma.guestAccess.findMany({
        take: 10,
        orderBy: { accessedAt: "desc" },
      });

      // 2. Invitados que han accedido pero no confirmado
      const accessedButNotConfirmed = await prisma.guest.findMany({
        where: {
          confirmed: false,
          code: {
            in: await prisma.guestAccess
              .findMany({
                select: { guestCode: true },
                distinct: ["guestCode"],
              })
              .then(accesses => accesses.map(a => a.guestCode)),
          },
        },
        include: { companions: true },
      });

      // 3. Códigos nunca usados
      const allGuests = await prisma.guest.findMany({
        select: { code: true, name: true, createdAt: true },
      });

      const accessedCodes = await prisma.guestAccess.findMany({
        select: { guestCode: true },
        distinct: ["guestCode"],
      });

      const accessedCodesSet = new Set(accessedCodes.map(a => a.guestCode));
      const neverAccessed = allGuests.filter(guest => !accessedCodesSet.has(guest.code));

      // 4. Estadísticas de accesos por código
      const accessStats = await prisma.guestAccess.groupBy({
        by: ["guestCode"],
        _count: {
          guestCode: true,
        },
        orderBy: {
          _count: {
            guestCode: "desc",
          },
        },
        take: 10,
      });

      // 5. Accesos por día (últimos 7 días)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const accessesByDay = await prisma.guestAccess.findMany({
        where: {
          accessedAt: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          accessedAt: true,
          guestCode: true,
        },
      });

      // Agrupar por día
      const accessesByDayGrouped = accessesByDay.reduce((acc, access) => {
        const day = access.accessedAt.toISOString().split("T")[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const analytics = {
        recentAccesses,
        accessedButNotConfirmed,
        neverAccessed,
        accessStats,
        accessesByDay: accessesByDayGrouped,
        summary: {
          totalAccesses: await prisma.guestAccess.count(),
          uniqueAccessedCodes: accessedCodes.length,
          neverAccessedCount: neverAccessed.length,
          accessedButNotConfirmedCount: accessedButNotConfirmed.length,
        },
      };

      console.log("Analytics retrieved successfully");
      res.json(analytics);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in analytics API:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}