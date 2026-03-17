import type { Tenant, Permissions } from '@/services/types';

interface TenantSelectorProps {
  tenants: Tenant[];
  selectedTenant: string | null;
  onSelect: (tenantId: string | null) => void;
  permissions: Permissions;
  currentTenantName?: string;
}

export function TenantSelector({
  tenants,
  selectedTenant,
  onSelect,
  permissions,
  currentTenantName,
}: TenantSelectorProps) {
  // Agents don't see the tenant selector at all
  if (!permissions.canSwitchTenant && !permissions.allowedTenantId) {
    return null;
  }

  // Client admins see a locked label — no dropdown
  if (!permissions.canSwitchTenant) {
    return (
      <div className="cc-tenant-locked">
        🔒 {currentTenantName || 'Your Organisation'}
      </div>
    );
  }

  // Super admin gets the full dropdown
  return (
    <select
      className="cc-tenant-select"
      value={selectedTenant || ''}
      onChange={(e) => onSelect(e.target.value || null)}
    >
      <option value="">All Clients</option>
      {tenants.map((t) => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  );
}
