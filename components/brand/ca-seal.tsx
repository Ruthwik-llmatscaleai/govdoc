type Props = {
  size?: number;
  className?: string;
};

export function CaSeal({ size = 64, className }: Props) {
  const stroke = Math.max(2, Math.round(size * 0.04));
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-label="State of California seal"
    >
      <svg viewBox="0 0 100 100" width={size} height={size} role="img">
        <defs>
          <linearGradient id="seal-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.42 0.13 254)" />
            <stop offset="100%" stopColor="oklch(0.32 0.12 258)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={50 - stroke / 2} fill="url(#seal-bg)" />
        <circle
          cx="50"
          cy="50"
          r={50 - stroke * 2}
          fill="none"
          stroke="oklch(0.99 0 0 / 0.45)"
          strokeWidth={stroke / 2}
        />
        <text
          x="50"
          y="44"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          letterSpacing="0.18em"
          fill="oklch(0.99 0 0)"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          CA
        </text>
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          letterSpacing="0.22em"
          fill="oklch(0.99 0 0 / 0.92)"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          STATE
        </text>
      </svg>
    </div>
  );
}
