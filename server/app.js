import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

import { authLimiter, guestLimiter } from "./middleware/limiters.js";
import { authRoutes } from "./routes/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { eventRoutes } from "./routes/events.js";
import { guestRoutes } from "./routes/guests.js";
import { masterRoutes } from "./routes/master.js";

dotenv.config();

const app = express();

// ─── Seguridad: headers HTTP ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "blob:", "*.public.blob.vercel-storage.com"],
        "media-src": ["'self'", "blob:", "*.public.blob.vercel-storage.com"],
      },
    },
  })
);

// ─── CORS: solo orígenes permitidos ─────────────────────────────────────────
// En Vercel, frontend y API comparten dominio: las peticiones son same-origin
// (sin header Origin) y no requieren aprobación CORS. Solo hace falta reflejar
// orígenes cross-site conocidos. Los dominios de Vercel se detectan por env.
const vercelOrigins = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL,
]
  .filter(Boolean)
  .map(host => `https://${host}`);

const allowedOrigins = [
  "http://localhost:3000",
  process.env.ALLOWED_ORIGIN,
  ...vercelOrigins,
].filter(Boolean);

// Si no hay ningún origen configurado en prod, se mantiene el comportamiento
// permisivo previo (reflejar) para no romper despliegues sin envs; con envs
// configuradas, se restringe a la whitelist.
const hasProdAllowlist = process.env.ALLOWED_ORIGIN || vercelOrigins.length > 0;

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / server-to-server / curl → sin header Origin: permitido.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Fallback seguro: en prod sin allowlist configurada, reflejar (legacy).
      if (process.env.NODE_ENV === "production" && !hasProdAllowlist) {
        return callback(null, true);
      }
      callback(new Error(`CORS bloqueado para origin: ${origin}`));
    },
    credentials: true,
  })
);

// ─── Rate limiting — see server/middleware/limiters.js ───────────────────────

// ─── Middlewares base ────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json());

// ─── Rutas ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/guests", guestLimiter, guestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/master", masterRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Error:", err);
  const isDev = process.env.NODE_ENV !== "production";
  res.status(500).json({
    error: "Error interno del servidor",
    message: isDev ? err.message : undefined,
  });
});

export default app;
