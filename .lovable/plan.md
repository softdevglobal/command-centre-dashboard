

# Role Switcher Dropdown in Dashboard Header

## What We're Building

A dropdown in the header that lets you switch between Super Admin, Client Admin, and Agent roles live — no code editing needed. The entire dashboard (tabs, data, tenant selector) re-renders instantly when you pick a different role.

## How It Works

1. **Make `mockSession.ts` export all three sessions** and a setter function instead of a hardcoded return. Uncomment the Agent session.

2. **Create `src/components/dashboard/RoleSwitcher.tsx`** — a styled `<select>` dropdown showing:
   - Super Admin (Sarah Mitchell)
   - Client Admin (James Wilson)  
   - Agent (Ben Torres)
   
   Styled to match the dark theme. Sits in the header next to the clock.

3. **Update `useDashboardData.ts`** — instead of calling `fetchSession()` once on mount, accept a session override or expose a `setSession` so when the role switcher changes, the hook re-fetches all data with the new session's tenant context, resets the selected tab to "overview", and clears the tenant selection.

4. **Update `DashboardHeader.tsx`** — add the RoleSwitcher component, pass the current role and an `onRoleChange` callback.

5. **Update `DashboardPage.tsx`** — wire the role change callback to trigger a session swap and data reload.

## Files to Change

| File | Change |
|---|---|
| `src/services/mockSession.ts` | Export all 3 sessions as a map, add `getSessionByRole()` |
| `src/components/dashboard/RoleSwitcher.tsx` | **New** — role dropdown component |
| `src/hooks/useDashboardData.ts` | Add `switchRole` function that swaps session and reloads |
| `src/components/dashboard/DashboardHeader.tsx` | Render RoleSwitcher |
| `src/pages/DashboardPage.tsx` | Pass role switch handler down |
| `src/styles/dashboard.css` | Add `.cc-role-switcher` styles |

