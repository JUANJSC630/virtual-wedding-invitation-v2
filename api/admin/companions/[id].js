import prisma from "../../../lib/prisma.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  try {
    if (req.method === "PATCH") {
      // Actualizar acompañante
      const { confirmed } = req.body;

      const companion = await prisma.companion.update({
        where: { id },
        data: {
          confirmed,
          confirmedAt: confirmed ? new Date() : null,
        },
      });

      res.json(companion);
    } else if (req.method === "DELETE") {
      // Eliminar acompañante
      await prisma.companion.delete({
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
