import { Router } from "express";
import { getDashboardData, updateSubscriptionPlan } from "../controllers/dashboardController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get("/", authenticate, getDashboardData);
router.post("/plan", authenticate, updateSubscriptionPlan);

export default router;
