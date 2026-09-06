import prisma from "../config/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { streamServerClient, upsertStreamUser } from "../config/stream.js";
import { bidEvents } from "../config/events.js";

export async function startOrGetConversation(req, res, next) {
  try {
    const { landId, projectId, recipientId, initialMessage } = req.body;

    let targetSellerId = recipientId;
    let targetLand = null;
    let targetProject = null;

    if (landId) {
      targetLand = await prisma.landListing.findFirst({
        where: { OR: [{ id: landId }, { slug: landId }] },
        include: { owner: true },
      });
      if (targetLand) {
        if (targetLand.ownerId === req.user.id) {
          throw new AppError("Land owners cannot purchase or initiate purchase inquiries on their own land listing.", 400);
        }
        targetSellerId = targetLand.ownerId;
      }
    }

    if (projectId) {
      targetProject = await prisma.constructionProject.findFirst({
        where: { OR: [{ id: projectId }, { slug: projectId }] },
        include: { client: true },
      });
      if (targetProject) {
        targetSellerId = targetProject.clientId;
      }
    }

    if (!targetSellerId) {
      // Fallback to any active land owner / admin if not specified
      const fallbackUser = await prisma.user.findFirst({
        where: { role: "LAND_OWNER" },
      });
      targetSellerId = fallbackUser ? fallbackUser.id : req.user.id;
    }

    if (targetSellerId === req.user.id) {
      throw new AppError("Cannot start a conversation with yourself.", 400);
    }

    // UNIQUE CONVERSATION RULE: Check for ANY existing thread between buyer and seller regardless of landId
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { buyerId: req.user.id, sellerId: targetSellerId },
          { buyerId: targetSellerId, sellerId: req.user.id },
        ],
      },
      include: {
        land: true,
        project: true,
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, name: true } } },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    if (conversation) {
      // Update landId or projectId context if provided on the existing thread
      if (targetLand || targetProject) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            landId: targetLand ? targetLand.id : conversation.landId,
            projectId: targetProject ? targetProject.id : conversation.projectId,
          },
        });
      }

      // Add the new message to the existing conversation instead of creating a duplicate thread
      if (initialMessage && initialMessage.trim()) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: req.user.id,
            body: initialMessage.trim(),
          },
        });
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        });
      }

      // Re-fetch conversation with all updated messages
      conversation = await prisma.conversation.findUnique({
        where: { id: conversation.id },
        include: {
          land: true,
          project: true,
          buyer: { select: { id: true, name: true, avatarUrl: true } },
          seller: { select: { id: true, name: true, avatarUrl: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { id: true, name: true } } },
          },
        },
      });
    } else {
      // Create a brand new single conversation between buyer and seller
      conversation = await prisma.conversation.create({
        data: {
          buyerId: req.user.id,
          sellerId: targetSellerId,
          landId: targetLand ? targetLand.id : null,
          projectId: targetProject ? targetProject.id : null,
          messages: initialMessage
            ? {
                create: {
                  senderId: req.user.id,
                  body: initialMessage.trim(),
                },
              }
            : undefined,
        },
        include: {
          land: true,
          project: true,
          buyer: { select: { id: true, name: true, avatarUrl: true } },
          seller: { select: { id: true, name: true, avatarUrl: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { id: true, name: true } } },
          },
        },
      });
    }

    res.status(201).json(formatConversationDetail(conversation, req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function listConversations(req, res, next) {
  try {
    const rawConversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }],
      },
      include: {
        land: true,
        project: true,
        buyer: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        seller: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Deduplicate and consolidate pre-existing duplicate conversation records per other party
    const conversationsByParty = new Map();

    for (const c of rawConversations) {
      const otherParty = c.buyerId === req.user.id ? c.seller : c.buyer;
      if (!otherParty) continue;

      const key = `${otherParty.id}_${c.landId || "none"}_${c.projectId || "none"}`;
      if (!conversationsByParty.has(key)) {
        conversationsByParty.set(key, c);
      } else {
        // Merge duplicate thread: move messages to primary conversation and delete duplicate thread
        const primary = conversationsByParty.get(key);
        try {
          await prisma.message.updateMany({
            where: { conversationId: c.id },
            data: { conversationId: primary.id },
          });
          await prisma.conversation.delete({
            where: { id: c.id },
          });
        } catch (mergeErr) {
          console.warn("Could not merge duplicate conversation record:", mergeErr);
        }
      }
    }

    const conversations = Array.from(conversationsByParty.values());

    const summaries = await Promise.all(
      conversations.map(async (c) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: req.user.id },
            isRead: false,
          },
        });

        const otherParty = c.buyerId === req.user.id ? c.seller : c.buyer;
        const isSupport =
          otherParty?.role === "ADMIN" ||
          (c.landId == null && c.projectId == null && (c.buyer?.role === "ADMIN" || c.seller?.role === "ADMIN"));

        const lastMsg = await prisma.message.findFirst({
          where: { conversationId: c.id },
          orderBy: { createdAt: "desc" },
        });

        return {
          id: c.id,
          landId: c.landId,
          landTitle: c.land ? c.land.title : c.project ? c.project.title : isSupport ? "Support Inquiry" : null,
          isSupport: Boolean(isSupport),
          type: isSupport ? "SUPPORT" : "DIRECT",
          otherPartyId: isSupport ? "support" : otherParty.id,
          otherPartyName: isSupport ? "Support (Admin)" : otherParty.name,
          otherPartyRole: isSupport ? "ADMIN" : otherParty.role,
          otherPartyAvatarUrl: otherParty.avatarUrl,
          lastMessageText: lastMsg ? lastMsg.body : "",
          lastMessageAt: lastMsg ? lastMsg.createdAt : c.lastMessageAt,
          unreadCount,
        };
      })
    );

    res.json(summaries);
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req, res, next) {
  try {
    const { id } = req.params;

    if (id === "support") {
      return getSupportConversation(req, res, next);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        land: true,
        project: true,
        buyer: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        seller: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!conversation) {
      throw new AppError("Conversation not found.", 404);
    }

    if (conversation.buyerId !== req.user.id && conversation.sellerId !== req.user.id) {
      throw new AppError("Access denied to this conversation.", 403);
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: req.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json(formatConversationDetail(conversation, req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { body, message: altMessage } = req.body;
    const textToSend = (body || altMessage || "").trim();

    if (!textToSend) {
      throw new AppError("Message body is required.", 400);
    }

    if (id === "support") {
      req.body.message = textToSend;
      return sendSupportMessage(req, res, next);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, role: true } },
        seller: { select: { id: true, name: true, role: true } },
      },
    });

    if (!conversation) {
      throw new AppError("Conversation not found.", 404);
    }

    if (conversation.buyerId !== req.user.id && conversation.sellerId !== req.user.id) {
      throw new AppError("Access denied.", 403);
    }

    const otherParty = conversation.buyerId === req.user.id ? conversation.seller : conversation.buyer;
    const isSupport =
      otherParty?.role === "ADMIN" ||
      (conversation.landId == null && conversation.projectId == null && (conversation.buyer?.role === "ADMIN" || conversation.seller?.role === "ADMIN"));

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: req.user.id,
        body: textToSend,
        isRead: false,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    // Stream Chat sync
    if (streamServerClient) {
      try {
        const channelId = isSupport ? `support_${req.user.role === "ADMIN" ? otherParty.id : req.user.id}` : undefined;
        if (channelId) {
          const channel = streamServerClient.channel("messaging", channelId);
          await channel.sendMessage({
            text: textToSend,
            user_id: req.user.id,
          });
        }
      } catch (streamErr) {
        console.warn("Stream sync warning:", streamErr.message);
      }
    }

    // If message is sent from user to Admin in a Support conversation, broadcast SSE
    if (isSupport && req.user.role !== "ADMIN") {
      bidEvents.broadcast({
        type: "SUPPORT_MESSAGE_RECEIVED",
        conversationId: conversation.id,
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email,
        userRole: req.user.role,
        message: textToSend,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      id: message.id,
      senderId: message.senderId,
      sender: "me",
      senderName: "You",
      body: message.body,
      text: message.body,
      isRead: message.isRead,
      createdAt: message.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// USER SUPPORT CHAT ENDPOINTS
// ==========================================

export async function getSupportConversation(req, res, next) {
  try {
    const admin =
      (await prisma.user.findFirst({
        where: { role: "ADMIN", id: { not: req.user.id } },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      })) ||
      (await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      }));

    if (!admin) {
      return res.json({
        id: "support",
        isSupport: true,
        type: "SUPPORT",
        otherPartyId: "support",
        otherPartyName: "Support (Admin)",
        otherPartyRole: "ADMIN",
        messages: [],
      });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { buyerId: req.user.id, sellerId: admin.id },
          { buyerId: admin.id, sellerId: req.user.id },
        ],
        landId: null,
        projectId: null,
      },
      include: {
        buyer: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        seller: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!conversation) {
      return res.json({
        id: null,
        isSupport: true,
        type: "SUPPORT",
        otherPartyId: "support",
        otherPartyName: "Support (Admin)",
        otherPartyRole: "ADMIN",
        messages: [],
      });
    }

    // Mark admin messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: admin.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.json(formatConversationDetail(conversation, req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function sendSupportMessage(req, res, next) {
  try {
    const { message, body, initialMessage } = req.body;
    const messageText = (message || body || initialMessage || "").trim();

    if (!messageText) {
      throw new AppError("Message is required.", 400);
    }

    let admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!admin) {
      admin = await prisma.user.findFirst({
        where: { id: { not: req.user.id } },
      });
    }

    if (!admin) {
      throw new AppError("No support recipient found.", 500);
    }

    // Find or create single persistent conversation with Admin
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { buyerId: req.user.id, sellerId: admin.id },
          { buyerId: admin.id, sellerId: req.user.id },
        ],
        landId: null,
        projectId: null,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          buyerId: req.user.id,
          sellerId: admin.id,
          landId: null,
          projectId: null,
        },
      });
    }

    const newMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.id,
        body: messageText,
        isRead: false,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Stream Chat sync
    const channelId = `support_${req.user.id}`;
    if (streamServerClient) {
      try {
        await upsertStreamUser(req.user);
        await upsertStreamUser(admin);

        const channel = streamServerClient.channel("messaging", channelId, {
          name: "Support (Admin)",
          isSupport: true,
          supportUserId: req.user.id,
          members: [req.user.id, admin.id],
        });
        await channel.create();
        await channel.sendMessage({
          text: messageText,
          user_id: req.user.id,
        });
      } catch (streamErr) {
        console.warn("Stream support sync warning:", streamErr.message);
      }
    }

    // In-app notification for Admin
    try {
      await prisma.notification.create({
        data: {
          recipientId: admin.id,
          role: "ADMIN",
          type: "SUPPORT_MESSAGE",
          message: `Support message from ${req.user.name} (${req.user.email}): "${messageText.length > 60 ? messageText.slice(0, 57) + "..." : messageText}"`,
        },
      });
    } catch (notifErr) {
      // ignore
    }

    // Broadcast SSE to live Admin dashboards
    bidEvents.broadcast({
      type: "SUPPORT_MESSAGE_RECEIVED",
      conversationId: conversation.id,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      message: messageText,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: newMsg,
      conversationId: conversation.id,
      channelId,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }],
        },
        senderId: { not: req.user.id },
        isRead: false,
      },
    });

    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
}

function formatConversationDetail(c, currentUserId) {
  const otherParty = c.buyerId === currentUserId ? c.seller : c.buyer;
  const isSupport =
    otherParty?.role === "ADMIN" ||
    (c.landId == null && c.projectId == null && (c.buyer?.role === "ADMIN" || c.seller?.role === "ADMIN"));

  return {
    id: c.id,
    landId: c.landId,
    landTitle: c.land?.title || c.project?.title || (isSupport ? "Support Inquiry" : null),
    isSupport: Boolean(isSupport),
    type: isSupport ? "SUPPORT" : "DIRECT",
    otherPartyId: isSupport ? "support" : otherParty?.id || "unknown",
    otherPartyName: isSupport ? "Support (Admin)" : otherParty?.name || "User",
    otherPartyRole: isSupport ? "ADMIN" : otherParty?.role || "USER",
    otherPartyAvatarUrl: otherParty?.avatarUrl || null,
    messages: (c.messages || []).map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: isSupport && (m.sender?.role === "ADMIN" || m.senderId !== currentUserId)
        ? "Support (Admin)"
        : m.senderId === currentUserId
        ? "You"
        : (m.sender?.name || otherParty?.name || "User"),
      isAdmin: Boolean(m.sender?.role === "ADMIN" || (isSupport && m.senderId !== currentUserId)),
      sender: m.senderId === currentUserId ? "me" : "them",
      body: m.body,
      text: m.body,
      isRead: m.isRead,
      createdAt: m.createdAt,
    })),
  };
}

