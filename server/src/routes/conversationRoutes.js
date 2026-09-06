import { Router } from "express";
import {
  startOrGetConversation,
  listConversations,
  getConversation,
  sendMessage,
  getUnreadCount,
  getSupportConversation,
  sendSupportMessage,
} from "../controllers/conversationController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

// Support chat endpoints
router.get("/support", getSupportConversation);
router.post("/support", sendSupportMessage);
router.post("/support/message", sendSupportMessage);

// General conversation endpoints
router.post("/", startOrGetConversation);
router.get("/", listConversations);
router.get("/unread-count", getUnreadCount);
router.get("/:id", getConversation);
router.post("/:id/messages", sendMessage);

export default router;
