import { api } from "./api";

export const chatApi = {
  getToken: () => api.get("/api/chat/token"),
  createOrGetChannel: (data) => api.post("/api/chat/channel", data),
};
