import type { UserRole } from '../../types/auth';
import { ROUTES } from '../../constants/api';
import type { AccountingAction, AccountingModule, AccountingPermissionProfile, ModuleOption, RecordState } from './types';

export const ROLE_LABELS: Record<UserRole, string> = {
  boss: 'Boss',
  admin: 'Admin',
  'vip-master': 'VIP Master',
  'bar-master': 'Bar Master',
  receptionist: 'Receptionist',
};

export const MODULE_LABELS: Record<AccountingModule, string> = {
  vip: 'VIP Module',
  bar: 'Bar Module',
  reception: 'Reception Module',
  inventory: 'Admin Inventory',
  approval: 'Boss Approval',
};

export const MODULE_OPTIONS: ModuleOption[] = [
  {
    module: 'vip',
    label: 'VIP Module',
    description: 'Create and submit daily VIP records.',
    route: ROUTES.ADMIN_VIP,
  },
  {
    module: 'bar',
    label: 'Bar Module',
    description: 'Manage daily bar sales and stock movement.',
    route: ROUTES.ADMIN_BAR,
  },
  {
    module: 'reception',
    label: 'Reception Module',
    description: 'Track lodging, split payments, and room revenue.',
    route: ROUTES.ADMIN_RECEPTION,
  },
  {
    module: 'inventory',
    label: 'Admin Inventory',
    description: 'Record purchases, stock transfers, and inconsistencies.',
    route: ROUTES.ADMIN_INVENTORY,
  },
  {
    module: 'approval',
    label: 'Boss Approval',
    description: 'Review submitted records and sign off final accounts.',
    route: ROUTES.ADMIN_APPROVAL,
  },
];

export const RECORD_STATE_LABELS: Record<RecordState, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  approved: 'Approved',
  'partially-resolved': 'Partially Resolved',
  'fully-resolved': 'Fully Resolved',
};

export const ACCOUNTING_PERMISSION_PROFILE: Record<UserRole, AccountingPermissionProfile> = {
  boss: {
    role: 'boss',
    label: 'Boss',
    modules: ['vip', 'bar', 'reception', 'inventory', 'approval'],
    readOnlyModules: [],
    editableModules: ['vip', 'bar', 'reception', 'inventory'],
    actions: ['create', 'edit', 'submit', 'flag-inconsistency', 'approve', 'reject', 'reopen', 'confirm-cash', 'sign-off'],
  },
  admin: {
    role: 'admin',
    label: 'Admin',
    modules: ['vip', 'bar', 'reception', 'inventory'],
    readOnlyModules: ['vip', 'bar', 'reception'],
    editableModules: ['vip', 'bar', 'reception', 'inventory'],
    actions: ['create', 'edit', 'submit', 'flag-inconsistency'],
  },
  'vip-master': {
    role: 'vip-master',
    label: 'VIP Master',
    modules: ['vip'],
    readOnlyModules: [],
    editableModules: ['vip'],
    actions: ['create', 'edit', 'submit'],
  },
  'bar-master': {
    role: 'bar-master',
    label: 'Bar Master',
    modules: ['bar'],
    readOnlyModules: [],
    editableModules: ['bar'],
    actions: ['create', 'edit', 'submit'],
  },
  receptionist: {
    role: 'receptionist',
    label: 'Receptionist',
    modules: ['reception'],
    readOnlyModules: [],
    editableModules: ['reception'],
    actions: ['create', 'edit', 'submit'],
  },
};

export function getRoleLabel(role: UserRole) {
  return ROLE_LABELS[role];
}

export function getAccessibleModules(role: UserRole) {
  return ACCOUNTING_PERMISSION_PROFILE[role].modules;
}

export function canAccessModule(role: UserRole, module: AccountingModule) {
  return ACCOUNTING_PERMISSION_PROFILE[role].modules.includes(module);
}

export function canEditModule(role: UserRole, module: AccountingModule, state: RecordState) {
  const profile = ACCOUNTING_PERMISSION_PROFILE[role];
  return profile.editableModules.includes(module) && state === 'draft';
}

export function canPerformAction(role: UserRole, action: AccountingAction) {
  return ACCOUNTING_PERMISSION_PROFILE[role].actions.includes(action);
}

export function canBossApprove(role: UserRole) {
  return role === 'boss';
}

export function isFinalizedState(state: RecordState) {
  return state !== 'draft';
}

export function nextStateLabel(state: RecordState) {
  if (state === 'draft') return 'Ready to submit';
  if (state === 'submitted') return 'Awaiting boss review';
  if (state === 'reviewed') return 'Review complete';
  if (state === 'approved') return 'Approved and locked';
  if (state === 'partially-resolved') return 'Partially resolved';
  return 'Fully resolved';
}
