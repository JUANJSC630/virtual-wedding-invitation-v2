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
    if (req.method === "GET") {
      // Obtener todos los invitados
      const guests = await prisma.guest.findMany({
        include: { companions: true },
        orderBy: { createdAt: "desc" },
      });

      res.json(guests);
    } else if (req.method === "POST") {
      // Crear nuevo invitado
      const { code, name, email, phone, maxGuests = 1 } = req.body;

      // Verificar que el código no exista
      const existingGuest = await prisma.guest.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (existingGuest) {
        return res.status(400).json({ message: "Ya existe un invitado con ese código" });
      }

      const guest = await prisma.guest.create({
        data: {
          code: code.toUpperCase(),
          name,
          email: email || undefined,
          phone: phone || undefined,
          maxGuests,
        },
        include: { companions: true },
      });

      return res.status(201).json(guest);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
