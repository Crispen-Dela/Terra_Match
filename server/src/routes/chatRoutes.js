import { Router } from "express";
import { getChatToken, createOrGetChannel } from "../controllers/chatController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get("/token", authenticate, getChatToken);
router.post("/channel", authenticate, createOrGetChannel);

export default router;
