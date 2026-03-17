import { useState, useCallback } from 'react';
import type {
  TenantOnboarding, Permissions, BusinessHours, OnboardingQueue,
  FaqEntry, TestCall, TransferRule,
} from '@/services/types';
import { OnboardingStageBadge } from './OnboardingStageBadge';
import {
  validateClientDetails, validateBusinessRules, validateQueueSetup,
  validateScriptKnowledgeBase, validateBookingRules, validateTestingGoLive,
  getGoLiveBlockers, getGoLiveWarnings,
} from '@/utils/onboardingValidation';

/* ─────────────────────────────── Props ─────────────────────────────── */
interface Props {
  client: TenantOnboarding;
  permissions: Permissions;
  onClose: () => void;
  onSaveSection: (clientId: string, section: string, data: unknown) => Promise<void>;
  onAdvanceStage: (clientId: string) => void;
  onRegressStage: (clientId: string, reason: string) => void;
}

type SectionKey = 'details' | 'rules' | 'queues' | 'script' | 'booking' | 'testing' | 'log';

interface SectionTab {
  key: SectionKey;
  label: string;
  errorCount: (c: TenantOnboarding) => number;
}

const SECTION_TABS: SectionTab[] = [
  { key: 'details', label: '1. Details', errorCount: (c) => validateClientDetails(c).filter(i => i.severity === 'blocker').length },
  { key: 'rules',   label: '2. Rules',   errorCount: (c) => validateBusinessRules(c).filter(i => i.severity === 'blocker').length },
  { key: 'queues',  label: '3. Queues',  errorCount: (c) => validateQueueSetup(c).filter(i => i.severity === 'blocker').length },
  { key: 'script',  label: '4. Script',  errorCount: (c) => validateScriptKnowledgeBase(c).filter(i => i.severity === 'blocker').length },
  { key: 'booking', label: '5. Booking', errorCount: (c) => validateBookingRules(c).filter(i => i.severity === 'blocker').length },
  { key: 'testing', label: '6. Testing', errorCount: (c) => validateTestingGoLive(c).filter(i => i.severity === 'blocker').length },
  { key: 'log',     label: '7. Log',     errorCount: () => 0 },
];

/* ─────────────────────────── Main Panel ─────────────────────────────── */
export function ClientOnboardingPanel({ client, permissions, onClose, onSaveSection, onAdvanceStage, onRegressStage }: Props) {
  const [section, setSection] = useState<SectionKey>('details');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [regressReason, setRegressReason] = useState('');
  const [showRegressInput, setShowRegressInput] = useState(false);

  const blockers = getGoLiveBlockers(client);
  const warnings = getGoLiveWarnings(client);

  const handleSave = useCallback(async (sectionKey: string, data: unknown) => {
    setSaving(true);
    setSavedMsg('');
    try {
      await onSaveSection(client.id, sectionKey, data);
      setSavedMsg('Saved');
      setTimeout(() => setSavedMsg(''), 2000);
    } finally {
      setSaving(false);
    }
  }, [client.id, onSaveSection]);

  const isLive = client.onboardingStage === 'live';
  const canEdit = permissions.canEditClientDetails;

  return (
    <>
      {/* Backdrop */}
      <div className="cc-panel-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="cc-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="cc-panel-header">
          <div>
            <div className="cc-panel-client-name" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: client.brandColor,
                  flexShrink: 0,
                }}
              />
              {client.name}
            </div>
            <div className="cc-panel-client-meta">
              {client.industry} · {client.contactName} · {client.contactEmail || client.contactPhone}
            </div>
          </div>
          <button className="cc-panel-close" onClick={onClose}>✕</button>
        </div>

        {/* Stage row */}
        <div className="cc-panel-stage-row">
          <OnboardingStageBadge stage={client.onboardingStage} />
          {blockers.length > 0 && (
            <span className="cc-blocker-chip">⛔ {blockers.length} blocker{blockers.length !== 1 ? 's' : ''}</span>
          )}
          {warnings.length > 0 && (
            <span className="cc-warning-chip">⚠ {warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>
          )}
          {blockers.length === 0 && warnings.length === 0 && (
            <span className="cc-ok-chip">✓ Ready</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!isLive && permissions.canAdvanceOnboarding && (
              <button
                className="cc-btn cc-btn-small cc-btn-primary"
                onClick={() => onAdvanceStage(client.id)}
              >
                Advance →
              </button>
            )}
            {permissions.canRegressStage && !isLive && (
              <button
                className="cc-btn cc-btn-small cc-btn-ghost"
                style={{ borderColor: 'rgba(244,63,94,0.4)', color: 'var(--cc-color-red)' }}
                onClick={() => setShowRegressInput((v) => !v)}
              >
                ← Needs Revision
              </button>
            )}
          </div>
        </div>

        {/* Regress reason input */}
        {showRegressInput && (
          <div style={{ padding: '10px 24px', background: 'rgba(244,63,94,0.06)', borderBottom: '1px solid rgba(244,63,94,0.2)', display: 'flex', gap: 8 }}>
            <input
              className="cc-form-input"
              style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
              placeholder="Reason for revision (optional)…"
              value={regressReason}
              onChange={(e) => setRegressReason(e.target.value)}
            />
            <button
              className="cc-btn cc-btn-small"
              style={{ background: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.4)', color: 'var(--cc-color-red)' }}
              onClick={() => {
                onRegressStage(client.id, regressReason);
                setShowRegressInput(false);
                setRegressReason('');
              }}
            >
              Confirm
            </button>
          </div>
        )}

        {/* Section tabs */}
        <div className="cc-panel-tabs">
          {SECTION_TABS.map((tab) => {
            const errCount = tab.errorCount(client);
            return (
              <button
                key={tab.key}
                className={`cc-panel-tab ${section === tab.key ? 'cc-panel-tab-active' : ''} ${errCount > 0 && section !== tab.key ? 'cc-panel-tab-error' : ''}`}
                onClick={() => setSection(tab.key)}
              >
                {errCount > 0 && section !== tab.key && <span className="cc-panel-tab-dot" />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Section body */}
        <div className="cc-panel-body">
          {section === 'details' && (
            <ClientDetailsSection
              client={client}
              canEdit={canEdit}
              onSave={(data) => handleSave('clientDetails', data)}
              saving={saving}
            />
          )}
          {section === 'rules' && (
            <BusinessRulesSection
              client={client}
              canEdit={canEdit}
              onSave={(data) => handleSave('businessRules', data)}
              saving={saving}
            />
          )}
          {section === 'queues' && (
            <QueueSetupSection
              client={client}
              canEdit={canEdit}
              onSave={(data) => handleSave('queueSetup', data)}
              saving={saving}
            />
          )}
          {section === 'script' && (
            <ScriptSection
              client={client}
              canEdit={canEdit}
              onSave={(data) => handleSave('scriptKnowledgeBase', data)}
              saving={saving}
            />
          )}
          {section === 'booking' && (
            <BookingRulesSection
              client={client}
              canEdit={canEdit}
              onSave={(data) => handleSave('bookingRules', data)}
              saving={saving}
            />
          )}
          {section === 'testing' && (
            <TestingGoLiveSection
              client={client}
              canEdit={canEdit}
              onSave={(data) => handleSave('testingGoLive', data)}
              saving={saving}
            />
          )}
          {section === 'log' && <ActivityLogSection client={client} />}
        </div>

        {/* Footer */}
        {section !== 'log' && (
          <div className="cc-panel-footer">
            <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, color: 'var(--cc-text-muted)' }}>
              {savedMsg
                ? <span style={{ color: 'var(--cc-color-green)' }}>✓ {savedMsg}</span>
                : canEdit ? 'Edit fields above then save' : 'View only — no edit permission'}
            </span>
            <button className="cc-btn cc-btn-ghost" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════ Shared helpers ════════════════════════════ */

function SectionValidation({ issues }: { issues: ReturnType<typeof validateClientDetails> }) {
  const blockers = issues.filter((i) => i.severity === 'blocker');
  const warnings = issues.filter((i) => i.severity === 'warning');
  if (issues.length === 0) return (
    <div className="cc-validation-box cc-validation-box-ok" style={{ marginBottom: 18 }}>
      <div className="cc-validation-box-title" style={{ color: 'var(--cc-color-green)' }}>✓ Section Complete</div>
    </div>
  );
  return (
    <>
      {blockers.length > 0 && (
        <div className="cc-validation-box cc-validation-box-blockers">
          <div className="cc-validation-box-title" style={{ color: 'var(--cc-color-red)' }}>
            ⛔ {blockers.length} Blocker{blockers.length !== 1 ? 's' : ''}
          </div>
          {blockers.map((b, i) => (
            <div key={i} className="cc-validation-item" style={{ color: 'var(--cc-color-red)' }}>
              <span className="cc-validation-icon">•</span>{b.message}
            </div>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="cc-validation-box cc-validation-box-warnings">
          <div className="cc-validation-box-title" style={{ color: 'var(--cc-color-amber)' }}>
            ⚠ {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
          </div>
          {warnings.map((w, i) => (
            <div key={i} className="cc-validation-item" style={{ color: 'var(--cc-color-amber)' }}>
              <span className="cc-validation-icon">•</span>{w.message}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="cc-form-label" style={{ marginTop: 0, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="cc-form-row" style={{ marginBottom: 0 }}>{children}</div>;
}

function Toggle({
  checked, onChange, label, sub, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string; disabled?: boolean }) {
  return (
    <div className="cc-toggle-row">
      <div>
        <div className="cc-toggle-label">{label}</div>
        {sub && <div className="cc-toggle-sub">{sub}</div>}
      </div>
      <label className="cc-toggle">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="cc-toggle-slider" />
      </label>
    </div>
  );
}

function SaveBar({ saving, onSave, canEdit }: { saving: boolean; onSave: () => void; canEdit: boolean }) {
  if (!canEdit) return null;
  return (
    <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid var(--cc-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
      <button className="cc-btn cc-btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Section'}
      </button>
    </div>
  );
}

/* ─── Business Hours Editor ─── */
const DAYS: { key: BusinessHours['day']; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

function BusinessHoursEditor({
  value, onChange, disabled,
}: { value: BusinessHours[]; onChange: (v: BusinessHours[]) => void; disabled?: boolean }) {
  const getDay = (day: BusinessHours['day']): BusinessHours =>
    value.find((d) => d.day === day) ?? { day, open: '09:00', close: '17:00', closed: false };

  const updateDay = (day: BusinessHours['day'], patch: Partial<BusinessHours>) => {
    const existing = getDay(day);
    const updated = value.filter((d) => d.day !== day);
    onChange([...updated, { ...existing, ...patch }]);
  };

  return (
    <table className="cc-bh-table">
      <tbody>
        {DAYS.map(({ key, label }) => {
          const d = getDay(key);
          return (
            <tr key={key}>
              <td>{label}</td>
              <td>
                <input
                  type="time"
                  className="cc-bh-time-input"
                  value={d.open}
                  disabled={disabled || d.closed}
                  onChange={(e) => updateDay(key, { open: e.target.value })}
                />
              </td>
              <td style={{ paddingLeft: 4, paddingRight: 4, color: 'var(--cc-text-muted)', fontSize: 11 }}>to</td>
              <td>
                <input
                  type="time"
                  className="cc-bh-time-input"
                  value={d.close}
                  disabled={disabled || d.closed}
                  onChange={(e) => updateDay(key, { close: e.target.value })}
                />
              </td>
              <td>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--cc-font-mono)', fontSize: 11, color: 'var(--cc-text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={d.closed}
                    disabled={disabled}
                    onChange={(e) => updateDay(key, { closed: e.target.checked })}
                  />
                  Closed
                </label>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ─── Tag Input ─── */
function TagInput({
  value, onChange, placeholder, disabled,
}: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; disabled?: boolean }) {
  const [input, setInput] = useState('');
  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          className="cc-form-input"
          style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
          placeholder={placeholder ?? 'Add item…'}
          value={input}
          disabled={disabled}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
        />
        <button className="cc-btn cc-btn-ghost cc-btn-small" onClick={addTag} disabled={disabled}>+ Add</button>
      </div>
      {value.length > 0 && (
        <div className="cc-tags">
          {value.map((tag) => (
            <span key={tag} className="cc-tag">
              {tag}
              {!disabled && (
                <button className="cc-tag-remove" onClick={() => onChange(value.filter((t) => t !== tag))}>×</button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ 1. Client Details ════════════════════════ */
function ClientDetailsSection({ client, canEdit, onSave, saving }: {
  client: TenantOnboarding; canEdit: boolean; onSave: (d: unknown) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...client.clientDetails });
  const issues = validateClientDetails({ ...client, clientDetails: form });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <SectionValidation issues={issues} />

      <Row>
        <div className="cc-form-field">
          <Field label="Business Name *">
            <input className="cc-form-input" value={form.businessName} disabled={!canEdit}
              onChange={(e) => set('businessName', e.target.value)} />
          </Field>
        </div>
        <div className="cc-form-field">
          <Field label="ABN">
            <input className="cc-form-input" value={form.abn} disabled={!canEdit}
              onChange={(e) => set('abn', e.target.value)} />
          </Field>
        </div>
      </Row>

      <Row>
        <div className="cc-form-field">
          <Field label="Industry">
            <input className="cc-form-input" value={form.industry} disabled={!canEdit}
              onChange={(e) => set('industry', e.target.value)} />
          </Field>
        </div>
        <div className="cc-form-field">
          <Field label="Timezone">
            <select className="cc-form-select" value={form.timezone} disabled={!canEdit}
              onChange={(e) => set('timezone', e.target.value)}>
              <option value="">— Select —</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
              <option value="Australia/Melbourne">Australia/Melbourne</option>
              <option value="Australia/Brisbane">Australia/Brisbane</option>
              <option value="Australia/Adelaide">Australia/Adelaide</option>
              <option value="Australia/Perth">Australia/Perth</option>
              <option value="Australia/Darwin">Australia/Darwin</option>
              <option value="Australia/Hobart">Australia/Hobart</option>
              <option value="Pacific/Auckland">Pacific/Auckland</option>
            </select>
          </Field>
        </div>
      </Row>

      <div style={{ marginTop: 18, marginBottom: 8, fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
        Primary Contact
      </div>
      <Row>
        <div className="cc-form-field">
          <Field label="Name *">
            <input className="cc-form-input" value={form.primaryContactName} disabled={!canEdit}
              onChange={(e) => set('primaryContactName', e.target.value)} />
          </Field>
        </div>
        <div className="cc-form-field">
          <Field label="Phone *">
            <input className="cc-form-input" value={form.primaryContactPhone} disabled={!canEdit}
              onChange={(e) => set('primaryContactPhone', e.target.value)} />
          </Field>
        </div>
      </Row>
      <Field label="Email *">
        <input className="cc-form-input" value={form.primaryContactEmail} disabled={!canEdit}
          onChange={(e) => set('primaryContactEmail', e.target.value)} />
      </Field>

      <div style={{ marginTop: 18, marginBottom: 8, fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
        Billing Contact
      </div>
      <Row>
        <div className="cc-form-field">
          <Field label="Name">
            <input className="cc-form-input" value={form.billingContactName} disabled={!canEdit}
              onChange={(e) => set('billingContactName', e.target.value)} />
          </Field>
        </div>
        <div className="cc-form-field">
          <Field label="Email">
            <input className="cc-form-input" value={form.billingContactEmail} disabled={!canEdit}
              onChange={(e) => set('billingContactEmail', e.target.value)} />
          </Field>
        </div>
      </Row>

      <div style={{ marginTop: 18, marginBottom: 8, fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
        Primary Manager / After Hours
      </div>
      <Row>
        <div className="cc-form-field">
          <Field label="Manager Name">
            <input className="cc-form-input" value={form.primaryManagerName} disabled={!canEdit}
              onChange={(e) => set('primaryManagerName', e.target.value)} />
          </Field>
        </div>
        <div className="cc-form-field">
          <Field label="Manager Phone">
            <input className="cc-form-input" value={form.primaryManagerPhone} disabled={!canEdit}
              onChange={(e) => set('primaryManagerPhone', e.target.value)} />
          </Field>
        </div>
      </Row>
      <Row>
        <div className="cc-form-field">
          <Field label="Manager Email">
            <input className="cc-form-input" value={form.primaryManagerEmail} disabled={!canEdit}
              onChange={(e) => set('primaryManagerEmail', e.target.value)} />
          </Field>
        </div>
        <div className="cc-form-field">
          <Field label="After Hours Phone">
            <input className="cc-form-input" value={form.afterHoursPhone} disabled={!canEdit}
              onChange={(e) => set('afterHoursPhone', e.target.value)} />
          </Field>
        </div>
      </Row>

      <Row>
        <div className="cc-form-field">
          <Field label="Website">
            <input className="cc-form-input" value={form.website} disabled={!canEdit}
              onChange={(e) => set('website', e.target.value)} />
          </Field>
        </div>
        <div className="cc-form-field">
          <Field label="Service Area">
            <input className="cc-form-input" value={form.serviceArea} disabled={!canEdit}
              onChange={(e) => set('serviceArea', e.target.value)} />
          </Field>
        </div>
      </Row>

      <div style={{ marginTop: 18, marginBottom: 8, fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
        Business Hours
      </div>
      <BusinessHoursEditor value={form.businessHours} onChange={(v) => set('businessHours', v)} disabled={!canEdit} />

      <SaveBar saving={saving} onSave={() => onSave(form)} canEdit={canEdit} />
    </>
  );
}

/* ═══════════════════════ 2. Business Rules ════════════════════════ */
function BusinessRulesSection({ client, canEdit, onSave, saving }: {
  client: TenantOnboarding; canEdit: boolean; onSave: (d: unknown) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...client.businessRules });
  const issues = validateBusinessRules({ ...client, businessRules: form });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const addTransferRule = () => {
    set('transferRules', [...form.transferRules, { trigger: '', destination: '', destinationNumber: '' }]);
  };
  const updateTransferRule = (i: number, patch: Partial<TransferRule>) => {
    const updated = [...form.transferRules];
    updated[i] = { ...updated[i], ...patch };
    set('transferRules', updated);
  };
  const removeTransferRule = (i: number) => {
    set('transferRules', form.transferRules.filter((_, idx) => idx !== i));
  };

  return (
    <>
      <SectionValidation issues={issues} />

      <div style={{ marginBottom: 8, fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
        Urgent Keywords
      </div>
      <TagInput
        value={form.urgentKeywords}
        onChange={(v) => set('urgentKeywords', v)}
        placeholder="Type keyword, press Enter…"
        disabled={!canEdit}
      />

      <div style={{ marginTop: 18, marginBottom: 4, fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
        Escalation Contact *
      </div>
      <Row>
        <div className="cc-form-field">
          <Field label="Name">
            <input className="cc-form-input" value={form.escalationContactName} disabled={!canEdit}
              onChange={(e) => set('escalationContactName', e.target.value)} />
          </Field>
        </div>
        <div className="cc-form-field">
          <Field label="Phone">
            <input className="cc-form-input" value={form.escalationContactPhone} disabled={!canEdit}
              onChange={(e) => set('escalationContactPhone', e.target.value)} />
          </Field>
        </div>
      </Row>
      <Field label="Email">
        <input className="cc-form-input" value={form.escalationContactEmail} disabled={!canEdit}
          onChange={(e) => set('escalationContactEmail', e.target.value)} />
      </Field>

      <div style={{ marginTop: 18 }}>
        <Toggle
          checked={form.afterHoursEnabled}
          onChange={(v) => set('afterHoursEnabled', v)}
          label="After Hours Handling"
          sub="Calls received outside business hours"
          disabled={!canEdit}
        />
      </div>
      {form.afterHoursEnabled && (
        <>
          <Row>
            <div className="cc-form-field">
              <Field label="After Hours Action">
                <select className="cc-form-select" value={form.afterHoursAction} disabled={!canEdit}
                  onChange={(e) => set('afterHoursAction', e.target.value as typeof form.afterHoursAction)}>
                  <option value="voicemail">Voicemail</option>
                  <option value="transfer">Transfer</option>
                  <option value="message">Message</option>
                  <option value="none">None</option>
                </select>
              </Field>
            </div>
            {form.afterHoursAction === 'transfer' && (
              <div className="cc-form-field">
                <Field label="Transfer Number">
                  <input className="cc-form-input" value={form.afterHoursTransferNumber} disabled={!canEdit}
                    onChange={(e) => set('afterHoursTransferNumber', e.target.value)} />
                </Field>
              </div>
            )}
          </Row>
          {form.afterHoursAction === 'voicemail' && (
            <Field label="Voicemail Greeting">
              <textarea className="cc-form-textarea" value={form.afterHoursVoicemailGreeting} disabled={!canEdit}
                onChange={(e) => set('afterHoursVoicemailGreeting', e.target.value)} />
            </Field>
          )}
        </>
      )}

      <Toggle
        checked={form.approvalRequired}
        onChange={(v) => set('approvalRequired', v)}
        label="Job Approval Required"
        sub="Manager must approve before booking is confirmed"
        disabled={!canEdit}
      />
      {form.approvalRequired && (
        <Row>
          <div className="cc-form-field">
            <Field label="Approver Name">
              <input className="cc-form-input" value={form.approverName} disabled={!canEdit}
                onChange={(e) => set('approverName', e.target.value)} />
            </Field>
          </div>
          <div className="cc-form-field">
            <Field label="Approver Phone">
              <input className="cc-form-input" value={form.approverPhone} disabled={!canEdit}
                onChange={(e) => set('approverPhone', e.target.value)} />
            </Field>
          </div>
        </Row>
      )}

      <Toggle
        checked={form.complaintEscalationEnabled}
        onChange={(v) => set('complaintEscalationEnabled', v)}
        label="Complaint Escalation"
        disabled={!canEdit}
      />
      {form.complaintEscalationEnabled && (
        <Row>
          <div className="cc-form-field">
            <Field label="Escalation Path">
              <input className="cc-form-input" value={form.complaintEscalationPath} disabled={!canEdit}
                onChange={(e) => set('complaintEscalationPath', e.target.value)} />
            </Field>
          </div>
          <div className="cc-form-field">
            <Field label="Escalation Contact">
              <input className="cc-form-input" value={form.complaintEscalationContact} disabled={!canEdit}
                onChange={(e) => set('complaintEscalationContact', e.target.value)} />
            </Field>
          </div>
        </Row>
      )}

      <div style={{ marginTop: 18, marginBottom: 8, fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
        Allowed Services
      </div>
      <TagInput value={form.allowedServices} onChange={(v) => set('allowedServices', v)} placeholder="e.g. Plumbing, Emergency…" disabled={!canEdit} />

      <div style={{ marginTop: 14, marginBottom: 8, fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
        Excluded Services
      </div>
      <TagInput value={form.excludedServices} onChange={(v) => set('excludedServices', v)} placeholder="e.g. Gas, Electrical…" disabled={!canEdit} />

      <div style={{ marginTop: 18, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>Transfer Rules</span>
        {canEdit && (
          <button className="cc-btn cc-btn-ghost cc-btn-small" onClick={addTransferRule}>+ Add Rule</button>
        )}
      </div>
      {form.transferRules.map((rule, i) => (
        <div key={i} className="cc-queue-item-card">
          <div className="cc-queue-item-header">
            <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, color: 'var(--cc-text-muted)' }}>Rule {i + 1}</span>
            {canEdit && (
              <button className="cc-btn cc-btn-ghost cc-btn-small" style={{ color: 'var(--cc-color-red)' }} onClick={() => removeTransferRule(i)}>Remove</button>
            )}
          </div>
          <Row>
            <div className="cc-form-field">
              <Field label="Trigger">
                <input className="cc-form-input" value={rule.trigger} disabled={!canEdit}
                  onChange={(e) => updateTransferRule(i, { trigger: e.target.value })} />
              </Field>
            </div>
            <div className="cc-form-field">
              <Field label="Destination">
                <input className="cc-form-input" value={rule.destination} disabled={!canEdit}
                  onChange={(e) => updateTransferRule(i, { destination: e.target.value })} />
              </Field>
            </div>
            <div className="cc-form-field">
              <Field label="Number">
                <input className="cc-form-input" value={rule.destinationNumber} disabled={!canEdit}
                  onChange={(e) => updateTransferRule(i, { destinationNumber: e.target.value })} />
              </Field>
            </div>
          </Row>
        </div>
      ))}

      <SaveBar saving={saving} onSave={() => onSave(form)} canEdit={canEdit} />
    </>
  );
}

/* ═══════════════════════ 3. Queue Setup ═══════════════════════════ */
function QueueSetupSection({ client, canEdit, onSave, saving }: {
  client: TenantOnboarding; canEdit: boolean; onSave: (d: unknown) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...client.queueSetup });
  const issues = validateQueueSetup({ ...client, queueSetup: form });

  const addQueue = () => {
    const newQ: OnboardingQueue = {
      id: `q-${Date.now()}`,
      name: '',
      purpose: '',
      businessHoursRule: '',
      afterHoursRule: '',
      fallbackAction: '',
      fallbackNumber: '',
      priority: form.queues.length + 1,
      assignedAgentIds: [],
      routingPath: '',
    };
    setForm((f) => ({ ...f, queues: [...f.queues, newQ] }));
  };

  const updateQueue = (i: number, patch: Partial<OnboardingQueue>) => {
    setForm((f) => {
      const updated = [...f.queues];
      updated[i] = { ...updated[i], ...patch };
      return { ...f, queues: updated };
    });
  };

  const removeQueue = (i: number) => {
    setForm((f) => ({ ...f, queues: f.queues.filter((_, idx) => idx !== i) }));
  };

  return (
    <>
      <SectionValidation issues={issues} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
          {form.queues.length} Queue{form.queues.length !== 1 ? 's' : ''}
        </span>
        {canEdit && (
          <button className="cc-btn cc-btn-ghost cc-btn-small" onClick={addQueue}>+ Add Queue</button>
        )}
      </div>

      {form.queues.length === 0 && (
        <div className="cc-empty" style={{ padding: 24 }}>
          <span className="cc-empty-icon">📞</span>
          <span className="cc-empty-text">No queues configured yet.</span>
        </div>
      )}

      {form.queues.map((q, i) => (
        <div key={q.id} className="cc-queue-item-card">
          <div className="cc-queue-item-header">
            <span className="cc-queue-item-name">{q.name || `Queue ${i + 1}`}</span>
            {canEdit && (
              <button className="cc-btn cc-btn-ghost cc-btn-small" style={{ color: 'var(--cc-color-red)' }} onClick={() => removeQueue(i)}>Remove</button>
            )}
          </div>
          <Row>
            <div className="cc-form-field">
              <Field label="Queue Name *">
                <input className="cc-form-input" value={q.name} disabled={!canEdit}
                  onChange={(e) => updateQueue(i, { name: e.target.value })} />
              </Field>
            </div>
            <div className="cc-form-field">
              <Field label="Priority">
                <input className="cc-form-input" type="number" min={1} value={q.priority} disabled={!canEdit}
                  onChange={(e) => updateQueue(i, { priority: Number(e.target.value) })} />
              </Field>
            </div>
          </Row>
          <Field label="Purpose *">
            <input className="cc-form-input" value={q.purpose} placeholder="What calls does this queue handle?"
              disabled={!canEdit} onChange={(e) => updateQueue(i, { purpose: e.target.value })} />
          </Field>
          <Row>
            <div className="cc-form-field">
              <Field label="Business Hours Rule *">
                <input className="cc-form-input" value={q.businessHoursRule} disabled={!canEdit}
                  onChange={(e) => updateQueue(i, { businessHoursRule: e.target.value })} />
              </Field>
            </div>
            <div className="cc-form-field">
              <Field label="After Hours Rule">
                <input className="cc-form-input" value={q.afterHoursRule} disabled={!canEdit}
                  onChange={(e) => updateQueue(i, { afterHoursRule: e.target.value })} />
              </Field>
            </div>
          </Row>
          <Row>
            <div className="cc-form-field">
              <Field label="Fallback Action">
                <input className="cc-form-input" value={q.fallbackAction} placeholder="e.g. Voicemail, Transfer…"
                  disabled={!canEdit} onChange={(e) => updateQueue(i, { fallbackAction: e.target.value })} />
              </Field>
            </div>
            <div className="cc-form-field">
              <Field label="Fallback Number">
                <input className="cc-form-input" value={q.fallbackNumber} disabled={!canEdit}
                  onChange={(e) => updateQueue(i, { fallbackNumber: e.target.value })} />
              </Field>
            </div>
          </Row>
          <Field label="Routing Path">
            <input className="cc-form-input" value={q.routingPath} placeholder="e.g. IVR → Queue → Agent…"
              disabled={!canEdit} onChange={(e) => updateQueue(i, { routingPath: e.target.value })} />
          </Field>
        </div>
      ))}

      <SaveBar saving={saving} onSave={() => onSave(form)} canEdit={canEdit} />
    </>
  );
}

/* ═══════════════════════ 4. Script & KB ══════════════════════════ */
function ScriptSection({ client, canEdit, onSave, saving }: {
  client: TenantOnboarding; canEdit: boolean; onSave: (d: unknown) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...client.scriptKnowledgeBase });
  const issues = validateScriptKnowledgeBase({ ...client, scriptKnowledgeBase: form });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const addFaq = () => {
    set('faqAnswers', [...form.faqAnswers, { question: '', answer: '' }]);
  };
  const updateFaq = (i: number, patch: Partial<FaqEntry>) => {
    const updated = [...form.faqAnswers];
    updated[i] = { ...updated[i], ...patch };
    set('faqAnswers', updated);
  };
  const removeFaq = (i: number) => {
    set('faqAnswers', form.faqAnswers.filter((_, idx) => idx !== i));
  };

  return (
    <>
      <SectionValidation issues={issues} />

      <Field label="Greeting Script *">
        <textarea className="cc-form-textarea" style={{ minHeight: 80 }} value={form.greeting} disabled={!canEdit}
          onChange={(e) => set('greeting', e.target.value)} />
      </Field>
      <Field label="Closing Script">
        <textarea className="cc-form-textarea" value={form.closingScript} disabled={!canEdit}
          onChange={(e) => set('closingScript', e.target.value)} />
      </Field>
      <Field label="Services Script">
        <textarea className="cc-form-textarea" value={form.servicesScript} disabled={!canEdit}
          onChange={(e) => set('servicesScript', e.target.value)} />
      </Field>
      <Field label="Objection Handling">
        <textarea className="cc-form-textarea" value={form.objectionHandling} disabled={!canEdit}
          onChange={(e) => set('objectionHandling', e.target.value)} />
      </Field>
      <Field label="Compliance Wording">
        <textarea className="cc-form-textarea" value={form.complianceWording} disabled={!canEdit}
          onChange={(e) => set('complianceWording', e.target.value)} />
      </Field>
      <Field label="Escalation Wording">
        <textarea className="cc-form-textarea" value={form.escalationWording} disabled={!canEdit}
          onChange={(e) => set('escalationWording', e.target.value)} />
      </Field>
      <Field label="Pricing Notes">
        <textarea className="cc-form-textarea" value={form.pricingNotes} disabled={!canEdit}
          onChange={(e) => set('pricingNotes', e.target.value)} />
      </Field>

      <div style={{ marginTop: 18, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
          FAQ / Knowledge Base ({form.faqAnswers.length})
        </span>
        {canEdit && <button className="cc-btn cc-btn-ghost cc-btn-small" onClick={addFaq}>+ Add FAQ</button>}
      </div>
      {form.faqAnswers.map((faq, i) => (
        <div key={i} className="cc-queue-item-card">
          <div className="cc-queue-item-header">
            <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, color: 'var(--cc-text-muted)' }}>FAQ {i + 1}</span>
            {canEdit && (
              <button className="cc-btn cc-btn-ghost cc-btn-small" style={{ color: 'var(--cc-color-red)' }} onClick={() => removeFaq(i)}>Remove</button>
            )}
          </div>
          <Field label="Question">
            <input className="cc-form-input" value={faq.question} disabled={!canEdit}
              onChange={(e) => updateFaq(i, { question: e.target.value })} />
          </Field>
          <Field label="Answer">
            <textarea className="cc-form-textarea" value={faq.answer} disabled={!canEdit}
              onChange={(e) => updateFaq(i, { answer: e.target.value })} />
          </Field>
        </div>
      ))}

      <div style={{ marginTop: 18 }}>
        <Toggle
          checked={form.approvedByClient}
          onChange={(v) => set('approvedByClient', v)}
          label="Script Approved by Client"
          disabled={!canEdit}
        />
        {form.approvedByClient && (
          <Row>
            <div className="cc-form-field">
              <Field label="Approved By">
                <input className="cc-form-input" value={form.approvedBy} disabled={!canEdit}
                  onChange={(e) => set('approvedBy', e.target.value)} />
              </Field>
            </div>
            <div className="cc-form-field">
              <Field label="Approved At">
                <input type="date" className="cc-form-input" value={form.approvedAt?.slice(0, 10)} disabled={!canEdit}
                  onChange={(e) => set('approvedAt', e.target.value)} />
              </Field>
            </div>
          </Row>
        )}
      </div>

      <SaveBar saving={saving} onSave={() => onSave(form)} canEdit={canEdit} />
    </>
  );
}

/* ═══════════════════════ 5. Booking Rules ════════════════════════ */
function BookingRulesSection({ client, canEdit, onSave, saving }: {
  client: TenantOnboarding; canEdit: boolean; onSave: (d: unknown) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...client.bookingRules });
  const issues = validateBookingRules({ ...client, bookingRules: form });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <SectionValidation issues={issues} />

      <div style={{ marginBottom: 8, fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>Required Caller Fields</div>
      <TagInput value={form.requiredCallerFields} onChange={(v) => set('requiredCallerFields', v)} placeholder="e.g. Name, Phone, Address…" disabled={!canEdit} />

      <div style={{ marginTop: 14, marginBottom: 8, fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>Required Job Fields</div>
      <TagInput value={form.requiredJobFields} onChange={(v) => set('requiredJobFields', v)} placeholder="e.g. Issue Type, Address, Date…" disabled={!canEdit} />

      <div style={{ marginTop: 18 }}>
        <Toggle checked={form.depositRequired} onChange={(v) => set('depositRequired', v)} label="Deposit Required" disabled={!canEdit} />
        {form.depositRequired && (
          <Row>
            <div className="cc-form-field">
              <Field label="Deposit Amount">
                <input className="cc-form-input" value={form.depositAmount} placeholder="e.g. $50 or 10%"
                  disabled={!canEdit} onChange={(e) => set('depositAmount', e.target.value)} />
              </Field>
            </div>
            <div className="cc-form-field">
              <Field label="Deposit Workflow">
                <input className="cc-form-input" value={form.depositWorkflow} placeholder="How is deposit collected?"
                  disabled={!canEdit} onChange={(e) => set('depositWorkflow', e.target.value)} />
              </Field>
            </div>
          </Row>
        )}

        <Toggle checked={form.managerApprovalRequired} onChange={(v) => set('managerApprovalRequired', v)} label="Manager Approval Required" disabled={!canEdit} />
        {form.managerApprovalRequired && (
          <Row>
            <div className="cc-form-field">
              <Field label="Manager Name">
                <input className="cc-form-input" value={form.managerContactName} disabled={!canEdit}
                  onChange={(e) => set('managerContactName', e.target.value)} />
              </Field>
            </div>
            <div className="cc-form-field">
              <Field label="Manager Phone">
                <input className="cc-form-input" value={form.managerContactPhone} disabled={!canEdit}
                  onChange={(e) => set('managerContactPhone', e.target.value)} />
              </Field>
            </div>
          </Row>
        )}

        <Toggle checked={form.calendarIntegrationEnabled} onChange={(v) => set('calendarIntegrationEnabled', v)} label="Calendar Integration" disabled={!canEdit} />
        {form.calendarIntegrationEnabled && (
          <Row>
            <div className="cc-form-field">
              <Field label="Provider">
                <input className="cc-form-input" value={form.calendarProvider} placeholder="e.g. Google, Outlook, Jobber…"
                  disabled={!canEdit} onChange={(e) => set('calendarProvider', e.target.value)} />
              </Field>
            </div>
            <div className="cc-form-field" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <Toggle
                checked={form.calendarConnected}
                onChange={(v) => set('calendarConnected', v)}
                label="Connected"
                disabled={!canEdit}
              />
            </div>
          </Row>
        )}

        <Toggle checked={form.smsConfirmationEnabled} onChange={(v) => set('smsConfirmationEnabled', v)} label="SMS Confirmation" disabled={!canEdit} />
        {form.smsConfirmationEnabled && (
          <Row>
            <div className="cc-form-field">
              <Field label="Sender ID">
                <input className="cc-form-input" value={form.smsSenderId} disabled={!canEdit}
                  onChange={(e) => set('smsSenderId', e.target.value)} />
              </Field>
            </div>
            <div className="cc-form-field" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <Toggle
                checked={form.smsSenderConfigured}
                onChange={(v) => set('smsSenderConfigured', v)}
                label="Configured"
                disabled={!canEdit}
              />
            </div>
          </Row>
        )}

        <Toggle checked={form.allowBookingsOutsideHours} onChange={(v) => set('allowBookingsOutsideHours', v)} label="Allow Bookings Outside Hours" disabled={!canEdit} />
        {form.allowBookingsOutsideHours && (
          <Field label="Outside Hours Booking Rule">
            <input className="cc-form-input" value={form.outsideHoursBookingRule} disabled={!canEdit}
              onChange={(e) => set('outsideHoursBookingRule', e.target.value)} />
          </Field>
        )}
      </div>

      <Field label="Cancellation Policy">
        <textarea className="cc-form-textarea" value={form.cancellationPolicy} disabled={!canEdit}
          onChange={(e) => set('cancellationPolicy', e.target.value)} />
      </Field>
      <Field label="Reschedule Rules">
        <textarea className="cc-form-textarea" value={form.rescheduleRules} disabled={!canEdit}
          onChange={(e) => set('rescheduleRules', e.target.value)} />
      </Field>

      <SaveBar saving={saving} onSave={() => onSave(form)} canEdit={canEdit} />
    </>
  );
}

/* ══════════════════════ 6. Testing & Go Live ═══════════════════════ */
function TestingGoLiveSection({ client, canEdit, onSave, saving }: {
  client: TenantOnboarding; canEdit: boolean; onSave: (d: unknown) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...client.testingGoLive });
  const issues = validateTestingGoLive({ ...client, testingGoLive: form });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const addTestCall = () => {
    const newCall: TestCall = {
      id: `tc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      testerName: '',
      scenario: '',
      result: 'partial',
      notes: '',
      queueTested: '',
    };
    set('testCalls', [...form.testCalls, newCall]);
  };

  const updateTestCall = (i: number, patch: Partial<TestCall>) => {
    const updated = [...form.testCalls];
    updated[i] = { ...updated[i], ...patch };
    set('testCalls', updated);
  };

  const removeTestCall = (i: number) => {
    set('testCalls', form.testCalls.filter((_, idx) => idx !== i));
  };

  const resultColor: Record<string, string> = {
    pass: 'var(--cc-color-green)',
    fail: 'var(--cc-color-red)',
    partial: 'var(--cc-color-amber)',
  };

  return (
    <>
      <SectionValidation issues={issues} />

      {/* Checklist */}
      <div style={{ marginBottom: 18, background: 'var(--cc-bg-elevated)', border: '1px solid var(--cc-border-default)', borderRadius: 'var(--cc-radius-md)', padding: '12px 16px' }}>
        <div style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)', marginBottom: 10 }}>Go-Live Checklist</div>
        {[
          { key: 'allTestsPassed', label: 'All test calls passed' },
          { key: 'routingVerified', label: 'Call routing verified' },
          { key: 'queueConfigVerified', label: 'Queue configuration verified' },
          { key: 'scriptApprovalReceived', label: 'Script approved by client' },
          { key: 'clientApprovalReceived', label: 'Final go-live approval received' },
        ].map(({ key, label }) => (
          <Toggle
            key={key}
            checked={!!form[key as keyof typeof form]}
            onChange={(v) => set(key as keyof typeof form, v as never)}
            label={label}
            disabled={!canEdit}
          />
        ))}
      </div>

      {form.clientApprovalReceived && (
        <Row>
          <div className="cc-form-field">
            <Field label="Approved By">
              <input className="cc-form-input" value={form.clientApprovalBy} disabled={!canEdit}
                onChange={(e) => set('clientApprovalBy', e.target.value)} />
            </Field>
          </div>
          <div className="cc-form-field">
            <Field label="Approval Date">
              <input type="date" className="cc-form-input" value={form.clientApprovalTimestamp?.slice(0, 10)} disabled={!canEdit}
                onChange={(e) => set('clientApprovalTimestamp', e.target.value)} />
            </Field>
          </div>
        </Row>
      )}

      <Row>
        <div className="cc-form-field">
          <Field label="Go-Live Date">
            <input type="date" className="cc-form-input" value={form.goLiveDate?.slice(0, 10)} disabled={!canEdit}
              onChange={(e) => set('goLiveDate', e.target.value)} />
          </Field>
        </div>
        <div className="cc-form-field">
          <Field label="Assigned Live Ops Team">
            <input className="cc-form-input" value={form.assignedLiveOpsTeam} disabled={!canEdit}
              onChange={(e) => set('assignedLiveOpsTeam', e.target.value)} />
          </Field>
        </div>
      </Row>

      <Field label="Rollback Plan">
        <textarea className="cc-form-textarea" value={form.rollbackPlan} disabled={!canEdit}
          onChange={(e) => set('rollbackPlan', e.target.value)} />
      </Field>
      <Field label="Handover Notes">
        <textarea className="cc-form-textarea" value={form.handoverNotes} disabled={!canEdit}
          onChange={(e) => set('handoverNotes', e.target.value)} />
      </Field>

      {/* Test Calls */}
      <div style={{ marginTop: 18, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '1.2px', color: 'var(--cc-text-muted)' }}>
          Test Calls ({form.testCalls.length})
        </span>
        {canEdit && <button className="cc-btn cc-btn-ghost cc-btn-small" onClick={addTestCall}>+ Add Test Call</button>}
      </div>

      {form.testCalls.map((tc, i) => (
        <div key={tc.id} className="cc-queue-item-card">
          <div className="cc-queue-item-header">
            <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, color: resultColor[tc.result] ?? 'var(--cc-text-muted)', fontWeight: 700 }}>
              {tc.result === 'pass' ? '✓' : tc.result === 'fail' ? '✗' : '◐'} Test {i + 1}
            </span>
            {canEdit && (
              <button className="cc-btn cc-btn-ghost cc-btn-small" style={{ color: 'var(--cc-color-red)' }} onClick={() => removeTestCall(i)}>Remove</button>
            )}
          </div>
          <Row>
            <div className="cc-form-field">
              <Field label="Scenario">
                <input className="cc-form-input" value={tc.scenario} disabled={!canEdit}
                  onChange={(e) => updateTestCall(i, { scenario: e.target.value })} />
              </Field>
            </div>
            <div className="cc-form-field">
              <Field label="Queue Tested">
                <input className="cc-form-input" value={tc.queueTested} disabled={!canEdit}
                  onChange={(e) => updateTestCall(i, { queueTested: e.target.value })} />
              </Field>
            </div>
          </Row>
          <Row>
            <div className="cc-form-field">
              <Field label="Tester">
                <input className="cc-form-input" value={tc.testerName} disabled={!canEdit}
                  onChange={(e) => updateTestCall(i, { testerName: e.target.value })} />
              </Field>
            </div>
            <div className="cc-form-field">
              <Field label="Result">
                <select className="cc-form-select" value={tc.result} disabled={!canEdit}
                  onChange={(e) => updateTestCall(i, { result: e.target.value as TestCall['result'] })}>
                  <option value="pass">✓ Pass</option>
                  <option value="fail">✗ Fail</option>
                  <option value="partial">◐ Partial</option>
                </select>
              </Field>
            </div>
          </Row>
          <Field label="Notes">
            <textarea className="cc-form-textarea" style={{ minHeight: 48 }} value={tc.notes} disabled={!canEdit}
              onChange={(e) => updateTestCall(i, { notes: e.target.value })} />
          </Field>
        </div>
      ))}

      <SaveBar saving={saving} onSave={() => onSave(form)} canEdit={canEdit} />
    </>
  );
}

/* ══════════════════════ 7. Activity Log ════════════════════════════ */
function ActivityLogSection({ client }: { client: TenantOnboarding }) {
  const log = [...(client.activityLog ?? [])].reverse();
  if (log.length === 0) {
    return (
      <div className="cc-empty" style={{ padding: 32 }}>
        <span className="cc-empty-icon">📝</span>
        <span className="cc-empty-text">No activity recorded yet.</span>
      </div>
    );
  }
  return (
    <div>
      {log.map((entry) => (
        <div key={entry.id} className="cc-activity-entry">
          <div className="cc-activity-dot" />
          <div className="cc-activity-content">
            <div className="cc-activity-detail">
              <strong>{entry.section}</strong> — {entry.details}
            </div>
            <div className="cc-activity-meta">
              {entry.userName} · {new Date(entry.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
