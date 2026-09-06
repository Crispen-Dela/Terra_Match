import crypto from "crypto";
import prisma from "../config/prisma.js";
import { streamServerClient, upsertStreamUser, createStreamToken } from "../config/stream.js";
import { bidEvents } from "../config/events.js";
import { AppError } from "../middlewares/errorHandler.js";

function slugify(text) {
  return text
    ? text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    : "";
}

export async function getChatToken(req, res, next) {
  try {
    if (!streamServerClient) {
      throw new AppError("Stream Chat is not configured on the server.", 500);
    }

    const user = req.user;
    await upsertStreamUser(user);
    const token = createStreamToken(user.id);

    res.json({
      apiKey: process.env.STREAM_API_KEY,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrGetChannel(req, res, next) {
  try {
    if (!streamServerClient) {
      throw new AppError("Stream Chat is not configured on the server.", 500);
    }

    const { targetUserId, targetSlug, landId, projectId, initialMessage } = req.body;
    let resolvedTargetUserId = targetUserId || null;
    let targetLand = null;
    let targetProject = null;

    const isSupportRequest =
      targetUserId === "support" || targetSlug === "support" || req.body.isSupport === true;

    if (isSupportRequest) {
      const adminUser =
        (await prisma.user.findFirst({
          where: { role: "ADMIN", id: { not: req.user.id } },
        })) ||
        (await prisma.user.findFirst({ where: { role: "ADMIN" } })) ||
        (await prisma.user.findFirst({ where: { id: { not: req.user.id } } }));
      if (adminUser) {
        targetUser = adminUser;
        resolvedTargetUserId = adminUser.id;
      }
    }

    if (landId && !isSupportRequest) {
      targetLand = await prisma.landListing.findFirst({
        where: { OR: [{ id: landId }, { slug: landId }] },
        include: { owner: true },
      });
      // If no explicit targetUserId provided, resolve to the land owner
      if (targetLand && !resolvedTargetUserId) {
        if (targetLand.ownerId === req.user.id) {
          throw new AppError("Land owners cannot initiate an inquiry on their own land listing without selecting a buyer/bidder.", 400);
        }
        resolvedTargetUserId = targetLand.ownerId;
      }
    }

    if (projectId && !isSupportRequest) {
      targetProject = await prisma.constructionProject.findFirst({
        where: { OR: [{ id: projectId }, { slug: projectId }] },
        include: { client: true },
      });
      // If no explicit targetUserId provided, resolve to the project client
      if (targetProject && !resolvedTargetUserId) {
        resolvedTargetUserId = targetProject.clientId;
      }
    }

    if (!resolvedTargetUserId && targetSlug && !isSupportRequest) {
      // Find user by slug/name or contractor profile
      const allUsers = await prisma.user.findMany({
        include: { contractorProfile: true, landListings: true },
      });
      const match = allUsers.find(
        (u) =>
          u.id === targetSlug ||
          slugify(u.name) === targetSlug.toLowerCase() ||
          (u.contractorProfile && slugify(u.contractorProfile.companyName) === targetSlug.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === targetSlug.toLowerCase())
      );
      if (match) {
        resolvedTargetUserId = match.id;
      }
    }

    // Resolve targetUser from Prisma flexibly by ID, email, name, or slug
    if (!targetUser && resolvedTargetUserId && resolvedTargetUserId !== req.user.id) {
      targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: resolvedTargetUserId },
            { email: { equals: resolvedTargetUserId, mode: "insensitive" } },
            { name: { equals: resolvedTargetUserId, mode: "insensitive" } },
          ],
        },
        include: { contractorProfile: true },
      });

      if (!targetUser) {
        const allUsers = await prisma.user.findMany({
          include: { contractorProfile: true },
        });
        targetUser = allUsers.find(
          (u) =>
            u.id === resolvedTargetUserId ||
            slugify(u.name) === slugify(resolvedTargetUserId) ||
            (u.contractorProfile && slugify(u.contractorProfile.companyName) === slugify(resolvedTargetUserId)) ||
            (u.email && u.email.toLowerCase() === resolvedTargetUserId.toLowerCase())
        );
      }
    }

    // Fallback to active admin/support user if no valid target or target is self
    if (!targetUser || targetUser.id === req.user.id) {
      const supportUser =
        (await prisma.user.findFirst({
          where: {
            role: "ADMIN",
            id: { not: req.user.id },
          },
        })) ||
        (await prisma.user.findFirst({
          where: { id: { not: req.user.id } },
        }));
      if (supportUser) {
        targetUser = supportUser;
        resolvedTargetUserId = supportUser.id;
      }
    }

    if (!targetUser || targetUser.id === req.user.id) {
      throw new AppError("Cannot create a conversation with yourself.", 400);
    }

    resolvedTargetUserId = targetUser.id;

    // Ensure target user and current user are synced to Stream
    await upsertStreamUser(targetUser);
    await upsertStreamUser(req.user);

    const isSupport = isSupportRequest || targetUser.role === "ADMIN" || req.user.role === "ADMIN";
    const supportClientUserId = req.user.role === "ADMIN" ? targetUser.id : req.user.id;

    // UNIQUE CHANNEL ID: Derived ONLY from sorted member IDs or dedicated support channel
    const members = [req.user.id, resolvedTargetUserId].sort();
    const rawKey = `direct_${members.join("_")}`;
    const hash = crypto.createHash("md5").update(rawKey).digest("hex");
    const channelId = isSupport ? `support_${supportClientUserId}` : `tm_${hash}`;

    const channelData = {
      members,
      created_by_id: req.user.id,
      name: isSupport
        ? "Support (Admin)"
        : targetLand
        ? `Inquiry: ${targetLand.title}`
        : targetProject
        ? `Project: ${targetProject.title}`
        : `${req.user.name} & ${targetUser?.name || "User"}`,
      isSupport: Boolean(isSupport),
      supportUserId: isSupport ? supportClientUserId : undefined,
      landId: targetLand ? targetLand.id : undefined,
      landTitle: targetLand ? targetLand.title : undefined,
      landSlug: targetLand ? targetLand.slug : undefined,
      landPrice: targetLand ? targetLand.buyNowPrice || targetLand.totalPrice : undefined,
      landLocation: targetLand ? targetLand.address : undefined,
      landImage: targetLand && Array.isArray(targetLand.images) && targetLand.images[0] ? targetLand.images[0] : undefined,
      projectId: targetProject ? targetProject.id : undefined,
      projectTitle: targetProject ? targetProject.title : undefined,
      projectLocation: targetProject ? targetProject.location : undefined,
      projectBudget: targetProject ? targetProject.budgetRange : undefined,
    };

    const channel = streamServerClient.channel("messaging", channelId, channelData);
    await channel.create();

    // Update channel metadata with current inquiry context
    try {
      const updateData = { ...channelData };
      delete updateData.members;
      delete updateData.created_by_id;
      await channel.updatePartial({ set: updateData });
    } catch (e) {
      console.warn("Channel partial update warning:", e.message);
    }

    // Sync Prisma conversation record
    let prismaConv = null;
    try {
      prismaConv = await prisma.conversation.findFirst({
        where: {
          OR: [
            { buyerId: req.user.id, sellerId: resolvedTargetUserId },
            { buyerId: resolvedTargetUserId, sellerId: req.user.id },
          ],
          ...(isSupport ? { landId: null, projectId: null } : {}),
        },
      });

      if (!prismaConv) {
        prismaConv = await prisma.conversation.create({
          data: {
            buyerId: req.user.id,
            sellerId: resolvedTargetUserId,
            landId: !isSupport && targetLand ? targetLand.id : null,
            projectId: !isSupport && targetProject ? targetProject.id : null,
          },
        });
      } else {
        prismaConv = await prisma.conversation.update({
          where: { id: prismaConv.id },
          data: {
            lastMessageAt: new Date(),
            ...(!isSupport && targetProject ? { projectId: targetProject.id } : {}),
            ...(!isSupport && targetLand ? { landId: targetLand.id } : {}),
          },
        });
      }
    } catch (e) {
      console.warn("Prisma conversation sync warning:", e.message);
    }

    if (initialMessage && initialMessage.trim()) {
      await channel.sendMessage({
        text: initialMessage.trim(),
        user_id: req.user.id,
      });

      if (prismaConv) {
        try {
          await prisma.message.create({
            data: {
              conversationId: prismaConv.id,
              senderId: req.user.id,
              body: initialMessage.trim(),
              isRead: false,
            },
          });
        } catch (msgErr) {
          console.warn("Prisma message create error:", msgErr.message);
        }
      }

      if (isSupport && req.user.role !== "ADMIN") {
        bidEvents.broadcast({
          type: "SUPPORT_MESSAGE_RECEIVED",
          conversationId: prismaConv?.id,
          userId: req.user.id,
          userName: req.user.name,
          userEmail: req.user.email,
          userRole: req.user.role,
          message: initialMessage.trim(),
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.status(201).json({
      channelId: channel.id,
      channelCid: channel.cid,
      conversationId: prismaConv?.id,
      channel: {
        id: channel.id,
        cid: channel.cid,
        data: channel.data,
      },
    });
  } catch (error) {
    next(error);
  }
}
