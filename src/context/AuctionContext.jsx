import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { FEATURED_LANDS } from "../constants/lands";
import { LAND_DETAILS } from "../constants/landDetails";
import { bidApi } from "../services/bidApi";

const AuctionContext = createContext(null);
const STORAGE_KEY = "terramatch_auction_state";

function readStoredState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function seedFor(slug) {
  const land = FEATURED_LANDS.find((l) => l.slug === slug);
  const detail = LAND_DETAILS[slug];

  const initialBid = detail?.bidHistory?.[0];
  const durationMs = detail?.auctionDurationMs ?? 7 * 24 * 60 * 60 * 1000;

  return {
    status: "live",
    soldVia: null,
    soldTo: null,
    soldAt: null,
    soldAmount: null,
    auctionEndsAt: Date.now() + durationMs,
    currentBid: initialBid
      ? { bidder: initialBid.bidder, amount: initialBid.amount, verified: Boolean(initialBid.verified) }
      : { bidder: "Starting Bid", amount: land?.totalPrice || 140000, verified: true },
    minNextBid: detail?.minimumNextBid || (land?.totalPrice ? land.totalPrice + 5000 : 150000),
    bidIncrement: detail?.bidIncrement ?? 5000,
    bidHistory: detail?.bidHistory ?? [],
    bidCount: land?.bids ?? (detail?.bidHistory?.length || 0),
  };
}

export function AuctionProvider({ children }) {
  const [records, setRecords] = useState(readStoredState);

  const getRecord = useCallback(
    (slug) => records[slug] ?? seedFor(slug),
    [records]
  );

  const isSold = useCallback(
    (slug) => (records[slug] ?? seedFor(slug)).status === "sold",
    [records]
  );

  const isExpired = useCallback((slug) => {
    const record = records[slug] ?? seedFor(slug);
    return record.status === "expired" || (record.status === "live" && Date.now() >= record.auctionEndsAt);
  }, [records]);

  const markExpired = useCallback((slug) => {
    setRecords((prev) => {
      const current = prev[slug] ?? seedFor(slug);
      if (current.status !== "live") return prev;

      const next = { ...prev, [slug]: { ...current, status: "expired" } };
      persistState(next);
      return next;
    });
  }, []);

  const placeBid = useCallback((slug, amount, bidderName = "You") => {
    let result = { ok: false, reason: "unknown" };

    // Fire live backend bid
    bidApi
      .place({ landId: slug, amount })
      .catch((err) => console.warn("Backend bid sync warning:", err.message));

    setRecords((prev) => {
      const current = prev[slug] ?? seedFor(slug);

      if (current.status === "sold") {
        result = { ok: false, reason: "sold" };
        return prev;
      }
      if (current.status === "expired" || Date.now() >= current.auctionEndsAt) {
        result = { ok: false, reason: "expired" };
        if (current.status === "expired") return prev;
        const next = { ...prev, [slug]: { ...current, status: "expired" } };
        persistState(next);
        return next;
      }
      if (!amount || amount < current.minNextBid) {
        result = { ok: false, reason: "too-low" };
        return prev;
      }

      const newBid = {
        bidder: bidderName,
        amount,
        dateLabel: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      const updated = {
        ...current,
        currentBid: { bidder: bidderName, amount, verified: true },
        minNextBid: amount + current.bidIncrement,
        bidHistory: [newBid, ...current.bidHistory],
        bidCount: current.bidCount + 1,
      };

      result = { ok: true };
      const next = { ...prev, [slug]: updated };
      persistState(next);
      return next;
    });

    return result;
  }, []);

  const buyNow = useCallback((slug, buyNowPrice, buyerName = "You") => {
    let result = { ok: false, reason: "unknown" };

    setRecords((prev) => {
      const current = prev[slug] ?? seedFor(slug);

      if (current.status === "sold") {
        result = { ok: false, reason: "sold" };
        return prev;
      }
      if (current.status === "expired" || Date.now() >= current.auctionEndsAt) {
        result = { ok: false, reason: "expired" };
        if (current.status === "expired") return prev;
        const next = { ...prev, [slug]: { ...current, status: "expired" } };
        persistState(next);
        return next;
      }
      if (!buyNowPrice) {
        result = { ok: false, reason: "not-available" };
        return prev;
      }

      const updated = {
        ...current,
        status: "sold",
        soldVia: "buyNow",
        soldTo: buyerName,
        soldAt: new Date().toISOString(),
        soldAmount: buyNowPrice,
      };

      result = { ok: true };
      const next = { ...prev, [slug]: updated };
      persistState(next);
      return next;
    });

    return result;
  }, []);

  const value = useMemo(
    () => ({ getRecord, isSold, isExpired, markExpired, placeBid, buyNow }),
    [getRecord, isSold, isExpired, markExpired, placeBid, buyNow]
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
