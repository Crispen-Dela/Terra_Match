import { AppError } from "./errorHandler.js";

/**
 * Admin authorization middleware.
 * Verifies that the authenticated user has role ADMIN.
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(new AppError("Authentication required.", 401));
  }

  if (req.user.role !== "ADMIN") {
    return next(
      new AppError("Access denied. Administrative privileges are required.", 403)
    );
  }

  next();
}
