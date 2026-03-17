import '@/styles/dashboard.css';

import type { TabDef } from '@/services/types';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useLiveClock } from '@/hooks/useLiveClock';
import { usePermissions } from '@/hooks/usePermissions';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton';
import { OverviewTab } from '@/tabs/OverviewTab';
import { AgentsTab } from '@/tabs/AgentsTab';
import { CallsTab } from '@/tabs/CallsTab';
import { SipLinesTab } from '@/tabs/SipLinesTab';

const TABS: TabDef[] = [
  { key: 'overview', label: 'Overview', icon: '◉' },
  { key: 'agents', label: 'Agents', icon: '◎' },
  { key: 'calls', label: 'Calls', icon: '◈' },
  { key: 'sip', label: 'SIP Lines', icon: '◇' },
];

export default function DashboardPage() {
  const d = useDashboardData();
  const { formatted: clockStr } = useLiveClock();
  const permissions = usePermissions(d.session);

  return (
    <div className="cc-root">
      <DashboardHeader
        tenants={d.tenants}
        selectedTenant={d.selectedTenant}
        onSelectTenant={d.setSelectedTenant}
        connectionStatus={d.connectionStatus}
        clockStr={clockStr}
        permissions={permissions}
        displayName={d.session?.displayName || ''}
      />

      <DashboardTabs
        tabs={TABS}
        selectedTab={d.selectedTab}
        onSelect={d.setSelectedTab}
        permissions={permissions}
      />

      <main className="cc-main">
        {/* Error Banner */}
        {d.error && (
          <div className="cc-error-banner">
            <span>⚠ {d.error}</span>
            <button className="cc-error-retry" onClick={d.refresh}>Retry</button>
          </div>
        )}

        {d.loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {d.selectedTab === 'overview' && (
              <OverviewTab
                summary={d.summary}
                queues={d.queues}
                agents={d.agents}
                tenants={d.tenants}
                permissions={permissions}
                now={d.now}
              />
            )}
            {d.selectedTab === 'agents' && (
              <AgentsTab
                agents={d.agents}
                queues={d.queues}
                tenants={d.tenants}
                permissions={permissions}
                now={d.now}
              />
            )}
            {d.selectedTab === 'calls' && (
              <CallsTab
                calls={d.calls}
                queues={d.queues}
                tenants={d.tenants}
                permissions={permissions}
              />
            )}
            {d.selectedTab === 'sip' && (
              <SipLinesTab
                sipLines={d.sipLines}
                tenants={d.tenants}
                permissions={permissions}
                now={d.now}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
