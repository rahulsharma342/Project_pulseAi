
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import api from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [knowledgeCount, setKnowledgeCount] = useState(0);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userResponse, usageResponse, knowledgeResponse] =
          await Promise.all([
            api.get("/auth/me"),
            api.get("/usage"),
            api.get("/knowledge"),
          ]);

        setUser(userResponse.data.user);
        setUsage(usageResponse.data);
        setKnowledgeCount(knowledgeResponse.data.data?.length ?? 0);
      } catch (error) {
        console.error("Dashboard Data Error:", error);
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchDashboardData();
  }, []);

  // User initials
  const userInitial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  // Usage values
  const monthlyLimit = usage?.monthlyLimit ?? 0;
  const messagesUsed = usage?.messagesUsed ?? 0;
  const messagesRemaining = usage?.messagesRemaining ?? 0;

  const usagePercentage =
    monthlyLimit > 0
      ? Math.min((messagesUsed / monthlyLimit) * 100, 100)
      : 0;

  const firstName = user?.name?.trim()?.split(" ")[0] || "there";

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">✦</div>
          <div>
            <h2>SupportPulse</h2>
            <span>AI PLATFORM</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">WORKSPACE</p>

          <nav className="sidebar-nav">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span>▦</span> Overview
            </NavLink>

            <NavLink
              to="/knowledge"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span>◫</span> Knowledge Sources
            </NavLink>

            <button
              className="nav-item"
              onClick={() => alert("AI Chatbot page coming soon!")}
            >
              <span>◉</span> AI Chatbot
            </button>

            <button
              className="nav-item"
              onClick={() => alert("Conversations page coming soon!")}
            >
              <span>▤</span> Conversations
            </button>
          </nav>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MANAGEMENT</p>

          <nav className="sidebar-nav">
            <button
              className="nav-item"
              onClick={() => alert("Usage & Billing page coming soon!")}
            >
              <span>◈</span> Usage & Billing
            </button>

            <button
              className="nav-item"
              onClick={() => alert("Settings page coming soon!")}
            >
              <span>⚙</span> Settings
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="plan-card">
            <span className="plan-badge">
              {(usage?.plan || "FREE").toUpperCase()} PLAN
            </span>

            <h3>Upgrade your plan</h3>
            <p>Unlock more AI conversations and features.</p>

            <button
              onClick={() => alert("Upgrade feature coming soon!")}
            >
              Upgrade Plan ↗
            </button>
          </div>

          <div className="sidebar-user">
            <div className="user-avatar">{userInitial}</div>

            <div>
              <h4>{user?.name || "Loading user..."}</h4>
              <p>{user?.email || "Free Account"}</p>
            </div>

            <span>•••</span>
          </div>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="breadcrumb">Workspace / Overview</p>
            <h2>Dashboard</h2>
          </div>

          <div className="header-actions">
            <button className="notification-btn">♧</button>
            <div className="header-avatar">{userInitial}</div>
          </div>
        </header>

        <section className="dashboard-content">
          {/* Welcome */}
          <div className="welcome-section">
            <div>
              <p className="welcome-label">YOUR WORKSPACE</p>
              <h1>Welcome back, {firstName}! 👋</h1>
              <p>
                Here's what's happening with your AI support today.
              </p>
            </div>

            <button
              className="primary-btn"
              onClick={() => navigate("/knowledge")}
            >
              + Add Knowledge Source
            </button>
          </div>

          {/* Statistics */}
          <div className="stats-container">
            <div className="stats-card">
              <div className="stats-top">
                <span>Total Messages</span>
                <span className="stats-icon purple">✉</span>
              </div>
              <h2>{loadingUsage ? "..." : messagesUsed}</h2>
              <p>Messages this month</p>
            </div>

            <div className="stats-card">
              <div className="stats-top">
                <span>Messages Remaining</span>
                <span className="stats-icon green">↗</span>
              </div>
              <h2>{loadingUsage ? "..." : messagesRemaining}</h2>
              <p>Available this month</p>
            </div>

            <div className="stats-card">
              <div className="stats-top">
                <span>Knowledge Sources</span>
                <span className="stats-icon orange">▤</span>
              </div>
              <h2>{knowledgeCount}</h2>
              <p>Documents and websites</p>
            </div>

            <div className="stats-card">
              <div className="stats-top">
                <span>Current Plan</span>
                <span className="stats-icon blue">✦</span>
              </div>
              <h2>
                {loadingUsage ? "..." : usage?.plan || "Free"}
              </h2>
              <p>
                {loadingUsage
                  ? "Loading plan..."
                  : `${monthlyLimit} messages per month`}
              </p>
            </div>
          </div>

          {/* Usage and AI Status */}
          <div className="dashboard-grid">
            <div className="dashboard-panel usage-panel">
              <div className="panel-heading">
                <div>
                  <h3>Monthly Usage</h3>
                  <p>Track your AI conversation limit</p>
                </div>
                <span className="panel-menu">•••</span>
              </div>

              <div className="usage-numbers">
                <h2>
                  {loadingUsage ? "..." : messagesUsed}
                  <span> / {monthlyLimit} messages</span>
                </h2>

                <span className="usage-percent">
                  {loadingUsage
                    ? "..."
                    : `${usagePercentage.toFixed(0)}% used`}
                </span>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>

              <div className="usage-footer">
                <span>{messagesUsed} messages used</span>
                <span>{messagesRemaining} remaining</span>
              </div>
            </div>

            <div className="dashboard-panel status-panel">
              <div className="panel-heading">
                <div>
                  <h3>AI Assistant Status</h3>
                  <p>Your support system overview</p>
                </div>
              </div>

              <div className="status-item">
                <span className="status-dot"></span>
                <div>
                  <h4>AI Engine</h4>
                  <p>Ready to answer questions</p>
                </div>
                <span className="status-ready">Active</span>
              </div>

              <div className="status-item">
                <span className="status-dot"></span>
                <div>
                  <h4>Knowledge Base</h4>
                  <p>{knowledgeCount} knowledge sources connected</p>
                </div>
                <span className="status-ready">
                  {knowledgeCount > 0 ? "Ready" : "Empty"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-panel quick-actions">
            <div className="panel-heading">
              <div>
                <h3>Quick Actions</h3>
                <p>Manage your AI support workspace</p>
              </div>
            </div>

            <div className="quick-action-list">
              <button onClick={() => navigate("/knowledge")}>
                ＋ Add Knowledge Source <span>→</span>
              </button>

              <button
                onClick={() => alert("AI Chatbot page coming soon!")}
              >
                ◉ Test AI Chatbot <span>→</span>
              </button>

              <button
                onClick={() => alert("Usage Details page coming soon!")}
              >
                ▤ View Usage Details <span>→</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
