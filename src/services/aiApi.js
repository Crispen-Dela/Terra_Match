import { api } from "./api";

export const aiApi = {
  /**
   * Fetch all saved AI conversations for the authenticated user
   */
  getConversations: () => api.get("/api/ai/conversations"),

  /**
   * Fetch a single AI conversation with its messages
   */
  getConversation: (id) => api.get(`/api/ai/conversations/${encodeURIComponent(id)}`),

  /**
   * Create a new AI conversation
   */
  createConversation: (title) => api.post("/api/ai/conversations", { title }),

  /**
   * Delete an AI conversation
   */
  deleteConversation: (id) => api.delete(`/api/ai/conversations/${encodeURIComponent(id)}`),

  /**
   * Clear all AI conversations for the authenticated user
   */
  clearAllConversations: () => api.delete("/api/ai/conversations"),

  /**
   * Send chat message to TerraBot AI
   */
  sendChat: ({ userMessage, history, attachments, conversationId, brief }) =>
    api.post("/api/ai/chat", {
      userMessage,
      history,
      attachments,
      conversationId,
      brief,
    }),

  /**
   * Run geospatial land & environmental analysis
   */
  getLandAnalysis: (region = "Greater Accra") =>
    api.get(`/api/ai/land-analysis?region=${encodeURIComponent(region)}`),
};
