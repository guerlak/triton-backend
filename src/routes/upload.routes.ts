import { Router } from "express";
import { uploadController } from "../controllers/upload.controller";
import { upload } from "../middlewares/upload.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// POST /api/upload - Upload de arquivo único (campo 'file')
router.post("/", authMiddleware, upload.single("file"), (req, res, next) =>
  uploadController.uploadSingle(req, res, next)
);

// POST /api/upload/multiple - Upload de múltiplos arquivos (campo 'files', máx 10)
router.post("/multiple", authMiddleware, upload.array("files", 10), (req, res, next) =>
  uploadController.uploadMultiple(req, res, next)
);

export default router;

