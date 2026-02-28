import express from "express";

import prisma from "../../src/lib/prisma.js";

export const eventRoutes = express.Router();

// Obtener evento público por slug
eventRoutes.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const event = await prisma.event.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        groomName: true,
        brideName: true,
        eventDate: true,
        rsvpDeadline: true,
        venueName: true,
        venueAddress: true,
        ceremonyTime: true,
        receptionTime: true,
        dressCode: true,
        config: true,
        isActive: true,
        heroPhotoUrl: true,
        photo2Url: true,
        audioUrl: true,
        groomPhone: true,
        bridePhone: true,
        groomWAMessage: true,
        brideWAMessage: true,
      },
    });

    if (!event || !event.isActive) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    res.json(event);
  } catch (error) {
    console.error("Error getting event:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
