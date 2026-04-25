import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthProvider';
import { ModuleCard } from '../components/ModuleCard';
import { MODULE_OPTIONS, getAccessibleModules, getRoleLabel } from '../permissions';
import './AccountingDashboardPage.css';

export function AccountingDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const accessibleModules = getAccessibleModules(user.role);
  const moduleCount = accessibleModules.length;

  return (
    <div className="accounting-dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Accounting dashboard</p>
          <h2>{getRoleLabel(user.role)} workspace</h2>
          <p>Role-based access is enforced strictly. Only permitted modules and actions are shown.</p>
        </div>
        <div className="dashboard-stamp">
          <span>Role</span>
          <strong>{getRoleLabel(user.role)}</strong>
          <small>{moduleCount} accessible module{moduleCount === 1 ? '' : 's'}</small>
        </div>
      </div>

      <div className="dashboard-grid">
        {MODULE_OPTIONS.map((option) => (
          <ModuleCard
            key={option.module}
            module={option.module}
            description={option.description}
            allowed={accessibleModules.includes(option.module)}
            subtitle={option.route}
            onOpen={() => navigate(option.route)}
          />
        ))}
      </div>
    </div>
  );
}
