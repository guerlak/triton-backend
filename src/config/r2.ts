import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// Extrai o accountId caso o usuário passe o hash ou a URL completa do endpoint
const rawAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.AccountID || "";
const accountId = rawAccountId
  .replace(/^https?:\/\//, "")
  .replace(/\.r2\.cloudflarestorage\.com.*$/, "")
  .trim();

const accessKeyId =
  process.env.R2_ACCESS_KEY_ID || process.env.AccesKEY || "";

const secretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY || process.env.SecretAccesKey || "";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const R2_CONFIG = {
  bucketName: process.env.R2_BUCKET_NAME || "triton-media",
  publicUrl: (process.env.R2_PUBLIC_URL || "").replace(/\/$/, ""),
};
