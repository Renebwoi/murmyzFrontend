import type { UserRole } from "../types/auth";
import type { AccountingModule } from "../features/accounting/types";
import { API_BASE_URL } from "../constants/api";
import { authService } from "./authService";

export type DebtLedgerStatus =
  | "pending-admin"
  | "accepted-admin"
  | "rejected-admin"
  | "paid";

export interface DebtLedgerEntry {
  id: string;
  module: Extract<AccountingModule, "vip" | "bar" | "reception">;
  date: string;
  amount: number;
  explanation: string;
  status: DebtLedgerStatus;
  submittedBy: string;
  submittedAt: string;
  adminReviewedBy?: string;
  adminReviewedAt?: string;
  bossPaidBy?: string;
  bossPaidAt?: string;
}

interface CreateDebtEntryInput {
  module: Extract<AccountingModule, "vip" | "bar" | "reception">;
  date: string;
  amount: number;
  explanation: string;
  submittedBy: string;
}

const UPDATE_EVENT = "murmyz:debt-ledger-updated";

const DEBT_ENDPOINTS = {
  BASE: `${API_BASE_URL}/accounting/debts`,
  SUMMARY: `${API_BASE_URL}/accounting/debts/summary`,
  ACCEPT: (id: string) => `${API_BASE_URL}/accounting/debts/${id}/accept`,
  REJECT: (id: string) => `${API_BASE_URL}/accounting/debts/${id}/reject`,
  MARK_PAID: (id: string) => `${API_BASE_URL}/accounting/debts/${id}/mark-paid`,
};

let debtEntriesCache: DebtLedgerEntry[] = [];

function broadcastLedgerUpdate() {
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function normalizeEntries(payload: unknown): DebtLedgerEntry[] {
  if (!payload) return [];
  const root = payload as {
    data?: { entries?: DebtLedgerEntry[] } | DebtLedgerEntry[];
    entries?: DebtLedgerEntry[];
  };
  const fromDataEntries = (
    root.data as { entries?: DebtLedgerEntry[] } | undefined
  )?.entries;
  const fromDataArray = Array.isArray(root.data)
    ? (root.data as DebtLedgerEntry[])
    : undefined;
  const fromRootEntries = root.entries;
  const entries = fromDataEntries ?? fromDataArray ?? fromRootEntries;
  if (!Array.isArray(entries)) return [];

  return entries.map((raw) => {
    const item = raw as unknown as Record<string, unknown>;
    return {
      id: String(item.id ?? ""),
      module: (item.module as DebtLedgerEntry["module"]) ?? "vip",
      date: String(item.date ?? item.businessDate ?? ""),
      amount: Number(item.amount ?? 0),
      explanation: String(item.explanation ?? ""),
      status: (item.status as DebtLedgerEntry["status"]) ?? "pending-admin",
      submittedBy: String(item.submittedBy ?? item.submittedByUsername ?? ""),
      submittedAt: String(
        item.submittedAt ?? item.createdAt ?? new Date().toISOString(),
      ),
      adminReviewedBy: item.adminReviewedBy
        ? String(item.adminReviewedBy)
        : undefined,
      adminReviewedAt: item.adminReviewedAt
        ? String(item.adminReviewedAt)
        : undefined,
      bossPaidBy: item.bossPaidBy ? String(item.bossPaidBy) : undefined,
      bossPaidAt: item.bossPaidAt ? String(item.bossPaidAt) : undefined,
    };
  });
}

function writeCache(entries: DebtLedgerEntry[]) {
  debtEntriesCache = entries;
  broadcastLedgerUpdate();
}

function roleModules(
  role: UserRole,
): Array<Extract<AccountingModule, "vip" | "bar" | "reception">> {
  if (role === "vip-master") return ["vip"];
  if (role === "bar-master") return ["bar"];
  if (role === "receptionist") return ["reception"];
  return ["vip", "bar", "reception"];
}

class DebtLedgerService {
  private async request<T>(url: string, init: RequestInit = {}) {
    const token = authService.getToken();
    const response = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || "Request failed");
    }

    return response.json() as Promise<T>;
  }

  getEntries() {
    return debtEntriesCache;
  }

  async refresh(params?: {
    date?: string;
    module?: "vip" | "bar" | "reception";
    status?: DebtLedgerStatus;
  }) {
    const query = new URLSearchParams();
    if (params?.date) query.set("businessDate", params.date);
    if (params?.module) query.set("module", params.module);
    if (params?.status) query.set("status", params.status);

    const queryString = query.toString();
    const payload = await this.request<unknown>(
      `${DEBT_ENDPOINTS.BASE}${queryString ? `?${queryString}` : ""}`,
      { method: "GET" },
    );
    const entries = normalizeEntries(payload);

    if (params?.date || params?.module || params?.status) {
      const filteredOut = debtEntriesCache.filter((entry) => {
        if (params.date && entry.date !== params.date) return true;
        if (params.module && entry.module !== params.module) return true;
        if (params.status && entry.status !== params.status) return true;
        return false;
      });
      writeCache([...filteredOut, ...entries]);
    } else {
      writeCache(entries);
    }

    return entries;
  }

  getEntriesForDate(date: string) {
    return debtEntriesCache.filter((entry) => entry.date === date);
  }

  getEntriesForModuleAndDate(
    module: Extract<AccountingModule, "vip" | "bar" | "reception">,
    date: string,
  ) {
    return debtEntriesCache.filter(
      (entry) => entry.module === module && entry.date === date,
    );
  }

  getAcceptedUnpaidAmount(
    module: Extract<AccountingModule, "vip" | "bar" | "reception">,
    date: string,
  ) {
    return this.getEntriesForModuleAndDate(module, date)
      .filter((entry) => entry.status === "accepted-admin")
      .reduce((total, entry) => total + entry.amount, 0);
  }

  hasAcceptedUnpaidDebt(
    module: Extract<AccountingModule, "vip" | "bar" | "reception">,
    date: string,
  ) {
    return this.getEntriesForModuleAndDate(module, date).some(
      (entry) => entry.status === "accepted-admin",
    );
  }

  async createEntry(input: CreateDebtEntryInput) {
    await this.request(DEBT_ENDPOINTS.BASE, {
      method: "POST",
      body: JSON.stringify({
        module: input.module,
        businessDate: input.date,
        date: input.date,
        amount: input.amount,
        explanation: input.explanation,
      }),
    });

    await this.refresh({ date: input.date });
  }

  async approveEntry(id: string, adminUsername: string) {
    await this.request(DEBT_ENDPOINTS.ACCEPT(id), {
      method: "POST",
      body: JSON.stringify({ actor: adminUsername }),
    });

    await this.refresh();
  }

  async rejectEntry(id: string, adminUsername: string) {
    await this.request(DEBT_ENDPOINTS.REJECT(id), {
      method: "POST",
      body: JSON.stringify({ actor: adminUsername }),
    });

    await this.refresh();
  }

  async markPaid(id: string, bossUsername: string) {
    await this.request(DEBT_ENDPOINTS.MARK_PAID(id), {
      method: "POST",
      body: JSON.stringify({ actor: bossUsername }),
    });

    await this.refresh();
  }

  async fetchSummary(
    module: Extract<AccountingModule, "vip" | "bar" | "reception">,
    date: string,
  ) {
    const query = new URLSearchParams({ module, businessDate: date });
    return this.request<unknown>(
      `${DEBT_ENDPOINTS.SUMMARY}?${query.toString()}`,
      { method: "GET" },
    );
  }

  getRoleModuleOptions(role: UserRole) {
    return roleModules(role);
  }

  subscribe(callback: () => void) {
    window.addEventListener(UPDATE_EVENT, callback);
    return () => window.removeEventListener(UPDATE_EVENT, callback);
  }
}

export const debtLedgerService = new DebtLedgerService();
