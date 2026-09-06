import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../services/authApi";
import { subscribeToBidEvents } from "../../services/bidEvents";
import { useAuth } from "../../context/AuthContext";

// Layout & UI Components
import AdminLayout from "../../components/admin/AdminLayout";
import OverviewTab from "../../components/admin/tabs/OverviewTab";
import UsersTab from "../../components/admin/tabs/UsersTab";
import AdminProfileTab from "../../components/admin/tabs/AdminProfileTab";
import VerificationsTab from "../../components/admin/tabs/VerificationsTab";
import ListingsTab from "../../components/admin/tabs/ListingsTab";
import BidsTab from "../../components/admin/tabs/BidsTab";
import ProjectsTab from "../../components/admin/tabs/ProjectsTab";
import AuditLogsTab from "../../components/admin/tabs/AuditLogsTab";
import ChatsTab from "../../components/admin/tabs/ChatsTab";
import SupportTab from "../../components/admin/tabs/SupportTab";
import PlaceholderTab from "../../components/admin/tabs/PlaceholderTab";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState("overview"); 

  // Global Data State
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab-specific State (Lifted so state persists between tabs)
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [reviewModal, setReviewModal] = useState(null); // verification item
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login", { replace: true });
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  async function loadData() {
    setLoading(true);
    try {
      const [statsData, usersData, verifData] = await Promise.all([
        adminApi.getStats(),
        adminApi.listUsers(),
        adminApi.listVerifications({ status: "ALL" }),
      ]);
      setStats(statsData);
      setUsers(usersData.users || []);
      setVerifications(verifData || []);
    } catch (err) {
      console.error("Admin data loading failed:", err);
    } finally {
      setLoading(false);
    }
  }

  // Silent sync to update clients and analytics in real-time when new clients join
  const silentReload = useCallback(async () => {
    try {
      const [statsData, usersData, verifData] = await Promise.all([
        adminApi.getStats(),
        adminApi.listUsers(),
        adminApi.listVerifications({ status: "ALL" }),
      ]);
      if (statsData) setStats(statsData);
      if (usersData?.users) setUsers(usersData.users);
      if (verifData) setVerifications(verifData);
    } catch (err) {
      console.warn("Silent real-time sync:", err);
    }
  }, []);

  // Real-time listener & 5s interval for new client registrations
  useEffect(() => {
    if (!isAdmin) return;

    // Periodic 5-second polling for real-time client registrations
    const interval = setInterval(() => {
      silentReload();
    }, 5000);

    // SSE EventSource for immediate real-time updates
    const unsubSSE = subscribeToBidEvents({
      onEvent: () => {
        silentReload();
      },
    });

    return () => {
      clearInterval(interval);
      if (unsubSSE) unsubSSE();
    };
  }, [isAdmin, silentReload]);

  // --- Handlers ---

  async function handleToggleUserStatus(u) {
    const newStatus = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await adminApi.updateUserStatus(u.id, { status: newStatus });
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      alert(err.message || "Failed to update user status");
    }
  }

  async function handleDeleteUser(userId, userName) {
    const displayName = userName || "this client";
    if (!window.confirm(`Are you sure you want to permanently delete ${displayName} from TerraMatch? All associated records will be removed.`)) {
      return;
    }
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((item) => item.id !== userId));
      setStats((prev) => prev ? {
        ...prev,
        users: { ...prev.users, total: Math.max(0, (prev.users?.total || 1) - 1) }
      } : prev);
    } catch (err) {
      console.error("Delete user error:", err);
      // Optimistically update list in UI
      setUsers((prev) => prev.filter((item) => item.id !== userId));
    }
  }

  async function handleDeleteBid(bidId) {
    try {
      await adminApi.deleteBid(bidId);
      silentReload();
    } catch (err) {
      console.error("Delete bid error:", err);
    }
  }

  async function handleReviewVerification(action) {
    if (!reviewModal) return;
    setActionLoading(true);
    try {
      await adminApi.reviewVerification(reviewModal.id, {
        action,
        rejectionReason: action === "REJECT" ? rejectionReason : null,
      });
      setReviewModal(null);
      setRejectionReason("");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to process review");
    } finally {
      setActionLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  // --- Render router logic for tabs ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab 
            stats={stats} 
            users={users} 
            user={user} 
            onNavigateTab={setActiveTab} 
          />
        );
      
      case "users":
        return (
          <UsersTab 
            users={users} 
            userSearch={userSearch} 
            setUserSearch={setUserSearch}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            handleToggleUserStatus={handleToggleUserStatus}
            handleDeleteUser={handleDeleteUser}
          />
        );
      
      case "verifications":
        return (
          <VerificationsTab 
            verifications={verifications}
            reviewModal={reviewModal}
            setReviewModal={setReviewModal}
            handleReviewVerification={handleReviewVerification}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
            actionLoading={actionLoading}
          />
        );

      case "land_owners":
      case "contractors":
        return (
          <UsersTab 
            users={users} 
            userSearch={userSearch} 
            setUserSearch={setUserSearch}
            userRoleFilter={activeTab === "land_owners" ? "LAND_OWNER" : "CONTRACTOR"}
            setUserRoleFilter={setUserRoleFilter}
            handleToggleUserStatus={handleToggleUserStatus}
            handleDeleteUser={handleDeleteUser}
          />
        );
      
      case "listings":
        return <ListingsTab />;
      
      case "bids":
        return <BidsTab onDeleteBid={handleDeleteBid} />;

      case "projects":
        return <ProjectsTab />;
      
      case "reports":
        return <PlaceholderTab title="Reports & Analytics" description="Advanced charting and CSV export capabilities for platform metrics." />;
      
      case "notifications":
        return <PlaceholderTab title="Admin Notifications" description="System-level alerts and moderation reports." />;
      
      case "audit_logs":
        return <AuditLogsTab />;

      case "chats":
        return <ChatsTab />;

      case "support":
        return <SupportTab />;

      case "settings":
        return <PlaceholderTab title="Platform Settings" description="Global configurations, feature flags, and administrative controls." />;
      
      case "profile":
        return <AdminProfileTab user={user} stats={stats} onBack={() => setActiveTab("overview")} />;

      default:
        return (
          <OverviewTab 
            stats={stats} 
            users={users} 
            user={user} 
            onNavigateTab={setActiveTab} 
          />
        );
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0F14]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AdminLayout 
      user={user} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onLogout={handleLogout}
    >
      {renderTabContent()}
    </AdminLayout>
  );
}
