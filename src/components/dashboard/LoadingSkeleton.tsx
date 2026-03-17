export function LoadingSkeleton() {
  return (
    <div className="cc-loading-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="cc-skeleton cc-loading-card" />
      ))}
    </div>
  );
}
