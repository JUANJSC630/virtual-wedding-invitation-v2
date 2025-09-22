import prisma from "../../../lib/prisma.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  try {
    if (req.method === 'PATCH') {
      // Actualizar invitado
      const { name, email, phone, maxGuests, confirmed } = req.body;

      const guest = await prisma.guest.update({
        where: { id },
        data: {
          name,
          email: email || undefined,
          phone: phone || undefined,
          maxGuests,
          confirmed,
          confirmedAt: confirmed ? new Date() : null,
        },
        include: { companions: true },
      });

      res.json(guest);
    } else if (req.method === 'DELETE') {
      // Eliminar invitado
      await prisma.guest.delete({
        where: { id },
      });

      res.json({ success: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}