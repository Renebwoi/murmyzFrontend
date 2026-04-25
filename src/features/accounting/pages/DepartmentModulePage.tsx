import type { UserRole } from '../../../types/auth';
import { AccountingModuleWorkspace } from '../components/AccountingModuleWorkspace';

interface DepartmentModulePageProps {
  module: 'vip' | 'bar';
  role: UserRole;
}

export function DepartmentModulePage({ module, role }: DepartmentModulePageProps) {
  return <AccountingModuleWorkspace module={module} role={role} />;
}
