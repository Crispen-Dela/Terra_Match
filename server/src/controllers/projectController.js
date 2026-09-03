import prisma from "../config/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listProjects(req, res, next) {
  try {
    const { category, search, status = "OPEN" } = req.query;

    const where = {};
    if (status && status !== "ALL") where.status = status;
    if (category && category !== "All Categories") where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const projects = await prisma.constructionProject.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true, ghanaCardVerified: true },
        },
        bids: {
          include: {
            contractor: {
              select: {
                id: true,
                name: true,
                contractorProfile: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(projects);
  } catch (error) {
    next(error);
  }
}

export async function getProjectBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const project = await prisma.constructionProject.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true, ghanaCardVerified: true },
        },
        bids: {
          include: {
            contractor: {
              select: {
                id: true,
                name: true,
                contractorProfile: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      throw new AppError("Construction project not found.", 404);
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
}

export async function createProject(req, res, next) {
  try {
    const {
      title,
      category = "Building & Construction",
      description,
      budgetRange = "GHS 30,000 – 75,000",
      budgetMin,
      budgetMax,
      timeline = "1 – 3 months",
      location,
      images = [],
      attachments = [],
    } = req.body;

    if (!title || !description || !location) {
      throw new AppError("Title, description, and location are required.", 400);
    }

    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const project = await prisma.constructionProject.create({
      data: {
        slug,
        clientId: req.user.id,
        title: title.trim(),
        category,
        description: description.trim(),
        budgetRange,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        timeline,
        location: location.trim(),
        images,
        attachments,
        status: "OPEN",
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, ghanaCardVerified: true },
        },
      },
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
}

export async function submitProjectBid(req, res, next) {
  try {
    const { projectId } = req.params;
    const { bidAmount, estimatedDuration, proposalText } = req.body;

    if (!bidAmount || !proposalText) {
      throw new AppError("Bid amount and proposal text are required.", 400);
    }

    const project = await prisma.constructionProject.findFirst({
      where: { OR: [{ id: projectId }, { slug: projectId }] },
    });

    if (!project) {
      throw new AppError("Project not found.", 404);
    }

    if (project.clientId === req.user.id) {
      throw new AppError("You cannot submit a bid for your own project.", 400);
    }

    const bid = await prisma.projectBid.create({
      data: {
        projectId: project.id,
        contractorId: req.user.id,
        bidAmount: parseFloat(bidAmount),
        estimatedDuration,
        proposalText: proposalText.trim(),
        status: "PENDING",
      },
      include: {
        contractor: {
          select: { id: true, name: true, contractorProfile: true },
        },
      },
    });

    await prisma.constructionProject.update({
      where: { id: project.id },
      data: { bidsCount: { increment: 1 } },
    });

    res.status(201).json({
      message: "Proposal submitted successfully.",
      bid,
    });
  } catch (error) {
    next(error);
  }
}
