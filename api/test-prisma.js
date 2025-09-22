export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log("Test Prisma function started");

    // Test environment variables
    const hasDbUrl = !!process.env.DATABASE_URL;
    console.log("DATABASE_URL exists:", hasDbUrl);

    // Try to import Prisma
    let prismaImported = false;
    let prismaError = null;
    let prisma = null;

    try {
      const { PrismaClient } = await import("@prisma/client");
      prismaImported = true;
      console.log("Prisma imported successfully");

      // Try to create client
      prisma = new PrismaClient();
      console.log("Prisma client created");
    } catch (err) {
      prismaError = err.message;
      console.error("Prisma import/creation error:", err);
    }

    res.json({
      success: true,
      message: "Prisma test completed",
      hasDbUrl,
      prismaImported,
      prismaError,
      hasPrismaClient: !!prisma,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in test-prisma function:", error);
    res.status(500).json({
      error: "Prisma test failed",
      details: error.message,
      stack: error.stack
    });
  }
}