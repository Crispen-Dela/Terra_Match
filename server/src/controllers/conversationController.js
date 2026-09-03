import prisma from "../config/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

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
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
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

      if (!conversationsByParty.has(otherParty.id)) {
        conversationsByParty.set(otherParty.id, c);
      } else {
        // Merge duplicate thread: move messages to primary conversation and delete duplicate thread
        const primary = conversationsByParty.get(otherParty.id);
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
        const lastMsg = await prisma.message.findFirst({
          where: { conversationId: c.id },
          orderBy: { createdAt: "desc" },
        });

        return {
          id: c.id,
          landId: c.landId,
          landTitle: c.land ? c.land.title : c.project ? c.project.title : null,
          otherPartyId: otherParty.id,
          otherPartyName: otherParty.name,
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

    const conversation = await prisma.conversation.findUnique({
      where: { id },
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
    const { body } = req.body;

    if (!body || !body.trim()) {
      throw new AppError("Message body is required.", 400);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new AppError("Conversation not found.", 404);
    }

    if (conversation.buyerId !== req.user.id && conversation.sellerId !== req.user.id) {
      throw new AppError("Access denied.", 403);
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: req.user.id,
        body: body.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    res.status(201).json(message);
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
  return {
    id: c.id,
    landId: c.landId,
    landTitle: c.land?.title || c.project?.title || null,
    otherPartyId: otherParty.id,
    otherPartyName: otherParty.name,
    messages: c.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender?.name || "",
      body: m.body,
      isRead: m.isRead,
      createdAt: m.createdAt,
    })),
  };
}
