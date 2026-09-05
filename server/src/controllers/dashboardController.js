import prisma from "../config/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

// Plan details configuration
const PLAN_TIERS = {
  CLIENT: {
    FREE: {
      id: "FREE",
      name: "Standard Member",
      status: "Active",
      isPaid: false,
      price: "Free",
      features: [
        "Browse all verified lands & contractors",
        "Place bids on active land listings",
        "Direct Stream Chat with owners & builders",
        "Standard AI land search recommendations",
      ],
      aiAccess: {
        recommendations: true,
        detailedValuation: false,
        priorityPlacement: false,
      },
    },
    PRO: {
      id: "PRO",
      name: "Investor Pro",
      status: "Active",
      isPaid: true,
      price: "GHS 99 / mo",
      features: [
        "Everything in Standard Member",
        "Instant Outbid SMS & WhatsApp alerts",
        "AI Due Diligence & Title Analysis reports",
        "Unlimited project postings with verified builder reach",
      ],
      aiAccess: {
        recommendations: true,
        detailedValuation: true,
        priorityPlacement: true,
      },
    },
  },
  CONTRACTOR: {
    FREE: {
      id: "FREE",
      name: "Starter Contractor",
      status: "Active",
      isPaid: false,
      price: "Free",
      features: [
        "Verified Contractor Profile listing",
        "Up to 3 active project bids per month",
        "Standard client messaging",
        "Public reviews & ratings",
      ],
      aiAccess: {
        aiBidEstimator: false,
        matchmakingPriority: false,
        instantLeadAlerts: false,
      },
    },
    PRO: {
      id: "PRO",
      name: "Builder Pro",
      status: "Active",
      isPaid: true,
      price: "GHS 180 / mo",
      features: [
        "Verified Badge & Priority Placement in Search",
        "Unlimited bids on construction projects",
        "AI Bid Estimator & Bill of Quantities generator",
        "Instant client service requests & direct leads",
      ],
      aiAccess: {
        aiBidEstimator: true,
        matchmakingPriority: true,
        instantLeadAlerts: true,
      },
    },
    ENTERPRISE: {
      id: "ENTERPRISE",
      name: "Commercial Enterprise",
      status: "Active",
      isPaid: true,
      price: "GHS 450 / mo",
      features: [
        "Top #1 Featured listing across Ghana",
        "Dedicated corporate project manager",
        "Government & developer project matching",
        "Full AI suite with custom project tender builder",
      ],
      aiAccess: {
        aiBidEstimator: true,
        matchmakingPriority: true,
        instantLeadAlerts: true,
      },
    },
  },
  LAND_OWNER: {
    FREE: {
      id: "FREE",
      name: "Standard Land Owner",
      status: "Active",
      isPaid: false,
      price: "Free",
      features: [
        "List up to 2 verified land parcels",
        "Public bidding & Buy Now inquiry management",
        "Direct buyer messaging via Stream Chat",
        "Basic GIS map display",
      ],
      aiAccess: {
        gisFloodAnalysis: true,
        aiValuationReport: false,
        featuredPlacement: false,
      },
    },
    PRO: {
      id: "PRO",
      name: "Landlord Pro",
      status: "Active",
      isPaid: true,
      price: "GHS 150 / mo",
      features: [
        "Unlimited land parcel listings",
        "Featured banner placement on Explore Land",
        "AI Soil & Flood Risk Engineering certificate",
        "Instant buyer bid notifications & Escrow support",
      ],
      aiAccess: {
        gisFloodAnalysis: true,
        aiValuationReport: true,
        featuredPlacement: true,
      },
    },
    ENTERPRISE: {
      id: "ENTERPRISE",
      name: "Estate Developer Elite",
      status: "Active",
      isPaid: true,
      price: "GHS 500 / mo",
      features: [
        "Multi-plot subdivision management",
        "Dedicated marketing campaign & 3D drone mapping",
        "Full AI land market analytics & buyer insights",
        "Direct contract legal support",
      ],
      aiAccess: {
        gisFloodAnalysis: true,
        aiValuationReport: true,
        featuredPlacement: true,
      },
    },
  },
};

function calculateProfileCompletion(user, contractorProfile = null) {
  let score = 0;
  const totalWeight = 100;

  if (user.name) score += 20;
  if (user.email) score += 15;
  if (user.phone) score += 15;
  if (user.avatarUrl) score += 15;
  if (user.ghanaCardVerified) score += 20;

  if (user.role === "CONTRACTOR" && contractorProfile) {
    if (contractorProfile.bio) score += 5;
    if (contractorProfile.specialties) score += 5;
    if (contractorProfile.licenseType) score += 5;
  } else {
    if (user.emailVerified) score += 15;
  }

  return Math.min(score, totalWeight);
}

export async function getDashboardData(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contractorProfile: true,
        verifications: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new AppError("User account not found.", 404);
    }

    const role = user.role;
    const planKey = (user.subscriptionPlan || "FREE").toUpperCase();
    const rolePlans = PLAN_TIERS[role] || PLAN_TIERS.CLIENT;
    const currentPlan = rolePlans[planKey] || rolePlans.FREE;

    // Verification status
    let verificationStatus = "UNVERIFIED";
    if (user.ghanaCardVerified) {
      verificationStatus = "VERIFIED";
    } else if (user.verifications?.length > 0) {
      verificationStatus = user.verifications[0].status; // PENDING | REJECTED | APPROVED
    }

    const profileCompletion = calculateProfileCompletion(user, user.contractorProfile);

    // Initialize role-specific response container
    let dashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        ghanaCardVerified: user.ghanaCardVerified,
        status: user.status,
        createdAt: user.createdAt,
      },
      plan: currentPlan,
      allPlans: Object.values(rolePlans),
      verification: {
        status: verificationStatus,
        isVerified: user.ghanaCardVerified,
        aiScore: user.verifications?.[0]?.aiAnalysisScore || null,
        details: user.verifications?.[0] || null,
      },
      profileCompletion,
      activity: [],
    };

    // ─────────────────────────────────────────────────────────────
    // 1. CONTRACTOR DASHBOARD
    // ─────────────────────────────────────────────────────────────
    if (role === "CONTRACTOR") {
      const contractorProfile = user.contractorProfile;

      // Contractor's bids on construction projects
      const projectBids = await prisma.projectBid.findMany({
        where: { contractorId: userId },
        include: {
          project: {
            select: {
              id: true,
              slug: true,
              title: true,
              category: true,
              location: true,
              budgetRange: true,
              status: true,
              client: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Relevant open projects for this contractor's category
      const availableProjects = await prisma.constructionProject.findMany({
        where: {
          status: "OPEN",
          ...(contractorProfile?.category
            ? {
                OR: [
                  { category: contractorProfile.category },
                  { category: { contains: contractorProfile.category.split(" ")[0], mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          client: { select: { id: true, name: true, phone: true, avatarUrl: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      });

      // Reviews received by this contractor
      const reviews = await prisma.review.findMany({
        where: { contractorId: userId },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const avgRating =
        reviews.length > 0
          ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
          : contractorProfile?.avgRating || 5.0;

      // Stats
      const activeBidsCount = projectBids.filter((b) => b.status === "PENDING").length;
      const acceptedBidsCount = projectBids.filter((b) => b.status === "ACCEPTED").length;
      const completedProjectsCount = contractorProfile?.completedProjects || 0;

      // Service inquiries / conversations
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        include: {
          buyer: { select: { id: true, name: true, avatarUrl: true } },
          seller: { select: { id: true, name: true, avatarUrl: true } },
          land: { select: { id: true, title: true, totalPrice: true, slug: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: 6,
      });

      // Build Activity Stream
      const activity = [];
      projectBids.slice(0, 3).forEach((b) => {
        const amount = b.bidAmount ?? b.proposedAmount ?? 0;
        activity.push({
          id: `bid-${b.id}`,
          type: "BID_UPDATE",
          title: `Bid ${b.status}: ${b.project?.title || "Construction Project"}`,
          description: `GHS ${amount.toLocaleString()} • ${b.estimatedDuration || "Standard timeline"}`,
          timestamp: b.createdAt,
          status: b.status,
        });
      });
      reviews.slice(0, 3).forEach((r) => {
        activity.push({
          id: `review-${r.id}`,
          type: "NEW_REVIEW",
          title: `New ${r.rating}-Star Review from ${r.author?.name || "Client"}`,
          description: r.comment,
          timestamp: r.createdAt,
          status: "REVIEW",
        });
      });
      if (user.ghanaCardVerified) {
        activity.push({
          id: "verif-approved",
          type: "VERIFICATION",
          title: "Identity Verified (NIA Ghana Card)",
          description: "Your contractor profile has earned the green verified badge.",
          timestamp: user.contractorProfile?.verifiedAt || user.updatedAt,
          status: "APPROVED",
        });
      }

      dashboardData = {
        ...dashboardData,
        contractorProfile,
        stats: {
          activeBids: activeBidsCount,
          acceptedBids: acceptedBidsCount,
          completedProjects: completedProjectsCount,
          rating: avgRating,
          reviewCount: reviews.length || contractorProfile?.reviewCount || 0,
          totalEarnings: acceptedBidsCount * 85000,
        },
        bids: {
          all: projectBids,
          active: projectBids.filter((b) => b.status === "PENDING"),
          accepted: projectBids.filter((b) => b.status === "ACCEPTED"),
          rejected: projectBids.filter((b) => b.status === "REJECTED"),
        },
        availableOpportunities: availableProjects,
        reviews: {
          items: reviews,
          avgRating,
          total: reviews.length,
        },
        conversations,
        activity: activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 2. LAND OWNER DASHBOARD
    // ─────────────────────────────────────────────────────────────
    else if (role === "LAND_OWNER") {
      // Land listings owned by this user
      const lands = await prisma.landListing.findMany({
        where: { ownerId: userId },
        include: {
          bids: {
            include: {
              bidder: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            },
            orderBy: { amount: "desc" },
          },
          _count: { select: { bids: true, reviews: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // All bids received across all lands
      const allBidsReceived = lands.flatMap((l) =>
        l.bids.map((b) => ({
          ...b,
          landId: l.id,
          landTitle: l.title,
          landSlug: l.slug,
          landCategory: l.category,
          buyNowPrice: l.buyNowPrice,
        }))
      );

      // Reviews received by this land owner
      const reviews = await prisma.review.findMany({
        where: {
          OR: [
            { contractorId: userId },
            { land: { ownerId: userId } },
          ],
        },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          land: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const avgRating =
        reviews.length > 0
          ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
          : 5.0;

      // Stats
      const activeListings = lands.filter((l) => l.status === "ACTIVE");
      const soldListings = lands.filter((l) => l.status === "SOLD");
      const totalPortfolioValue = lands.reduce((acc, l) => acc + (l.totalPrice || 0), 0);

      // Conversations / Inquiries
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        include: {
          buyer: { select: { id: true, name: true, avatarUrl: true } },
          seller: { select: { id: true, name: true, avatarUrl: true } },
          land: { select: { id: true, title: true, totalPrice: true, slug: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: 6,
      });

      // Build Activity Stream
      const activity = [];
      allBidsReceived.slice(0, 4).forEach((b) => {
        const amount = b.amount ?? 0;
        activity.push({
          id: `bid-${b.id}`,
          type: "NEW_BID",
          title: `New Bid on ${b.landTitle || "Land"}: GHS ${amount.toLocaleString()}`,
          description: `Placed by ${b.bidder?.name || "Buyer"} (${b.status || "ACTIVE"})`,
          timestamp: b.createdAt,
          status: b.status,
        });
      });
      reviews.slice(0, 3).forEach((r) => {
        activity.push({
          id: `review-${r.id}`,
          type: "NEW_REVIEW",
          title: `New ${r.rating}-Star Review from ${r.author?.name || "Client"}`,
          description: r.comment,
          timestamp: r.createdAt,
          status: "REVIEW",
        });
      });
      lands.slice(0, 2).forEach((l) => {
        const price = l.totalPrice ?? 0;
        activity.push({
          id: `land-${l.id}`,
          type: "LISTING",
          title: `Land Listed: ${l.title}`,
          description: `${l.district || ""}, ${l.region || ""} • GHS ${price.toLocaleString()}`,
          timestamp: l.createdAt,
          status: l.status,
        });
      });

      dashboardData = {
        ...dashboardData,
        stats: {
          totalListings: lands.length,
          activeListings: activeListings.length,
          soldListings: soldListings.length,
          bidsReceived: allBidsReceived.length,
          portfolioValue: totalPortfolioValue,
          rating: avgRating,
          reviewCount: reviews.length,
        },
        listings: {
          all: lands,
          active: activeListings,
          sold: soldListings,
        },
        bidsReceived: {
          all: allBidsReceived,
          active: allBidsReceived.filter((b) => b.status === "ACTIVE"),
          accepted: allBidsReceived.filter((b) => b.status === "ACCEPTED"),
        },
        reviews: {
          items: reviews,
          avgRating,
          total: reviews.length,
        },
        conversations,
        activity: activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. NORMAL USER / CLIENT DASHBOARD
    // ─────────────────────────────────────────────────────────────
    else {
      // Land bids placed by this client
      const myBids = await prisma.landBid.findMany({
        where: { bidderId: userId },
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
              images: true,
              status: true,
              owner: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Projects posted by this client
      const myProjects = await prisma.constructionProject.findMany({
        where: { clientId: userId },
        include: {
          bids: {
            include: {
              contractor: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Recommended Lands (e.g. active featured listings)
      const recommendedLands = await prisma.landListing.findMany({
        where: { status: "ACTIVE" },
        take: 4,
        orderBy: { bidsCount: "desc" },
      });

      // Recommended Contractors
      const recommendedContractors = await prisma.contractorProfile.findMany({
        take: 4,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        },
        orderBy: { avgRating: "desc" },
      });

      // Conversations
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        include: {
          buyer: { select: { id: true, name: true, avatarUrl: true } },
          seller: { select: { id: true, name: true, avatarUrl: true } },
          land: { select: { id: true, title: true, totalPrice: true, slug: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: 6,
      });

      // Activity Stream
      const activity = [];
      myBids.slice(0, 4).forEach((b) => {
        const amount = b.amount ?? 0;
        const topBid = b.land?.currentBid ?? b.amount ?? 0;
        activity.push({
          id: `bid-${b.id}`,
          type: "MY_BID",
          title: `Bid on ${b.land?.title || "Land"}: GHS ${amount.toLocaleString()}`,
          description: `Current Status: ${b.status} (Top bid: GHS ${topBid.toLocaleString()})`,
          timestamp: b.createdAt,
          status: b.status,
        });
      });
      myProjects.slice(0, 2).forEach((p) => {
        activity.push({
          id: `proj-${p.id}`,
          type: "PROJECT",
          title: `Project Posted: ${p.title}`,
          description: `${p.bids?.length || 0} contractor proposals received`,
          timestamp: p.createdAt,
          status: p.status,
        });
      });

      dashboardData = {
        ...dashboardData,
        stats: {
          activeBids: myBids.filter((b) => b.status === "ACTIVE").length,
          outbidBids: myBids.filter((b) => b.status === "OUTBID").length,
          postedProjects: myProjects.length,
          conversationsCount: conversations.length,
        },
        bids: {
          all: myBids,
          active: myBids.filter((b) => b.status === "ACTIVE"),
          outbid: myBids.filter((b) => b.status === "OUTBID"),
          accepted: myBids.filter((b) => b.status === "ACCEPTED"),
        },
        projects: myProjects,
        recommendedLands,
        recommendedContractors: recommendedContractors.map((cp) => ({
          id: cp.userId,
          slug: cp.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: cp.companyName,
          category: cp.category,
          specialties: cp.specialties,
          location: cp.location,
          rating: cp.avgRating,
          reviews: cp.reviewCount,
          projects: cp.completedProjects,
          avatarUrl: cp.user?.avatarUrl,
        })),
        conversations,
        activity: activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      };
    }

    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
}

export async function updateSubscriptionPlan(req, res, next) {
  try {
    const userId = req.user.id;
    const { plan } = req.body;

    if (!plan || !["FREE", "PRO", "ENTERPRISE"].includes(plan.toUpperCase())) {
      throw new AppError("Invalid subscription plan selected.", 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan.toUpperCase(),
        planExpiresAt:
          plan.toUpperCase() === "FREE"
            ? null
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    const rolePlans = PLAN_TIERS[updatedUser.role] || PLAN_TIERS.CLIENT;
    const newPlan = rolePlans[updatedUser.subscriptionPlan] || rolePlans.FREE;

    res.json({
      message: `Successfully updated to ${newPlan.name}!`,
      plan: newPlan,
    });
  } catch (error) {
    next(error);
  }
}
