import prisma from "../../lib/prisma.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { code } = req.query;

  try {
    if (req.method === 'GET') {
      // Obtener invitado por código
      const guest = await prisma.guest.findUnique({
        where: { code: code.toUpperCase() },
        include: { companions: true },
      });

      if (!guest) {
        return res.status(404).json({ error: "Invitado no encontrado" });
      }

      res.json(guest);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}