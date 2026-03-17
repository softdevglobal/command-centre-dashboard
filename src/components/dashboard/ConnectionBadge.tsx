import type { ConnectionStatus } from '@/services/types';

interface ConnectionBadgeProps {
  status: ConnectionStatus;
}

const LABELS: Record<ConnectionStatus, string> = {
  connected: 'CONNECTED',
  reconnecting: 'RECONNECTING',
  disconnected: 'DISCONNECTED',
};

export function ConnectionBadge({ status }: ConnectionBadgeProps) {
  return (
    <div className={`cc-conn-badge cc-conn-${status}`}>
      <span className="cc-conn-dot">
        <span className="cc-conn-dot-inner" />
        <span className="cc-conn-dot-ring" />
      </span>
      <span className="cc-conn-label">{LABELS[status]}</span>
    </div>
  );
}
