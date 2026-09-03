import { Router } from "express";
import {
  listLands,
  getLandBySlug,
  getLandOwnerProfile,
  addLandOwnerReview,
  createLand,
} from "../controllers/landController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get("/", listLands);
router.get("/owner/:identifier", getLandOwnerProfile);
router.post("/owner/:identifier/reviews", authenticate, addLandOwnerReview);
router.get("/:slug", getLandBySlug);
router.post("/", authenticate, createLand);

export default router;
