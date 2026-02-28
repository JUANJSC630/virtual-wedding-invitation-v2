import express from "express";

import prisma from "../../src/lib/prisma.js";

export const guestRoutes = express.Router();

const DEFAULT_SLUG = process.env.DEFAULT_EVENT_SLUG || "jimena-juan";

/**
 * Resuelve el evento a partir del slug.
 * Usa el slug del body/params, con fallback al DEFAULT_EVENT_SLUG.
 */
async function resolveEvent(slug) {
  const event = await prisma.event.findUnique({ where: { slug: slug || DEFAULT_SLUG } });
  return event;
}

// POST /api/guests/validate
guestRoutes.post("/validate", async (req, res) => {
  try {
    const { code, eventSlug } = req.body;

    if (!code) {
      return res.status(400).json({ valid: false, error: "Código de invitación requerido" });
    }

    const event = await resolveEvent(eventSlug);
    if (!event) {
      return res.json({ valid: false, error: "Evento no encontrado" });
    }

    const guest = await prisma.guest.findUnique({
      where: { eventId_code: { eventId: event.id, code: code.toUpperCase() } },
      include: { companions: true },
    });

    if (!guest) {
      return res.json({ valid: false, error: "Código de invitación no válido" });
    }

    return res.json({ valid: true, guest });
  } catch (error) {
    console.error("Error validating guest code:", error);
    return res.status(500).json({ valid: false, error: "Error interno del servidor" });
  }
});

// GET /api/guests/validate/:code (legacy)
guestRoutes.get("/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const eventSlug = req.query.eventSlug;

    const event = await resolveEvent(eventSlug);
    if (!event) {
      return res.json({ valid: false, error: "Evento no encontrado" });
    }

    const guest = await prisma.guest.findUnique({
      where: { eventId_code: { eventId: event.id, code: code.toUpperCase() } },
      include: { companions: true },
    });

    if (!guest) {
      return res.json({ valid: false, error: "Código de invitación no válido" });
    }

    return res.json({ valid: true, guest });
  } catch (error) {
    console.error("Error validating guest code:", error);
    return res.status(500).json({ valid: false, error: "Error interno del servidor" });
  }
});

// GET /api/guests/code/:code
guestRoutes.get("/code/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const eventSlug = req.query.eventSlug;

    const event = await resolveEvent(eventSlug);
    if (!event) return res.status(404).json({ error: "Evento no encontrado" });

    const guest = await prisma.guest.findUnique({
      where: { eventId_code: { eventId: event.id, code: code.toUpperCase() } },
      include: { companions: true },
    });

    if (!guest) return res.status(404).json({ error: "Invitado no encontrado" });

    return res.json(guest);
  } catch (error) {
    console.error("Error getting guest by code:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/guests/access
guestRoutes.post("/access", async (req, res) => {
  try {
    const { guestCode, eventSlug } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get("User-Agent");

    const event = await resolveEvent(eventSlug);

    await prisma.guestAccess.create({
      data: {
        eventId: event?.id || (await getDefaultEventId()),
        guestCode: guestCode.toUpperCase(),
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error registering guest access:", error);
    res.json({ success: false });
  }
});

// POST /api/guests/rsvp
guestRoutes.post("/rsvp", async (req, res) => {
  try {
    const { guestCode, confirmed, companions, eventSlug } = req.body;

    const event = await resolveEvent(eventSlug);
    if (!event) return res.status(404).json({ error: "Evento no encontrado" });

    const guest = await prisma.guest.update({
      where: { eventId_code: { eventId: event.id, code: guestCode.toUpperCase() } },
      data: { confirmed, confirmedAt: confirmed ? new Date() : null },
      include: { companions: true },
    });

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

    const finalGuest = await prisma.guest.findUnique({
      where: { eventId_code: { eventId: event.id, code: guestCode.toUpperCase() } },
      include: { companions: true },
    });

    res.json(finalGuest);
  } catch (error) {
    console.error("Error confirming RSVP:", error);
    res.status(500).json({ error: "Error al confirmar asistencia" });
  }
});

// Helper para /access cuando no viene el slug
async function getDefaultEventId() {
  const event = await prisma.event.findUnique({ where: { slug: DEFAULT_SLUG } });
  return event?.id;
}
