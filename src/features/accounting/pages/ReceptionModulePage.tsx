import type { UserRole } from "../../../types/auth";
import { AccountingModuleWorkspace } from "../components/AccountingModuleWorkspace";

interface ReceptionModulePageProps {
  role: UserRole;
}

export function ReceptionModulePage({ role }: ReceptionModulePageProps) {
  return <AccountingModuleWorkspace module="reception" role={role} />;
}
