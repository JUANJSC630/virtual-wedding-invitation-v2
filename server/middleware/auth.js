import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error("JWT_SECRET no está definido en las variables de entorno");
    return res.status(500).json({ error: "Error de configuración del servidor." });
  }

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

export function requireMaster(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "master") {
      return res.status(403).json({ error: "Acceso denegado. Solo para master admin." });
    }
    next();
  });
}
