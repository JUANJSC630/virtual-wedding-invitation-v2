import prisma from "../../src/lib/prisma.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Obtener estadísticas
      const [totalGuests, confirmedGuests, totalCompanions, confirmedCompanions] = await Promise.all([
        prisma.guest.count(),
        prisma.guest.count({ where: { confirmed: true } }),
        prisma.companion.count(),
        prisma.companion.count({ where: { confirmed: true } }),
      ]);

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

      res.json(stats);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}