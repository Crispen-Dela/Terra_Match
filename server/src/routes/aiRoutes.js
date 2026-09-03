import { Router } from "express";
import {
  recommendContractors,
  aiChatAssistant,
  analyzeLandEnvironment,
} from "../controllers/aiController.js";

const router = Router();

router.get("/recommend", recommendContractors);
router.post("/recommend", recommendContractors);
router.post("/chat", aiChatAssistant);
router.get("/land-analysis", analyzeLandEnvironment);

export default router;
