import type { AgentStatus } from '@/services/types';

interface StatusBadgeProps {
  status: AgentStatus;
}

const STATUS_MAP: Record<AgentStatus, { label: string; color: string; bg: string }> = {
  'on-call':   { label: 'On Call',   color: 'var(--cc-color-red)',      bg: 'rgba(244,63,94,0.12)' },
  'available': { label: 'Available', color: 'var(--cc-color-green)',    bg: 'rgba(52,211,153,0.12)' },
  'wrap-up':   { label: 'Wrap-Up',   color: 'var(--cc-color-amber)',   bg: 'rgba(251,191,36,0.12)' },
  'break':     { label: 'Break',     color: 'var(--cc-color-slate)',   bg: 'rgba(100,116,139,0.12)' },
  'offline':   { label: 'Offline',   color: 'var(--cc-text-disabled)', bg: 'rgba(45,61,80,0.2)' },
};

export { STATUS_MAP };

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_MAP[status] || STATUS_MAP['offline'];
  return (
    <span className="cc-badge" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}
