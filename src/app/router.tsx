import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { ROUTES } from '../constants/api';
import { AccountingDashboardPage } from '../pages/AccountingDashboardPage';
import { VipModulePage } from '../pages/VipModulePage';
import { BarModulePage } from '../pages/BarModulePage';
import { ReceptionModulePage } from '../pages/ReceptionModulePage';
import { InventoryModulePage } from '../pages/InventoryModulePage';
import { BossApprovalPage } from '../pages/BossApprovalPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: ROUTES.ADMIN_LOGIN,
    element: <AdminLoginPage />,
  },
  {
    path: ROUTES.ADMIN_DASHBOARD,
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AccountingDashboardPage />,
      },
    ],
  },
  {
    path: ROUTES.ADMIN_VIP,
    element: (
      <ProtectedRoute requiredRoles={['vip-master', 'admin', 'boss']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <VipModulePage />,
      },
    ],
  },
  {
    path: ROUTES.ADMIN_BAR,
    element: (
      <ProtectedRoute requiredRoles={['bar-master', 'admin', 'boss']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <BarModulePage />,
      },
    ],
  },
  {
    path: ROUTES.ADMIN_RECEPTION,
    element: (
      <ProtectedRoute requiredRoles={['receptionist', 'admin', 'boss']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ReceptionModulePage />,
      },
    ],
  },
  {
    path: ROUTES.ADMIN_INVENTORY,
    element: (
      <ProtectedRoute requiredRoles={['admin', 'boss']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <InventoryModulePage />,
      },
    ],
  },
  {
    path: ROUTES.ADMIN_APPROVAL,
    element: (
      <ProtectedRoute requiredRoles={['boss']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <BossApprovalPage />,
      },
    ],
  },
]);
