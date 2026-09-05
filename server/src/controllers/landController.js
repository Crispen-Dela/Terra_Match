import prisma from "../config/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { bidEvents } from "../config/events.js";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listLands(req, res, next) {
  try {
    const { category, region, priceRange, search, status } = req.query;

    const where = {};
    if (status && status !== "ALL") {
      where.status = status;
    } else if (!status) {
      where.status = { in: ["ACTIVE", "SOLD"] };
    }

    if (category && category !== "All Land") {
      where.category = category;
    }

    if (region && region !== "All Regions") {
      where.region = { contains: region, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const lands = await prisma.landListing.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            ghanaCardVerified: true,
            avatarUrl: true,
          },
        },
        bids: {
          orderBy: { amount: "desc" },
          take: 5,
          include: {
            bidder: {
              select: { id: true, name: true, ghanaCardVerified: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(lands.map(formatLandResponse));
  } catch (error) {
    next(error);
  }
}

export async function getLandBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const land = await prisma.landListing.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            ghanaCardVerified: true,
            avatarUrl: true,
          },
        },
        bids: {
          orderBy: { amount: "desc" },
          include: {
            bidder: {
              select: { id: true, name: true, ghanaCardVerified: true },
            },
          },
        },
        reviews: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!land) {
      throw new AppError("Land listing not found.", 404);
    }

    res.json(formatLandResponse(land));
  } catch (error) {
    next(error);
  }
}

export async function createLand(req, res, next) {
  try {
    const {
      title,
      category = "Residential",
      description,
      region = "Greater Accra",
      district,
      address,
      latitude,
      longitude,
      landSize = "1 Plot",
      plotSize = "100 x 70 ft",
      tenure = "Freehold",
      ownershipType = "Titled",
      titleDocRef,
      price,
      totalPrice,
      buyNowPrice,
      amenities = [],
      images = [],
      documents = [],
      floodRisk = "LOW",
      terrainType = "FLAT",
      drainageQuality = "GOOD",
      elevationMeters = 45.0,
      auctionDurationDays = 7,
    } = req.body;

    if (!title || !description || !address || (!totalPrice && !price)) {
      throw new AppError("Title, description, address, and price are required.", 400);
    }

    const resolvedPrice = parseFloat(totalPrice || price);
    const resolvedBuyNow = buyNowPrice ? parseFloat(buyNowPrice) : null;
    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const auctionEndsAt = new Date(Date.now() + auctionDurationDays * 24 * 60 * 60 * 1000);

    const land = await prisma.landListing.create({
      data: {
        slug,
        ownerId: req.user.id,
        title: title.trim(),
        category,
        description: description.trim(),
        region,
        district,
        address: address.trim(),
        latitude: latitude ? parseFloat(latitude) : 5.6037,
        longitude: longitude ? parseFloat(longitude) : -0.187,
        landSize,
        plotSize,
        tenure,
        ownershipType,
        titleDocRef,
        pricePerSqFt: resolvedPrice > 1000 ? Math.round(resolvedPrice / 4356) : resolvedPrice,
        totalPrice: resolvedPrice,
        buyNowPrice: resolvedBuyNow,
        amenities,
        images,
        documents,
        floodRisk,
        terrainType,
        drainageQuality,
        elevationMeters: parseFloat(elevationMeters) || 45.0,
        auctionEndsAt,
        currentBid: null,
        minNextBid: resolvedPrice,
        bidIncrement: Math.max(1000, Math.round(resolvedPrice * 0.02)),
        status: "ACTIVE",
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            ghanaCardVerified: true,
            avatarUrl: true,
          },
        },
        bids: true,
      },
    });

    res.status(201).json(formatLandResponse(land));
  } catch (error) {
    next(error);
  }
}

export async function getLandOwnerProfile(req, res, next) {
  try {
    const { identifier } = req.params;

    // Look for user by ID, email, or name slug
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: identifier },
          { email: identifier },
        ],
      },
      include: {
        landListings: {
          include: {
            bids: {
              orderBy: { amount: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        verifications: true,
      },
    });

    let user = users[0];

    // If not found by direct id/email, search by name slug or name match
    if (!user) {
      const allUsers = await prisma.user.findMany({
        include: {
          landListings: {
            include: {
              bids: {
                orderBy: { amount: "desc" },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          verifications: true,
        },
      });
      const matches = allUsers.filter(
        (u) =>
          slugify(u.name) === identifier.toLowerCase() ||
          u.id.toLowerCase() === identifier.toLowerCase() ||
          (u.email && u.email.toLowerCase().includes(identifier.toLowerCase()))
      );
      matches.sort((a, b) => (b.landListings?.length || 0) - (a.landListings?.length || 0));
      user = matches[0];
    }

    if (!user) {
      throw new AppError("Land owner profile not found.", 404);
    }

    const memberSinceDate = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "Jan 2022";

    const totalListings = user.landListings ? user.landListings.length : 0;
    const currentSold = user.landListings ? user.landListings.filter((l) => l.status === "SOLD").length : 0;
    const historicalSold = user.historicalSalesCount || 0;
    const totalSold = currentSold + historicalSold;

    // Distinct areas of operation from their lands
    const regions = [
      ...new Set(
        user.landListings
          .map((l) => l.district ? `${l.district}, ${l.region}` : l.region)
          .filter(Boolean)
      ),
    ];
    const areasOfOperation =
      regions.length > 0
        ? regions
        : ["Greater Accra Region", "Eastern Region"];

    const formattedLands = user.landListings.map(formatLandResponse);

    const dbReviews = await prisma.review.findMany({
      where: {
        OR: [
          { contractorId: user.id },
          { land: { ownerId: user.id } },
        ],
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedReviews = dbReviews.map((r) => ({
      id: r.id,
      name: r.author?.name || "Verified Buyer",
      rating: r.rating,
      comment: r.comment,
      dateLabel: new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      createdAt: r.createdAt,
    }));

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    dbReviews.forEach((r) => {
      const star = Math.round(r.rating);
      if (counts[star] !== undefined) counts[star]++;
    });

    const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: counts[stars] || 0,
    }));

    const avgRating =
      dbReviews.length > 0
        ? Math.round((dbReviews.reduce((sum, r) => sum + r.rating, 0) / dbReviews.length) * 10) / 10
        : 0;

    const ownerProfile = {
      id: user.id,
      slug: slugify(user.name),
      name: user.name,
      shortName: user.name.split(" ")[0] || "Owner",
      role: "Land Owner",
      verified: user.ghanaCardVerified || user.verifications?.some((v) => v.status === "APPROVED") || true,
      location: user.landListings[0]?.region ? `Accra, ${user.landListings[0].region}, Ghana` : "Accra, Greater Accra Region, Ghana",
      bio: `I specialize in residential and commercial land sales in prime locations across Greater Accra. My goal is to provide genuine land opportunities with complete transparency.`,
      about: `With over 5 years of experience in real estate and land ownership, I ensure that every transaction is fair, transparent, and secure. I work with verified surveyors and legal professionals to guarantee authentic land documents.`,
      rating: avgRating,
      reviewCount: dbReviews.length,
      phone: user.phone || "+233 24 123 4567",
      email: user.email,
      avatarUrl: user.avatarUrl || null,
      memberSince: memberSinceDate,
      totalListings: totalListings,
      successfulSales: totalSold,
      landsSold: totalSold,
      responseRate: "98%",
      avgResponseTime: "1.2 hrs",
      breadcrumb: [
        { label: "Explore Land", to: "/explore-land" },
      ],
      stats: [
        { icon: "listings", label: "Member Since", value: memberSinceDate },
        { icon: "listings", label: "Total Listings", value: String(totalListings) },
        { icon: "sales", label: "Lands Sold", value: String(totalSold) },
        { icon: "phone", label: "Response Rate", value: "98%" },
        { icon: "clock", label: "Avg. Response Time", value: "1.2 hrs" },
      ],
      verificationChecklist: [
        "National ID Verified",
        "Contact Information Verified",
        "Business Registration Verified",
        "Address Verified",
      ],
      verificationDetails: [
        { label: "National ID", value: "Ghana Card NIA Verified • Valid" },
        { label: "Contact Verification", value: "Phone & Email Confirmed" },
        { label: "Title Registration", value: "Lands Commission Approved" },
        { label: "Dispute Status", value: "Zero Encumbrances" },
      ],
      areasOfOperation: areasOfOperation.slice(0, 4),
      specialization: [
        "Residential Lands",
        "Commercial Lands",
      ],
      lands: formattedLands,
      listingSlugs: formattedLands.map((l) => l.slug),
      performance: [
        { label: "Response Rate", value: "98%" },
        { label: "Avg. Response Time", value: "1.2 hrs" },
        { label: "Lands Sold", value: String(totalSold) },
        { label: "Total Listings", value: String(totalListings) },
        { label: "Member Since", value: memberSinceDate },
      ],
      performanceDetails: [
        { label: "Survey Accuracy", value: "100%" },
        { label: "Site Inspection Availability", value: "7 Days a Week" },
      ],
      ratingBreakdown,
      reviews: formattedReviews,
      badges: [
        {
          icon: "trophy",
          title: "Top Rated Seller",
          description: "Awarded for excellent service",
        },
        {
          icon: "shield",
          title: "Verified Land Owner",
          description: "Identity and documents verified",
        },
        {
          icon: "bolt",
          title: "Fast Responder",
          description: "Usually replies within 1 hour",
        },
      ],
    };

    res.json(ownerProfile);
  } catch (error) {
    next(error);
  }
}

export async function addLandOwnerReview(req, res, next) {
  try {
    const { identifier } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      throw new AppError("Rating and comment are required.", 400);
    }

    const score = parseFloat(rating);
    if (score < 1 || score > 5) {
      throw new AppError("Rating must be between 1 and 5.", 400);
    }

    let ownerUser = await prisma.user.findUnique({
      where: { id: identifier },
    });

    if (!ownerUser) {
      const allUsers = await prisma.user.findMany();
      ownerUser = allUsers.find(
        (u) =>
          u.id === identifier ||
          slugify(u.name) === identifier.toLowerCase() ||
          (u.email && u.email.toLowerCase() === identifier.toLowerCase())
      );
    }

    if (!ownerUser) {
      throw new AppError("Land owner profile not found.", 404);
    }

    const review = await prisma.review.create({
      data: {
        authorId: req.user.id,
        contractorId: ownerUser.id,
        rating: score,
        comment: comment.trim(),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    res.status(201).json({
      message: "Review submitted successfully.",
      review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a land listing as SOLD (owner only)
 */
export async function markLandAsSold(req, res, next) {
  try {
    const { id } = req.params;

    const land = await prisma.landListing.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: { owner: true },
    });

    if (!land) {
      throw new AppError("Land listing not found.", 404);
    }

    if (land.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      throw new AppError("Only the verified owner of this listing can mark it as sold.", 403);
    }

    const updatedLand = await prisma.landListing.update({
      where: { id: land.id },
      data: { status: "SOLD" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            ghanaCardVerified: true,
            avatarUrl: true,
          },
        },
        bids: {
          orderBy: { amount: "desc" },
          include: {
            bidder: {
              select: { id: true, name: true, ghanaCardVerified: true },
            },
          },
        },
      },
    });

    // Broadcast real-time SSE event to all connected clients
    bidEvents.broadcast({
      type: "LAND_STATUS_CHANGED",
      landId: land.id,
      landSlug: land.slug,
      status: "SOLD",
      ownerId: land.ownerId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: "Land listing successfully marked as sold.",
      land: formatLandResponse(updatedLand),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Permanently delete a land listing (owner only)
 */
export async function deleteLand(req, res, next) {
  try {
    const { id } = req.params;

    const land = await prisma.landListing.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!land) {
      throw new AppError("Land listing not found.", 404);
    }

    if (land.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      throw new AppError("Only the verified owner of this listing can delete it.", 403);
    }

    // If listing was SOLD, preserve the historical sales count for the owner
    if (land.status === "SOLD") {
      await prisma.user.update({
        where: { id: land.ownerId },
        data: { historicalSalesCount: { increment: 1 } },
      });
    }

    // Permanently remove listing from PostgreSQL
    await prisma.landListing.delete({
      where: { id: land.id },
    });

    // Broadcast real-time deletion event
    bidEvents.broadcast({
      type: "LAND_DELETED",
      landId: land.id,
      landSlug: land.slug,
      ownerId: land.ownerId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: "Land listing permanently deleted.",
      id: land.id,
      slug: land.slug,
    });
  } catch (error) {
    next(error);
  }
}

export function formatLandResponse(land) {
  return {
    id: land.id,
    slug: land.slug,
    name: land.title,
    title: land.title,
    category: land.category,
    description: land.description,
    location: `${land.address}, ${land.region}`,
    region: land.region,
    district: land.district,
    address: land.address,
    coordinates: {
      lat: land.latitude || 5.6037,
      lng: land.longitude || -0.187,
    },
    latitude: land.latitude,
    longitude: land.longitude,
    price: `GH₵${land.pricePerSqFt || Math.round(land.totalPrice / 4356)} / sq ft`,
    priceValue: land.pricePerSqFt || Math.round(land.totalPrice / 4356),
    totalPrice: land.totalPrice,
    buyNowPrice: land.buyNowPrice,
    landSize: land.landSize,
    plotSize: land.plotSize,
    tenure: land.tenure,
    ownershipType: land.ownershipType,
    titleDocRef: land.titleDocRef,
    amenities: land.amenities || [],
    images: land.images || [],
    image: Array.isArray(land.images) && land.images.length > 0 ? land.images[0] : null,
    documents: land.documents || [],
    environmentalData: {
      floodRisk: land.floodRisk,
      terrainType: land.terrainType,
      drainageQuality: land.drainageQuality,
      elevationMeters: land.elevationMeters,
    },
    status: land.status,
    auctionEndsAt: land.auctionEndsAt,
    currentBid: land.currentBid,
    minNextBid: land.minNextBid,
    bidIncrement: land.bidIncrement,
    bids: land.bidsCount || (land.bids ? land.bids.length : 0),
    bidHistory: land.bids
      ? land.bids.map((b) => ({
          id: b.id,
          bidder: b.bidder?.name || "Verified Bidder",
          amount: b.amount,
          dateLabel: new Date(b.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          verified: Boolean(b.bidder?.ghanaCardVerified),
        }))
      : [],
    owner: land.owner || null,
    ownerSlug: land.owner ? slugify(land.owner.name) : "kwame-owusu",
    createdAt: land.createdAt,
  };
}
