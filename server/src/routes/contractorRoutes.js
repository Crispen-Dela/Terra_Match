import { Router } from "express";
import {
  listContractors,
  getContractorBySlug,
  getMyProfile,
  updateMyProfile,
  addContractorReview,
} from "../controllers/contractorController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get("/", listContractors);
router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);
router.get("/:slug", getContractorBySlug);
router.post("/:contractorId/reviews", authenticate, addContractorReview);

export default router;
