import prisma from "../config/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listContractors(req, res, next) {
  try {
    const { category, location, minRating, search } = req.query;

    const where = {};
    if (category && category !== "All Categories" && category !== "Others") {
      where.category = category;
    }
    if (location && location !== "All Locations") {
      where.location = { contains: location, mode: "insensitive" };
    }
    if (minRating) {
      where.avgRating = { gte: parseFloat(minRating) };
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { specialties: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const profiles = await prisma.contractorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            ghanaCardVerified: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }],
    });

    res.json(profiles.map(formatContractorResponse));
  } catch (error) {
    next(error);
  }
}

export async function getContractorBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    // Search by ID or match name slug
    const profiles = await prisma.contractorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            ghanaCardVerified: true,
            avatarUrl: true,
          },
        },
      },
    });

    const contractor = profiles.find(
      (p) =>
        p.id === slug ||
        slugify(p.companyName) === slug ||
        slugify(p.user.name) === slug
    );

    if (!contractor) {
      throw new AppError("Contractor profile not found.", 404);
    }

    const reviews = await prisma.review.findMany({
      where: {
        OR: [
          { contractorId: contractor.userId },
          { contractorId: contractor.id },
        ],
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      name: r.author?.name || "Verified Client",
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
    reviews.forEach((r) => {
      const star = Math.round(r.rating);
      if (counts[star] !== undefined) counts[star]++;
    });

    const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: counts[stars] || 0,
    }));

    const response = formatContractorResponse(contractor);
    response.reviews = formattedReviews;
    response.reviewCount = reviews.length;
    response.ratingBreakdown = ratingBreakdown;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
      response.rating = Math.round((sum / reviews.length) * 10) / 10;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMyProfile(req, res, next) {
  try {
    let profile = await prisma.contractorProfile.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!profile) {
      profile = await prisma.contractorProfile.create({
        data: {
          userId: req.user.id,
          companyName: req.user.name,
          category: "Building & Construction",
          specialties: "Residential, Commercial",
          bio: "Experienced building contractor.",
          location: "Accra, Ghana",
          yearsExperience: 2,
        },
        include: { user: true },
      });
    }

    res.json(formatContractorResponse(profile));
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const {
      companyName,
      category,
      specialties,
      bio,
      location,
      yearsExperience,
      licenseType,
      serviceAreas,
      portfolio,
    } = req.body;

    const profile = await prisma.contractorProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        companyName: companyName || req.user.name,
        category: category || "Building & Construction",
        specialties: specialties || "Residential, Commercial",
        bio: bio || "",
        location: location || "Accra, Ghana",
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : 1,
        licenseType: licenseType || "D1K1 General Building",
        serviceAreas: serviceAreas || ["Greater Accra"],
        portfolio: portfolio || [],
      },
      update: {
        companyName: companyName || undefined,
        category: category || undefined,
        specialties: specialties || undefined,
        bio: bio !== undefined ? bio : undefined,
        location: location || undefined,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
        licenseType: licenseType || undefined,
        serviceAreas: serviceAreas || undefined,
        portfolio: portfolio || undefined,
      },
      include: { user: true },
    });

    res.json(formatContractorResponse(profile));
  } catch (error) {
    next(error);
  }
}

export async function addContractorReview(req, res, next) {
  try {
    const { contractorId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      throw new AppError("Rating and comment are required.", 400);
    }

    const score = parseFloat(rating);
    if (score < 1 || score > 5) {
      throw new AppError("Rating must be between 1 and 5.", 400);
    }

    let contractorUser = await prisma.user.findUnique({
      where: { id: contractorId },
      include: { contractorProfile: true },
    });

    if (!contractorUser) {
      const profile = await prisma.contractorProfile.findUnique({
        where: { id: contractorId },
        include: { user: true },
      });
      if (profile?.user) {
        contractorUser = profile.user;
      }
    }

    if (!contractorUser) {
      const allProfiles = await prisma.contractorProfile.findMany({
        include: { user: true },
      });
      const match = allProfiles.find(
        (p) =>
          p.id === contractorId ||
          slugify(p.companyName) === contractorId.toLowerCase() ||
          slugify(p.user.name) === contractorId.toLowerCase()
      );
      if (match?.user) {
        contractorUser = match.user;
      }
    }

    if (!contractorUser) {
      throw new AppError("Contractor not found.", 404);
    }

    const review = await prisma.review.create({
      data: {
        authorId: req.user.id,
        contractorId: contractorUser.id,
        rating: score,
        comment: comment.trim(),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Recalculate average rating
    const allReviews = await prisma.review.findMany({
      where: { contractorId: contractorUser.id },
    });

    const avg =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.contractorProfile.update({
      where: { userId: contractorUser.id },
      data: {
        avgRating: Math.round(avg * 10) / 10,
        reviewCount: allReviews.length,
      },
    });

    res.status(201).json({
      message: "Review submitted successfully.",
      review,
      newAvgRating: Math.round(avg * 10) / 10,
      reviewCount: allReviews.length,
    });
  } catch (error) {
    next(error);
  }
}

export function formatContractorResponse(profile) {
  const slug = slugify(profile.companyName || profile.user.name);
  return {
    id: profile.id,
    userId: profile.userId,
    slug,
    name: profile.companyName || profile.user.name,
    shortName: (profile.companyName || profile.user.name).split(" ")[0],
    rating: profile.avgRating,
    reviews: profile.reviewCount,
    projects: profile.completedProjects,
    specialties: profile.specialties,
    location: profile.location,
    category: profile.category,
    bio: profile.bio || "",
    yearsExperience: profile.yearsExperience,
    licenseType: profile.licenseType,
    serviceAreas: profile.serviceAreas || ["Greater Accra"],
    portfolio: profile.portfolio || [],
    verified: Boolean(profile.isVerified || profile.user?.ghanaCardVerified),
    image: profile.user?.avatarUrl || null,
    createdAt: profile.createdAt,
  };
}
