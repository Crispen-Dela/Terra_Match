// Real-Time Server-Sent Events (SSE) Bus for TerraMatch Bidding & Listings
import jwt from "jsonwebtoken";

class BidEventsManager {
  constructor() {
    this.clients = new Set();
  }

  /**
   * Handle incoming SSE connection request
   */
  handleSSEConnection(req, res) {
    // Set headers for standard HTTP Server-Sent Events
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": req.headers.origin || "*",
      "Access-Control-Allow-Credentials": "true",
    });

    res.flushHeaders?.();

    // Extract query parameters
    const landId = req.query.landId || null;
    let userId = req.query.userId || null;

    // Optional token authentication for SSE (via query token or Authorization header)
    const token = req.query.token || (req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : null);
    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) userId = decoded.id;
      } catch (err) {
        // Token invalid or expired, continue as anonymous viewer
      }
    }

    const client = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      res,
      landId,
      userId,
      connectedAt: new Date(),
    };

    this.clients.add(client);

    // Send initial handshake
    this.sendToClient(client, {
      type: "CONNECTED",
      clientId: client.id,
      landId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Keep connection alive with a heartbeat ping every 25 seconds
    const pingInterval = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch (err) {
        clearInterval(pingInterval);
        this.clients.delete(client);
      }
    }, 25000);

    // Clean up when client disconnects
    req.on("close", () => {
      clearInterval(pingInterval);
      this.clients.delete(client);
    });

    req.on("error", () => {
      clearInterval(pingInterval);
      this.clients.delete(client);
    });
  }

  /**
   * Send SSE message to a single client
   */
  sendToClient(client, data) {
    try {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      this.clients.delete(client);
    }
  }

  /**
   * Broadcast event to matching subscribers (by landId, userId, or globally)
   */
  broadcast(event) {
    const { landId, landSlug, ownerId, bidderId } = event;

    for (const client of this.clients) {
      const matchesLand =
        !client.landId ||
        client.landId === "all" ||
        client.landId === landId ||
        (landSlug && client.landId === landSlug);

      const matchesUser =
        !client.userId ||
        client.userId === ownerId ||
        client.userId === bidderId;

      if (matchesLand || matchesUser) {
        this.sendToClient(client, event);
      }
    }
  }
}

export const bidEvents = new BidEventsManager();
