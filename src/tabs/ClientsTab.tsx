import { useState } from 'react';
import type { TenantOnboarding, Permissions, NewClientForm } from '@/services/types';
import { OnboardingStageBadge } from '@/components/dashboard/OnboardingStageBadge';
import { ClientSignupModal } from '@/components/dashboard/ClientSignupModal';
import { ClientOnboardingPanel } from '@/components/dashboard/ClientOnboardingPanel';
import { getGoLiveBlockers, getGoLiveWarnings } from '@/utils/onboardingValidation';

interface Props {
  clients: TenantOnboarding[];
  permissions: Permissions;
  onCreateClient: (data: NewClientForm) => void;
  onAdvanceStage: (clientId: string) => void;
  onUpdateClient: (clientId: string, section: string, data: unknown) => Promise<void>;
  onRegressStage: (clientId: string, reason: string) => void;
}

export function ClientsTab({ clients, permissions, onCreateClient, onAdvanceStage, onUpdateClient, onRegressStage }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const visibleClients = permissions.canViewAllTenants
    ? clients
    : clients.filter((c) => c.id === permissions.allowedTenantId);

  const selectedClient = selectedClientId ? clients.find((c) => c.id === selectedClientId) ?? null : null;

  return (
    <div className="cc-fade-in">
      <div className="cc-section-header">
        <span className="cc-section-title">CLIENT ONBOARDING</span>
        {permissions.canSignUpClients && (
          <button className="cc-btn cc-btn-primary" onClick={() => setModalOpen(true)}>
            + New Client
          </button>
        )}
      </div>

      {visibleClients.length === 0 ? (
        <div className="cc-empty">
          <span className="cc-empty-icon">📋</span>
          <span className="cc-empty-text">No clients yet. Sign up your first client to get started.</span>
        </div>
      ) : (
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Industry</th>
                <th>Contact</th>
                <th>Stage</th>
                <th>Health</th>
                <th>Created</th>
                {permissions.canAdvanceOnboarding && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {visibleClients.map((c) => {
                const isLive = c.onboardingStage === 'live';
                const isNeedsRevision = c.onboardingStage === 'needs-revision';
                const blockers = getGoLiveBlockers(c);
                const warnings = getGoLiveWarnings(c);
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className="cc-client-dot"
                          style={{ background: c.brandColor }}
                        />
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="cc-table-mono">{c.industry}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{c.contactName || '—'}</div>
                      <div className="cc-table-mono cc-table-muted" style={{ fontSize: 11 }}>
                        {c.contactEmail || c.contactPhone || '—'}
                      </div>
                    </td>
                    <td><OnboardingStageBadge stage={c.onboardingStage} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {blockers.length > 0
                          ? <span className="cc-blocker-chip">⛔ {blockers.length}</span>
                          : isLive
                          ? <span className="cc-ok-chip">✓ Live</span>
                          : <span className="cc-ok-chip">✓ OK</span>
                        }
                        {warnings.length > 0 && (
                          <span className="cc-warning-chip">⚠ {warnings.length}</span>
                        )}
                      </div>
                    </td>
                    <td className="cc-table-mono cc-table-muted">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    {permissions.canAdvanceOnboarding && (
                      <td>
                        {isLive ? (
                          <span className="cc-table-muted">✓ Live</span>
                        ) : isNeedsRevision ? (
                          <span className="cc-table-muted" style={{ color: '#ef4444' }}>⚠ Revision</span>
                        ) : (
                          <button
                            className="cc-btn cc-btn-small cc-btn-ghost"
                            onClick={(e) => { e.stopPropagation(); onAdvanceStage(c.id); }}
                          >
                            Advance →
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ClientSignupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={onCreateClient}
      />

      {selectedClient && (
        <ClientOnboardingPanel
          client={selectedClient}
          permissions={permissions}
          onClose={() => setSelectedClientId(null)}
          onSaveSection={onUpdateClient}
          onAdvanceStage={onAdvanceStage}
          onRegressStage={onRegressStage}
        />
      )}
    </div>
  );
}
