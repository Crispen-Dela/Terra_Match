import { Router } from "express";
import {
  listProjects,
  getProjectBySlug,
  createProject,
  submitProjectBid,
} from "../controllers/projectController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get("/", listProjects);
router.get("/:slug", getProjectBySlug);
router.post("/", authenticate, createProject);
router.post("/:projectId/bids", authenticate, submitProjectBid);

export default router;
