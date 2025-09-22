import prisma from "../_utils/prisma.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { guestCode } = req.body;

    if (!guestCode) {
      return res.status(400).json({ success: false, error: "guestCode is required" });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await prisma.guestAccess.create({
      data: {
        guestCode: guestCode.toUpperCase(),
        ipAddress: ipAddress,
        userAgent: userAgent,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error registering guest access:", error);
    // No enviamos error al cliente para que no afecte la experiencia
    res.json({ success: false });
  }
}