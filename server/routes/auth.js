import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";

import prisma from "../../src/lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días en ms

const cookieOptions = {
  httpOnly: true,               // No accesible desde JS del cliente
  secure: process.env.NODE_ENV === "production", // HTTPS solo en producción
  sameSite: "lax",
  maxAge: COOKIE_MAX_AGE,
  path: "/",
};

// POST /api/auth/login
authRoutes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos." });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      // Mismo mensaje para no revelar si el email existe o no
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("admin_token", token, cookieOptions);

    return res.json({
      user: { id: admin.id, email: admin.email, name: admin.name },
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

// GET /api/auth/me — devuelve el usuario actual si la sesión es válida
authRoutes.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});
