import express from "express";
import { nanoid } from "nanoid";

import prisma from "../../src/lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const adminRoutes = express.Router();

// Aplicar autenticación a todas las rutas de este router
adminRoutes.use(requireAuth);

// Obtener todos los invitados
adminRoutes.get("/guests", async (_req, res) => {
  try {
    const guests = await prisma.guest.findMany({
      include: { companions: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(guests);
  } catch (error) {
    console.error("Error getting all guests:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear nuevo invitado
adminRoutes.post("/guests", async (req, res) => {
  try {
    const { code, name, email, phone, maxGuests = 1 } = req.body;

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
  } catch (error) {
    console.error("Error creating guest:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar invitado
adminRoutes.patch("/guests/:id", async (req, res) => {
  try {
    const { id } = req.params;
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
  } catch (error) {
    console.error("Error updating guest:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar invitado
adminRoutes.delete("/guests/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.guest.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting guest:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear acompañante
adminRoutes.post("/companions", async (req, res) => {
  try {
    const { guestId, name } = req.body;

    const companion = await prisma.companion.create({
      data: { guestId, name },
    });

    res.status(201).json(companion);
  } catch (error) {
    console.error("Error creating companion:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar acompañante
adminRoutes.patch("/companions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed } = req.body;

    const companion = await prisma.companion.update({
      where: { id },
      data: {
        confirmed,
        confirmedAt: confirmed ? new Date() : null,
      },
    });

    res.json(companion);
  } catch (error) {
    console.error("Error updating companion:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar acompañante
adminRoutes.delete("/companions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.companion.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting companion:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener estadísticas
adminRoutes.get("/stats", async (_req, res) => {
  try {
    const [totalGuests, confirmedGuests, totalCompanions, confirmedCompanions] = await Promise.all([
      prisma.guest.count(),
      prisma.guest.count({ where: { confirmed: true } }),
      prisma.companion.count(),
      prisma.companion.count({ where: { confirmed: true } }),
    ]);

    const guestsWithSlots = await prisma.guest.findMany({
      select: { maxGuests: true },
    });
    const totalSlots = guestsWithSlots.reduce((sum, guest) => sum + guest.maxGuests, 0);

    res.json({
      totalGuests,
      confirmedGuests,
      pendingGuests: totalGuests - confirmedGuests,
      totalCompanions,
      confirmedCompanions,
      pendingCompanions: totalCompanions - confirmedCompanions,
      totalSlots,
      totalConfirmedAttendees: confirmedGuests + confirmedCompanions,
      availableSlots: totalSlots - (confirmedGuests + confirmedCompanions),
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Generar códigos aleatorios
adminRoutes.post("/generate-codes", async (req, res) => {
  try {
    const { count = 10, prefix = "AYP" } = req.body;

    const codes = [];
    for (let i = 0; i < count; i++) {
      let code;
      let exists = true;

      while (exists) {
        const randomPart = nanoid(3).toUpperCase();
        code = `${prefix}${randomPart}`;

        const existingGuest = await prisma.guest.findUnique({ where: { code } });
        exists = !!existingGuest;
      }

      codes.push(code);
    }

    res.json({ codes });
  } catch (error) {
    console.error("Error generating codes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Analytics de accesos
adminRoutes.get("/analytics", async (_req, res) => {
  try {
    const recentAccesses = await prisma.guestAccess.findMany({
      take: 10,
      orderBy: { accessedAt: "desc" },
    });

    const accessedCodes = await prisma.guestAccess.findMany({
      select: { guestCode: true },
      distinct: ["guestCode"],
    });

    const accessedCodesSet = new Set(accessedCodes.map(a => a.guestCode));

    const accessedButNotConfirmed = await prisma.guest.findMany({
      where: {
        confirmed: false,
        code: { in: [...accessedCodesSet] },
      },
      include: { companions: true },
    });

    const allGuests = await prisma.guest.findMany({
      select: { code: true, name: true, createdAt: true },
    });

    const neverAccessed = allGuests.filter(guest => !accessedCodesSet.has(guest.code));

    const accessStats = await prisma.guestAccess.groupBy({
      by: ["guestCode"],
      _count: { guestCode: true },
      orderBy: { _count: { guestCode: "desc" } },
      take: 10,
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const accessesByDay = await prisma.guestAccess.findMany({
      where: { accessedAt: { gte: sevenDaysAgo } },
      select: { accessedAt: true, guestCode: true },
    });

    const accessesByDayGrouped = accessesByDay.reduce((acc, access) => {
      const day = access.accessedAt.toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    res.json({
      recentAccesses,
      accessedButNotConfirmed,
      neverAccessed,
      accessStats,
      accessesByDay: accessesByDayGrouped,
      summary: {
        totalAccesses: await prisma.guestAccess.count(),
        uniqueAccessedCodes: accessedCodes.length,
        neverAccessedCount: neverAccessed.length,
        accessedButNotConfirmedCount: accessedButNotConfirmed.length,
      },
    });
  } catch (error) {
    console.error("Error in analytics API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
