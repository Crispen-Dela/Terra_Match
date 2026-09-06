import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { systemApi } from "../services/authApi";
import { subscribeToBidEvents } from "../services/bidEvents";

const SystemStatusContext = createContext(null);

const STORAGE_KEY = "terramatch_maintenance_state";

function getCachedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    // Ignore JSON parsing errors
  }
  return {
    isMaintenance: false,
    shutdownAt: null,
    shutdownBy: null,
    message: "TerraMatch is undergoing scheduled system updates and maintenance. All platform operations will resume shortly.",
  };
}

function setCachedState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Ignore storage quota errors
  }
}

export function SystemStatusProvider({ children }) {
  const [systemState, setSystemState] = useState(getCachedState);
  const [isUpdating, setIsUpdating] = useState(false);

  const isShutdown = Boolean(systemState?.isMaintenance);

  // Sync state from server
  const checkStatus = useCallback(async () => {
    try {
      const res = await systemApi.getStatus();
      if (res && typeof res.isMaintenance === "boolean") {
        setSystemState(res);
        setCachedState(res);
      }
    } catch (err) {
      // If server returns 503 maintenance json, parse it
      if (err?.body?.maintenance !== undefined) {
        const state = {
          isMaintenance: true,
          shutdownAt: err.body.shutdownAt || null,
          message: err.body.message || "System is under maintenance.",
        };
        setSystemState(state);
        setCachedState(state);
      }
    }
  }, []);

  // Toggle Maintenance (Admin function)
  const toggleShutdown = async ({ isMaintenance, message } = {}) => {
    setIsUpdating(true);
    try {
      const res = await systemApi.toggleMaintenance({
        isMaintenance: isMaintenance !== undefined ? isMaintenance : !isShutdown,
        message,
      });
      if (res?.state) {
        setSystemState(res.state);
        setCachedState(res.state);
      }
      return res;
    } catch (err) {
      console.error("Failed to toggle system maintenance:", err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  // 1. Initial check & Realtime polling every 4 seconds
  useEffect(() => {
    checkStatus();

    const interval = setInterval(() => {
      checkStatus();
    }, 4000);

    // 2. Realtime SSE listener for instant broadcast
    const unsubscribe = subscribeToBidEvents({
      onEvent: (event) => {
        if (event?.type === "SYSTEM_MAINTENANCE_TOGGLED") {
          const updatedState = {
            isMaintenance: Boolean(event.isMaintenance),
            shutdownAt: event.shutdownAt || null,
            shutdownBy: event.shutdownBy || null,
            message: event.message,
          };
          setSystemState(updatedState);
          setCachedState(updatedState);
        }
      },
    });

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, [checkStatus]);

  const value = {
    isShutdown,
    shutdownInfo: systemState,
    toggleShutdown,
    checkStatus,
    isUpdating,
  };

  return (
    <SystemStatusContext.Provider value={value}>
      {children}
    </SystemStatusContext.Provider>
  );
}

export function useSystemStatus() {
  const context = useContext(SystemStatusContext);
  if (!context) {
    // Fallback if rendered outside provider
    const cached = getCachedState();
    return {
      isShutdown: Boolean(cached?.isMaintenance),
      shutdownInfo: cached,
      toggleShutdown: async () => {},
      checkStatus: async () => {},
      isUpdating: false,
    };
  }
  return context;
}
