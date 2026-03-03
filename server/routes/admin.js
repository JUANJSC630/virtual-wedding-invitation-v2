import express from "express";
import { nanoid } from "nanoid";
import { z } from "zod";

import prisma from "../../src/lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const createGuestSchema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_-]+$/, "Código inválido"),
  name: z.string().min(2).max(100),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().regex(/^[+\d\s()-]{7,20}$/).or(z.literal("")).optional(),
  maxGuests: z.coerce.number().int().min(1).max(20).default(1),
});

export const adminRoutes = express.Router();

// Solo client admins — el master tiene su propio panel en /master
adminRoutes.use(requireAuth, (req, res, next) => {
  if (req.user.role !== "client") {
    return res.status(403).json({ error: "Este panel es exclusivo para admins de evento. Usa /master." });
  }
  next();
});

function eventFilter(user) {
  return { eventId: user.eventId };
}

// Obtener todos los invitados
adminRoutes.get("/guests", async (req, res) => {
  try {
    const guests = await prisma.guest.findMany({
      where: eventFilter(req.user),
      include: {
        companions: true,
        _count: { select: { guestAccesses: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    // Flatten _count into accessCount for the client
    const result = guests.map(({ _count, ...g }) => ({ ...g, accessCount: _count.guestAccesses }));
    res.json(result);
  } catch (error) {
    console.error("Error getting guests:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear nuevo invitado
adminRoutes.post("/guests", async (req, res) => {
  const parsed = createGuestSchema.safeParse({
    ...req.body,
    code: req.body.code?.toUpperCase(),
  });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
  }
  try {
    const { code, name, email, phone, maxGuests } = parsed.data;

    // El eventId viene del JWT (client) o del body (master puede especificarlo)
    const eventId =
      req.user.role === "master" ? req.body.eventId : req.user.eventId;

    if (!eventId) {
      return res.status(400).json({ error: "eventId es requerido" });
    }

    const existing = await prisma.guest.findUnique({
      where: { eventId_code: { eventId, code: code.toUpperCase() } },
    });

    if (existing) {
      return res.status(400).json({ message: "Ya existe un invitado con ese código en este evento" });
    }

    const guest = await prisma.guest.create({
      data: {
        eventId,
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
    const { name, email, phone, maxGuests, confirmed, notes } = req.body;

    // Verificar que el guest pertenece al evento del usuario (si es client)
    if (req.user.role === "client") {
      const guest = await prisma.guest.findFirst({ where: { id, eventId: req.user.eventId } });
      if (!guest) return res.status(403).json({ error: "Sin acceso a este invitado" });
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: {
        name,
        email: email || undefined,
        phone: phone || undefined,
        maxGuests,
        confirmed,
        confirmedAt: confirmed ? new Date() : null,
        notes: notes !== undefined ? notes : undefined,
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

    if (req.user.role === "client") {
      const guest = await prisma.guest.findFirst({ where: { id, eventId: req.user.eventId } });
      if (!guest) return res.status(403).json({ error: "Sin acceso a este invitado" });
    }

    await prisma.guest.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting guest:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Importar invitados desde CSV
adminRoutes.post("/guests/import", async (req, res) => {
  try {
    const eventId = req.user.eventId;
    if (!eventId) return res.status(400).json({ error: "eventId es requerido" });

    const { rows } = req.body; // [{ code, name, email, phone, maxGuests }]
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No hay filas para importar" });
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const row of rows) {
      const code = (row.code || "").trim().toUpperCase();
      const name = (row.name || "").trim();
      if (!code || !name) {
        errors.push({ code: code || "?", reason: "código y nombre son obligatorios" });
        continue;
      }
      const maxGuests = parseInt(row.maxGuests, 10) || 1;

      const exists = await prisma.guest.findUnique({
        where: { eventId_code: { eventId, code } },
      });
      if (exists) { skipped++; continue; }

      await prisma.guest.create({
        data: {
          eventId,
          code,
          name,
          email: row.email?.trim() || undefined,
          phone: row.phone?.trim() || undefined,
          maxGuests,
        },
      });
      created++;
    }

    res.json({ created, skipped, errors });
  } catch (error) {
    console.error("Error importing guests:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear acompañante
adminRoutes.post("/companions", async (req, res) => {
  try {
    const { guestId, name } = req.body;

    const companion = await prisma.companion.create({ data: { guestId, name } });
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
      data: { confirmed, confirmedAt: confirmed ? new Date() : null },
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

// Estadísticas
adminRoutes.get("/stats", async (req, res) => {
  try {
    const filter = eventFilter(req.user);

    const [totalGuests, confirmedGuests, totalCompanions, confirmedCompanions, guestsWithSlots] =
      await Promise.all([
        prisma.guest.count({ where: filter }),
        prisma.guest.count({ where: { ...filter, confirmed: true } }),
        prisma.companion.count({
          where: { guest: filter },
        }),
        prisma.companion.count({
          where: { confirmed: true, guest: filter },
        }),
        prisma.guest.findMany({ where: filter, select: { maxGuests: true } }),
      ]);

    const totalSlots = guestsWithSlots.reduce((sum, g) => sum + g.maxGuests, 0);

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
    const { count = 10, prefix = "INV" } = req.body;
    const eventId = req.user.role === "master" ? req.body.eventId : req.user.eventId;

    if (!eventId) return res.status(400).json({ error: "eventId requerido" });

    const codes = [];
    for (let i = 0; i < count; i++) {
      let code;
      let exists = true;

      while (exists) {
        const randomPart = nanoid(3).toUpperCase();
        code = `${prefix}${randomPart}`;
        const existing = await prisma.guest.findUnique({
          where: { eventId_code: { eventId, code } },
        });
        exists = !!existing;
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
adminRoutes.get("/analytics", async (req, res) => {
  try {
    const filter = eventFilter(req.user);
    const accessFilter = req.user.role === "master" ? {} : { eventId: req.user.eventId };

    const recentAccesses = await prisma.guestAccess.findMany({
      where: accessFilter,
      take: 10,
      orderBy: { accessedAt: "desc" },
    });

    const accessedCodes = await prisma.guestAccess.findMany({
      where: accessFilter,
      select: { guestCode: true },
      distinct: ["guestCode"],
    });

    const accessedCodesSet = new Set(accessedCodes.map(a => a.guestCode));

    const accessedButNotConfirmed = await prisma.guest.findMany({
      where: { ...filter, confirmed: false, code: { in: [...accessedCodesSet] } },
      include: { companions: true },
    });

    const allGuests = await prisma.guest.findMany({
      where: filter,
      select: { code: true, name: true, createdAt: true },
    });

    const neverAccessed = allGuests.filter(g => !accessedCodesSet.has(g.code));

    const accessStats = await prisma.guestAccess.groupBy({
      by: ["guestCode"],
      where: accessFilter,
      _count: { guestCode: true },
      orderBy: { _count: { guestCode: "desc" } },
      take: 10,
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const accessesByDay = await prisma.guestAccess.findMany({
      where: { ...accessFilter, accessedAt: { gte: sevenDaysAgo } },
      select: { accessedAt: true, guestCode: true },
    });

    const accessesByDayGrouped = accessesByDay.reduce((acc, a) => {
      const day = a.accessedAt.toISOString().split("T")[0];
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
        totalAccesses: await prisma.guestAccess.count({ where: accessFilter }),
        uniqueAccessedCodes: accessedCodes.length,
        neverAccessedCount: neverAccessed.length,
        accessedButNotConfirmedCount: accessedButNotConfirmed.length,
      },
    });
  } catch (error) {
    console.error("Error in analytics:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
