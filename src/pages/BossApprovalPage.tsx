import { useAuth } from '../auth/AuthProvider';
import { BossApprovalPage as FeatureBossApprovalPage } from '../features/accounting/pages/BossApprovalPage';

export function BossApprovalPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <FeatureBossApprovalPage role={user.role} />;
}
