import crypto from "crypto";
import prisma from "../config/prisma.js";
import { streamServerClient, upsertStreamUser, createStreamToken } from "../config/stream.js";
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
    let resolvedTargetUserId = targetUserId;
    let targetLand = null;
    let targetProject = null;

    if (landId) {
      targetLand = await prisma.landListing.findFirst({
        where: { OR: [{ id: landId }, { slug: landId }] },
        include: { owner: true },
      });
      if (targetLand) {
        if (targetLand.ownerId === req.user.id) {
          throw new AppError("Land owners cannot initiate a purchase conversation on their own land listing.", 400);
        }
        resolvedTargetUserId = targetLand.ownerId;
      }
    }

    if (projectId) {
      targetProject = await prisma.constructionProject.findFirst({
        where: { OR: [{ id: projectId }, { slug: projectId }] },
        include: { client: true },
      });
      if (targetProject) {
        resolvedTargetUserId = targetProject.clientId;
      }
    }

    if (!resolvedTargetUserId && targetSlug) {
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

    if (!resolvedTargetUserId) {
      // Fallback to active admin/support user
      const supportUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
      resolvedTargetUserId = supportUser ? supportUser.id : req.user.id;
    }

    if (resolvedTargetUserId === req.user.id) {
      throw new AppError("Cannot create a conversation with yourself.", 400);
    }

    // Ensure target user exists and is synced to Stream
    const targetUser = await prisma.user.findUnique({
      where: { id: resolvedTargetUserId },
    });

    if (targetUser) {
      await upsertStreamUser(targetUser);
    }

    // Ensure current user is synced to Stream
    await upsertStreamUser(req.user);

    // UNIQUE CHANNEL ID: Derived ONLY from sorted member IDs (userA_userB)
    // This guarantees strictly ONE channel per buyer/seller relationship!
    const members = [req.user.id, resolvedTargetUserId].sort();
    const rawKey = `direct_${members.join("_")}`;
    const hash = crypto.createHash("md5").update(rawKey).digest("hex");
    const channelId = `tm_${hash}`;

    const channelData = {
      members,
      created_by_id: req.user.id,
      name: targetLand ? `Inquiry: ${targetLand.title}` : targetProject ? `Project: ${targetProject.title}` : `${req.user.name} & ${targetUser?.name || "User"}`,
      landId: targetLand ? targetLand.id : undefined,
      landTitle: targetLand ? targetLand.title : undefined,
      landSlug: targetLand ? targetLand.slug : undefined,
      landPrice: targetLand ? (targetLand.buyNowPrice || targetLand.totalPrice) : undefined,
      landLocation: targetLand ? targetLand.address : undefined,
      landImage: targetLand && Array.isArray(targetLand.images) && targetLand.images[0] ? targetLand.images[0] : undefined,
      projectId: targetProject ? targetProject.id : undefined,
      projectTitle: targetProject ? targetProject.title : undefined,
    };

    const channel = streamServerClient.channel("messaging", channelId, channelData);
    await channel.create();
    
    // Update channel metadata with the current inquiry context
    try {
      await channel.updatePartial({ set: channelData });
    } catch (e) {
      console.warn("Channel partial update warning:", e.message);
    }

    if (initialMessage && initialMessage.trim()) {
      await channel.sendMessage({
        text: initialMessage.trim(),
        user_id: req.user.id,
      });
    }

    res.status(201).json({
      channelId: channel.id,
      channelCid: channel.cid,
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
