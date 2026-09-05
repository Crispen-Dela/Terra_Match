import { Router } from "express";
import {
  placeBid,
  listBidsForLand,
  getMyBids,
  getReceivedBids,
  getBidDetail,
  updateBidStatus,
  streamBids,
} from "../controllers/bidController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// Real-time Server-Sent Events stream (must be before :landId wildcard)
router.get("/live", streamBids);

// Authenticated user bid queries
router.get("/my-bids", authenticate, getMyBids);
router.get("/received", authenticate, getReceivedBids);
router.get("/detail/:id", authenticate, getBidDetail);

// Place bid & update status
router.post("/", authenticate, placeBid);
router.patch("/:id/status", authenticate, updateBidStatus);
router.put("/:id/status", authenticate, updateBidStatus);

// Public / Authenticated bid history for a land parcel
router.get("/land/:landId", listBidsForLand);
router.get("/:landId", listBidsForLand);

export default router;
