import crypto from "crypto";
import prisma from "../config/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { bidEvents } from "../config/events.js";
import { streamServerClient, upsertStreamUser } from "../config/stream.js";

/**
 * 1. Place a new bid on a land listing
 * Transactional, validates buyer, ownership, amounts, auction timing.
 */
export async function placeBid(req, res, next) {
  try {
    const landId = req.body.landId || req.query.landId;
    const amount = parseFloat(req.body.amount || req.query.amount);

    if (!landId || isNaN(amount) || amount <= 0) {
      throw new AppError("A valid land ID and bid amount (in GHS) are required.", 400);
    }

    const land = await prisma.landListing.findFirst({
      where: {
        OR: [{ id: landId }, { slug: landId }],
      },
      include: { owner: true },
    });

    if (!land) {
      throw new AppError("Land listing not found.", 404);
    }

    if (land.status !== "ACTIVE") {
      throw new AppError(`This land is not open for bidding (status: ${land.status}).`, 400);
    }

    if (land.auctionEndsAt && new Date() > new Date(land.auctionEndsAt)) {
      throw new AppError("This auction has closed.", 400);
    }

    if (land.ownerId === req.user.id) {
      throw new AppError("Land owners cannot place bids on their own land listing.", 400);
    }

    const minRequired = land.minNextBid || land.totalPrice;
    if (amount < minRequired) {
      throw new AppError(
        `Bid amount too low. The minimum next bid is GH₵${minRequired.toLocaleString()}.`,
        400
      );
    }

    // Atomic transaction for bid placement & status updates
    const result = await prisma.$transaction(async (tx) => {
      // Mark prior active bids as OUTBID so they remain in permanent history
      await tx.landBid.updateMany({
        where: { landId: land.id, status: "ACTIVE" },
        data: { status: "OUTBID" },
      });

      // Create new active bid
      const newBid = await tx.landBid.create({
        data: {
          landId: land.id,
          bidderId: req.user.id,
          amount,
          status: "ACTIVE",
        },
        include: {
          bidder: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              ghanaCardVerified: true,
            },
          },
        },
      });

      const nextMin = amount + (land.bidIncrement || 5000);

      // Update land listing current bid and counter
      const updatedLand = await tx.landListing.update({
        where: { id: land.id },
        data: {
          currentBid: amount,
          minNextBid: nextMin,
          bidsCount: { increment: 1 },
        },
      });

      // Create in-app notification for the land owner in PostgreSQL
      try {
        await tx.notification.create({
          data: {
            recipientId: land.ownerId,
            role: "LAND_OWNER",
            type: "LAND_BID_UPDATE",
            message: `${req.user.name} placed a bid of GH₵${amount.toLocaleString()} on your land "${land.title}".`,
          },
        });
      } catch (notifErr) {
        console.warn("Notification create warning:", notifErr.message);
      }

      return { newBid, updatedLand };
    });

    const formattedBid = {
      id: result.newBid.id,
      landId: land.id,
      landSlug: land.slug,
      landTitle: land.title,
      bidderId: req.user.id,
      bidderName: req.user.name,
      verified: Boolean(req.user.ghanaCardVerified),
      amount: result.newBid.amount,
      status: result.newBid.status,
      createdAt: result.newBid.createdAt,
      updatedAt: result.newBid.updatedAt,
      dateLabel: new Date(result.newBid.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    // Broadcast real-time event to SSE listeners
    bidEvents.broadcast({
      type: "BID_PLACED",
      landId: land.id,
      landSlug: land.slug,
      bid: formattedBid,
      currentBid: result.updatedLand.currentBid,
      minNextBid: result.updatedLand.minNextBid,
      bidsCount: result.updatedLand.bidsCount,
      ownerId: land.ownerId,
      bidderId: req.user.id,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      message: "Bid placed successfully.",
      bid: formattedBid,
      currentBid: result.updatedLand.currentBid,
      minNextBid: result.updatedLand.minNextBid,
      bidsCount: result.updatedLand.bidsCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Get all bids for a specific land listing (sorted newest first)
 */
export async function listBidsForLand(req, res, next) {
  try {
    const { landId } = req.params;

    const land = await prisma.landListing.findFirst({
      where: {
        OR: [{ id: landId }, { slug: landId }],
      },
    });

    if (!land) {
      throw new AppError("Land listing not found.", 404);
    }

    const bids = await prisma.landBid.findMany({
      where: { landId: land.id },
      orderBy: { createdAt: "desc" },
      include: {
        bidder: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            ghanaCardVerified: true,
          },
        },
      },
    });

    res.json(
      bids.map((b) => ({
        id: b.id,
        landId: b.landId,
        landSlug: land.slug,
        bidderId: b.bidderId,
        bidderName: b.bidder.name,
        verified: Boolean(b.bidder.ghanaCardVerified),
        amount: b.amount,
        status: b.status,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        dateLabel: new Date(b.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      }))
    );
  } catch (error) {
    next(error);
  }
}

/**
 * 3. Get all bids made by the authenticated buyer
 */
export async function getMyBids(req, res, next) {
  try {
    const bids = await prisma.landBid.findMany({
      where: { bidderId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        land: {
          select: {
            id: true,
            slug: true,
            title: true,
            district: true,
            region: true,
            totalPrice: true,
            buyNowPrice: true,
            currentBid: true,
            minNextBid: true,
            images: true,
            status: true,
            owner: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
      },
    });

    res.json(
      bids.map((b) => ({
        id: b.id,
        landId: b.landId,
        land: b.land,
        amount: b.amount,
        status: b.status,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        dateLabel: new Date(b.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      }))
    );
  } catch (error) {
    next(error);
  }
}

/**
 * 4. Get all bids received by the authenticated land owner
 */
export async function getReceivedBids(req, res, next) {
  try {
    const bids = await prisma.landBid.findMany({
      where: {
        land: { ownerId: req.user.id },
      },
      orderBy: { createdAt: "desc" },
      include: {
        land: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            district: true,
            region: true,
            totalPrice: true,
            buyNowPrice: true,
            currentBid: true,
            status: true,
          },
        },
        bidder: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            ghanaCardVerified: true,
          },
        },
      },
    });

    res.json(
      bids.map((b) => ({
        id: b.id,
        landId: b.landId,
        landTitle: b.land.title,
        landSlug: b.land.slug,
        landCategory: b.land.category,
        buyNowPrice: b.land.buyNowPrice,
        bidderId: b.bidderId,
        bidder: b.bidder,
        amount: b.amount,
        status: b.status,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        dateLabel: new Date(b.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      }))
    );
  } catch (error) {
    next(error);
  }
}

/**
 * 5. Get individual bid details
 */
export async function getBidDetail(req, res, next) {
  try {
    const { id } = req.params;
    const bid = await prisma.landBid.findUnique({
      where: { id },
      include: {
        land: { include: { owner: true } },
        bidder: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            ghanaCardVerified: true,
          },
        },
      },
    });

    if (!bid) {
      throw new AppError("Bid not found.", 404);
    }

    // Only bidder, land owner, or admin can view private details
    if (
      bid.bidderId !== req.user.id &&
      bid.land.ownerId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      throw new AppError("Unauthorized to view this bid detail.", 403);
    }

    res.json({
      id: bid.id,
      landId: bid.landId,
      landTitle: bid.land.title,
      landSlug: bid.land.slug,
      bidderId: bid.bidderId,
      bidder: bid.bidder,
      amount: bid.amount,
      status: bid.status,
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

async function sendDirectMessageHelper({ senderUser, recipientUser, land, text }) {
  if (!senderUser || !recipientUser || !text) return;

  // 1. Send via Stream Chat Channel & Message
  if (streamServerClient) {
    try {
      await upsertStreamUser(senderUser);
      await upsertStreamUser(recipientUser);

      const members = [senderUser.id, recipientUser.id].sort();
      const rawKey = `direct_${members.join("_")}`;
      const hash = crypto.createHash("md5").update(rawKey).digest("hex");
      const channelId = `tm_${hash}`;

      const channelData = {
        members,
        created_by_id: senderUser.id,
        name: land ? `Inquiry: ${land.title}` : `${senderUser.name} & ${recipientUser.name}`,
        landId: land?.id,
        landTitle: land?.title,
        landSlug: land?.slug,
        landPrice: land?.buyNowPrice || land?.totalPrice,
        landLocation: land?.address,
      };

      const channel = streamServerClient.channel("messaging", channelId, channelData);
      await channel.create();
      await channel.sendMessage({
        text: text.trim(),
        user_id: senderUser.id,
      });
    } catch (err) {
      console.warn("Stream Chat DM error:", err.message);
    }
  }

  // 2. Persist in PostgreSQL via Prisma Conversation & Message
  try {
    let conv = await prisma.conversation.findFirst({
      where: {
        OR: [
          { buyerId: recipientUser.id, sellerId: senderUser.id },
          { buyerId: senderUser.id, sellerId: recipientUser.id },
        ],
      },
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          buyerId: recipientUser.id,
          sellerId: senderUser.id,
          landId: land?.id || null,
        },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: {
          lastMessageAt: new Date(),
          ...(land?.id ? { landId: land.id } : {}),
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: senderUser.id,
        body: text.trim(),
      },
    });
  } catch (err) {
    console.warn("Prisma conversation error:", err.message);
  }
}

/**
 * 6. Update bid status (ACCEPTED | REJECTED | WITHDRAWN)
 */
export async function updateBidStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["ACTIVE", "PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"];
    if (!status || !validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const bid = await prisma.landBid.findUnique({
      where: { id },
      include: {
        land: {
          include: {
            owner: true,
          },
        },
        bidder: true,
      },
    });

    if (!bid) {
      throw new AppError("Bid not found.", 404);
    }

    // Check actionable status: prevent repeated accept/reject or contradictory actions
    if (bid.status === "ACCEPTED" || bid.status === "REJECTED" || bid.status === "WITHDRAWN") {
      throw new AppError(`This bid has already been ${bid.status.toLowerCase()} and cannot be modified.`, 400);
    }

    // Authorization checks
    if (status === "ACCEPTED" || status === "REJECTED") {
      if (bid.land.ownerId !== req.user.id && req.user.role !== "ADMIN") {
        throw new AppError("Only the land owner can accept or reject bids on this listing.", 403);
      }
    } else if (status === "WITHDRAWN") {
      if (bid.bidderId !== req.user.id && req.user.role !== "ADMIN") {
        throw new AppError("Only the bidder can withdraw their bid.", 403);
      }
    }

    // Update bid in PostgreSQL
    const updatedBid = await prisma.$transaction(async (tx) => {
      const uBid = await tx.landBid.update({
        where: { id },
        data: { status },
        include: {
          bidder: {
            select: { id: true, name: true, email: true, phone: true, avatarUrl: true, ghanaCardVerified: true },
          },
        },
      });

      if (status === "ACCEPTED") {
        // Update land currentBid to reflect accepted bid
        await tx.landListing.update({
          where: { id: bid.landId },
          data: { currentBid: bid.amount },
        });

        // Notify bidder of acceptance
        try {
          await tx.notification.create({
            data: {
              recipientId: bid.bidderId,
              role: "CLIENT",
              type: "LAND_BID_UPDATE",
              message: `Congratulations! Your bid of GH₵${bid.amount.toLocaleString()} on "${bid.land.title}" was accepted by the seller.`,
            },
          });
        } catch (notifErr) {
          console.warn("Notification error:", notifErr.message);
        }
      } else if (status === "REJECTED") {
        // Notify bidder of rejection
        try {
          await tx.notification.create({
            data: {
              recipientId: bid.bidderId,
              role: "CLIENT",
              type: "LAND_BID_UPDATE",
              message: `Your bid of GH₵${bid.amount.toLocaleString()} on "${bid.land.title}" was declined by the seller.`,
            },
          });
        } catch (notifErr) {
          console.warn("Notification error:", notifErr.message);
        }
      }

      return uBid;
    });

    // Send a DM to the PARTICULAR bidder who made that bid using TerraMatch's chat infrastructure
    let dmText = "";
    if (status === "ACCEPTED") {
      dmText = `Bid of GHS ${bid.amount.toLocaleString()} has been accepted.`;
    } else if (status === "REJECTED") {
      dmText = `Bid of GHS ${bid.amount.toLocaleString()} has been rejected.`;
    }

    if (dmText && bid.bidder) {
      await sendDirectMessageHelper({
        senderUser: req.user,
        recipientUser: bid.bidder,
        land: bid.land,
        text: dmText,
      });
    }

    const formattedBid = {
      id: updatedBid.id,
      landId: bid.landId,
      landSlug: bid.land.slug,
      landTitle: bid.land.title,
      bidderId: bid.bidderId,
      bidderName: updatedBid.bidder?.name || bid.bidder?.name,
      verified: Boolean(updatedBid.bidder?.ghanaCardVerified),
      amount: updatedBid.amount,
      status: updatedBid.status,
      createdAt: updatedBid.createdAt,
      updatedAt: updatedBid.updatedAt,
      dateLabel: new Date(updatedBid.updatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    // Broadcast status change real-time event
    bidEvents.broadcast({
      type: "BID_STATUS_CHANGED",
      landId: bid.landId,
      landSlug: bid.land.slug,
      bid: formattedBid,
      status: updatedBid.status,
      ownerId: bid.land.ownerId,
      bidderId: bid.bidderId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: `Bid status updated to ${status}.`,
      bid: formattedBid,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 7. Server-Sent Events (SSE) stream for real-time bid updates
 */
export function streamBids(req, res) {
  bidEvents.handleSSEConnection(req, res);
}

