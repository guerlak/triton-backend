import { Router } from "express";
import { eventController } from "../controllers/event.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// GET /api/events - Lista eventos com filtros opcionais (query params: eventFormat, year, status, language, search)
router.get("/", (req, res, next) => eventController.getAll(req, res, next));

// GET /api/events/:idOrSlug - Retorna evento específico por id ou slug
router.get("/:idOrSlug", (req, res, next) => eventController.getByIdOrSlug(req, res, next));

// POST /api/events - Cria um novo evento
router.post("/", authMiddleware, (req, res, next) => eventController.create(req, res, next));

// PUT /api/events/:idOrSlug - Atualiza um evento existente
router.put("/:idOrSlug", authMiddleware, (req, res, next) => eventController.update(req, res, next));

// DELETE /api/events/:idOrSlug - Exclui um evento
router.delete("/:idOrSlug", authMiddleware, (req, res, next) => eventController.delete(req, res, next));

export default router;

