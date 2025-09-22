import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { adminRoutes } from "./routes/admin.js";
import { guestRoutes } from "./routes/guests.js";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/guests", guestRoutes);
app.use("/api/admin", adminRoutes);

// Ruta de health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Manejo de errores
app.use((err, _req, res) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor API ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
