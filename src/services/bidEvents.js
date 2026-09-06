import { getStoredToken } from "./api";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

/**
 * Subscribes to real-time Server-Sent Events (SSE) for bids.
 * Automatically reconnects on network interruptions.
 */
export function subscribeToBidEvents(optionsOrCallback, maybeOptions = {}) {
  if (typeof window === "undefined" || !window.EventSource) {
    return () => {};
  }

  let onEvent;
  let landId;
  let userId;

  if (typeof optionsOrCallback === "function") {
    onEvent = optionsOrCallback;
    landId = maybeOptions?.landId;
    userId = maybeOptions?.userId;
  } else if (optionsOrCallback && typeof optionsOrCallback === "object") {
    onEvent = optionsOrCallback.onEvent;
    landId = optionsOrCallback.landId;
    userId = optionsOrCallback.userId;
  }


  let eventSource = null;
  let isClosed = false;
  let retryTimeout = null;
  let retryDelay = 1000;

  function connect() {
    if (isClosed) return;

    try {
      const token = getStoredToken();
      const params = new URLSearchParams();
      if (landId) params.append("landId", landId);
      if (userId) params.append("userId", userId);
      if (token) params.append("token", token);

      const url = `${API_BASE_URL}/api/bids/live?${params.toString()}`;
      eventSource = new EventSource(url, { withCredentials: true });

      eventSource.onopen = () => {
        retryDelay = 1000;
      };

      eventSource.onmessage = (event) => {
        if (!event.data) return;
        try {
          const data = JSON.parse(event.data);
          if (onEvent) onEvent(data);
        } catch (err) {
          console.warn("Could not parse bid SSE event data:", err);
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        if (!isClosed) {
          retryTimeout = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 1.5, 15000);
            connect();
          }, retryDelay);
        }
      };
    } catch (e) {
      console.warn("Failed to initialize Bid EventSource:", e);
    }
  }

  connect();

  return function unsubscribe() {
    isClosed = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
