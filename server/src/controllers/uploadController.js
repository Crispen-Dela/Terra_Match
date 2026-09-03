import { AppError } from "../middlewares/errorHandler.js";

export function handleFileUpload(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError("No file provided for upload.", 400);
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
      message: "File uploaded successfully.",
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl,
    });
  } catch (error) {
    next(error);
  }
}
