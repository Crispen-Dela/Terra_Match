import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserNotifications = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Make sure users can only fetch their own notifications (basic authorization)
    if (req.user && req.user.id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to view these notifications' });
    }

    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent 50
    });

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

// --- Helper Functions for Generating Notifications ---

export const createNotification = async ({ recipientId, role, message, type }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        role,
        message,
        type,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw so it doesn't break the main flow (e.g. bidding)
  }
};
