import { api } from "./api";

export const bidApi = {
  place: ({ landId, amount }) => api.post("/api/bids", { landId, amount }),
  listForLand: (landId) => api.get(`/api/bids/${encodeURIComponent(landId)}`),
};
