import prisma from "../_utils/prisma.js";

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
      // Test simple first
      if (!prisma) {
        return res.status(500).json({ error: "Prisma not initialized" });
      }

      // Obtener estadísticas
      console.log("Starting stats query...");
      const [totalGuests, confirmedGuests, totalCompanions, confirmedCompanions] =
        await Promise.all([
          prisma.guest.count(),
          prisma.guest.count({ where: { confirmed: true } }),
          prisma.companion.count(),
          prisma.companion.count({ where: { confirmed: true } }),
        ]);

      console.log("Got basic counts:", {
        totalGuests,
        confirmedGuests,
        totalCompanions,
        confirmedCompanions,
      });

      // Calcular cupos totales
      const guestsWithSlots = await prisma.guest.findMany({
        select: { maxGuests: true },
      });
      const totalSlots = guestsWithSlots.reduce((sum, guest) => sum + guest.maxGuests, 0);

      const stats = {
        totalGuests,
        confirmedGuests,
        pendingGuests: totalGuests - confirmedGuests,
        totalCompanions,
        confirmedCompanions,
        totalSlots,
        confirmedSlots: confirmedGuests + confirmedCompanions,
      };

      console.log("Returning stats:", stats);
      res.json(stats);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in API:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
