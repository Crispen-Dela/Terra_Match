import { useEffect, useState, useCallback } from "react";
import ContractorDashboard from "../dashboard/ContractorDashboard";
import LandOwnerDashboard from "../dashboard/LandOwnerDashboard";
import ClientDashboard from "../dashboard/ClientDashboard";
import MobileTabBar from "../common/MobileTabBar";
import ErrorBoundary from "../common/ErrorBoundary";
import Button from "../common/Button";
import { dashboardApi } from "../../services/dashboardApi";
import { useAuth } from "../../context/AuthContext";

export default function DashboardHome() {
  const { user: authUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardApi.get();
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError(err.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <main className="min-h-[85vh] bg-mist-50/60 pb-24 pt-6 sm:py-10">
        <div className="container-page space-y-6 sm:space-y-8">
          {/* Skeleton Header */}
          <div className="h-36 sm:h-44 animate-pulse rounded-2xl bg-gradient-to-r from-forest-900/80 to-forest-950/80 shadow-card" />
          {/* Skeleton Stats */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 sm:h-32 animate-pulse rounded-2xl border border-ink-900/5 bg-white p-5 shadow-card" />
            ))}
          </div>
          {/* Skeleton Content Columns */}
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            <div className="space-y-6 sm:space-y-8 lg:col-span-2">
              <div className="h-72 animate-pulse rounded-2xl border border-ink-900/5 bg-white p-6 shadow-card" />
              <div className="h-64 animate-pulse rounded-2xl border border-ink-900/5 bg-white p-6 shadow-card" />
            </div>
            <div className="space-y-6 sm:space-y-8">
              <div className="h-44 animate-pulse rounded-2xl border border-ink-900/5 bg-white p-6 shadow-card" />
              <div className="h-64 animate-pulse rounded-2xl border border-ink-900/5 bg-white p-6 shadow-card" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !dashboardData) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-mist-50/60 p-6">
        <div className="max-w-md text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ember-100 text-ember-700">
            ⚠️
          </div>
          <h2 className="mt-4 text-xl font-bold text-ink-900">Dashboard Unavailable</h2>
          <p className="mt-2 text-sm text-ink-600">
            {error || "Could not retrieve your dashboard profile. Please check your connection."}
          </p>
          <Button type="button" variant="primary" onClick={fetchDashboard} className="mt-6">
            Retry Loading
          </Button>
        </div>
      </main>
    );
  }

  const role = dashboardData.user?.role || authUser?.role || "CLIENT";

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-mist-50/60 pb-24 pt-6 sm:py-10">
        <div className="container-page">
          {role === "CONTRACTOR" ? (
            <ContractorDashboard data={dashboardData} onRefresh={fetchDashboard} />
          ) : role === "LAND_OWNER" ? (
            <LandOwnerDashboard data={dashboardData} onRefresh={fetchDashboard} />
          ) : (
            <ClientDashboard data={dashboardData} onRefresh={fetchDashboard} />
          )}
        </div>

        {/* Mobile Navigation Tab Bar */}
        <MobileTabBar activeTab="dashboard" role={role} />
      </main>
    </ErrorBoundary>
  );
}
