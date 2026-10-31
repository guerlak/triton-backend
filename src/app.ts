import express, { Application, Request, Response } from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

export const app: Application = express();

// Configurações e Middlewares globais
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Rotas da API
app.use("/api", routes);

// Rota raiz de boas-vindas / status
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Triton Backend API",
    version: "1.0.0",
    docs: {
      events: "/api/events",
      health: "/api/health",
    },
  });
});

// Tratamento de rota não encontrada (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Rota '${req.method} ${req.originalUrl}' não encontrada.`,
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

