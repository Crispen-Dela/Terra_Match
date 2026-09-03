import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { auth as firebaseAuth } from "../config/firebase.js";
import { AppError } from "./errorHandler.js";

const JWT_SECRET = process.env.JWT_SECRET || "terramatch_jwt_production_secret_key_ghana_2026";

/**
 * Authentication middleware.
 * Verifies either a backend-issued JWT token or a Firebase ID Token.
 * Attaches the resolved database User object to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Authentication required. Please sign in.", 401));
    }

    const token = authHeader.split(" ")[1];
    let user = null;

    // 1. Try resolving as a Firebase ID token
    try {
      if (firebaseAuth) {
        const decodedFirebaseToken = await firebaseAuth.verifyIdToken(token);
        if (decodedFirebaseToken && decodedFirebaseToken.email) {
          user = await prisma.user.findFirst({
            where: {
              OR: [
                { firebaseUid: decodedFirebaseToken.uid },
                { email: decodedFirebaseToken.email.toLowerCase() },
              ],
            },
            include: { contractorProfile: true },
          });

          // If found by email but firebaseUid not set, sync it
          if (user && !user.firebaseUid) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                firebaseUid: decodedFirebaseToken.uid,
                emailVerified: decodedFirebaseToken.email_verified || user.emailVerified,
              },
              include: { contractorProfile: true },
            });
          } else if (user && !user.emailVerified && decodedFirebaseToken.email_verified) {
            // Firebase token says verified but DB is still false — sync it
            user = await prisma.user.update({
              where: { id: user.id },
              data: { emailVerified: true },
              include: { contractorProfile: true },
            });
          }
        }
      }
    } catch (fbErr) {
      // Not a valid Firebase token, continue to JWT check
    }

    // 2. If not found via Firebase, check as backend JWT
    if (!user) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = await prisma.user.findUnique({
          where: { id: decoded.userId || decoded.id },
          include: { contractorProfile: true },
        });
      } catch (jwtErr) {
        return next(new AppError("Session invalid or expired. Please sign in again.", 401));
      }
    }

    if (!user) {
      return next(new AppError("User account not found.", 401));
    }

    if (user.status === "SUSPENDED") {
      return next(new AppError("This account has been suspended. Please contact support.", 403));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware:
 * Attaches user if valid token present, otherwise proceeds as guest.
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    let user = null;

    try {
      if (firebaseAuth) {
        const decodedFirebaseToken = await firebaseAuth.verifyIdToken(token);
        if (decodedFirebaseToken && decodedFirebaseToken.email) {
          user = await prisma.user.findFirst({
            where: {
              OR: [
                { firebaseUid: decodedFirebaseToken.uid },
                { email: decodedFirebaseToken.email.toLowerCase() },
              ],
            },
            include: { contractorProfile: true },
          });
        }
      }
    } catch {
      // ignore
    }

    if (!user) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = await prisma.user.findUnique({
          where: { id: decoded.userId || decoded.id },
          include: { contractorProfile: true },
        });
      } catch {
        // ignore
      }
    }

    if (user && user.status !== "SUSPENDED") {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
}

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
