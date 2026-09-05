import crypto from "crypto";
import prisma from "../config/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function checkContractorProfileComplete(profile) {
  if (!profile) {
    return {
      isComplete: false,
      missingRequirements: [
        "Contractor profile not initialized.",
        "A detailed professional bio is required.",
        "At least one project with pictures is required in your portfolio.",
      ],
    };
  }

  const missing = [];
  const bio = (profile.bio || "").trim();
  if (!bio || bio.length < 15) {
    missing.push("A detailed professional bio is required (min 15 characters).");
  }

  const portfolio = Array.isArray(profile.portfolio) ? profile.portfolio : [];
  if (portfolio.length === 0) {
    missing.push("At least one previous project with pictures is required in your portfolio.");
  } else {
    const validProjects = portfolio.filter((p) => {
      const hasTitle = Boolean(p.title && String(p.title).trim());
      const hasDesc = Boolean(p.description && String(p.description).trim());
      let imgCount = 0;
      if (Array.isArray(p.images)) {
        imgCount = p.images.filter(Boolean).length;
      } else if (p.image) {
        imgCount = 1;
      }
      return hasTitle && hasDesc && imgCount >= 1 && imgCount <= 8;
    });

    if (validProjects.length === 0) {
      missing.push("Each portfolio project must have a title, description, and at least 1 picture (max 8).");
    }
  }

  return {
    isComplete: missing.length === 0,
    missingRequirements: missing,
  };
}

export function normalizePortfolio(portfolioRaw) {
  if (!Array.isArray(portfolioRaw)) return [];
  return portfolioRaw.map((p, idx) => {
    let images = [];
    if (Array.isArray(p.images)) {
      images = p.images.filter(Boolean).slice(0, 8);
    } else if (p.image) {
      images = [p.image];
    }
    return {
      id: p.id || `proj-${idx + 1}-${Date.now()}`,
      title: p.title || "Untitled Project",
      description: p.description || "",
      images,
      image: images[0] || null, // legacy backward compatibility
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
    };
  });
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
        p.userId === slug ||
        slugify(p.companyName) === slug ||
        slugify(p.user?.name) === slug
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
          bio: "",
          location: "Accra, Ghana",
          yearsExperience: 1,
          portfolio: [],
        },
        include: { user: true },
      });
    }

    res.json(formatContractorResponse(profile));
  } catch (error) {
    next(error);
  }
}

export async function getProfileStatus(req, res, next) {
  try {
    const profile = await prisma.contractorProfile.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!profile) {
      return res.json({
        isComplete: false,
        missingRequirements: [
          "Contractor profile not initialized.",
          "A detailed professional bio is required.",
          "At least one project with pictures is required in your portfolio.",
        ],
        profile: null,
      });
    }

    const completion = checkContractorProfileComplete(profile);
    res.json({
      isComplete: completion.isComplete,
      missingRequirements: completion.missingRequirements,
      profile: formatContractorResponse(profile),
    });
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

    let processedPortfolio = undefined;
    if (portfolio !== undefined) {
      if (!Array.isArray(portfolio)) {
        throw new AppError("Portfolio must be an array of projects.", 400);
      }
      // Strictly enforce <= 8 pictures rule per project
      for (const p of portfolio) {
        let count = 0;
        if (Array.isArray(p.images)) {
          count = p.images.length;
        } else if (p.image) {
          count = 1;
        }
        if (count > 8) {
          throw new AppError("Each portfolio project can have a maximum of 8 pictures.", 400);
        }
      }
      processedPortfolio = normalizePortfolio(portfolio);
    }

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
        portfolio: processedPortfolio || [],
        completedProjects: processedPortfolio ? processedPortfolio.length : 0,
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
        portfolio: processedPortfolio !== undefined ? processedPortfolio : undefined,
        completedProjects:
          processedPortfolio !== undefined ? processedPortfolio.length : undefined,
      },
      include: { user: true },
    });

    res.json(formatContractorResponse(profile));
  } catch (error) {
    next(error);
  }
}

export async function addProject(req, res, next) {
  try {
    const { title, description, images } = req.body;

    if (!title || !String(title).trim()) {
      throw new AppError("Project Worked On (title) is required.", 400);
    }
    if (!description || !String(description).trim()) {
      throw new AppError("Project Description is required.", 400);
    }
    if (!images || !Array.isArray(images) || images.filter(Boolean).length === 0) {
      throw new AppError("At least one project picture is required.", 400);
    }
    if (images.length > 8) {
      throw new AppError("A maximum of 8 pictures is allowed per project.", 400);
    }

    let profile = await prisma.contractorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      profile = await prisma.contractorProfile.create({
        data: {
          userId: req.user.id,
          companyName: req.user.name,
          category: "Building & Construction",
          specialties: "Residential, Commercial",
          bio: "",
          location: "Accra, Ghana",
          yearsExperience: 1,
          portfolio: [],
        },
      });
    }

    const currentPortfolio = normalizePortfolio(profile.portfolio);
    const newProject = {
      id: crypto.randomUUID ? crypto.randomUUID() : `proj-${Date.now()}`,
      title: String(title).trim(),
      description: String(description).trim(),
      images: images.filter(Boolean).slice(0, 8),
      image: images[0] || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedPortfolio = [newProject, ...currentPortfolio];

    const updatedProfile = await prisma.contractorProfile.update({
      where: { userId: req.user.id },
      data: {
        portfolio: updatedPortfolio,
        completedProjects: updatedPortfolio.length,
      },
      include: { user: true },
    });

    res.status(201).json({
      message: "Project added to portfolio successfully.",
      project: newProject,
      portfolio: updatedPortfolio,
      profile: formatContractorResponse(updatedProfile),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req, res, next) {
  try {
    const { projectId } = req.params;
    const { title, description, images } = req.body;

    const profile = await prisma.contractorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      throw new AppError("Contractor profile not found.", 404);
    }

    const currentPortfolio = normalizePortfolio(profile.portfolio);
    const projectIndex = currentPortfolio.findIndex(
      (p) => String(p.id) === String(projectId)
    );

    if (projectIndex === -1) {
      throw new AppError("Portfolio project not found.", 404);
    }

    if (images !== undefined) {
      if (!Array.isArray(images)) {
        throw new AppError("Images must be an array of URLs.", 400);
      }
      if (images.length > 8) {
        throw new AppError("A maximum of 8 pictures is allowed per project.", 400);
      }
    }

    const existingProject = currentPortfolio[projectIndex];
    const updatedImages =
      images !== undefined ? images.filter(Boolean).slice(0, 8) : existingProject.images;

    const updatedProject = {
      ...existingProject,
      title: title !== undefined ? String(title).trim() : existingProject.title,
      description:
        description !== undefined ? String(description).trim() : existingProject.description,
      images: updatedImages,
      image: updatedImages[0] || null,
      updatedAt: new Date().toISOString(),
    };

    currentPortfolio[projectIndex] = updatedProject;

    const updatedProfile = await prisma.contractorProfile.update({
      where: { userId: req.user.id },
      data: {
        portfolio: currentPortfolio,
      },
      include: { user: true },
    });

    res.json({
      message: "Portfolio project updated successfully.",
      project: updatedProject,
      portfolio: currentPortfolio,
      profile: formatContractorResponse(updatedProfile),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { projectId } = req.params;

    const profile = await prisma.contractorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      throw new AppError("Contractor profile not found.", 404);
    }

    const currentPortfolio = normalizePortfolio(profile.portfolio);
    const filteredPortfolio = currentPortfolio.filter(
      (p) => String(p.id) !== String(projectId)
    );

    if (filteredPortfolio.length === currentPortfolio.length) {
      throw new AppError("Portfolio project not found.", 404);
    }

    const updatedProfile = await prisma.contractorProfile.update({
      where: { userId: req.user.id },
      data: {
        portfolio: filteredPortfolio,
        completedProjects: filteredPortfolio.length,
      },
      include: { user: true },
    });

    res.json({
      message: "Portfolio project deleted successfully.",
      portfolio: filteredPortfolio,
      profile: formatContractorResponse(updatedProfile),
    });
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
          p.userId === contractorId ||
          slugify(p.companyName) === contractorId.toLowerCase() ||
          slugify(p.user?.name) === contractorId.toLowerCase()
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
  const slug = slugify(profile.companyName || profile.user?.name || "contractor");
  const portfolio = normalizePortfolio(profile.portfolio);
  const completion = checkContractorProfileComplete(profile);

  return {
    id: profile.id,
    userId: profile.userId,
    slug,
    name: profile.companyName || profile.user?.name || "Contractor",
    shortName: (profile.companyName || profile.user?.name || "Contractor").split(" ")[0],
    rating: profile.avgRating,
    reviews: profile.reviewCount,
    projects: portfolio.length || profile.completedProjects,
    completedProjects: portfolio.length || profile.completedProjects,
    specialties: profile.specialties,
    location: profile.location,
    category: profile.category,
    bio: profile.bio || "",
    yearsExperience: profile.yearsExperience,
    licenseType: profile.licenseType,
    serviceAreas: profile.serviceAreas || ["Greater Accra"],
    portfolio,
    isComplete: completion.isComplete,
    missingRequirements: completion.missingRequirements,
    verified: Boolean(profile.isVerified || profile.user?.ghanaCardVerified),
    image: profile.user?.avatarUrl || null,
    avatarUrl: profile.user?.avatarUrl || null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
