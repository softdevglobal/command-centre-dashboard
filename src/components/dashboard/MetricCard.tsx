interface MetricCardProps {
  label: string;
  value: string | number;
  accent: string;
  sub?: string;
}

export function MetricCard({ label, value, accent, sub }: MetricCardProps) {
  return (
    <div className="cc-metric">
      <div className="cc-metric-bar" style={{ background: accent }} />
      <div className="cc-metric-label">{label}</div>
      <div className="cc-metric-value" style={{ color: accent }}>{value}</div>
      {sub && <div className="cc-metric-sub">{sub}</div>}
    </div>
  );
}
