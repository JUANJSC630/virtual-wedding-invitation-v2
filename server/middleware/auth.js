import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}

/**
 * Middleware que verifica el JWT del admin.
 * Lee el token desde la cookie 'admin_token'.
 * Si es válido, adjunta el payload a req.user y continúa.
 * Si no, responde con 401.
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.admin_token;

  if (!token) {
    return res.status(401).json({ error: "No autorizado. Inicia sesión primero." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada. Inicia sesión de nuevo." });
  }
}
