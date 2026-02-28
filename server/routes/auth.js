import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";

import prisma from "../../src/lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: COOKIE_MAX_AGE,
  path: "/",
};

// POST /api/auth/login
// Comprueba primero en Admin (master), luego en ClientAdmin
authRoutes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos." });
    }

    let user = null;
    let role = null;
    let eventId = null;

    // 1. Buscar master admin
    const masterAdmin = await prisma.admin.findUnique({ where: { email } });
    if (masterAdmin) {
      user = masterAdmin;
      role = "master";
    } else {
      // 2. Buscar client admin
      const clientAdmin = await prisma.clientAdmin.findUnique({
        where: { email },
        include: { event: { select: { id: true, slug: true } } },
      });
      if (clientAdmin) {
        user = clientAdmin;
        role = "client";
        eventId = clientAdmin.eventId;
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const payload = { id: user.id, email: user.email, name: user.name, role, eventId };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("admin_token", token, cookieOptions);

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role, eventId },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// POST /api/auth/logout
authRoutes.post("/logout", (_req, res) => {
  res.clearCookie("admin_token", { path: "/" });
  return res.json({ success: true });
});

// GET /api/auth/me
authRoutes.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});
