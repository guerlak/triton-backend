import multer from "multer";

// Mantém o arquivo em memória para processamento (otimização/compressão) antes de enviar ao R2
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // Limite de 20MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    // Permite imagens comuns e PDFs (ex: Race Guide / Regulamentos)
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/svg+xml",
      "application/pdf",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo '${file.mimetype}' não suportado. Envie imagens (JPEG, PNG, WEBP, SVG) ou PDFs.`));
    }
  },
});

