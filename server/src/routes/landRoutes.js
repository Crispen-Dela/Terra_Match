import { Router } from "express";
import {
  listLands,
  getLandBySlug,
  getLandOwnerProfile,
  addLandOwnerReview,
  createLand,
  markLandAsSold,
  deleteLand,
} from "../controllers/landController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get("/", listLands);
router.get("/owner/:identifier", getLandOwnerProfile);
router.post("/owner/:identifier/reviews", authenticate, addLandOwnerReview);
router.post("/", authenticate, createLand);

// Owner lifecycle actions
router.patch("/:id/sold", authenticate, markLandAsSold);
router.patch("/:id/status", authenticate, markLandAsSold);
router.delete("/:id", authenticate, deleteLand);

router.get("/:slug", getLandBySlug);

export default router;
