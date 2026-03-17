import { useState, useMemo } from 'react';
import type { Call, Queue, Tenant, Permissions } from '@/services/types';
import { formatTime, formatPhone, formatSeconds } from '@/utils/formatters';
import { ResultBadge, RESULT_MAP } from '@/components/dashboard/ResultBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface CallsTabProps {
  calls: Call[];
  queues: Queue[];
  tenants: Tenant[];
  permissions: Permissions;
}

export function CallsTab({ calls, queues, tenants, permissions }: CallsTabProps) {
  const [filterResult, setFilterResult] = useState('all');
  const [filterQueue, setFilterQueue] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const availableQueues = useMemo(() => {
    const qids = new Set(calls.map((c) => c.queueId));
    return queues.filter((q) => qids.has(q.id));
  }, [calls, queues]);

  const filtered = useMemo(() => {
    let list = calls;
    if (filterResult !== 'all') list = list.filter((c) => c.result === filterResult);
    if (filterQueue !== 'all') list = list.filter((c) => c.queueId === filterQueue);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter((c) =>
        c.callerNumber.includes(s) ||
        c.agentName.toLowerCase().includes(s) ||
        c.queueName.toLowerCase().includes(s) ||
        (c.callerName && c.callerName.toLowerCase().includes(s))
      );
    }
    return list;
  }, [calls, filterResult, filterQueue, searchTerm]);

  return (
    <div className="cc-fade-in">
      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <input
          className="cc-search-input"
          type="text"
          placeholder="Search by caller, agent, queue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Result Filters */}
      <div className="cc-filters">
        <button
          className={`cc-chip ${filterResult === 'all' ? 'cc-chip-active' : ''}`}
          onClick={() => setFilterResult('all')}
        >
          All Results
        </button>
        {Object.entries(RESULT_MAP).map(([key, val]) => (
          <button
            key={key}
            className={`cc-chip ${filterResult === key ? 'cc-chip-active' : ''}`}
            onClick={() => setFilterResult(key)}
            style={filterResult === key ? { borderColor: val.color, color: val.color, background: val.bg } : {}}
          >
            {val.label}
          </button>
        ))}
      </div>

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

      {/* Calls Table */}
      <div className="cc-table-wrap">
        <table className="cc-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Caller</th>
              <th>Client</th>
              <th>Queue</th>
              <th>Agent</th>
              <th>Duration</th>
              <th>Result</th>
              <th>Transcript</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={permissions.canViewTenantNames ? 8 : 7}>
                  <EmptyState message="No calls match filters" />
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="cc-table-mono">{formatTime(c.startTime)}</td>
                <td className="cc-table-mono">
                  {formatPhone(c.callerNumber)}
                  {c.callerName && (
                    <div style={{ fontSize: 10, color: 'var(--cc-text-muted)', marginTop: 1 }}>
                      {c.callerName}
                    </div>
                  )}
                </td>
                {permissions.canViewTenantNames && <td className="cc-table-muted">{c.tenantName}</td>}
                <td>
                  <span
                    className="cc-badge cc-badge-queue"
                    style={{
                      color: queues.find((q) => q.id === c.queueId)?.color || 'var(--cc-color-cyan)',
                      background: `${queues.find((q) => q.id === c.queueId)?.color || 'var(--cc-color-cyan)'}18`,
                    }}
                  >
                    {c.queueName}
                  </span>
                </td>
                <td>{c.agentName}</td>
                <td className="cc-table-mono">{c.durationSeconds > 0 ? formatSeconds(c.durationSeconds) : '—'}</td>
                <td><ResultBadge result={c.result} /></td>
                <td>
                  <TranscriptIndicator status={c.transcriptStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TranscriptIndicator({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    ready: { label: '✓ Ready', color: 'var(--cc-color-green)', bg: 'rgba(52,211,153,0.1)' },
    processing: { label: '⟳ Processing', color: 'var(--cc-color-amber)', bg: 'rgba(251,191,36,0.1)' },
    pending: { label: '◌ Pending', color: 'var(--cc-text-muted)', bg: 'rgba(77,95,117,0.1)' },
    none: { label: '—', color: 'var(--cc-text-disabled)', bg: 'transparent' },
  };
  const s = map[status] || map['none'];
  return (
    <span className="cc-transcript-badge" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}
