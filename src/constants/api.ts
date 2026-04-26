export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/admin/login`,
  LOGOUT: `${API_BASE_URL}/auth/admin/logout`,
  VERIFY: `${API_BASE_URL}/auth/admin/verify`,
};

export const USER_ROLES = {
  BOSS: "boss",
  ADMIN: "admin",
  VIP_MASTER: "vip-master",
  BAR_MASTER: "bar-master",
  RECEPTIONIST: "receptionist",
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "murmyz_auth_token",
  USER: "murmyz_user",
  ROLE: "murmyz_user_role",
};

export const ROUTES = {
  PUBLIC: "/",
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin",
  ACCOUNTING: "/admin",
  ADMIN_VIP: "/admin/vip",
  ADMIN_BAR: "/admin/bar",
  ADMIN_RECEPTION: "/admin/reception",
  ADMIN_INVENTORY: "/admin/inventory",
  ADMIN_APPROVAL: "/admin/approval",
  ADMIN_DEBTS: "/admin/debts",
};
