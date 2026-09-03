import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "./errorHandler.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${cleanName || "file"}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mime = file.mimetype.toLowerCase();

  const isExtAllowed = allowedExtensions.test(ext);
  const isMimeAllowed =
    /image\/(jpeg|jpg|png|webp)|application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)/.test(
      mime
    );

  if (isExtAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file format. Only JPG, PNG, WEBP, PDF, and DOC files are allowed.",
        400
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
