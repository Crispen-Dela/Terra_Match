import { Router } from "express";
import {
  listContractors,
  getContractorBySlug,
  getMyProfile,
  getProfileStatus,
  updateMyProfile,
  addProject,
  updateProject,
  deleteProject,
  addContractorReview,
} from "../controllers/contractorController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get("/", listContractors);
router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);
router.get("/status", authenticate, getProfileStatus);

// Portfolio project routes
router.post("/projects", authenticate, addProject);
router.put("/projects/:projectId", authenticate, updateProject);
router.delete("/projects/:projectId", authenticate, deleteProject);

router.get("/:slug", getContractorBySlug);
router.post("/:contractorId/reviews", authenticate, addContractorReview);

export default router;

