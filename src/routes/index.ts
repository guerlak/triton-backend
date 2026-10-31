import { Router } from "express";
import eventRoutes from "./event.routes";
import uploadRoutes from "./upload.routes";
import authRoutes from "./auth.routes"; 

const router = Router();


router.use("/auth", authRoutes);   

// Subrotas de Eventos
router.use("/events", eventRoutes);

// Subrotas de Upload (Cloudflare R2)
router.use("/upload", uploadRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
