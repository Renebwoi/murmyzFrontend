import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { ROUTES } from "../constants/api";
import { ACCOUNTING_ROUTES } from "../features/accounting/routes";
import {
  getAccessibleModules,
  getRoleLabel,
  MODULE_LABELS,
} from "../features/accounting/permissions";
import "./AdminLayout.css";

const routeMap = {
  vip: ACCOUNTING_ROUTES.VIP,
  bar: ACCOUNTING_ROUTES.BAR,
  reception: ACCOUNTING_ROUTES.RECEPTION,
  inventory: ACCOUNTING_ROUTES.INVENTORY,
  approval: ACCOUNTING_ROUTES.APPROVAL,
  debts: ACCOUNTING_ROUTES.DEBTS,
} as const;

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const accessibleModules = useMemo(
    () => (user ? getAccessibleModules(user.role) : []),
    [user],
  );

  const navigationItems = [
    { label: "Dashboard", path: ACCOUNTING_ROUTES.DASHBOARD, icon: "📊" },
    ...accessibleModules.map((module) => ({
      label: MODULE_LABELS[module],
      path: routeMap[module],
      icon:
        module === "vip"
          ? "🥂"
          : module === "bar"
            ? "🍺"
            : module === "reception"
              ? "🛎️"
              : module === "inventory"
                ? "📦"
                : module === "debts"
                  ? "📒"
                  : "✅",
    })),
  ];

  const handleLogout = () => {
    logout();
    navigate(ROUTES.ADMIN_LOGIN);
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">Murmyz Accounting</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username[0]?.toUpperCase() || "U"}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.username}</p>
              <p className="user-role">
                {user ? getRoleLabel(user.role) : "Unknown"}
              </p>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1>Accounting Console</h1>
          </div>
          <div className="header-right">
            <span className="user-welcome">
              Welcome, {user?.username} · {user ? getRoleLabel(user.role) : ""}
            </span>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
