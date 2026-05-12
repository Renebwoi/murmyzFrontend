# Murmyz Frontend AI Instructions

## Big picture
- This is a React 19 + TypeScript + Vite app for a hotel accounting/admin console.
- Public marketing UI lives in [src/App.tsx](src/App.tsx); authenticated admin flows live under [src/app/router.tsx](src/app/router.tsx).
- Authentication is centralized in [src/auth/AuthProvider.tsx](src/auth/AuthProvider.tsx) and route protection lives in [src/guards/ProtectedRoute.tsx](src/guards/ProtectedRoute.tsx).
- Feature pages are thin wrappers; most accounting behavior is in [src/features/accounting/components/AccountingModuleWorkspace.tsx](src/features/accounting/components/AccountingModuleWorkspace.tsx).

## Data flow and service boundaries
- Frontend talks to a backend API through [src/services/authService.ts](src/services/authService.ts), [src/services/accountingService.ts](src/services/accountingService.ts), and [src/services/debtLedgerService.ts](src/services/debtLedgerService.ts).
- API base URL comes from Vite env `VITE_API_URL`; default is `http://localhost:5000/api` in [src/constants/api.ts](src/constants/api.ts).
- Auth tokens and user data are stored in `localStorage`; authenticated requests send `Authorization: Bearer <token>` and `credentials: include`.
- The accounting workspace now loads from the backend on mount; do not reintroduce mock seed data as the source of truth.

## Accounting module patterns
- [src/features/accounting/permissions.ts](src/features/accounting/permissions.ts) defines role/module access, readable labels, and allowed actions.
- [src/features/accounting/pages/*.tsx](src/features/accounting/pages) are wrappers that pass the logged-in user role into the shared workspace.
- `AccountingModuleWorkspace` handles autosave with debounced `useEffect` calls, record selection, and create/submit flows.
- Debt ledger state is cached client-side inside [src/services/debtLedgerService.ts](src/services/debtLedgerService.ts) and refreshed via a custom window event.

## Conventions to follow
- Prefer small wrapper pages and keep shared logic in feature components or services.
- Use the existing service layer for all API work; avoid direct `fetch` calls in components unless extending a service.
- Preserve the role-based gating already enforced by `ProtectedRoute`, `canAccessModule()`, `canEditModule()`, and `canPerformAction()`.
- Keep state normalization close to the service boundary; the workspace uses backend responses plus local blank record factories.
- Comments should explain non-obvious business rules, not obvious JSX or React mechanics.

## Developer workflow
- Run `npm run build` for a full TypeScript + Vite production check.
- Run `npm run lint` for formatting and lint validation.
- `npm run dev` starts the Vite app.
- There are no project test scripts in `package.json`; validate behavior by building/linting and by exercising the backend-backed flows.

## Files that show the intended structure
- [src/app/router.tsx](src/app/router.tsx) for all route composition.
- [src/layouts/AdminLayout.tsx](src/layouts/AdminLayout.tsx) for authenticated shell/navigation.
- [src/features/accounting/pages/AccountingDashboardPage.tsx](src/features/accounting/pages/AccountingDashboardPage.tsx) for module cards.
- [src/features/accounting/components/AccountingModuleWorkspace.tsx](src/features/accounting/components/AccountingModuleWorkspace.tsx) for the core accounting UX and autosave logic.
