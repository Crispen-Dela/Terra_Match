import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FEATURED_LANDS } from "../constants/lands";
import { LAND_DETAILS } from "../constants/landDetails";
import { bidApi } from "../services/bidApi";
import { landApi } from "../services/landApi";
import { subscribeToBidEvents } from "../services/bidEvents";
import { useAuth } from "./AuthContext";

const AuctionContext = createContext(null);

function buildFallbackRecord(slug) {
  const land = FEATURED_LANDS.find((l) => l.slug === slug);
  const detail = LAND_DETAILS[slug];

  const durationMs = detail?.auctionDurationMs ?? 7 * 24 * 60 * 60 * 1000;
  const startingPrice = land?.totalPrice || land?.priceValue || 140000;

  return {
    status: land?.status || "ACTIVE",
    soldVia: null,
    soldTo: null,
    soldAt: null,
    soldAmount: null,
    auctionEndsAt: Date.now() + durationMs,
    currentBid: {
      bidder: "Starting Price",
      amount: startingPrice,
      verified: true,
    },
    minNextBid: startingPrice + 5000,
    bidIncrement: 5000,
    bidHistory: [],
    bidCount: 0,
    loadedFromBackend: false,
  };
}

export function AuctionProvider({ children }) {
  const { user } = useAuth();
  const [records, setRecords] = useState({});

  // Sync land record from live database response
  const syncFromLandData = useCallback((slug, landData, bidsData = []) => {
    if (!slug || !landData) return;

    setRecords((prev) => {
      const existing = prev[slug] || buildFallbackRecord(slug);
      const isSold = landData.status === "SOLD";
      const isExpired = landData.status === "EXPIRED" || (landData.auctionEndsAt && new Date() > new Date(landData.auctionEndsAt));

      const rawBids = Array.isArray(bidsData) && bidsData.length > 0 ? bidsData : (landData.bidHistory || landData.bids || []);
      const formattedBids = rawBids.map((b) => ({
        id: b.id,
        bidder: b.bidderName || b.bidder?.name || b.bidder || "Verified Bidder",
        amount: b.amount,
        status: b.status || "ACTIVE",
        verified: b.verified !== undefined ? Boolean(b.verified) : Boolean(b.bidder?.ghanaCardVerified),
        dateLabel:
          b.dateLabel ||
          new Date(b.createdAt || Date.now()).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        createdAt: b.createdAt,
      }));

      // Top bid
      const topBid = formattedBids.length > 0 ? formattedBids[0] : null;
      const currentBidAmount = landData.currentBid || (topBid ? topBid.amount : landData.totalPrice || landData.priceValue || 140000);
      const currentBidder = topBid ? topBid.bidder : "Starting Price";
      const minNext = landData.minNextBid || currentBidAmount + (landData.bidIncrement || 5000);

      return {
        ...prev,
        [slug]: {
          ...existing,
          landId: landData.id,
          status: isSold ? "sold" : isExpired ? "expired" : "live",
          backendStatus: landData.status,
          soldVia: isSold ? "buyNow" : null,
          soldAmount: isSold ? landData.totalPrice : null,
          auctionEndsAt: landData.auctionEndsAt ? new Date(landData.auctionEndsAt).getTime() : existing.auctionEndsAt,
          currentBid: {
            amount: currentBidAmount,
            bidder: currentBidder,
            verified: topBid ? topBid.verified : true,
          },
          minNextBid: minNext,
          bidIncrement: landData.bidIncrement || 5000,
          bidHistory: formattedBids,
          bidCount: landData.bidsCount !== undefined ? landData.bidsCount : formattedBids.length,
          loadedFromBackend: true,
        },
      };
    });
  }, []);

  // Fetch bids and land state for a specific land parcel
  const fetchLandBids = useCallback(
    async (slugOrId) => {
      if (!slugOrId) return null;
      try {
        const [land, bids] = await Promise.all([
          landApi.getBySlug(slugOrId).catch(() => null),
          bidApi.listForLand(slugOrId).catch(() => []),
        ]);

        if (land) {
          syncFromLandData(slugOrId, land, bids);
          if (land.slug && land.slug !== slugOrId) {
            syncFromLandData(land.slug, land, bids);
          }
        }
        return { land, bids };
      } catch (err) {
        console.warn("Could not fetch land bids:", err);
        return null;
      }
    },
    [syncFromLandData]
  );

  // Subscribe to real-time Server-Sent Events (SSE)
  useEffect(() => {
    const unsubscribe = subscribeToBidEvents({
      userId: user?.id,
      onEvent: (event) => {
        if (event.type === "BID_PLACED") {
          const { landId, landSlug, bid, currentBid, minNextBid, bidsCount } = event;
          const targetKeys = [landId, landSlug].filter(Boolean);

          setRecords((prev) => {
            const next = { ...prev };
            targetKeys.forEach((key) => {
              const cur = next[key] || buildFallbackRecord(key);
              const history = cur.bidHistory || [];
              const exists = history.some((b) => b.id === bid.id);
              const updatedHistory = exists ? history : [bid, ...history];

              next[key] = {
                ...cur,
                currentBid: {
                  amount: currentBid || bid.amount,
                  bidder: bid.bidderName || "Verified Bidder",
                  verified: Boolean(bid.verified),
                },
                minNextBid: minNextBid || (currentBid || bid.amount) + (cur.bidIncrement || 5000),
                bidHistory: updatedHistory,
                bidCount: bidsCount !== undefined ? bidsCount : updatedHistory.length,
              };
            });
            return next;
          });
        } else if (event.type === "BID_STATUS_CHANGED") {
          const { landId, landSlug, bid, status } = event;
          const targetKeys = [landId, landSlug].filter(Boolean);

          setRecords((prev) => {
            const next = { ...prev };
            targetKeys.forEach((key) => {
              const cur = next[key];
              if (!cur) return;
              const updatedHistory = (cur.bidHistory || []).map((b) =>
                b.id === bid.id ? { ...b, status: status || bid.status } : b
              );
              next[key] = {
                ...cur,
                bidHistory: updatedHistory,
              };
            });
            return next;
          });
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const getRecord = useCallback(
    (slug) => {
      if (!slug) return buildFallbackRecord("default");
      return records[slug] ?? buildFallbackRecord(slug);
    },
    [records]
  );

  const isSold = useCallback(
    (slug) => (records[slug] ?? buildFallbackRecord(slug)).status === "sold",
    [records]
  );

  const isExpired = useCallback(
    (slug) => {
      const record = records[slug] ?? buildFallbackRecord(slug);
      return record.status === "expired" || (record.status === "live" && Date.now() >= record.auctionEndsAt);
    },
    [records]
  );

  const markExpired = useCallback((slug) => {
    setRecords((prev) => {
      const current = prev[slug] ?? buildFallbackRecord(slug);
      if (current.status !== "live") return prev;
      return { ...prev, [slug]: { ...current, status: "expired" } };
    });
  }, []);

  // Place a real-time persisted bid via API
  const placeBid = useCallback(
    async (slug, amount) => {
      try {
        const res = await bidApi.place({ landId: slug, amount });
        const confirmedBid = res.bid;

        setRecords((prev) => {
          const current = prev[slug] ?? buildFallbackRecord(slug);
          const history = current.bidHistory || [];
          const exists = history.some((b) => b.id === confirmedBid.id);
          const nextHistory = exists ? history : [confirmedBid, ...history];

          return {
            ...prev,
            [slug]: {
              ...current,
              currentBid: {
                amount: res.currentBid || confirmedBid.amount,
                bidder: confirmedBid.bidderName || "You",
                verified: Boolean(confirmedBid.verified),
              },
              minNextBid: res.minNextBid || confirmedBid.amount + (current.bidIncrement || 5000),
              bidHistory: nextHistory,
              bidCount: res.bidsCount !== undefined ? res.bidsCount : nextHistory.length,
            },
          };
        });

        return { ok: true, bid: confirmedBid, message: res.message };
      } catch (err) {
        return {
          ok: false,
          reason: err.message?.toLowerCase().includes("sold")
            ? "sold"
            : err.message?.toLowerCase().includes("closed") || err.message?.toLowerCase().includes("ended")
            ? "expired"
            : err.message?.toLowerCase().includes("low")
            ? "too-low"
            : err.message?.toLowerCase().includes("own")
            ? "owner"
            : "error",
          error: err.message || "Failed to place bid. Please try again.",
        };
      }
    },
    []
  );

  const buyNow = useCallback((slug, buyNowPrice, buyerName = "You") => {
    setRecords((prev) => {
      const current = prev[slug] ?? buildFallbackRecord(slug);
      return {
        ...prev,
        [slug]: {
          ...current,
          status: "sold",
          soldVia: "buyNow",
          soldTo: buyerName,
          soldAt: new Date().toISOString(),
          soldAmount: buyNowPrice,
        },
      };
    });
    return { ok: true };
  }, []);

  const value = useMemo(
    () => ({
      records,
      getRecord,
      fetchLandBids,
      syncFromLandData,
      isSold,
      isExpired,
      markExpired,
      placeBid,
      buyNow,
    }),
    [records, getRecord, fetchLandBids, syncFromLandData, isSold, isExpired, markExpired, placeBid, buyNow]
  );

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>;
}

export function useAuction() {
  const ctx = useContext(AuctionContext);
  if (!ctx) {
    throw new Error("useAuction must be used within an AuctionProvider");
  }
  return ctx;
}
