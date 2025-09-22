import prisma from "../../lib/prisma.js";

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
    if (req.method === "POST") {
      // Confirmar RSVP
      const { guestCode, confirmed, companions } = req.body;

      // Actualizar invitado principal
      const guest = await prisma.guest.update({
        where: { code: guestCode.toUpperCase() },
        data: {
          confirmed,
          confirmedAt: confirmed ? new Date() : null,
        },
        include: { companions: true },
      });

      // Actualizar acompañantes si se proporcionaron
      if (companions && Array.isArray(companions)) {
        for (const companion of companions) {
          if (companion.id) {
            await prisma.companion.update({
              where: { id: companion.id },
              data: {
                confirmed: companion.confirmed,
                confirmedAt: companion.confirmed ? new Date() : null,
              },
            });
          }
        }
      }

      // Obtener datos actualizados
      const updatedGuest = await prisma.guest.findUnique({
        where: { code: guestCode.toUpperCase() },
        include: { companions: true },
      });

      res.json(updatedGuest);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
