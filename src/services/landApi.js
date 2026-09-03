import { api } from "./api";

export const landApi = {
  create: (data) => api.post("/api/lands", data),
  list: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(`/api/lands${q ? `?${q}` : ""}`);
  },
  getBySlug: (slug) => api.get(`/api/lands/${encodeURIComponent(slug)}`),
  getOwnerProfile: (identifier) => api.get(`/api/lands/owner/${encodeURIComponent(identifier)}`),
  addOwnerReview: (identifier, { rating, comment }) =>
    api.post(`/api/lands/owner/${encodeURIComponent(identifier)}/reviews`, { rating, comment }),
  analyzeEnvironment: (lat, lng, region) => {
    const q = new URLSearchParams({ lat, lng, region }).toString();
    return api.get(`/api/ai/land-analysis?${q}`);
  },
};
