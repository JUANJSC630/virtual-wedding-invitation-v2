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

  try {
    if (req.method === 'POST') {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          valid: false,
          error: "Código de invitación requerido",
        });
      }

      const guest = await prisma.guest.findUnique({
        where: { code: code.toUpperCase() },
        include: { companions: true },
      });

      if (!guest) {
        return res.json({
          valid: false,
          error: "Código de invitación no válido",
        });
      }

      res.json({
        valid: true,
        guest,
      });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}