import { api } from "./api";

export const dashboardApi = {
  async get() {
    return api.get("/api/dashboard");
  },

  async updatePlan(plan) {
    return api.post("/api/dashboard/plan", { plan });
  },
};
