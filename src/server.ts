import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { testConnection } from "./config/database";

const PORT = process.env.PORT || 3001;

async function startServer() {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Triton Backend Server rodando na porta ${PORT}`);
    console.log(`👉 API disponível em: http://localhost:${PORT}/api/events`);
    console.log(`💓 Health check em: http://localhost:${PORT}/api/health`);
  });
}

startServer();
