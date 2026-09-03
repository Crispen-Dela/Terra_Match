import { Router } from "express";
import {
  startOrGetConversation,
  listConversations,
  getConversation,
  sendMessage,
  getUnreadCount,
} from "../controllers/conversationController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.post("/", startOrGetConversation);
router.get("/", listConversations);
router.get("/unread-count", getUnreadCount);
router.get("/:id", getConversation);
router.post("/:id/messages", sendMessage);

export default router;
