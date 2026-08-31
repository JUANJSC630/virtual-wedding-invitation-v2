import bcrypt from "bcryptjs";
import express from "express";
import multer from "multer";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { z } from "zod";

import prisma from "../../src/lib/prisma.js";
import {
  deleteCompanionAttendee,
  syncCompanionAttendee,
  syncPrimaryAttendee,
} from "../lib/attendees.js";
import { confirmationFields } from "../lib/confirmation.js";
import { importGuestRows } from "../lib/guest-import.js";
import { sanitizeRsvpQuestions } from "../lib/rsvp-questions.js";
import { requireMaster } from "../middleware/auth.js";

// Mismo esquema que admin (crear invitado)
const createGuestSchema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_-]+$/, "Código inválido"),
  name: z.string().min(2).max(100),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().regex(/^[+\d\s()-]{7,20}$/).or(z.literal("")).optional(),
  maxGuests: z.coerce.number().int().min(1).max(20).default(1),
});

export const masterRoutes = express.Router();

masterRoutes.use(requireMaster);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Construye el objeto `config` de un evento.
 *
 * `existing` es la config que el evento ya tiene (vacía al crear). Todo campo que
 * el body NO traiga conserva su valor actual en vez de volver al default.
 *
 * Sin esta fusión, un PATCH parcial —como el toggle Activar/Desactivar, que solo
 * manda {isActive}— reconstruía la config desde cero y borraba layout (Fase B),
 * eventType/honorees (Fase C) y todos los textos del evento.
 */
function buildConfig(body, existing = {}) {
  const base = (existing && typeof existing === "object") ? existing : {};
  const sent = (key) => body[key] !== undefined;

  const splitLines = (str) =>
    (str || "").split("\n").map(s => s.trim()).filter(Boolean);

  // Texto: usa el del body si vino, si no conserva el guardado.
  const text = (key, current) => (sent(key) ? (body[key] || "") : (current ?? ""));

  // Lista multilínea: el body la manda como string, se guarda como array.
  const lines = (key, current) =>
    sent(key) ? splitLines(body[key]) : (Array.isArray(current) ? current : []);

  // Array ya estructurado (timeline, gallery).
  const list = (key, current) =>
    sent(key) && Array.isArray(body[key]) ? body[key] : (Array.isArray(current) ? current : []);

  return {
    // Multi-ocasión (Fase C) — guardado en config, sin columnas nuevas.
    eventType: sent("eventType") && typeof body.eventType === "string" && body.eventType
      ? body.eventType
      : (base.eventType ?? "wedding"),
    honorees: sent("honorees")
      ? (Array.isArray(body.honorees)
          ? body.honorees
              .filter(h => h && typeof h.name === "string")
              .map(h => ({ role: String(h.role || "host"), label: String(h.label || ""), name: h.name.trim() }))
          : [])
      : (Array.isArray(base.honorees) ? base.honorees : []),
    eventTitle: text("eventTitle", base.eventTitle),
    // Secciones dinámicas (Fase B) — array ordenado de bloques, saneado.
    layout: sent("layout")
      ? (Array.isArray(body.layout)
          ? body.layout
              .filter(b => b && typeof b.type === "string" && b.id)
              .map(b => ({
                id: String(b.id),
                type: String(b.type),
                enabled: b.enabled !== false,
                config: b.config && typeof b.config === "object" ? b.config : {},
              }))
          : [])
      : (Array.isArray(base.layout) ? base.layout : []),
    verse: {
      text: text("verseText", base.verse?.text),
      reference: text("verseReference", base.verse?.reference),
    },
    ceremony: {
      name: text("ceremonyName", base.ceremony?.name),
      address: text("ceremonyAddress", base.ceremony?.address),
      mapsUrl: text("ceremonyMapsUrl", base.ceremony?.mapsUrl),
    },
    reception: {
      name: text("receptionName", base.reception?.name),
      address: text("receptionAddress", base.reception?.address),
      mapsUrl: text("receptionMapsUrl", base.reception?.mapsUrl),
    },
    heroMessage: text("heroMessage", base.heroMessage),
    giftMessage: text("giftMessage", base.giftMessage),
    announcementText: text("announcementText", base.announcementText),
    dressCode: {
      label: text("dressCodeLabel", base.dressCode?.label),
      ladies: text("dressCodeLadies", base.dressCode?.ladies),
      gentlemen: text("dressCodeGentlemen", base.dressCode?.gentlemen),
    },
    parents: {
      bride: lines("parentsBride", base.parents?.bride),
      groom: lines("parentsGroom", base.parents?.groom),
    },
    godparents: lines("godparents", base.godparents),
    bridesmaids: lines("bridesmaids", base.bridesmaids),
    groomsmen: lines("groomsmen", base.groomsmen),
    timeline: list("timeline", base.timeline),
    gallery: list("gallery", base.gallery),
    sections: {
      showVerse:    body.sections?.showVerse    ?? base.sections?.showVerse    ?? true,
      showNames:    body.sections?.showNames    ?? base.sections?.showNames    ?? true,
      showPhotos:   body.sections?.showPhotos   ?? base.sections?.showPhotos   ?? true,
      showFamily:   body.sections?.showFamily   ?? base.sections?.showFamily   ?? true,
      showVenues:   body.sections?.showVenues   ?? base.sections?.showVenues   ?? true,
      showTimeline: body.sections?.showTimeline ?? base.sections?.showTimeline ?? true,
      showGifts:    body.sections?.showGifts    ?? base.sections?.showGifts    ?? true,
      showGallery:  body.sections?.showGallery  ?? base.sections?.showGallery  ?? true,
    },
    rsvpMode: sent("rsvpMode")
      ? (body.rsvpMode === "form" ? "form" : "whatsapp")
      : (base.rsvpMode ?? "whatsapp"),
    // Preguntas personalizadas del RSVP. Igual que el resto: si el body no las
    // trae, se conservan las guardadas.
    rsvpQuestions: sent("rsvpQuestions")
      ? sanitizeRsvpQuestions(body.rsvpQuestions)
      : sanitizeRsvpQuestions(base.rsvpQuestions),
    labels: (typeof body.labels === "object" && body.labels !== null)
      ? { ...(base.labels ?? {}), ...body.labels }
      : (base.labels ?? {}),
  };
}

// ─── GET /api/master/events — listar todos con stats ────────────────────────

masterRoutes.get("/events", async (req, res) => {
  try {
    const showArchived = req.query.archived === "1";
    const events = await prisma.event.findMany({
      where: showArchived ? { archivedAt: { not: null } } : { archivedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        clientAdmins: { select: { id: true, email: true, name: true } },
        _count: { select: { guests: true, guestAccesses: true } },
      },
    });

    // Un solo groupBy en vez de un guest.count() por evento (N+1): el listado
    // hacía 1 + N viajes a Neon y crecía con cada evento nuevo.
    const confirmedByEvent = await prisma.guest.groupBy({
      by: ["eventId"],
      where: { confirmed: true, eventId: { in: events.map(e => e.id) } },
      _count: { _all: true },
    });
    const confirmedMap = new Map(
      confirmedByEvent.map(row => [row.eventId, row._count._all])
    );

    const withStats = events.map(ev => ({
      ...ev,
      stats: {
        totalGuests: ev._count.guests,
        confirmedGuests: confirmedMap.get(ev.id) ?? 0,
        totalAccesses: ev._count.guestAccesses,
      },
    }));

    res.json(withStats);
  } catch (error) {
    console.error("Error listing events:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── POST /api/master/events — crear evento ──────────────────────────────────

masterRoutes.post("/events", async (req, res) => {
  try {
    const {
      slug, groomName, brideName, eventDate, rsvpDeadline,
      ceremonyTime, receptionTime, venueName, venueAddress, dressCode,
      heroPhotoUrl, photo2Url, photo3Url, audioUrl,
      groomPhone, bridePhone, groomWAMessage, brideWAMessage,
      isActive = true,
    } = req.body;

    if (!slug || !groomName || !brideName || !eventDate) {
      return res.status(400).json({ error: "slug, groomName, brideName y eventDate son requeridos" });
    }

    const existing = await prisma.event.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: `Ya existe un evento con el slug "${slug}"` });
    }

    const config = buildConfig(req.body);

    const event = await prisma.event.create({
      data: {
        slug,
        groomName,
        brideName,
        eventDate: new Date(eventDate),
        rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
        ceremonyTime: ceremonyTime || null,
        receptionTime: receptionTime || null,
        venueName: venueName || null,
        venueAddress: venueAddress || null,
        dressCode: dressCode || null,
        heroPhotoUrl: heroPhotoUrl || null,
        photo2Url: photo2Url || null,
        photo3Url: photo3Url || null,
        audioUrl: audioUrl || null,
        groomPhone: groomPhone || null,
        bridePhone: bridePhone || null,
        groomWAMessage: groomWAMessage || null,
        brideWAMessage: brideWAMessage || null,
        isActive: Boolean(isActive),
        config,
        assets: (typeof req.body.assets === "object" && req.body.assets !== null) ? req.body.assets : {},
        theme: (typeof req.body.theme === "object" && req.body.theme !== null) ? req.body.theme : {},
      },
      include: { clientAdmins: true, _count: { select: { guests: true, guestAccesses: true } } },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── PATCH /api/master/events/:id — actualizar evento ────────────────────────

masterRoutes.patch("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slug, groomName, brideName, eventDate, rsvpDeadline,
      ceremonyTime, receptionTime, venueName, venueAddress, dressCode,
      heroPhotoUrl, photo2Url, photo3Url, audioUrl,
      groomPhone, bridePhone, groomWAMessage, brideWAMessage,
      isActive,
    } = req.body;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Evento no encontrado" });

    // Verificar slug único si cambia
    if (slug && slug !== existing.slug) {
      const slugTaken = await prisma.event.findUnique({ where: { slug } });
      if (slugTaken) return res.status(400).json({ error: `El slug "${slug}" ya está en uso` });
    }

    // Fusiona sobre la config actual: un PATCH parcial no debe borrar el resto.
    const config = buildConfig(req.body, existing.config ?? {});

    const event = await prisma.event.update({
      where: { id },
      data: {
        slug: slug || existing.slug,
        groomName: groomName || existing.groomName,
        brideName: brideName || existing.brideName,
        eventDate: eventDate ? new Date(eventDate) : existing.eventDate,
        rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : existing.rsvpDeadline,
        ceremonyTime: ceremonyTime ?? existing.ceremonyTime,
        receptionTime: receptionTime ?? existing.receptionTime,
        venueName: venueName ?? existing.venueName,
        venueAddress: venueAddress ?? existing.venueAddress,
        dressCode: dressCode ?? existing.dressCode,
        heroPhotoUrl: heroPhotoUrl ?? existing.heroPhotoUrl,
        photo2Url: photo2Url ?? existing.photo2Url,
        photo3Url: photo3Url ?? existing.photo3Url,
        audioUrl: audioUrl ?? existing.audioUrl,
        groomPhone: groomPhone ?? existing.groomPhone,
        bridePhone: bridePhone ?? existing.bridePhone,
        groomWAMessage: groomWAMessage ?? existing.groomWAMessage,
        brideWAMessage: brideWAMessage ?? existing.brideWAMessage,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        config,
        assets: (typeof req.body.assets === "object" && req.body.assets !== null)
          ? { ...(existing.assets || {}), ...req.body.assets }
          : (existing.assets || {}),
        theme: (typeof req.body.theme === "object" && req.body.theme !== null)
          ? { ...(existing.theme || {}), ...req.body.theme }
          : (existing.theme || {}),
      },
      include: { clientAdmins: true, _count: { select: { guests: true, guestAccesses: true } } },
    });

    res.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── POST /api/master/events/:id/duplicate — clonar evento ───────────────────

masterRoutes.post("/events/:id/duplicate", async (req, res) => {
  try {
    const { id } = req.params;
    const original = await prisma.event.findUnique({ where: { id } });
    if (!original) return res.status(404).json({ error: "Evento no encontrado" });

    // Generar slug único: {slug}-copia, con sufijo numérico si ya existe
    let baseSlug = `${original.slug}-copia`;
    let newSlug = baseSlug;
    let attempt = 1;
    while (await prisma.event.findUnique({ where: { slug: newSlug } })) {
      newSlug = `${baseSlug}-${attempt++}`;
    }

    const clone = await prisma.event.create({
      data: {
        slug: newSlug,
        groomName: original.groomName,
        brideName: original.brideName,
        eventDate: original.eventDate,
        rsvpDeadline: original.rsvpDeadline,
        ceremonyTime: original.ceremonyTime,
        receptionTime: original.receptionTime,
        venueName: original.venueName,
        venueAddress: original.venueAddress,
        dressCode: original.dressCode,
        heroPhotoUrl: original.heroPhotoUrl,
        photo2Url: original.photo2Url,
        photo3Url: original.photo3Url,
        audioUrl: original.audioUrl,
        groomPhone: original.groomPhone,
        bridePhone: original.bridePhone,
        groomWAMessage: original.groomWAMessage,
        brideWAMessage: original.brideWAMessage,
        config: original.config ?? {},
        assets: original.assets ?? {},
        theme: original.theme ?? {},
        isActive: false,
      },
      include: { clientAdmins: true, _count: { select: { guests: true, guestAccesses: true } } },
    });

    res.status(201).json(clone);
  } catch (error) {
    console.error("Error duplicating event:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── POST /api/master/events/:id/archive — archivar evento ───────────────────

masterRoutes.post("/events/:id/archive", async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.update({
      where: { id },
      data: { archivedAt: new Date(), isActive: false },
      include: { clientAdmins: true, _count: { select: { guests: true, guestAccesses: true } } },
    });
    res.json(event);
  } catch (error) {
    console.error("Error archiving event:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── POST /api/master/events/:id/unarchive — desarchivar evento ───────────────

masterRoutes.post("/events/:id/unarchive", async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.update({
      where: { id },
      data: { archivedAt: null },
      include: { clientAdmins: true, _count: { select: { guests: true, guestAccesses: true } } },
    });
    res.json(event);
  } catch (error) {
    console.error("Error unarchiving event:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── DELETE /api/master/events/:id — eliminar evento ─────────────────────────

masterRoutes.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Delete related records first (no onDelete: Cascade on Event relations)
    // Companion already cascades from Guest, so deleting guests covers it.
    await prisma.$transaction([
      prisma.guestAccess.deleteMany({ where: { eventId: id } }),
      prisma.guest.deleteMany({ where: { eventId: id } }),
      prisma.clientAdmin.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── POST /api/master/events/:id/import-guests — importar invitados CSV ──────

masterRoutes.post("/events/:id/import-guests", async (req, res) => {
  try {
    const { id: eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Evento no encontrado" });

    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No hay filas para importar" });
    }

    res.json(await importGuestRows(eventId, rows));
  } catch (error) {
    console.error("Error importing guests (master):", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── GET /api/master/events/:id/guests — invitados de un evento (panel) ──────

masterRoutes.get("/events/:id/guests", async (req, res) => {
  try {
    const { id: eventId } = req.params;

    const [guests, accessCounts] = await Promise.all([
      prisma.guest.findMany({
        where: { eventId },
        include: {
        companions: true,
        attendees: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      },
        orderBy: { createdAt: "desc" },
      }),
      prisma.guestAccess.groupBy({
        by: ["guestCode"],
        where: { eventId },
        _count: { id: true },
      }),
    ]);

    const countMap = Object.fromEntries(
      accessCounts.map(({ guestCode, _count }) => [guestCode, _count.id])
    );

    res.json(guests.map(g => ({ ...g, accessCount: countMap[g.code] ?? 0 })));
  } catch (error) {
    console.error("Error getting event guests (master):", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── CRUD de invitados/acompañantes de un evento (panel master por-evento) ────
// Espeja la lógica de /api/admin/* pero scoped por :id (params). requireMaster
// ya garantiza el acceso. Las sub-rutas coinciden con las de admin para que el
// frontend reuse el mismo GuestManager cambiando solo el basePath.

masterRoutes.post("/events/:id/guests", async (req, res) => {
  const parsed = createGuestSchema.safeParse({ ...req.body, code: req.body.code?.toUpperCase() });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
  }
  try {
    const eventId = req.params.id;
    const { code, name, email, phone, maxGuests } = parsed.data;

    const existing = await prisma.guest.findUnique({
      where: { eventId_code: { eventId, code: code.toUpperCase() } },
    });
    if (existing) {
      return res.status(400).json({ message: "Ya existe un invitado con ese código en este evento" });
    }

    const guest = await prisma.guest.create({
      data: { eventId, code: code.toUpperCase(), name, email: email || undefined, phone: phone || undefined, maxGuests },
      include: {
        companions: true,
        attendees: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      },
    });
    await syncPrimaryAttendee(guest);
    return res.status(201).json(guest);
  } catch (error) {
    console.error("Error creating guest (master):", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

masterRoutes.patch("/events/:id/guests/:guestId", async (req, res) => {
  try {
    const { id: eventId, guestId } = req.params;
    const { name, email, phone, maxGuests, confirmed, notes } = req.body;

    const owned = await prisma.guest.findFirst({ where: { id: guestId, eventId } });
    if (!owned) return res.status(404).json({ error: "Invitado no encontrado en este evento" });

    const guest = await prisma.guest.update({
      where: { id: guestId },
      data: {
        name, email: email || undefined, phone: phone || undefined, maxGuests,
        ...confirmationFields(confirmed),
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        companions: true,
        attendees: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      },
    });
    await syncPrimaryAttendee(guest);
    res.json(guest);
  } catch (error) {
    console.error("Error updating guest (master):", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

masterRoutes.delete("/events/:id/guests/:guestId", async (req, res) => {
  try {
    const { id: eventId, guestId } = req.params;
    const owned = await prisma.guest.findFirst({ where: { id: guestId, eventId } });
    if (!owned) return res.status(404).json({ error: "Invitado no encontrado en este evento" });
    await prisma.guest.delete({ where: { id: guestId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting guest (master):", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

masterRoutes.post("/events/:id/companions", async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { guestId, name } = req.body;
    const owned = await prisma.guest.findFirst({ where: { id: guestId, eventId } });
    if (!owned) return res.status(404).json({ error: "Invitado no encontrado en este evento" });
    const companion = await prisma.companion.create({ data: { guestId, name } });
    await syncCompanionAttendee(guestId, companion);
    res.status(201).json(companion);
  } catch (error) {
    console.error("Error creating companion (master):", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

masterRoutes.patch("/events/:id/companions/:companionId", async (req, res) => {
  try {
    const { id: eventId, companionId } = req.params;
    const { confirmed } = req.body;
    const owned = await prisma.companion.findFirst({ where: { id: companionId, guest: { eventId } } });
    if (!owned) return res.status(404).json({ error: "Acompañante no encontrado en este evento" });
    const companion = await prisma.companion.update({
      where: { id: companionId },
      data: confirmationFields(confirmed),
    });
    await syncCompanionAttendee(companion.guestId, companion);
    res.json(companion);
  } catch (error) {
    console.error("Error updating companion (master):", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

masterRoutes.delete("/events/:id/companions/:companionId", async (req, res) => {
  try {
    const { id: eventId, companionId } = req.params;
    const owned = await prisma.companion.findFirst({ where: { id: companionId, guest: { eventId } } });
    if (!owned) return res.status(404).json({ error: "Acompañante no encontrado en este evento" });
    await prisma.companion.delete({ where: { id: companionId } });
    await deleteCompanionAttendee(companionId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting companion (master):", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

masterRoutes.get("/events/:id/stats", async (req, res) => {
  try {
    const filter = { eventId: req.params.id };
    const [totalGuests, confirmedGuests, totalCompanions, confirmedCompanions, guestsWithSlots] =
      await Promise.all([
        prisma.guest.count({ where: filter }),
        prisma.guest.count({ where: { ...filter, confirmed: true } }),
        prisma.companion.count({ where: { guest: filter } }),
        prisma.companion.count({ where: { confirmed: true, guest: filter } }),
        prisma.guest.findMany({ where: filter, select: { maxGuests: true } }),
      ]);
    const totalSlots = guestsWithSlots.reduce((s, g) => s + g.maxGuests, 0);
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
    console.error("Error getting event stats (master):", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

masterRoutes.get("/events/:id/analytics", async (req, res) => {
  try {
    const eventId = req.params.id;
    const filter = { eventId };
    const accessFilter = { eventId };

    const recentAccesses = await prisma.guestAccess.findMany({
      where: accessFilter, take: 10, orderBy: { accessedAt: "desc" },
    });
    const accessedCodes = await prisma.guestAccess.findMany({
      where: accessFilter, select: { guestCode: true }, distinct: ["guestCode"],
    });
    const accessedCodesSet = new Set(accessedCodes.map(a => a.guestCode));
    const accessedButNotConfirmed = await prisma.guest.findMany({
      where: { ...filter, confirmed: false, code: { in: [...accessedCodesSet] } },
      include: {
        companions: true,
        attendees: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      },
    });
    const allGuests = await prisma.guest.findMany({
      where: filter, select: { code: true, name: true, createdAt: true },
    });
    const neverAccessed = allGuests.filter(g => !accessedCodesSet.has(g.code));
    const accessStats = await prisma.guestAccess.groupBy({
      by: ["guestCode"], where: accessFilter, _count: { guestCode: true },
      orderBy: { _count: { guestCode: "desc" } }, take: 10,
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
      recentAccesses, accessedButNotConfirmed, neverAccessed, accessStats,
      accessesByDay: accessesByDayGrouped,
      summary: {
        totalAccesses: await prisma.guestAccess.count({ where: accessFilter }),
        uniqueAccessedCodes: accessedCodes.length,
        neverAccessedCount: neverAccessed.length,
        accessedButNotConfirmedCount: accessedButNotConfirmed.length,
      },
    });
  } catch (error) {
    console.error("Error in event analytics (master):", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── MESAS ───────────────────────────────────────────────────────────────────
// La ocupación no se guarda en la mesa: se deriva de los Attendee que apuntan a
// ella. Ver ARQUITECTURA_MESAS.md §2.

const tableSchema = z.object({
  name: z.string().min(1).max(60),
  shape: z.enum(["round", "rect"]).default("round"),
  capacity: z.coerce.number().int().min(1).max(50).default(8),
  x: z.coerce.number().default(0),
  y: z.coerce.number().default(0),
  rotation: z.coerce.number().default(0),
});

// GET — mesas del evento con las personas sentadas en cada una
masterRoutes.get("/events/:id/tables", async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      where: { eventId: req.params.id },
      orderBy: { createdAt: "asc" },
      include: {
        attendees: {
          select: { id: true, name: true, isPrimary: true, guestId: true },
          orderBy: { name: "asc" },
        },
      },
    });
    res.json(tables);
  } catch (error) {
    console.error("Error listing tables:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

masterRoutes.post("/events/:id/tables", async (req, res) => {
  const parsed = tableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
  }
  try {
    const table = await prisma.table.create({
      data: { ...parsed.data, eventId: req.params.id },
      include: { attendees: { select: { id: true, name: true, isPrimary: true, guestId: true } } },
    });
    res.status(201).json(table);
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

masterRoutes.patch("/events/:id/tables/:tableId", async (req, res) => {
  const parsed = tableSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
  }
  try {
    const { id: eventId, tableId } = req.params;
    const owned = await prisma.table.findFirst({ where: { id: tableId, eventId } });
    if (!owned) return res.status(404).json({ error: "Mesa no encontrada en este evento" });

    const table = await prisma.table.update({
      where: { id: tableId },
      data: parsed.data,
      include: { attendees: { select: { id: true, name: true, isPrimary: true, guestId: true } } },
    });
    res.json(table);
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE — al borrar la mesa sus personas quedan sin sitio (SetNull), no se borran
masterRoutes.delete("/events/:id/tables/:tableId", async (req, res) => {
  try {
    const { id: eventId, tableId } = req.params;
    const owned = await prisma.table.findFirst({ where: { id: tableId, eventId } });
    if (!owned) return res.status(404).json({ error: "Mesa no encontrada en este evento" });
    await prisma.table.delete({ where: { id: tableId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT — aplica un reparto completo: { asignaciones: { personaId: mesaId|null } }
masterRoutes.put("/events/:id/seating", async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { assignments } = req.body;
    if (!assignments || typeof assignments !== "object" || Array.isArray(assignments)) {
      return res.status(400).json({ error: "Se esperaba un objeto de asignaciones" });
    }

    // Solo personas y mesas de ESTE evento: el id llega del cliente.
    const [personas, mesas] = await Promise.all([
      prisma.attendee.findMany({ where: { guest: { eventId } }, select: { id: true } }),
      prisma.table.findMany({ where: { eventId }, select: { id: true } }),
    ]);
    const personasValidas = new Set(personas.map(p => p.id));
    const mesasValidas = new Set(mesas.map(t => t.id));

    const cambios = Object.entries(assignments)
      .filter(([attendeeId, tableId]) =>
        personasValidas.has(attendeeId) && (tableId === null || mesasValidas.has(tableId))
      );

    await prisma.$transaction(
      cambios.map(([attendeeId, tableId]) =>
        prisma.attendee.update({ where: { id: attendeeId }, data: { tableId } })
      )
    );

    res.json({ applied: cambios.length, ignored: Object.keys(assignments).length - cambios.length });
  } catch (error) {
    console.error("Error applying seating:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── POST /api/master/events/:id/client-admins — crear client admin ──────────

masterRoutes.post("/events/:id/client-admins", async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password y name son requeridos" });
    }

    const existing = await prisma.clientAdmin.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Ya existe un admin con ese email" });

    const hashed = await bcrypt.hash(password, 12);
    const admin = await prisma.clientAdmin.create({
      data: { eventId, email, password: hashed, name },
      select: { id: true, email: true, name: true, eventId: true, createdAt: true },
    });

    res.status(201).json(admin);
  } catch (error) {
    console.error("Error creating client admin:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── DELETE /api/master/client-admins/:id — eliminar client admin ────────────

masterRoutes.delete("/client-admins/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.clientAdmin.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting client admin:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── PATCH /api/master/client-admins/:id/password — cambiar contraseña ───────

masterRoutes.patch("/client-admins/:id/password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    const admin = await prisma.clientAdmin.findUnique({ where: { id } });
    if (!admin) return res.status(404).json({ error: "Admin no encontrado" });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.clientAdmin.update({ where: { id }, data: { password: hashed } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error changing client admin password:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── POST /api/master/upload — subir asset a Vercel Blob ─────────────────────

const ALLOWED_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME[file.mimetype]) cb(null, true);
    else cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  },
});

masterRoutes.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

  const { eventId, assetType = "asset" } = req.body;
  if (!eventId) return res.status(400).json({ error: "eventId es requerido" });

  const ext = ALLOWED_MIME[req.file.mimetype];
  const filename = `events/${eventId}/${assetType}/${nanoid(8)}.${ext}`;

  try {
    const blob = await put(filename, req.file.buffer, {
      access: "public",
      contentType: req.file.mimetype,
    });
    res.json({ url: blob.url });
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    res.status(500).json({ error: "Error al subir el archivo" });
  }
});

// ─── GET /api/master/recent-confirmations — últimas 10 confirmaciones ────────

masterRoutes.get("/recent-confirmations", async (req, res) => {
  try {
    const guests = await prisma.guest.findMany({
      where: { confirmed: true, confirmedAt: { not: null }, event: { archivedAt: null } },
      orderBy: { confirmedAt: "desc" },
      take: 10,
      select: {
        id: true, name: true, confirmedAt: true,
        event: { select: { slug: true, groomName: true, brideName: true } },
      },
    });
    res.json(guests);
  } catch (error) {
    console.error("Error getting recent confirmations:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── GET /api/master/stats — estadísticas globales ───────────────────────────

masterRoutes.get("/stats", async (req, res) => {
  try {
    const [totalEvents, activeEvents, totalGuests, confirmedGuests, totalAccesses] =
      await Promise.all([
        prisma.event.count({ where: { archivedAt: null } }),
        prisma.event.count({ where: { isActive: true, archivedAt: null } }),
        prisma.guest.count({ where: { event: { archivedAt: null } } }),
        prisma.guest.count({ where: { confirmed: true, event: { archivedAt: null } } }),
        prisma.guestAccess.count({ where: { event: { archivedAt: null } } }),
      ]);

    res.json({ totalEvents, activeEvents, totalGuests, confirmedGuests, totalAccesses });
  } catch (error) {
    console.error("Error getting master stats:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
