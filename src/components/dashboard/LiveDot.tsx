interface LiveDotProps {
  color?: string;
}

export function LiveDot({ color = 'var(--cc-color-red)' }: LiveDotProps) {
  return (
    <span className="cc-live-dot">
      <span className="cc-live-dot-inner" style={{ background: color }} />
      <span className="cc-live-dot-ring" style={{ background: color }} />
    </span>
  );
}
