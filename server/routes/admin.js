import express from "express";
import { nanoid } from "nanoid";

import prisma from "../../src/lib/prisma.js";

export const adminRoutes = express.Router();

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

    await prisma.guest.delete({
      where: { id },
    });

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
      data: {
        guestId,
        name,
      },
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

    await prisma.companion.delete({
      where: { id },
    });

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

    // Calcular cupos totales
    const guestsWithSlots = await prisma.guest.findMany({
      select: { maxGuests: true },
    });
    const totalSlots = guestsWithSlots.reduce((sum, guest) => sum + guest.maxGuests, 0);

    const stats = {
      totalGuests,
      confirmedGuests,
      pendingGuests: totalGuests - confirmedGuests,
      totalCompanions,
      confirmedCompanions,
      totalSlots,
      confirmedSlots: confirmedGuests + confirmedCompanions,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Generar códigos aleatorios para invitados
adminRoutes.post("/generate-codes", async (req, res) => {
  try {
    const { count = 10, prefix = "AYP" } = req.body;

    const codes = [];
    for (let i = 0; i < count; i++) {
      let code;
      let exists = true;

      // Generar código único
      while (exists) {
        const randomPart = nanoid(3).toUpperCase();
        code = `${prefix}${randomPart}`;

        const existingGuest = await prisma.guest.findUnique({
          where: { code },
        });

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

// Obtener analytics de accesos
adminRoutes.get("/analytics", async (_req, res) => {
  try {
    console.log("Getting access analytics...");

    // 1. Últimos accesos (10 más recientes)
    const recentAccesses = await prisma.guestAccess.findMany({
      take: 10,
      orderBy: { accessedAt: "desc" },
    });

    // 2. Invitados que han accedido pero no confirmado
    const accessedButNotConfirmed = await prisma.guest.findMany({
      where: {
        confirmed: false,
        code: {
          in: await prisma.guestAccess
            .findMany({
              select: { guestCode: true },
              distinct: ["guestCode"],
            })
            .then(accesses => accesses.map(a => a.guestCode)),
        },
      },
      include: { companions: true },
    });

    // 3. Códigos nunca usados
    const allGuests = await prisma.guest.findMany({
      select: { code: true, name: true, createdAt: true },
    });

    const accessedCodes = await prisma.guestAccess.findMany({
      select: { guestCode: true },
      distinct: ["guestCode"],
    });

    const accessedCodesSet = new Set(accessedCodes.map(a => a.guestCode));
    const neverAccessed = allGuests.filter(guest => !accessedCodesSet.has(guest.code));

    // 4. Estadísticas de accesos por código
    const accessStats = await prisma.guestAccess.groupBy({
      by: ["guestCode"],
      _count: {
        guestCode: true,
      },
      orderBy: {
        _count: {
          guestCode: "desc",
        },
      },
      take: 10,
    });

    // 5. Accesos por día (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const accessesByDay = await prisma.guestAccess.findMany({
      where: {
        accessedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        accessedAt: true,
        guestCode: true,
      },
    });

    // Agrupar por día
    const accessesByDayGrouped = accessesByDay.reduce((acc, access) => {
      const day = access.accessedAt.toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const analytics = {
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
    };

    console.log("Analytics retrieved successfully");
    res.json(analytics);
  } catch (error) {
    console.error("Error in analytics API:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
      stack: error.stack,
    });
  }
});
