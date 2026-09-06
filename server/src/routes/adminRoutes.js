import { Router } from "express";
import {
  getAdminStats,
  listAllUsers,
  updateUserStatus,
  deleteUser,
  listVerifications,
  reviewVerification,
  updateLandStatus,
  deleteLand,
  listLands,
  listBids,
  deleteBid,
  listProjects,
  deleteProject,
  listAuditLogs,
  listChats,
  getChatMessages,
  listSupportTickets,
  updateSupportTicketStatus,
  replyToSupportTicket,
  listNotifications,
  markNotificationRead,
} from "../controllers/adminController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";

const router = Router();

// Strict security: all admin routes require both valid authentication and role ADMIN
router.use(authenticate, requireAdmin);

router.get("/stats", getAdminStats);
router.get("/users", listAllUsers);
router.put("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);
router.get("/verifications", listVerifications);
router.post("/verifications/:id/review", reviewVerification);
router.put("/lands/:id/status", updateLandStatus);
router.delete("/lands/:id", deleteLand);
router.get("/lands", listLands);
router.get("/bids", listBids);
router.delete("/bids/:id", deleteBid);
router.get("/projects", listProjects);
router.delete("/projects/:id", deleteProject);
router.get("/logs", listAuditLogs);

// Chat Moderation
router.get("/chats", listChats);
router.get("/chats/:id/messages", getChatMessages);

// Support System
router.get("/support", listSupportTickets);
router.put("/support/:id/status", updateSupportTicketStatus);
router.post("/support/:id/reply", replyToSupportTicket);

// Notifications
router.get("/notifications", listNotifications);
router.put("/notifications/:id/read", markNotificationRead);

export default router;
