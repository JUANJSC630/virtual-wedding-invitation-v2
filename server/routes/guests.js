import express from "express";

import prisma from "../../src/lib/prisma.js";

export const guestRoutes = express.Router();

// Validar código de invitado (POST - compatible con Vercel)
guestRoutes.post("/validate", async (req, res) => {
  try {
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

// Validar código de invitado (GET - legacy)
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
    const { guestCode, confirmed, companions } = req.body;

    // Actualizar el invitado principal
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

    // Obtener el invitado actualizado con acompañantes
    const finalGuest = await prisma.guest.findUnique({
      where: { code: guestCode.toUpperCase() },
      include: { companions: true },
    });

    res.json(finalGuest);
  } catch (error) {
    console.error("Error confirming RSVP:", error);
    res.status(500).json({ error: "Error al confirmar asistencia" });
  }
});
