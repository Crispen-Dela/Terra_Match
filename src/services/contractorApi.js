import { api } from "./api";

export const contractorApi = {
  list: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(`/api/contractors${q ? `?${q}` : ""}`);
  },
  getBySlug: (slug) => api.get(`/api/contractors/${encodeURIComponent(slug)}`),
  getMyProfile: () => api.get("/api/contractors/me"),
  updateMyProfile: (data) => api.put("/api/contractors/me", data),
  addReview: (contractorId, { rating, comment }) =>
    api.post(`/api/contractors/${contractorId}/reviews`, { rating, comment }),
  recommend: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(`/api/ai/recommend${q ? `?${q}` : ""}`);
  },
  submitBid: (projectId, { bidAmount, estimatedDuration, proposalText }) =>
    api.post(`/api/projects/${projectId}/bids`, {
      bidAmount: parseFloat(bidAmount),
      estimatedDuration,
      proposalText,
    }),
};

