import app from "./app.js";

const PORT = process.env.API_PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 Servidor API en http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
});
