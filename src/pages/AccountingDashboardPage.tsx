import { useAuth } from "../auth/AuthProvider";
import { AccountingDashboardPage as FeatureDashboardPage } from "../features/accounting/pages/AccountingDashboardPage";

export function AccountingDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <FeatureDashboardPage />;
}
