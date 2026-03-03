import { rateLimit } from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Demasiados intentos. Espera 15 minutos e intenta de nuevo." },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const guestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: { error: "Demasiadas peticiones. Espera unos minutos e intenta de nuevo." },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const validateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { error: "Demasiados intentos de validación. Espera un minuto." },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const rsvpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  message: { error: "Demasiados envíos de confirmación. Espera un minuto." },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const accessLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  message: { error: "Demasiadas peticiones." },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
