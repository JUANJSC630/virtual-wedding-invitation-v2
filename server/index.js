import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import { authRoutes } from "./routes/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { guestRoutes } from "./routes/guests.js";

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3002;

// ─── Seguridad: headers HTTP ────────────────────────────────────────────────
app.use(helmet());

// ─── CORS: solo orígenes permitidos ─────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  process.env.ALLOWED_ORIGIN, // dominio de producción (ej: https://tuapp.vercel.app)
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (ej: Postman en dev, serverless functions)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS bloqueado para origin: ${origin}`));
    },
    credentials: true, // necesario para que las cookies viajen con las requests
  })
);

// ─── Rate limiting en auth ───────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10,                 // máx 10 intentos por ventana
  message: { error: "Demasiados intentos. Espera 15 minutos e intenta de nuevo." },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// ─── Middlewares base ────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json());

// ─── Rutas ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/admin", adminRoutes);

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

app.listen(PORT, () => {
  console.log(`🚀 Servidor API en http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
});
