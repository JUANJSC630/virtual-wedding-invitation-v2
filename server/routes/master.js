import bcrypt from "bcryptjs";
import express from "express";
import multer from "multer";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

import prisma from "../../src/lib/prisma.js";
import { requireMaster } from "../middleware/auth.js";

export const masterRoutes = express.Router();

masterRoutes.use(requireMaster);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildConfig(body) {
  const {
    verseText, verseReference,
    ceremonyName, ceremonyAddress, ceremonyMapsUrl,
    receptionName, receptionAddress, receptionMapsUrl,
    heroMessage, giftMessage, announcementText,
    dressCodeLabel, dressCodeLadies, dressCodeGentlemen,
    parentsBride, parentsGroom, godparents, bridesmaids, groomsmen,
    timeline,
  } = body;

  const splitLines = (str) =>
    (str || "").split("\n").map(s => s.trim()).filter(Boolean);

  return {
    verse: { text: verseText || "", reference: verseReference || "" },
    ceremony: { name: ceremonyName || "", address: ceremonyAddress || "", mapsUrl: ceremonyMapsUrl || "" },
    reception: { name: receptionName || "", address: receptionAddress || "", mapsUrl: receptionMapsUrl || "" },
    heroMessage: heroMessage || "",
    giftMessage: giftMessage || "",
    announcementText: announcementText || "",
    dressCode: { label: dressCodeLabel || "", ladies: dressCodeLadies || "", gentlemen: dressCodeGentlemen || "" },
    parents: { bride: splitLines(parentsBride), groom: splitLines(parentsGroom) },
    godparents: splitLines(godparents),
    bridesmaids: splitLines(bridesmaids),
    groomsmen: splitLines(groomsmen),
    timeline: Array.isArray(timeline) ? timeline : [],
    labels: (typeof body.labels === "object" && body.labels !== null) ? body.labels : {},
  };
}

// ─── GET /api/master/events — listar todos con stats ────────────────────────

masterRoutes.get("/events", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        clientAdmins: { select: { id: true, email: true, name: true } },
        _count: { select: { guests: true, guestAccesses: true } },
      },
    });

    const withStats = await Promise.all(
      events.map(async (ev) => {
        const confirmedGuests = await prisma.guest.count({
          where: { eventId: ev.id, confirmed: true },
        });
        return { ...ev, stats: { totalGuests: ev._count.guests, confirmedGuests, totalAccesses: ev._count.guestAccesses } };
      })
    );

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

    const config = buildConfig(req.body);

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

// ─── DELETE /api/master/events/:id — eliminar evento ─────────────────────────

masterRoutes.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
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

// ─── GET /api/master/stats — estadísticas globales ───────────────────────────

masterRoutes.get("/stats", async (req, res) => {
  try {
    const [totalEvents, activeEvents, totalGuests, confirmedGuests, totalAccesses] =
      await Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { isActive: true } }),
        prisma.guest.count(),
        prisma.guest.count({ where: { confirmed: true } }),
        prisma.guestAccess.count(),
      ]);

    res.json({ totalEvents, activeEvents, totalGuests, confirmedGuests, totalAccesses });
  } catch (error) {
    console.error("Error getting master stats:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
