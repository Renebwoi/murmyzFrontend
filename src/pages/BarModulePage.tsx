import { useAuth } from "../auth/AuthProvider";
import { DepartmentModulePage } from "../features/accounting/pages/DepartmentModulePage";

export function BarModulePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <DepartmentModulePage module="bar" role={user.role} />;
}
