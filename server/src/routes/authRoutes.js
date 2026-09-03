import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateMe,
  verifyGhanaCard,
  resendVerification,
  submitSupportTicket,
} from "../controllers/authController.js";
import { authenticate, optionalAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateMe);
router.post("/verify-ghana-card", authenticate, verifyGhanaCard);
router.post("/resend-verification", authenticate, resendVerification);
router.post("/support", optionalAuth, submitSupportTicket);

export default router;
