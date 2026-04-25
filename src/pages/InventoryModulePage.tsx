import { useAuth } from '../auth/AuthProvider';
import { InventoryModulePage as FeatureInventoryModulePage } from '../features/accounting/pages/InventoryModulePage';

export function InventoryModulePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <FeatureInventoryModulePage role={user.role} />;
}
