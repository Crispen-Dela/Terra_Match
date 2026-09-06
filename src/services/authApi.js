import { api } from "./api";

export const authApi = {
  register: ({ name, email, password, role, phone, firebaseUid }) =>
    api.post(
      "/api/auth/register",
      { name, email, password, role, phone, firebaseUid },
      { skipAuth: true }
    ),

  login: ({ email, password, firebaseUid, idToken }) =>
    api.post(
      "/api/auth/login",
      { email, password, firebaseUid, idToken },
      { skipAuth: true }
    ),

  me: () => api.get("/api/auth/me"),

  updateMe: (data) => api.put("/api/auth/me", data),

  verifyGhanaCard: ({ ghanaCardNumber, fullNameOnCard, region, cardPhotoUrl }) =>
    api.post("/api/auth/verify-ghana-card", {
      ghanaCardNumber,
      fullNameOnCard,
      region,
      cardPhotoUrl,
    }),

  resendVerification: () => api.post("/api/auth/resend-verification", {}),
  
  submitSupportTicket: (data) => api.post("/api/auth/support", data),
};

export const adminApi = {
  getStats: () => api.get("/api/admin/stats"),
  listUsers: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(`/api/admin/users${q ? `?${q}` : ""}`);
  },
  updateUserStatus: (userId, data) =>
    api.put(`/api/admin/users/${userId}/status`, data),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
  listVerifications: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(`/api/admin/verifications${q ? `?${q}` : ""}`);
  },
  reviewVerification: (id, { action, rejectionReason }) =>
    api.post(`/api/admin/verifications/${id}/review`, { action, rejectionReason }),
  updateLandStatus: (id, status) =>
    api.put(`/api/admin/lands/${id}/status`, { status }),
  deleteLand: (id) => api.delete(`/api/admin/lands/${id}`),
  listLands: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(`/api/admin/lands${q ? `?${q}` : ""}`);
  },
  listBids: () => api.get("/api/admin/bids"),
  deleteBid: (id) => api.delete(`/api/admin/bids/${id}`),
  listProjects: () => api.get("/api/admin/projects"),
  deleteProject: (id) => api.delete(`/api/admin/projects/${id}`),
  listAuditLogs: () => api.get("/api/admin/logs"),
  
  listChats: () => api.get("/api/admin/chats"),
  getChatMessages: (id) => api.get(`/api/admin/chats/${id}/messages`),
  
  listSupportTickets: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(`/api/admin/support${q ? `?${q}` : ""}`);
  },
  updateSupportTicketStatus: (id, status) => api.put(`/api/admin/support/${id}/status`, { status }),
  replyToSupportTicket: (id, message) => api.post(`/api/admin/support/${id}/reply`, { message }),
  
  listNotifications: () => api.get("/api/admin/notifications"),
  markNotificationRead: (id) => api.put(`/api/admin/notifications/${id}/read`),
};
export const uploadApi = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("terramatch_token");

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to upload file.");
    }
    return res.json();
  },
};
