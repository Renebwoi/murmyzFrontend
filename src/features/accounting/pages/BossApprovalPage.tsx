import type { UserRole } from "../../../types/auth";
import { AccountingModuleWorkspace } from "../components/AccountingModuleWorkspace";

interface BossApprovalPageProps {
  role: UserRole;
}

export function BossApprovalPage({ role }: BossApprovalPageProps) {
  return <AccountingModuleWorkspace module="approval" role={role} />;
}
