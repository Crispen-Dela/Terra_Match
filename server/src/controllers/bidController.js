import prisma from "../config/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

export async function placeBid(req, res, next) {
  try {
    // Support both JSON body and query params (for backwards-compatibility)
    const landId = req.body.landId || req.query.landId;
    const amount = parseFloat(req.body.amount || req.query.amount);

    if (!landId || isNaN(amount)) {
      throw new AppError("Land ID and bid amount are required.", 400);
    }

    const land = await prisma.landListing.findFirst({
      where: {
        OR: [{ id: landId }, { slug: landId }],
      },
    });

    if (!land) {
      throw new AppError("Land listing not found.", 404);
    }

    if (land.status !== "ACTIVE") {
      throw new AppError(`This land is no longer open for bidding (status: ${land.status}).`, 400);
    }

    if (land.auctionEndsAt && new Date() > new Date(land.auctionEndsAt)) {
      throw new AppError("This auction has ended.", 400);
    }

    if (land.ownerId === req.user.id) {
      throw new AppError("You cannot bid on your own land listing.", 400);
    }

    const minRequired = land.minNextBid || land.totalPrice;
    if (amount < minRequired) {
      throw new AppError(
        `Bid amount too low. The minimum next bid is GH₵${minRequired.toLocaleString()}.`,
        400
      );
    }

    // Atomic transaction for bid placement
    const result = await prisma.$transaction(async (tx) => {
      // Mark prior active bids as outbid
      await tx.landBid.updateMany({
        where: { landId: land.id, status: "ACTIVE" },
        data: { status: "OUTBID" },
      });

      // Create new bid
      const newBid = await tx.landBid.create({
        data: {
          landId: land.id,
          bidderId: req.user.id,
          amount,
          status: "ACTIVE",
        },
        include: {
          bidder: {
            select: { id: true, name: true, ghanaCardVerified: true },
          },
        },
      });

      const nextMin = amount + (land.bidIncrement || 5000);

      // Update land current bid and count
      const updatedLand = await tx.landListing.update({
        where: { id: land.id },
        data: {
          currentBid: amount,
          minNextBid: nextMin,
          bidsCount: { increment: 1 },
        },
      });

      return { newBid, updatedLand };
    });

    res.status(201).json({
      message: "Bid placed successfully.",
      bid: {
        id: result.newBid.id,
        landId: land.id,
        bidderId: req.user.id,
        bidderName: req.user.name,
        amount: result.newBid.amount,
        status: result.newBid.status,
        createdAt: result.newBid.createdAt,
      },
      currentBid: result.updatedLand.currentBid,
      minNextBid: result.updatedLand.minNextBid,
      bidsCount: result.updatedLand.bidsCount,
    });
  } catch (error) {
    next(error);
  }
}

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
      orderBy: { amount: "desc" },
      include: {
        bidder: {
          select: { id: true, name: true, ghanaCardVerified: true },
        },
      },
    });

    res.json(
      bids.map((b) => ({
        id: b.id,
        landId: b.landId,
        bidderId: b.bidderId,
        bidderName: b.bidder.name,
        verified: b.bidder.ghanaCardVerified,
        amount: b.amount,
        status: b.status,
        createdAt: b.createdAt,
        dateLabel: new Date(b.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      }))
    );
  } catch (error) {
    next(error);
  }
}
