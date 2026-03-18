import type { Tenant, Permissions, ConnectionStatus, UserRole } from '@/services/types';
import { ConnectionBadge } from './ConnectionBadge';
import { TenantSelector } from './TenantSelector';

interface DashboardHeaderProps {
  tenants: Tenant[];
  selectedTenant: string | null;
  onSelectTenant: (id: string | null) => void;
  connectionStatus: ConnectionStatus;
  clockStr: string;
  permissions: Permissions;
  displayName: string;
  currentRole: UserRole;
  onSignOut: () => Promise<void>;
}

export function DashboardHeader({
  tenants,
  selectedTenant,
  onSelectTenant,
  connectionStatus,
  clockStr,
  permissions,
  displayName,
  currentRole,
  onSignOut,
}: DashboardHeaderProps) {
  const currentTenant = tenants.find((t) => t.id === permissions.allowedTenantId);

  return (
    <header className="cc-header">
      <div className="cc-header-left">
        <div className="cc-header-logo">📡</div>
        <div>
          <div className="cc-header-title">COMMAND CENTRE</div>
          <div className="cc-header-subtitle">
            YEASTAR P-SERIES · {currentRole.toUpperCase()} · {displayName.toUpperCase()}
          </div>
        </div>
      </div>
      <div className="cc-header-right">
        <TenantSelector
          tenants={tenants}
          selectedTenant={selectedTenant}
          onSelect={onSelectTenant}
          permissions={permissions}
          currentTenantName={currentTenant?.name}
        />
        <ConnectionBadge status={connectionStatus} />
        <div className="cc-clock">{clockStr}</div>
        <button
          onClick={onSignOut}
          className="cc-role-select"
          style={{ cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
