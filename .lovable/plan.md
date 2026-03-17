

## Plan: Add Supervisor Role

### Overview
Add a **Supervisor** role that sits between Client Admin and Agent — can monitor agents, view calls, and oversee onboarding but cannot create clients or approve go-live.

### Changes

**1. `src/services/types.ts`**
- Add `'supervisor'` to the `UserRole` union type

**2. `src/utils/permissions.ts`**
- Add `isSupervisor` flag
- Supervisors get: `canViewCallsTab`, `canViewAgentsTab`, `canViewOverviewTab`, `canViewClientsTab`, `canEditClientDetails`, `canRegressStage`
- Supervisors do NOT get: `canViewAllTenants`, `canSwitchTenant`, `canViewSipInfrastructure`, `canSignUpClients`, `canAdvanceOnboarding`, `canApproveGoLive`
- Supervisor is tenant-locked (like client-admin)

**3. `src/services/mockSession.ts`**
- Add a `'supervisor'` session entry (e.g., "Lisa Chen", tenant `t-001`, with queue access)

**4. `src/components/dashboard/RoleSwitcher.tsx`**
- Add `'supervisor': '👁 Supervisor'` to `ROLE_LABELS`

### No other files need changes
The permissions system is already consumed via the `Permissions` interface — all tabs, headers, and components read permission flags, so the new role will automatically get correct UI visibility.

