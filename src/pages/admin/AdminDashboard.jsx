import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../services/authApi";
import { useAuth } from "../../context/AuthContext";

// Layout & UI Components
import AdminLayout from "../../components/admin/AdminLayout";
import OverviewTab from "../../components/admin/tabs/OverviewTab";
import UsersTab from "../../components/admin/tabs/UsersTab";
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
        return <OverviewTab stats={stats} user={user} />;
      
      case "users":
        return (
          <UsersTab 
            users={users} 
            userSearch={userSearch} 
            setUserSearch={setUserSearch}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            handleToggleUserStatus={handleToggleUserStatus}
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
        return <PlaceholderTab title="Role-Specific Management" description="Advanced filtering views for specific user roles will be placed here." />;
      
      case "listings":
        return <ListingsTab />;
      
      case "bids":
        return <BidsTab />;

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
        return <PlaceholderTab title="Admin Profile" description="Manage your administrator credentials and security settings." />;

      default:
        return <OverviewTab stats={stats} user={user} />;
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
