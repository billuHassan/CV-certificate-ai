import React from "react";

interface ArcGaugeChartProps {
  score: number; // 0 to 100
  title?: string;
  subtitle?: string;
  size?: number; // width/height in px, defaults to 240
  min?: number;
  max?: number;
  thresholds?: {
    low: number;
    medium: number;
  };
}

export default function ArcGaugeChart({
  score,
  title = "ATS Match Index",
  subtitle = "PARSER COMPATIBILITY",
  size = 240,
  min = 0,
  max = 100,
  thresholds = { low: 60, medium: 80 },
}: ArcGaugeChartProps) {
  // Clamp score
  const clampedScore = Math.max(min, Math.min(max, score));

  // Gauge spans 240 degrees (from 150deg to 390deg / -210deg to 30deg)
  // Or symmetric from 135deg to 405deg (270 deg)
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // 240 degrees arc: start at 150deg (top-left) to 390deg (top-right)
  const startAngle = 140;
  const endAngle = 400;
  const totalAngle = endAngle - startAngle; // 260 deg

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  };

  // Background track
  const bgPath = describeArc(cx, cy, radius, startAngle, endAngle);

  // Active progress arc
  const progressRatio = (clampedScore - min) / (max - min);
  const currentAngle = startAngle + totalAngle * progressRatio;
  const activePath = progressRatio > 0.01 ? describeArc(cx, cy, radius, startAngle, currentAngle) : "";

  // Pointer needle angle
  const needleAngle = startAngle + totalAngle * progressRatio;
  const needleTip = polarToCartesian(cx, cy, radius - 10, needleAngle);
  const needleBaseLeft = polarToCartesian(cx, cy, 8, needleAngle - 90);
  const needleBaseRight = polarToCartesian(cx, cy, 8, needleAngle + 90);

  // Determine status color
  const isElite = clampedScore >= thresholds.medium;
  const isModerate = clampedScore >= thresholds.low && clampedScore < thresholds.medium;

  const scoreColor = isElite
    ? "text-emerald-400"
    : isModerate
    ? "text-amber-400"
    : "text-rose-400";

  const statusLabel = isElite
    ? "Top 5% Candidate"
    : isModerate
    ? "Review Margin"
    : "Needs Enhancement";

  const badgeBg = isElite
    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
    : isModerate
    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
    : "bg-rose-500/10 text-rose-300 border-rose-500/30";

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size - 20 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Dark Arc Track */}
          <path
            d={bgPath}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Scale Ticks along perimeter */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = startAngle + (totalAngle * tick) / 100;
            const pOuter = polarToCartesian(cx, cy, radius + 10, tickAngle);
            const pInner = polarToCartesian(cx, cy, radius + 3, tickAngle);
            const pText = polarToCartesian(cx, cy, radius + 20, tickAngle);
            return (
              <g key={`tick-${tick}`}>
                <line
                  x1={pInner.x}
                  y1={pInner.y}
                  x2={pOuter.x}
                  y2={pOuter.y}
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <text
                  x={pText.x}
                  y={pText.y + 3}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Colored Active Arc */}
          {activePath && (
            <path
              d={activePath}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Pivot Center Circles */}
          <circle cx={cx} cy={cy} r="10" fill="#0f172a" stroke="#6366f1" strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="4" fill="#a5b4fc" />

          {/* Needle Pointer */}
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBaseLeft.x},${needleBaseLeft.y} ${needleBaseRight.x},${needleBaseRight.y}`}
            fill="#818cf8"
            filter="url(#needleGlow)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Digital Readout in center of Gauge */}
        <div
          className="absolute inset-x-0 flex flex-col items-center justify-center text-center pointer-events-none"
          style={{ top: cy - 20 }}
        >
          <span className={`text-4xl sm:text-5xl font-black font-display tracking-tight ${scoreColor}`}>
            {clampedScore}%
          </span>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase mt-0.5">
            {subtitle}
          </span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border mt-1.5 ${badgeBg}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {title && (
        <span className="text-xs font-bold text-slate-300 font-display text-center mt-1">
          {title}
        </span>
      )}
    </div>
  );
}
