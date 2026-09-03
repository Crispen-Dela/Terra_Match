import express from 'express';
import { getUserNotifications, markAsRead } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Both routes protected so only logged-in users can access notifications
router.get('/:userId', authenticate, getUserNotifications);
router.put('/:notificationId/read', authenticate, markAsRead);

export default router;
