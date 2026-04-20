export default function ScoreGauge({ score = 600 }) {
  const MIN = 300;
  const MAX = 900;
  const safeScore = Number.isFinite(score) ? Math.round(score) : MIN;
  const clampedScore = Math.min(MAX, Math.max(MIN, safeScore));
  const pct = (clampedScore - MIN) / (MAX - MIN);

  const width = 220;
  const height = 132;
  const cx = 110;
  const cy = 108;
  const r = 84;

  const polar = (deg, radius) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  };

  const arcPath = (startDeg, endDeg, radius) => {
    const start = polar(startDeg, radius);
    const end = polar(endDeg, radius);
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const startDeg = 180;
  const endDeg = 0;
  const valueDeg = startDeg - pct * 180;
  const needleTip = polar(valueDeg, r - 12);

  const scoreColor =
    clampedScore < 500 ? "#dc2626" : clampedScore < 680 ? "#d97706" : "#16a34a";

  return (
    <div
      className="flex flex-col items-center"
      role="meter"
      aria-label="Loan risk score"
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={clampedScore}
      aria-valuetext={`${clampedScore} out of ${MAX} risk score`}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient
            id="riskGaugeGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="52%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>

        <path
          d={arcPath(startDeg, endDeg, r)}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
          strokeLinecap="round"
        />

        <path
          d={arcPath(startDeg, endDeg, r)}
          fill="none"
          stroke="url(#riskGaugeGradient)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#0f172a"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="7" fill="#0f172a" />
      </svg>

      <div className="text-2xl font-bold mt-1" style={{ color: scoreColor }}>
        {clampedScore}
      </div>
      <div className="text-xs text-slate-400">/ 900 risk score</div>
    </div>
  );
}
