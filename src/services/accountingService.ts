import { API_BASE_URL } from "../constants/api";
import { authService } from "./authService";
import type {
  AccountingModule,
  ApprovalRecord,
  DepartmentModuleState,
  InventoryModuleState,
  ReceptionModuleState,
} from "../features/accounting/types";

const ACCOUNTING_ENDPOINTS = {
  DASHBOARD: `${API_BASE_URL}/accounting/dashboard`,
  MODULES: (module: AccountingModule) =>
    `${API_BASE_URL}/accounting/modules/${module}`,
  MODULE_RECORDS: (
    module: Extract<
      AccountingModule,
      "vip" | "bar" | "reception" | "inventory"
    >,
  ) => `${API_BASE_URL}/accounting/modules/${module}/records`,
  MODULE_DATES: (
    module: Extract<
      AccountingModule,
      "vip" | "bar" | "reception" | "inventory"
    >,
  ) => `${API_BASE_URL}/accounting/modules/${module}/dates`,
  SUBMIT: (module: AccountingModule, recordId: string) =>
    `${API_BASE_URL}/accounting/modules/${module}/records/${recordId}/submit`,
  REVIEW: (recordId: string) =>
    `${API_BASE_URL}/accounting/records/${recordId}/review`,
  APPROVE: (recordId: string) =>
    `${API_BASE_URL}/accounting/records/${recordId}/approve`,
  REJECT: (recordId: string) =>
    `${API_BASE_URL}/accounting/records/${recordId}/reject`,
  REOPEN: (recordId: string) =>
    `${API_BASE_URL}/accounting/records/${recordId}/reopen`,
  CONFIRM_CASH: (recordId: string) =>
    `${API_BASE_URL}/accounting/records/${recordId}/confirm-cash`,
  SIGN_OFF: (recordId: string) =>
    `${API_BASE_URL}/accounting/records/${recordId}/sign-off`,
  INVENTORY: `${API_BASE_URL}/accounting/inventory`,
  TRANSFERS: `${API_BASE_URL}/accounting/inventory/transfers`,
};

class AccountingService {
  private unwrapPayload<T>(payload: unknown): T {
    const root = payload as { data?: T; record?: T };
    if (root?.data) return root.data;
    if (root?.record) return root.record;
    return payload as T;
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
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

  async getDashboard() {
    return this.request<unknown>(ACCOUNTING_ENDPOINTS.DASHBOARD, {
      method: "GET",
    });
  }

  async getModuleRecord(module: AccountingModule) {
    return this.request<
      DepartmentModuleState | ReceptionModuleState | InventoryModuleState
    >(ACCOUNTING_ENDPOINTS.MODULES(module), { method: "GET" });
  }

  async getModuleRecordByDate(
    module: Extract<
      AccountingModule,
      "vip" | "bar" | "reception" | "inventory"
    >,
    date: string,
  ) {
    const query = new URLSearchParams({ date });
    const payload = await this.request<unknown>(
      `${ACCOUNTING_ENDPOINTS.MODULES(module)}?${query.toString()}`,
      { method: "GET" },
    );
    return this.unwrapPayload<
      DepartmentModuleState | ReceptionModuleState | InventoryModuleState
    >(payload);
  }

  async getModuleDates(
    module: Extract<
      AccountingModule,
      "vip" | "bar" | "reception" | "inventory"
    >,
  ) {
    const payload = await this.request<unknown>(
      ACCOUNTING_ENDPOINTS.MODULE_DATES(module),
      {
        method: "GET",
      },
    );
    const root = payload as { dates?: string[]; data?: { dates?: string[] } };
    return root.dates ?? root.data?.dates ?? [];
  }

  async upsertModuleRecord(
    module: Extract<
      AccountingModule,
      "vip" | "bar" | "reception" | "inventory"
    >,
    record:
      | DepartmentModuleState
      | ReceptionModuleState
      | InventoryModuleState
      | Record<string, unknown>,
  ) {
    const payload = await this.request<unknown>(
      ACCOUNTING_ENDPOINTS.MODULE_RECORDS(module),
      {
        method: "POST",
        body: JSON.stringify(record),
      },
    );
    return this.unwrapPayload<
      DepartmentModuleState | ReceptionModuleState | InventoryModuleState
    >(payload);
  }

  async submitRecord(module: AccountingModule, recordId: string) {
    return this.request<unknown>(
      ACCOUNTING_ENDPOINTS.SUBMIT(module, recordId),
      { method: "POST" },
    );
  }

  async reviewRecord(recordId: string) {
    return this.request<unknown>(ACCOUNTING_ENDPOINTS.REVIEW(recordId), {
      method: "POST",
    });
  }

  async approveRecord(recordId: string) {
    return this.request<unknown>(ACCOUNTING_ENDPOINTS.APPROVE(recordId), {
      method: "POST",
    });
  }

  async rejectRecord(recordId: string) {
    return this.request<unknown>(ACCOUNTING_ENDPOINTS.REJECT(recordId), {
      method: "POST",
    });
  }

  async reopenRecord(recordId: string) {
    return this.request<unknown>(ACCOUNTING_ENDPOINTS.REOPEN(recordId), {
      method: "POST",
    });
  }

  async confirmCash(recordId: string) {
    return this.request<unknown>(ACCOUNTING_ENDPOINTS.CONFIRM_CASH(recordId), {
      method: "POST",
    });
  }

  async signOff(recordId: string) {
    return this.request<unknown>(ACCOUNTING_ENDPOINTS.SIGN_OFF(recordId), {
      method: "POST",
    });
  }

  async getInventory() {
    return this.request<InventoryModuleState>(ACCOUNTING_ENDPOINTS.INVENTORY, {
      method: "GET",
    });
  }

  async transferStock(payload: {
    department: "Bar" | "VIP";
    quantity: number;
    reference: string;
  }) {
    return this.request<unknown>(ACCOUNTING_ENDPOINTS.TRANSFERS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async flagInconsistency(recordId: string, message: string) {
    return this.request<unknown>(
      `${API_BASE_URL}/accounting/records/${recordId}/flag-inconsistency`,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      },
    );
  }

  async getSubmittedRecords() {
    return this.request<ApprovalRecord[]>(
      `${API_BASE_URL}/accounting/approvals`,
      { method: "GET" },
    );
  }
}

export const accountingService = new AccountingService();
