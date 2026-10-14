import React, { useState } from "react";

export interface RadarDataPoint {
  axis: string;
  value: number; // 0 to 100
  benchmark?: number; // 0 to 100 (optional comparison target)
  description?: string;
}

interface PolygonRadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
  showBenchmark?: boolean;
  benchmarkLabel?: string;
  currentLabel?: string;
}

export default function PolygonRadarChart({
  data,
  size = 320,
  className = "",
  showBenchmark = true,
  benchmarkLabel = "Tier-1 Benchmark (88%)",
  currentLabel = "Active Resume",
}: PolygonRadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const numAxes = data.length;
  if (numAxes < 3) return null;

  const center = size / 2;
  const radius = size * 0.38; // leave room for labels
  const levels = 5; // 20%, 40%, 60%, 80%, 100%

  // Polar to Cartesian conversion
  const getCoordinates = (value: number, index: number) => {
    const angle = (index * 2 * Math.PI) / numAxes - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate regular polygon points for level rings
  const getLevelPolygonPoints = (levelRatio: number) => {
    const points: string[] = [];
    for (let i = 0; i < numAxes; i++) {
      const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
      const x = center + radius * levelRatio * Math.cos(angle);
      const y = center + radius * levelRatio * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(" ");
  };

  // Coordinates for Current Resume polygon
  const currentPoints = data
    .map((d, i) => {
      const { x, y } = getCoordinates(d.value, i);
      return `${x},${y}`;
    })
    .join(" ");

  // Coordinates for Benchmark polygon
  const benchmarkPoints = data
    .map((d, i) => {
      const benchmarkVal = d.benchmark ?? 85;
      const { x, y } = getCoordinates(benchmarkVal, i);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          <defs>
            {/* Current Resume Polygon Gradient */}
            <linearGradient id="currentPolygonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.25" />
            </linearGradient>

            {/* Benchmark Polygon Gradient */}
            <linearGradient id="benchmarkPolygonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.06" />
            </linearGradient>

            {/* Glow Filter for Polygon Lines */}
            <filter id="polygonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Concentric Polygon Rings */}
          {Array.from({ length: levels }, (_, l) => (l + 1) / levels).map((ratio, idx) => (
            <polygon
              key={`ring-${idx}`}
              points={getLevelPolygonPoints(ratio)}
              fill={idx % 2 === 0 ? "rgba(30, 41, 59, 0.25)" : "transparent"}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray={idx < levels - 1 ? "3 3" : undefined}
              className="transition-all"
            />
          ))}

          {/* Axis Spokes from center to outer vertices */}
          {data.map((_, i) => {
            const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
            const x2 = center + radius * Math.cos(angle);
            const y2 = center + radius * Math.sin(angle);
            return (
              <line
                key={`spoke-${i}`}
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke="#334155"
                strokeWidth="1"
              />
            );
          })}

          {/* Level percentage markers on top spoke */}
          {[20, 40, 60, 80, 100].map((pct) => (
            <text
              key={`pct-${pct}`}
              x={center + 4}
              y={center - (pct / 100) * radius + 3}
              fill="#64748b"
              fontSize="9"
              fontFamily="monospace"
              className="pointer-events-none"
            >
              {pct}%
            </text>
          ))}

          {/* Optional Benchmark Target Polygon (Teal/Emerald dashed) */}
          {showBenchmark && (
            <polygon
              points={benchmarkPoints}
              fill="url(#benchmarkPolygonGrad)"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.8"
              className="pointer-events-none"
            />
          )}

          {/* Active Data Filled Polygon with Glow */}
          <polygon
            points={currentPoints}
            fill="url(#currentPolygonGrad)"
            stroke="#818cf8"
            strokeWidth="2.5"
            filter="url(#polygonGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Vertex Data Points & Interactive Nodes */}
          {data.map((point, i) => {
            const { x, y } = getCoordinates(point.value, i);
            const isHovered = hoveredIndex === i;

            return (
              <g key={`vertex-${i}`} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                {/* Glow ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 8 : 5}
                  fill="#6366f1"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                />
              </g>
            );
          })}

          {/* Exterior Axis Text Labels */}
          {data.map((point, i) => {
            const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
            const labelRadius = radius + 26;
            const lx = center + labelRadius * Math.cos(angle);
            const ly = center + labelRadius * Math.sin(angle);

            // Determine text anchor based on angle
            const textAnchor =
              Math.abs(Math.cos(angle)) < 0.2
                ? "middle"
                : Math.cos(angle) > 0
                ? "start"
                : "end";

            const isHovered = hoveredIndex === i;

            return (
              <g
                key={`label-${i}`}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <text
                  x={lx}
                  y={ly - 4}
                  textAnchor={textAnchor}
                  fill={isHovered ? "#a5b4fc" : "#cbd5e1"}
                  fontSize="11"
                  fontWeight={isHovered ? "bold" : "600"}
                  className="font-sans transition-colors"
                >
                  {point.axis}
                </text>
                <text
                  x={lx}
                  y={ly + 10}
                  textAnchor={textAnchor}
                  fill={
                    point.value >= 85
                      ? "#34d399"
                      : point.value >= 70
                      ? "#fbbf24"
                      : "#f87171"
                  }
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {point.value}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip if hovering a vertex */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-indigo-500/50 shadow-xl px-3 py-1.5 rounded-xl text-center pointer-events-none z-20 whitespace-nowrap backdrop-blur-md">
            <span className="text-[11px] font-bold text-white block">
              {data[hoveredIndex].axis}:{" "}
              <strong className="text-indigo-400 font-mono">
                {data[hoveredIndex].value}%
              </strong>
            </span>
            {data[hoveredIndex].description && (
              <span className="text-[9px] text-slate-400">
                {data[hoveredIndex].description}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-500/80 border border-indigo-400 shrink-0" />
          <span>{currentLabel}</span>
        </div>
        {showBenchmark && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-400 shrink-0" />
            <span className="text-slate-400">{benchmarkLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
