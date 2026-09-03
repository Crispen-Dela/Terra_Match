import { Router } from "express";
import { placeBid, listBidsForLand } from "../controllers/bidController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.post("/", authenticate, placeBid);
router.get("/:landId", authenticate, listBidsForLand);

export default router;
