import fs from "fs";
import path from "path";
import prisma from "../config/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { bidEvents } from "../config/events.js";
import { streamServerClient } from "../config/stream.js";

const STATE_FILE = path.join(process.cwd(), "system_state.json");

function getStoredSystemState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read system_state.json:", err.message);
  }
  return {
    isMaintenance: false,
    shutdownAt: null,
    shutdownBy: null,
    message: "TerraMatch is undergoing scheduled system updates and maintenance. All platform operations will resume shortly.",
  };
}

function saveSystemState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save system_state.json:", err.message);
  }
}

let currentSystemState = getStoredSystemState();

export function getSystemStateDirect() {
  return currentSystemState;
}

export async function getAdminStats(req, res, next) {
  try {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      contractorsCount,
      landOwnersCount,
      clientsCount,
      totalLands,
      activeLands,
      soldLands,
      totalBids,
      bidsAgg,
      totalProjects,
      pendingVerifications,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { ghanaCardVerified: true } }),
      prisma.user.count({ where: { role: "CONTRACTOR" } }),
      prisma.user.count({ where: { role: "LAND_OWNER" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.landListing.count(),
      prisma.landListing.count({ where: { status: "ACTIVE" } }),
      prisma.landListing.count({ where: { status: "SOLD" } }),
      prisma.landBid.count(),
      prisma.landBid.aggregate({ _sum: { amount: true }, _avg: { amount: true } }),
      prisma.constructionProject.count(),
      prisma.ghanaCardVerification.count({ where: { status: "PENDING" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          ghanaCardVerified: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
        contractors: contractorsCount,
        landOwners: landOwnersCount,
        clients: clientsCount,
      },
      lands: {
        total: totalLands,
        active: activeLands,
        sold: soldLands,
      },
      bids: {
        total: totalBids,
        totalVolumeGHS: bidsAgg._sum.amount || 0,
        averageBidGHS: Math.round(bidsAgg._avg.amount || 0),
      },
      projects: {
        total: totalProjects,
      },
      verifications: {
        pending: pendingVerifications,
      },
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAllUsers(req, res, next) {
  try {
    const { role, status, search, limit = 50, page = 1 } = req.query;

    const where = {};
    if (role && role !== "ALL") where.role = role;
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          contractorProfile: true,
          _count: {
            select: {
              landListings: true,
              landBids: true,
              projects: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        ghanaCardVerified: u.ghanaCardVerified,
        listingsCount: u._count.landListings,
        bidsCount: u._count.landBids,
        projectsCount: u._count.projects,
        createdAt: u.createdAt,
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    if (id === req.user.id && status === "SUSPENDED") {
      throw new AppError("You cannot suspend your own admin account.", 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: status || undefined,
        role: role || undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: "UPDATE_USER",
        resource: `User:${id}`,
        details: `Status: ${status || 'unchanged'}, Role: ${role || 'unchanged'}`,
      }
    });

    res.json({
      message: `User ${updatedUser.name} updated successfully.`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      throw new AppError("You cannot delete your own admin account.", 400);
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      throw new AppError("User not found.", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.landBid.deleteMany({ where: { bidderId: id } });
      await tx.ghanaCardVerification.deleteMany({ where: { userId: id } });
      await tx.contractorProfile.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { recipientId: id } });
      await tx.supportTicket.deleteMany({ where: { userId: id } });
      await tx.supportReply.deleteMany({ where: { senderId: id } });
      await tx.user.delete({ where: { id } });
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: "DELETE_USER",
        resource: `User:${id}`,
        details: `Deleted user ${targetUser.email} (${targetUser.name})`,
      },
    });

    res.json({ message: `User ${targetUser.name} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function deleteBid(req, res, next) {
  try {
    const { id } = req.params;

    const bid = await prisma.landBid.findUnique({ where: { id } });
    if (!bid) {
      throw new AppError("Bid not found.", 404);
    }

    await prisma.landBid.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: "DELETE_BID",
        resource: `LandBid:${id}`,
        details: `Deleted bid amount: ${bid.amount} on land ${bid.landId}`,
      },
    });

    res.json({ message: "Bid deleted successfully." });
  } catch (error) {
    next(error);
  }
}

export async function deleteLand(req, res, next) {
  try {
    const { id } = req.params;

    const land = await prisma.landListing.findUnique({ where: { id } });
    if (!land) {
      throw new AppError("Land listing not found.", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.landBid.deleteMany({ where: { landId: id } });
      await tx.landListing.delete({ where: { id } });
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: "DELETE_LAND",
        resource: `LandListing:${id}`,
        details: `Deleted land: ${land.title}`,
      },
    });

    res.json({ message: "Land listing deleted successfully." });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;

    const project = await prisma.constructionProject.findUnique({ where: { id } });
    if (!project) {
      throw new AppError("Project not found.", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectBid.deleteMany({ where: { projectId: id } });
      await tx.constructionProject.delete({ where: { id } });
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: "DELETE_PROJECT",
        resource: `ConstructionProject:${id}`,
        details: `Deleted project: ${project.title}`,
      },
    });

    res.json({ message: "Project deleted successfully." });
  } catch (error) {
    next(error);
  }
}

export async function listVerifications(req, res, next) {
  try {
    const { status = "PENDING" } = req.query;

    const where = {};
    if (status && status !== "ALL") where.status = status;

    const verifications = await prisma.ghanaCardVerification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            ghanaCardVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(verifications);
  } catch (error) {
    next(error);
  }
}

export async function reviewVerification(req, res, next) {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: "APPROVE" | "REJECT"

    if (!["APPROVE", "REJECT"].includes(action)) {
      throw new AppError("Action must be either APPROVE or REJECT.", 400);
    }

    const verification = await prisma.ghanaCardVerification.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!verification) {
      throw new AppError("Verification request not found.", 404);
    }

    const isApproved = action === "APPROVE";

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.ghanaCardVerification.update({
        where: { id },
        data: {
          status: isApproved ? "APPROVED" : "REJECTED",
          rejectionReason: !isApproved ? rejectionReason || "Document details did not match." : null,
          reviewedById: req.user.id,
          reviewedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: verification.userId },
        data: {
          ghanaCardVerified: isApproved,
          contractorProfile:
            verification.user.role === "CONTRACTOR"
              ? {
                  update: {
                    isVerified: isApproved,
                    verifiedAt: isApproved ? new Date() : null,
                  },
                }
              : undefined,
        },
      });
      
      await tx.auditLog.create({
        data: {
          adminId: req.user.id,
          action: isApproved ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
          resource: `GhanaCardVerification:${id}`,
          details: `User: ${verification.userId}`,
        }
      });

      return v;
    });

    res.json({
      message: `Verification ${isApproved ? "approved" : "rejected"} successfully.`,
      verification: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLandStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const land = await prisma.landListing.update({
      where: { id },
      data: { status },
    });
    
    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: "UPDATE_LAND_STATUS",
        resource: `LandListing:${id}`,
        details: `Status updated to ${status}`,
      }
    });

    res.json({
      message: "Listing status updated.",
      land,
    });
  } catch (error) {
    next(error);
  }
}

export async function listLands(req, res, next) {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;

    const where = {};
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [lands, total] = await Promise.all([
      prisma.landListing.findMany({
        where,
        include: { owner: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.landListing.count({ where }),
    ]);

    res.json({
      lands,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
}

export async function listBids(req, res, next) {
  try {
    const bids = await prisma.landBid.findMany({
      include: {
        bidder: { select: { id: true, name: true, email: true } },
        land: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(bids);
  } catch (error) {
    next(error);
  }
}

export async function listProjects(req, res, next) {
  try {
    const projects = await prisma.constructionProject.findMany({
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
}

export async function listAuditLogs(req, res, next) {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

// ==========================================
// CHAT MODERATION ENDPOINTS
// ==========================================

export async function listChats(req, res, next) {
  try {
    const chats = await prisma.conversation.findMany({
      include: {
        buyer: { select: { id: true, name: true, email: true, role: true } },
        seller: { select: { id: true, name: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
    });
    res.json(chats);
  } catch (error) {
    next(error);
  }
}

export async function getChatMessages(req, res, next) {
  try {
    const { id } = req.params;
    
    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: "REVIEW_CHAT",
        resource: `Conversation:${id}`,
        details: "Admin accessed private messages for moderation.",
      }
    });

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: "asc" }
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
}

// ==========================================
// SUPPORT INBOX & CONVERSATION ENDPOINTS
// ==========================================

export async function listSupportTickets(req, res, next) {
  try {
    const { status, search } = req.query;

    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    const adminIds = adminUsers.map((a) => a.id);

    // 1. Fetch support conversations from Conversation & Message models
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: { in: adminIds } },
          { sellerId: { in: adminIds } },
        ],
        landId: null,
        projectId: null,
      },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, ghanaCardVerified: true, createdAt: true },
        },
        seller: {
          select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, ghanaCardVerified: true, createdAt: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    const formatted = conversations
      .map((conv) => {
        const clientUser = adminIds.includes(conv.buyerId) ? conv.seller : conv.buyer;
        if (!clientUser) return null;

        const msgs = conv.messages || [];
        const lastMsg = msgs[msgs.length - 1];
        const unreadCount = msgs.filter((m) => !adminIds.includes(m.senderId) && !m.isRead).length;

        const latestSenderIsAdmin = lastMsg && adminIds.includes(lastMsg.senderId);
        const threadStatus = unreadCount > 0 ? "NEW" : latestSenderIsAdmin ? "RESOLVED" : "IN_PROGRESS";

        return {
          id: conv.id,
          conversationId: conv.id,
          userId: clientUser.id,
          name: clientUser.name,
          email: clientUser.email,
          phone: clientUser.phone,
          role: clientUser.role,
          avatarUrl: clientUser.avatarUrl,
          ghanaCardVerified: Boolean(clientUser.ghanaCardVerified),
          userCreatedAt: clientUser.createdAt,
          user: clientUser,
          subject: `Support: ${clientUser.name} (${clientUser.role})`,
          category: "Account & Bidding Support",
          message: msgs[0]?.body || "Support inquiry opened",
          latestMessage: lastMsg ? lastMsg.body : "Support inquiry opened",
          lastMessageAt: lastMsg ? lastMsg.createdAt : conv.lastMessageAt,
          createdAt: conv.createdAt,
          unreadCount,
          status: threadStatus,
          messages: msgs.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: adminIds.includes(m.senderId) ? "Support (Admin)" : (m.sender?.name || clientUser.name),
            isAdmin: adminIds.includes(m.senderId),
            senderRole: m.sender?.role || (adminIds.includes(m.senderId) ? "ADMIN" : clientUser.role),
            message: m.body,
            body: m.body,
            isRead: m.isRead,
            createdAt: m.createdAt,
          })),
          replies: msgs.filter((m) => adminIds.includes(m.senderId)).map((m) => ({
            id: m.id,
            senderId: m.senderId,
            sender: { name: "Support (Admin)" },
            message: m.body,
            createdAt: m.createdAt,
          })),
        };
      })
      .filter(Boolean);

    // Also fetch any tickets from SupportTicket model if any exist and not yet represented
    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true, ghanaCardVerified: true } },
        replies: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Merge ticket format
    const ticketFormatted = tickets.map((t) => {
      // If there's already a conversation for this user, skip to avoid duplicates
      if (t.userId && formatted.some((f) => f.userId === t.userId)) {
        return null;
      }
      return {
        id: t.id,
        conversationId: null,
        userId: t.userId || t.id,
        name: t.name || t.user?.name || "User",
        email: t.email || t.user?.email || "user@example.com",
        phone: t.user?.phone || null,
        role: t.user?.role || "CLIENT",
        avatarUrl: t.user?.avatarUrl || null,
        ghanaCardVerified: Boolean(t.user?.ghanaCardVerified),
        user: t.user || { id: t.userId || t.id, name: t.name, email: t.email, role: "CLIENT" },
        subject: t.subject || "Support Inquiry",
        category: t.category || "General",
        message: t.message,
        latestMessage: t.replies?.length > 0 ? t.replies[t.replies.length - 1].message : t.message,
        lastMessageAt: t.replies?.length > 0 ? t.replies[t.replies.length - 1].createdAt : t.createdAt,
        createdAt: t.createdAt,
        unreadCount: t.status === "NEW" ? 1 : 0,
        status: t.status,
        messages: [
          {
            id: `orig-${t.id}`,
            senderId: t.userId || "user",
            senderName: t.name || "User",
            isAdmin: false,
            body: t.message,
            message: t.message,
            createdAt: t.createdAt,
          },
          ...(t.replies || []).map((r) => ({
            id: r.id,
            senderId: r.senderId,
            senderName: "Support (Admin)",
            isAdmin: true,
            body: r.message,
            message: r.message,
            createdAt: r.createdAt,
          })),
        ],
        replies: t.replies || [],
      };
    }).filter(Boolean);

    let allResults = [...formatted, ...ticketFormatted].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    if (status && status !== "ALL") {
      allResults = allResults.filter((t) => t.status === status);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allResults = allResults.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          t.latestMessage?.toLowerCase().includes(q) ||
          t.role?.toLowerCase().includes(q)
      );
    }

    res.json(allResults);
  } catch (error) {
    next(error);
  }
}

export async function getSupportConversation(req, res, next) {
  try {
    const { id } = req.params;

    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    const adminIds = adminUsers.map((a) => a.id);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, ghanaCardVerified: true, createdAt: true } },
        seller: { select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, ghanaCardVerified: true, createdAt: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (conversation) {
      const clientUser = adminIds.includes(conversation.buyerId) ? conversation.seller : conversation.buyer;

      // Mark all messages from the client as read by Admin
      await prisma.message.updateMany({
        where: {
          conversationId: id,
          senderId: clientUser.id,
          isRead: false,
        },
        data: { isRead: true },
      });

      return res.json({
        id: conversation.id,
        conversationId: conversation.id,
        user: clientUser,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: adminIds.includes(m.senderId) ? "Support (Admin)" : (m.sender?.name || clientUser.name),
          isAdmin: adminIds.includes(m.senderId),
          senderRole: m.sender?.role || (adminIds.includes(m.senderId) ? "ADMIN" : clientUser.role),
          body: m.body,
          message: m.body,
          isRead: m.isRead,
          createdAt: m.createdAt,
        })),
      });
    }

    // Fallback to SupportTicket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, ghanaCardVerified: true } },
        replies: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
    });

    if (ticket) {
      return res.json({
        id: ticket.id,
        conversationId: null,
        user: ticket.user || { id: ticket.userId, name: ticket.name, email: ticket.email, role: "CLIENT" },
        messages: [
          {
            id: `orig-${ticket.id}`,
            senderId: ticket.userId || "user",
            senderName: ticket.name || "User",
            isAdmin: false,
            body: ticket.message,
            message: ticket.message,
            createdAt: ticket.createdAt,
          },
          ...(ticket.replies || []).map((r) => ({
            id: r.id,
            senderId: r.senderId,
            senderName: "Support (Admin)",
            isAdmin: true,
            body: r.message,
            message: r.message,
            createdAt: r.createdAt,
          })),
        ],
      });
    }

    throw new AppError("Support thread not found.", 404);
  } catch (error) {
    next(error);
  }
}

export async function updateSupportTicketStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (ticket) {
      const updated = await prisma.supportTicket.update({
        where: { id },
        data: { status },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          replies: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } }
        }
      });
      return res.json({ message: "Ticket status updated.", ticket: updated });
    }

    res.json({ message: "Status acknowledged." });
  } catch (error) {
    next(error);
  }
}

export async function replyToSupportTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      throw new AppError("Message is required.", 400);
    }

    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    const adminIds = adminUsers.map((a) => a.id);

    // 1. Try finding conversation first
    let conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { buyer: true, seller: true },
    });

    if (conversation) {
      const clientUser = adminIds.includes(conversation.buyerId) ? conversation.seller : conversation.buyer;

      const newMsg = await prisma.message.create({
        data: {
          conversationId: id,
          senderId: req.user.id,
          body: message.trim(),
          isRead: false,
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      });

      await prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      });

      // Stream Chat sync
      if (streamServerClient) {
        try {
          const channelId = `support_${clientUser.id}`;
          const channel = streamServerClient.channel("messaging", channelId);
          await channel.sendMessage({
            text: message.trim(),
            user_id: req.user.id,
          });
        } catch (streamErr) {
          console.warn("Stream support reply warning:", streamErr.message);
        }
      }

      // In-app notification
      try {
        await prisma.notification.create({
          data: {
            recipientId: clientUser.id,
            role: clientUser.role,
            type: "SYSTEM_ALERT",
            message: `Support (Admin) replied: "${message.trim().length > 60 ? message.trim().slice(0, 57) + "..." : message.trim()}"`,
          },
        });
      } catch (notifErr) {
        console.warn("Notification error:", notifErr.message);
      }

      // Record audit log
      try {
        await prisma.auditLog.create({
          data: {
            adminId: req.user.id,
            action: "REPLY_SUPPORT_CONVERSATION",
            resource: `Conversation:${id}`,
            details: `Admin ${req.user.name} sent a support reply to ${clientUser.name} (${clientUser.email})`,
          },
        });
      } catch (auditErr) {
        // ignore
      }

      // Broadcast SSE
      bidEvents.broadcast({
        type: "SUPPORT_REPLY_RECEIVED",
        conversationId: id,
        userId: clientUser.id,
        senderName: "Support (Admin)",
        message: message.trim(),
        timestamp: new Date().toISOString(),
      });

      return res.status(201).json({
        message: "Reply sent successfully.",
        reply: {
          id: newMsg.id,
          senderId: newMsg.senderId,
          senderName: "Support (Admin)",
          isAdmin: true,
          body: newMsg.body,
          isRead: newMsg.isRead,
          createdAt: newMsg.createdAt,
        },
      });
    }

    // 2. Fallback to SupportTicket
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (ticket) {
      const reply = await prisma.supportReply.create({
        data: {
          ticketId: id,
          senderId: req.user.id,
          message: message.trim(),
        },
        include: {
          sender: { select: { id: true, name: true } },
        },
      });

      if (ticket.status === "NEW") {
        await prisma.supportTicket.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
        });
      }

      if (ticket.userId) {
        try {
          await prisma.notification.create({
            data: {
              recipientId: ticket.userId,
              role: "CLIENT",
              type: "SYSTEM_ALERT",
              message: `Support (Admin) replied to your ticket: "${message.trim()}"`,
            },
          });
        } catch (notifErr) {
          // ignore
        }
      }

      return res.status(201).json({ message: "Reply sent.", reply });
    }

    throw new AppError("Support conversation or ticket not found.", 404);
  } catch (error) {
    next(error);
  }
}

// ==========================================
// ADMIN NOTIFICATION ENDPOINTS
// ==========================================

export async function listNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id, recipientId: req.user.id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error) {
    next(error);
  }
}

// ==========================================
// SYSTEM PLATFORM STATUS & SHUTDOWN ENDPOINTS
// ==========================================

export async function getSystemStatus(req, res, next) {
  try {
    res.json(currentSystemState);
  } catch (error) {
    next(error);
  }
}

export async function toggleSystemMaintenance(req, res, next) {
  try {
    const { isMaintenance, message } = req.body;
    const newState = isMaintenance !== undefined ? Boolean(isMaintenance) : !currentSystemState.isMaintenance;

    currentSystemState = {
      isMaintenance: newState,
      shutdownAt: newState ? new Date().toISOString() : null,
      shutdownBy: newState ? (req.user?.name || req.user?.email || "Administrator") : null,
      message:
        message ||
        "TerraMatch is currently undergoing scheduled system updates and maintenance. All platform operations will resume shortly.",
      updatedAt: new Date().toISOString(),
    };

    saveSystemState(currentSystemState);

    // Record persistent audit log in PostgreSQL
    try {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: newState ? "SHUTDOWN_WEBSITE" : "RESTART_WEBSITE",
          resource: "SystemPlatform",
          details: newState
            ? `Admin ${req.user.name} initiated emergency website shutdown. Public access suspended.`
            : `Admin ${req.user.name} restarted the website. All public operations and bidding resumed.`,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation warning:", auditErr.message);
    }

    // Broadcast real-time SSE event to all active clients & admin sessions
    bidEvents.broadcast({
      type: "SYSTEM_MAINTENANCE_TOGGLED",
      isMaintenance: currentSystemState.isMaintenance,
      shutdownAt: currentSystemState.shutdownAt,
      shutdownBy: currentSystemState.shutdownBy,
      message: currentSystemState.message,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: newState
        ? "Website successfully shut down. Only admin portal remains accessible."
        : "Website successfully restarted. All public activities and dashboards resumed.",
      state: currentSystemState,
    });
  } catch (error) {
    next(error);
  }
}
