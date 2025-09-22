import express from "express";

import prisma from "../../src/lib/prisma.js";

export const guestRoutes = express.Router();

// Validar código de invitado
guestRoutes.get("/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;

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

    return res.json({
      valid: true,
      guest,
    });
  } catch (error) {
    console.error("Error validating guest code:", error);
    return res.status(500).json({
      valid: false,
      error: "Error interno del servidor",
    });
  }
});

// Obtener invitado por código
guestRoutes.get("/code/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { code: code.toUpperCase() },
      include: { companions: true },
    });

    if (!guest) {
      return res.status(404).json({ error: "Invitado no encontrado" });
    }

    return res.json(guest);
  } catch (error) {
    console.error("Error getting guest by code:", error);
    return res.status(500).json({
      valid: false,
      error: "Error interno del servidor",
    });
  }
});

// Registrar acceso de invitado
guestRoutes.post("/access", async (req, res) => {
  try {
    const { code } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    await prisma.guestAccess.create({
      data: {
        guestCode: code.toUpperCase(),
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error registering guest access:", error);
    // No enviamos error al cliente para que no afecte la experiencia
    res.json({ success: false });
  }
});

// Confirmar RSVP
guestRoutes.post("/rsvp", async (req, res) => {
  try {
    const { guestId, confirmed, companions } = req.body;

    // Actualizar el invitado principal
    await prisma.guest.update({
      where: { id: guestId },
      data: {
        confirmed,
        confirmedAt: confirmed ? new Date() : null,
      },
      include: { companions: true },
    });

    // Actualizar o crear acompañantes
    for (const companion of companions) {
      if (companion.id) {
        // Actualizar acompañante existente
        await prisma.companion.update({
          where: { id: companion.id },
          data: {
            name: companion.name,
            confirmed: companion.confirmed,
          },
        });
      } else if (companion.name.trim()) {
        // Crear nuevo acompañante
        await prisma.companion.create({
          data: {
            guestId,
            name: companion.name.trim(),
            confirmed: companion.confirmed,
          },
        });
      }
    }

    // Obtener el invitado actualizado con acompañantes
    const finalGuest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { companions: true },
    });

    res.json(finalGuest);
  } catch (error) {
    console.error("Error confirming RSVP:", error);
    res.status(500).json({ error: "Error al confirmar asistencia" });
  }
});
