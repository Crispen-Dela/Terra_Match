import { Router } from "express";
import {
  recommendContractors,
  aiChatAssistant,
  analyzeLandEnvironment,
  getUserAiConversations,
  getAiConversationById,
  createAiConversation,
  deleteAiConversation,
  clearAllUserAiConversations,
} from "../controllers/aiController.js";
import { authenticate, optionalAuth } from "../middlewares/auth.js";

const router = Router();

// Recommendation & Analysis endpoints
router.get("/recommend", recommendContractors);
router.post("/recommend", recommendContractors);
router.get("/land-analysis", analyzeLandEnvironment);

// Chat endpoint (optionalAuth allows both authenticated persistence and guest temporary chats)
router.post("/chat", optionalAuth, aiChatAssistant);

// Protected user-specific conversation management endpoints
router.get("/conversations", authenticate, getUserAiConversations);
router.post("/conversations", authenticate, createAiConversation);
router.get("/conversations/:id", authenticate, getAiConversationById);
router.delete("/conversations/:id", authenticate, deleteAiConversation);
router.delete("/conversations", authenticate, clearAllUserAiConversations);

export default router;

