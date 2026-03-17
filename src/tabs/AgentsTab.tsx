import { useState, useMemo } from 'react';
import type { Agent, Queue, Tenant, Permissions } from '@/services/types';
import { formatDuration, formatPhone } from '@/utils/formatters';
import { StatusBadge, STATUS_MAP } from '@/components/dashboard/StatusBadge';
import { LiveDot } from '@/components/dashboard/LiveDot';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface AgentsTabProps {
  agents: Agent[];
  queues: Queue[];
  tenants: Tenant[];
  permissions: Permissions;
  now: number;
}

export function AgentsTab({ agents, queues, tenants, permissions, now }: AgentsTabProps) {
  const [filterQueue, setFilterQueue] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Respect agent queue restrictions
  const visibleAgents = useMemo(() => {
    if (permissions.allowedQueueIds.length > 0) {
      return agents.filter((a) => a.queueIds.some((qid) => permissions.allowedQueueIds.includes(qid)));
    }
    return agents;
  }, [agents, permissions.allowedQueueIds]);

  const availableQueues = useMemo(() => {
    const qids = new Set(visibleAgents.flatMap((a) => a.queueIds));
    return queues.filter((q) => qids.has(q.id));
  }, [visibleAgents, queues]);

  const filtered = useMemo(() => {
    let list = visibleAgents;
    if (filterQueue !== 'all') list = list.filter((a) => a.queueIds.includes(filterQueue));
    if (filterStatus !== 'all') list = list.filter((a) => a.status === filterStatus);
    return list;
  }, [visibleAgents, filterQueue, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(STATUS_MAP).forEach((s) => {
      counts[s] = filtered.filter((a) => a.status === s).length;
    });
    return counts;
  }, [filtered]);

  return (
    <div className="cc-fade-in">
      {/* Queue Filters */}
      <div className="cc-filters">
        <button
          className={`cc-chip ${filterQueue === 'all' ? 'cc-chip-active' : ''}`}
          onClick={() => setFilterQueue('all')}
        >
          All Queues
        </button>
        {availableQueues.map((q) => (
          <button
            key={q.id}
            className={`cc-chip ${filterQueue === q.id ? 'cc-chip-active' : ''}`}
            onClick={() => setFilterQueue(q.id)}
            style={filterQueue === q.id ? { borderColor: q.color, color: q.color, background: `${q.color}0a` } : {}}
          >
            {q.icon} {q.name}
          </button>
        ))}
      </div>

      {/* Status Filters */}
      <div className="cc-filters">
        <button
          className={`cc-chip ${filterStatus === 'all' ? 'cc-chip-active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All Statuses
        </button>
        {Object.entries(STATUS_MAP).map(([key, val]) => (
          <button
            key={key}
            className={`cc-chip ${filterStatus === key ? 'cc-chip-active' : ''}`}
            onClick={() => setFilterStatus(key)}
            style={filterStatus === key ? { borderColor: val.color, color: val.color, background: val.bg } : {}}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Status Summary */}
      <div className="cc-status-bar">
        {Object.entries(STATUS_MAP).map(([key, val]) => (
          <div key={key} className="cc-status-item">
            <span className="cc-status-dot" style={{ background: val.color }} />
            <span className="cc-status-label">{val.label}</span>
            <span className="cc-status-count" style={{ color: val.color }}>
              {statusCounts[key] || 0}
            </span>
          </div>
        ))}
      </div>

      {/* Agent Cards */}
      {filtered.length === 0 ? (
        <EmptyState message="No agents match current filters" />
      ) : (
        <div className="cc-agents-grid">
          {filtered.map((a) => {
            const isLive = a.status === 'on-call';
            const qColor = queues.find((q) => a.queueIds.includes(q.id))?.color || 'var(--cc-color-cyan)';
            return (
              <div key={a.id} className={`cc-agent-card ${isLive ? 'cc-agent-card-live' : ''}`}>
                {isLive && <div className="cc-agent-card-live-bar" />}
                <div className="cc-agent-top">
                  <div>
                    <div className="cc-agent-name">{a.name}</div>
                    <div className="cc-agent-meta">
                      {a.queueName} · Ext {a.extension}
                      {permissions.canViewTenantNames && <> · {a.tenantName}</>}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                {isLive && a.callStartTime && (
                  <div className="cc-agent-call-info">
                    <span className="cc-agent-caller">{formatPhone(a.currentCaller)}</span>
                    <span className="cc-agent-duration">
                      <LiveDot /> {formatDuration(now - a.callStartTime)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
