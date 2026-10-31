import { Request, Response, NextFunction } from "express";
import { storageService } from "../services/storage.service";

export class UploadController {
  async uploadSingle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "Nenhum arquivo foi enviado. Use o campo 'file'.",
        });
        return;
      }

      const folder = (req.body.folder as string) || "events";
      const result = await storageService.uploadFile(req.file, folder);

      res.status(201).json({
        success: true,
        message: "Arquivo enviado com sucesso para o Cloudflare R2.",
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async uploadMultiple(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: "Nenhum arquivo foi enviado. Use o campo 'files'.",
        });
        return;
      }

      const folder = (req.body.folder as string) || "events";
      const uploadPromises = files.map((file) => storageService.uploadFile(file, folder));
      const results = await Promise.all(uploadPromises);

      res.status(201).json({
        success: true,
        count: results.length,
        message: `${results.length} arquivos enviados com sucesso para o Cloudflare R2.`,
        data: results,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();

