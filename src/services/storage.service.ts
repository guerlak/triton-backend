import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import { r2Client, R2_CONFIG } from "../config/r2";

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  originalName: string;
  mimeType: string;
}

export class StorageService {
  /**
   * Faz upload de arquivo para o Cloudflare R2 com otimização automática de imagens
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = "events"
  ): Promise<UploadResult> {
    if (!R2_CONFIG.bucketName) {
      throw new Error("R2_BUCKET_NAME não configurado no .env");
    }

    let buffer = file.buffer;
    let mimeType = file.mimetype;
    let extension = path.extname(file.originalname).toLowerCase();

    // Se for imagem (exceto SVG), converte para WebP e otimiza
    const isImage = file.mimetype.startsWith("image/") && file.mimetype !== "image/svg+xml";

    if (isImage) {
      buffer = await sharp(file.buffer)
        .resize({ width: 2560, withoutEnlargement: true }) // Redimensiona apenas se for maior que 2560px
        .webp({ quality: 85 }) // Converte para WebP de alta qualidade e leveza
        .toBuffer();

      mimeType = "image/webp";
      extension = ".webp";
    }

    const uniqueHash = crypto.randomBytes(6).toString("hex");
    const sanitizedName = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .substring(0, 30);

    const key = `${folder}/${Date.now()}-${sanitizedName}-${uniqueHash}${extension}`;

    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await r2Client.send(command);

    // Monta a URL pública (usando R2_PUBLIC_URL se configurada, ou fallback para r2.cloudflarestorage.com)
    const publicBase = R2_CONFIG.publicUrl || `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_CONFIG.bucketName}`;
    const url = `${publicBase}/${key}`;

    return {
      url,
      key,
      size: buffer.length,
      originalName: file.originalname,
      mimeType,
    };
  }
}

export const storageService = new StorageService();

