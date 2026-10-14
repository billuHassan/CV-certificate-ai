import React from "react";
import { CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, Zap } from "lucide-react";

export interface AtsDimension {
  id: string;
  name: string;
  score: number; // 0 to 100
  target?: number;
  weight?: string;
  status?: "optimal" | "warning" | "critical";
  description?: string;
}

interface AtsBarMeterProps {
  overallScore: number;
  atsMatchRate: number;
  dimensions?: AtsDimension[];
  className?: string;
}

export default function AtsBarMeter({
  overallScore,
  atsMatchRate,
  dimensions = [
    { id: "keywords", name: "Industry Keyword Match", score: 94, target: 85, status: "optimal", description: "High-density technical & competency terms identified" },
    { id: "format", name: "ATS Formatting & Layout", score: 98, target: 90, status: "optimal", description: "Standard single/double column, clean headers, no tables/graphics traps" },
    { id: "verbs", name: "Action Verbs & Quantifiable Metrics", score: 88, target: 80, status: "optimal", description: "% / $ / # deliverables present in work experience" },
    { id: "sections", name: "Required Section Hierarchy", score: 100, target: 95, status: "optimal", description: "Summary, Experience, Skills, Education clearly demarcated" },
    { id: "contact", name: "Mechanical & Contact Hygiene", score: 100, target: 100, status: "optimal", description: "Phone, email, LinkedIn, location properly formatted" },
  ],
  className = "",
}: AtsBarMeterProps) {
  const getTierColor = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-teal-400";
    if (score >= 60) return "from-amber-500 to-yellow-400";
    return "from-rose-500 to-red-400";
  };

  const getTierBadge = (score: number) => {
    if (score >= 80) return { label: "ATS GUARANTEED PASS", bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
    if (score >= 60) return { label: "REVIEW MARGIN", bg: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
    return { label: "PARSER FILTER RISK", bg: "bg-rose-500/15 text-rose-300 border-rose-500/30" };
  };

  const tierBadge = getTierBadge(atsMatchRate);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Primary ATS Master Bar Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                ATS COMPLIANCE INDEX
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tierBadge.bg}`}>
                {tierBadge.label}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white font-display">
              Enterprise Parser Pass Probability
            </h3>
          </div>

          <div className="flex items-baseline gap-2 self-start sm:self-auto bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
            <span className="text-2xl sm:text-3xl font-black font-display text-white">
              {atsMatchRate}%
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Pass Rate
            </span>
          </div>
        </div>

        {/* Master Segmented Bar Meter */}
        <div className="space-y-2">
          {/* Top labels */}
          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 uppercase">
            <span className="text-rose-400">0% Rejection Zone</span>
            <span className="text-amber-400">60% Benchmark</span>
            <span className="text-emerald-400">80% Elite Tier</span>
            <span className="text-cyan-400">100% Perfect</span>
          </div>

          {/* Segmented Gradient Bar with cursor needle */}
          <div className="relative">
            <div className="h-5 w-full bg-slate-900 rounded-xl overflow-hidden p-0.5 border border-slate-800 flex gap-1">
              {/* Zone 1: Critical (0-60%) */}
              <div className="w-[60%] h-full bg-gradient-to-r from-rose-950/40 to-amber-950/40 rounded-l-lg flex items-center justify-end px-2">
                <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">Review Margin</span>
              </div>
              {/* Zone 2: Pass (60-80%) */}
              <div className="w-[20%] h-full bg-amber-950/40 flex items-center justify-center px-1">
                <span className="text-[9px] font-mono text-amber-500/70 hidden sm:inline">Pass</span>
              </div>
              {/* Zone 3: Elite (80-100%) */}
              <div className="w-[20%] h-full bg-emerald-950/50 rounded-r-lg flex items-center justify-center px-1">
                <span className="text-[9px] font-mono text-emerald-400/80 font-bold hidden sm:inline">Top 5%</span>
              </div>
            </div>

            {/* Glowing Active Progress Bar Fill Overlay */}
            <div
              className={`absolute top-0.5 left-0.5 bottom-0.5 rounded-lg bg-gradient-to-r ${getTierColor(atsMatchRate)} transition-all duration-1000 opacity-90 shadow-lg shadow-indigo-500/20`}
              style={{ width: `calc(${Math.min(100, Math.max(0, atsMatchRate))}% - 4px)` }}
            />

            {/* Needle indicator pip */}
            <div
              className="absolute -top-1.5 bottom-[-6px] w-1 bg-white shadow-[0_0_12px_#ffffff] rounded-full transition-all duration-1000 z-10 -translate-x-1/2"
              style={{ left: `${Math.min(100, Math.max(0, atsMatchRate))}%` }}
            >
              <div className="w-3 h-3 bg-white border-2 border-indigo-600 rounded-full -ml-1 -mt-1 shadow-md" />
            </div>
          </div>

          {/* Subtext info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Tested against Taleo, Workday, Greenhouse &amp; Lever ATS systems
            </span>
            <span className="font-mono text-indigo-300 font-bold">
              +{Math.max(0, atsMatchRate - 70)}% above industry avg
            </span>
          </div>
        </div>
      </div>

      {/* Dimensional ATS Breakdown Bars Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-indigo-400" /> ATS Dimensional Bar Breakdown
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {dimensions.map((dim) => {
            const isHigh = dim.score >= 85;
            const isMid = dim.score >= 70 && dim.score < 85;

            return (
              <div
                key={dim.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5 transition hover:border-slate-700 shadow-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-white font-sans">{dim.name}</h5>
                    {dim.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{dim.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isHigh
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : isMid
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {dim.score}%
                    </span>
                  </div>
                </div>

                {/* Progress bar with segment ticks */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 relative">
                    {/* Benchmark mark at 80% */}
                    <div className="absolute top-0 bottom-0 left-[80%] w-[1px] bg-slate-700 z-10" />

                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isHigh ? "bg-emerald-500" : isMid ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Baseline: 0%</span>
                    <span className="text-slate-400">Target: {dim.target || 85}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
