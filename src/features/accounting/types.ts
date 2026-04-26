import type { UserRole } from "../../types/auth";

export type AccountingModule =
  | "vip"
  | "bar"
  | "reception"
  | "inventory"
  | "approval"
  | "debts";
export type RecordState =
  | "draft"
  | "submitted"
  | "reviewed"
  | "approved"
  | "partially-resolved"
  | "fully-resolved";
export type AccountingAction =
  | "create"
  | "edit"
  | "submit"
  | "flag-inconsistency"
  | "approve"
  | "reject"
  | "reopen"
  | "confirm-cash"
  | "sign-off";

export interface DepartmentRow {
  id: string;
  drinkName: string;
  openingStock: number;
  newStock: number;
  totalStock: number;
  closingStock: number;
  drinksSold: number;
  price: number;
  amount: number;
  damages: number;
  transfers: number;
}

export interface ReceptionRow {
  id: string;
  customerName: string;
  sex: "Male" | "Female" | "Other";
  timeIn: string;
  timeOut: string;
  room: string;
  idNumber: string;
  pos: number;
  transfer: number;
  cash: number;
  duration: string;
  roomRate: number;
  amountPaid: number;
  existing: boolean;
}

export interface InventoryRow {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  department: "Store" | "Bar" | "VIP";
  inconsistency?: string;
}

export interface ApprovalRecord {
  id: string;
  module: AccountingModule;
  title: string;
  status: RecordState;
  debtStatus: "none" | "partial" | "full";
  cashAtHand: number;
  submittedBy: string;
  notes: string;
}

export interface DepartmentModuleState {
  id: string;
  module: "vip" | "bar";
  date: string;
  status: RecordState;
  rows: DepartmentRow[];
  transfersSection: number;
  pos: number;
  bossCollectedCash: number;
  debtsExplanation: string;
  submittedBy: string;
  warnings: string[];
}

export interface ReceptionModuleState {
  id: string;
  module: "reception";
  date: string;
  status: RecordState;
  rows: ReceptionRow[];
  submittedBy: string;
  warnings: string[];
}

export interface InventoryModuleState {
  id: string;
  module: "inventory";
  date: string;
  status: RecordState;
  purchases: InventoryRow[];
  transfersToBar: number;
  transfersToVip: number;
  flaggedInconsistencies: string[];
  submittedBy: string;
}

export interface AccountingPermissionProfile {
  role: UserRole;
  label: string;
  modules: AccountingModule[];
  readOnlyModules: AccountingModule[];
  editableModules: AccountingModule[];
  actions: AccountingAction[];
}

export interface ModuleOption {
  module: AccountingModule;
  label: string;
  description: string;
  route: string;
}
