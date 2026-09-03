export class AppError extends Error {
  constructor(message, statusCode = 400, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}

export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || "Internal server error. Please try again.";

  res.status(statusCode).json({
    status: statusCode,
    error: err.name || "Error",
    message,
    data: err.data || null,
    timestamp: new Date().toISOString(),
  });
}
