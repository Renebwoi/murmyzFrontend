import { useAuth } from '../auth/AuthProvider';
import { DepartmentModulePage } from '../features/accounting/pages/DepartmentModulePage';

export function VipModulePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <DepartmentModulePage module="vip" role={user.role} />;
}
