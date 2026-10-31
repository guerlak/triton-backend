import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// POST /api/auth/login
router.post("/login", (req, res, next) => authController.login(req, res, next));

// GET /api/auth/me (verifica usuário logado)
router.get("/me", authMiddleware, (req, res) => authController.me(req, res));

export default router;