import { useAuth } from '../auth/AuthProvider';
import { ReceptionModulePage as FeatureReceptionModulePage } from '../features/accounting/pages/ReceptionModulePage';

export function ReceptionModulePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <FeatureReceptionModulePage role={user.role} />;
}
