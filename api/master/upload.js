import Busboy from "busboy";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export const config = { api: { bodyParser: false } };

const ALLOWED_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
};

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader.split(";").map(c => c.trim().split("=").map(decodeURIComponent))
  );
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  // Verify master auth via JWT cookie
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.admin_token;
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "master") {
      return res.status(403).json({ error: "Solo master admin puede subir archivos" });
    }
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }

  // Parse multipart with busboy
  return new Promise((resolve) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });

    let fileBuffer = null;
    let mimeType = null;
    let originalName = "file";
    let eventId = null;
    let assetType = "asset";

    busboy.on("file", (fieldname, file, info) => {
      mimeType = info.mimeType;
      originalName = info.filename || "file";
      const chunks = [];
      file.on("data", chunk => chunks.push(chunk));
      file.on("end", () => { fileBuffer = Buffer.concat(chunks); });
    });

    busboy.on("field", (name, val) => {
      if (name === "eventId") eventId = val;
      if (name === "assetType") assetType = val;
    });

    busboy.on("finish", async () => {
      if (!fileBuffer) {
        res.status(400).json({ error: "No se recibió ningún archivo" });
        return resolve();
      }
      if (!eventId) {
        res.status(400).json({ error: "eventId es requerido" });
        return resolve();
      }
      if (!ALLOWED_MIME[mimeType]) {
        res.status(400).json({ error: `Tipo de archivo no permitido: ${mimeType}` });
        return resolve();
      }

      const ext = ALLOWED_MIME[mimeType];
      const filename = `events/${eventId}/${assetType}/${nanoid(8)}.${ext}`;

      try {
        const blob = await put(filename, fileBuffer, {
          access: "public",
          contentType: mimeType,
        });
        res.status(200).json({ url: blob.url });
      } catch (err) {
        console.error("Error uploading to Vercel Blob:", err);
        res.status(500).json({ error: "Error al subir el archivo" });
      }
      resolve();
    });

    busboy.on("error", (err) => {
      console.error("Busboy error:", err);
      res.status(400).json({ error: "Error al procesar el archivo" });
      resolve();
    });

    req.pipe(busboy);
  });
}
