import type { UserRole } from "../../../types/auth";
import { AccountingModuleWorkspace } from "../components/AccountingModuleWorkspace";

interface InventoryModulePageProps {
  role: UserRole;
}

export function InventoryModulePage({ role }: InventoryModulePageProps) {
  return <AccountingModuleWorkspace module="inventory" role={role} />;
}
