import type { Tenant, Permissions, ConnectionStatus } from '@/services/types';
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
}

export function DashboardHeader({
  tenants,
  selectedTenant,
  onSelectTenant,
  connectionStatus,
  clockStr,
  permissions,
  displayName,
}: DashboardHeaderProps) {
  const currentTenant = tenants.find((t) => t.id === permissions.allowedTenantId);

  return (
    <header className="cc-header">
      <div className="cc-header-left">
        <div className="cc-header-logo">📡</div>
        <div>
          <div className="cc-header-title">COMMAND CENTRE</div>
          <div className="cc-header-subtitle">
            YEASTAR S-SERIES · MULTI-TENANT OPS · {displayName.toUpperCase()}
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
      </div>
    </header>
  );
}
