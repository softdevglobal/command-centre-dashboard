import type { SipLine, Tenant, Permissions } from '@/services/types';
import { formatDuration, formatPhone } from '@/utils/formatters';
import { LiveDot } from '@/components/dashboard/LiveDot';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface SipLinesTabProps {
  sipLines: SipLine[];
  tenants: Tenant[];
  permissions: Permissions;
  now: number;
}

export function SipLinesTab({ sipLines, tenants, permissions, now }: SipLinesTabProps) {
  // Only super-admin should see this tab — double-check
  if (!permissions.canViewSipInfrastructure) {
    return <EmptyState message="You do not have permission to view SIP infrastructure." />;
  }

  const activeCount = sipLines.filter((l) => l.status === 'active').length;
  const idleCount = sipLines.filter((l) => l.status === 'idle').length;

  return (
    <div className="cc-fade-in">
      <div className="cc-section-head" style={{ marginBottom: 18 }}>
        Yeastar SIP Trunks
        <div className="cc-sip-summary" style={{ marginBottom: 0, marginLeft: 16 }}>
          <span>
            <span className="cc-status-count" style={{ color: 'var(--cc-color-red)' }}>{activeCount}</span>
            <span className="cc-sip-summary-label" style={{ marginLeft: 4 }}>in use</span>
          </span>
          <span>
            <span className="cc-status-count" style={{ color: 'var(--cc-color-green)' }}>{idleCount}</span>
            <span className="cc-sip-summary-label" style={{ marginLeft: 4 }}>available</span>
          </span>
        </div>
      </div>

      {sipLines.length === 0 ? (
        <EmptyState message="No SIP lines configured" />
      ) : (
        <div className="cc-sip-grid">
          {sipLines.map((l) => {
            const isActive = l.status === 'active';
            const tenant = l.tenantId ? tenants.find((t) => t.id === l.tenantId) : null;
            return (
              <div key={l.id} className={`cc-sip-card ${isActive ? 'cc-sip-active' : ''}`}>
                {isActive && <div className="cc-sip-active-bar" />}
                <div className="cc-sip-top">
                  <span className="cc-sip-label">{l.label}</span>
                  <span
                    className="cc-badge"
                    style={{
                      color: isActive ? 'var(--cc-color-red)' : 'var(--cc-color-green)',
                      background: isActive ? 'rgba(244,63,94,0.12)' : 'rgba(52,211,153,0.12)',
                    }}
                  >
                    {isActive ? 'IN USE' : 'IDLE'}
                  </span>
                </div>
                {isActive ? (
                  <>
                    <div className="cc-sip-call-row">
                      <span className="cc-table-mono" style={{ fontSize: 12 }}>
                        {formatPhone(l.activeCaller)}
                      </span>
                      <span className="cc-table-mono" style={{ color: 'var(--cc-color-red)', fontWeight: 700 }}>
                        <LiveDot /> {l.activeSince ? formatDuration(now - l.activeSince) : '—'}
                      </span>
                    </div>
                    {permissions.canViewTenantNames && tenant && (
                      <div style={{ marginTop: 6, fontFamily: 'var(--cc-font-mono)', fontSize: 10, color: 'var(--cc-text-muted)' }}>
                        {tenant.name}
                      </div>
                    )}
                    <div style={{ marginTop: 4, fontFamily: 'var(--cc-font-mono)', fontSize: 9, color: 'var(--cc-text-disabled)' }}>
                      {l.trunkName}
                    </div>
                  </>
                ) : (
                  <div className="cc-sip-idle-text">No active call</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
