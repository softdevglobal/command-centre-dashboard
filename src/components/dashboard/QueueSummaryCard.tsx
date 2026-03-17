import type { Queue, Tenant } from '@/services/types';

interface QueueSummaryCardProps {
  queue: Queue;
  tenant?: Tenant;
  showTenant: boolean;
}

export function QueueSummaryCard({ queue, tenant, showTenant }: QueueSummaryCardProps) {
  return (
    <div className="cc-queue-card">
      <div className="cc-queue-header">
        <span className="cc-queue-icon">{queue.icon}</span>
        <div>
          <div className="cc-queue-name" style={{ color: queue.color }}>{queue.name}</div>
          {showTenant && tenant && (
            <div className="cc-queue-tenant">{tenant.name}</div>
          )}
        </div>
      </div>
      <div className="cc-queue-stats">
        <div>
          <div className="cc-queue-stat-label">Active</div>
          <div className="cc-queue-stat-value" style={{ color: queue.activeCalls > 0 ? 'var(--cc-color-red)' : 'var(--cc-text-secondary)' }}>
            {queue.activeCalls}
          </div>
        </div>
        <div>
          <div className="cc-queue-stat-label">Waiting</div>
          <div className="cc-queue-stat-value" style={{ color: queue.waitingCalls > 0 ? 'var(--cc-color-amber)' : 'var(--cc-text-secondary)' }}>
            {queue.waitingCalls}
          </div>
        </div>
        <div>
          <div className="cc-queue-stat-label">Ready</div>
          <div className="cc-queue-stat-value" style={{ color: 'var(--cc-color-green)' }}>
            {queue.availableAgents}
          </div>
        </div>
        <div>
          <div className="cc-queue-stat-label">Avg Wait</div>
          <div className="cc-queue-stat-value" style={{ color: 'var(--cc-text-secondary)' }}>
            {queue.avgWaitSeconds}s
          </div>
        </div>
      </div>
    </div>
  );
}
