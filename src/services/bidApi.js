import { api } from "./api";

export const bidApi = {
  place: ({ landId, amount }) => api.post("/api/bids", { landId, amount }),
  listForLand: (landId) => api.get(`/api/bids/land/${encodeURIComponent(landId)}`),
  getMyBids: () => api.get("/api/bids/my-bids"),
  getReceivedBids: () => api.get("/api/bids/received"),
  getDetail: (id) => api.get(`/api/bids/detail/${encodeURIComponent(id)}`),
  updateStatus: (id, status) => api.patch(`/api/bids/${encodeURIComponent(id)}/status`, { status }),
};
