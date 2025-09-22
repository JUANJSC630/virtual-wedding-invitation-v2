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
    if (req.method === 'POST') {
      // Registrar acceso del invitado
      const { guestCode } = req.body;

      // Buscar el invitado
      const guest = await prisma.guest.findUnique({
        where: { code: guestCode.toUpperCase() },
      });

      if (!guest) {
        return res.status(404).json({ error: "Invitado no encontrado" });
      }

      // Actualizar último acceso
      await prisma.guest.update({
        where: { id: guest.id },
        data: {
          lastAccessAt: new Date(),
        },
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