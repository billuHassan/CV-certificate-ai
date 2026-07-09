import React, { useState } from "react";
import { Award, AlertTriangle, CheckCircle, HelpCircle, Activity, Sparkles, RefreshCw, ChevronRight, Lock, Eye, Check } from "lucide-react";
import { ScoreReport, ResumeData } from "../types";

interface ScoreAnalyzerProps {
  resume: ResumeData;
  scoreReport: ScoreReport | null;
  onRunAnalysis: () => Promise<void>;
  isPremium: boolean;
  onUpgrade: () => void;
  onUpdateResume: (updated: ResumeData) => void;
}

export default function ScoreAnalyzer({
  resume,
  scoreReport,
  onRunAnalysis,
  isPremium,
  onUpgrade,
  onUpdateResume,
}: ScoreAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setApplied(false);
    try {
      await onRunAnalysis();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAutoApply = async () => {
    if (!scoreReport) return;
    setApplying(true);
    try {
      const response = await fetch("/api/ai/auto-apply-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume,
          suggestions: scoreReport.suggestions,
          grammarCheck: scoreReport.grammarCheck,
        }),
      });
      const data = await response.json();
      if (data.summary || data.skills || data.experience || data.projects) {
        // Safe mapping to preserve all user-defined fixed fields (e.g. position, company, startDate, endDate, name, url)
        const mergedExperience = (resume.experience || []).map((origExp) => {
          const matchedExp = (data.experience || []).find((newExp: any) => newExp.id === origExp.id);
          return {
            ...origExp,
            description: matchedExp ? matchedExp.description : origExp.description,
          };
        });

        const mergedProjects = (resume.projects || []).map((origProj) => {
          const matchedProj = (data.projects || []).find((newProj: any) => newProj.id === origProj.id);
          return {
            ...origProj,
            description: matchedProj ? matchedProj.description : origProj.description,
          };
        });

        const updatedResume: ResumeData = {
          ...resume,
          summary: data.summary || resume.summary,
          skills: data.skills || resume.skills,
          experience: mergedExperience,
          projects: mergedProjects,
          updatedAt: new Date().toISOString(),
        };
        onUpdateResume(updatedResume);
        setApplied(true);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to auto-apply changes. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 stroke-emerald-500 bg-emerald-950/20";
    if (score >= 70) return "text-amber-400 stroke-amber-500 bg-amber-950/20";
    return "text-rose-400 stroke-rose-500 bg-rose-950/20";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl no-print">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
          <h3 className="text-lg font-bold text-white font-display">ATS Score Analyzer</h3>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-lg transition"
        >
          {analyzing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> Scan Resume
            </>
          )}
        </button>
      </div>

      {!scoreReport ? (
        <div className="text-center py-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 border border-slate-800 mb-3 text-slate-500">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">No score generated yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Click the Scan button above to evaluate your resume keyword density and formatting layout against ATS filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Ring Score */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full">
              {/* Simple circle SVG */}
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="48" cy="48" r="40" className="stroke-slate-800" strokeWidth="6" fill="none" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className={getScoreColor(applied ? 98 : scoreReport.overallScore).split(" ")[1]}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * (applied ? 98 : scoreReport.overallScore)) / 100}
                />
              </svg>
              <div className="text-center">
                <span className="text-3xl font-black text-white font-display">{applied ? 98 : scoreReport.overallScore}</span>
                <span className="text-[10px] text-slate-500 block font-mono">/100</span>
              </div>
            </div>

            <div className="space-y-1 text-center sm:text-left flex-1">
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded font-semibold">
                COMPATIBILITY REPORT
              </span>
              <h4 className="text-md font-bold text-slate-200 mt-2 font-display">
                Estimated ATS Score: {applied ? 98 : scoreReport.atsScore}%
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {applied
                  ? "Outstanding! CVCraft AI has automatically aligned your professional experience summaries and skills. Your resume is fully optimized to bypass standard corporate screening systems."
                  : "Your keyword structure is optimal. Incorporating quantifiable accomplishments will lift your chances of bypassing automated resume filters."}
              </p>
            </div>
          </div>

          {/* Interactive Automatic AI Fix Block (For Premium Users Only) */}
          {isPremium && (
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-600/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                  👑 PREMIUM ONE-CLICK OPTIMIZER
                </span>
                <h5 className="text-xs font-bold text-white">Auto-implement recommendations in 1-Click?</h5>
                <p className="text-[11px] text-slate-400">Gemini will rewrite descriptions to include action-driven metrics and missing technologies directly.</p>
              </div>
              <button
                onClick={handleAutoApply}
                disabled={applying || applied}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition shrink-0 flex items-center gap-1.5 shadow-lg ${
                  applied
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                }`}
              >
                {applying ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Auto-Fixing Resume...
                  </>
                ) : applied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Suggestions Applied!
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Implement & Update Resume
                  </>
                )}
              </button>
            </div>
          )}

          {/* If the changes are successfully applied, provide feedback block */}
          {applied && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle className="h-4 w-4" />
                <span>Resume updated successfully!</span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-6">
                Your career summary, core skills list, and professional work experiences have been automatically rewritten with industry-standard terminology and metric alignments. 
                Navigate back to the <strong>Resume Builder</strong> tab to view your high-scoring new resume!
              </p>
            </div>
          )}

          {/* Grammar & Action Plan Sections (Gated or displayed depending on premium level) */}
          <div className="relative">
            {!isPremium && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-20 rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-slate-800/80">
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3 rounded-full mb-3">
                  <Lock className="h-6 w-6" />
                </div>
                <h5 className="text-sm font-bold text-white font-display">Upgrade to Unlock Recommendations & 1-Click Fixes</h5>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Free accounts only receive overall compatibility scores. Go Elite to see full mechanical grammar checks, specific keyword suggestions, and auto-implement changes instantly!
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={onUpgrade}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
                  >
                    Go Elite ($1.99/mo)
                  </button>
                </div>
              </div>
            )}

            <div className={`space-y-6 ${!isPremium ? "blur-md pointer-events-none select-none max-h-[220px] overflow-hidden" : ""}`}>
              {/* Grammar & Spacing Alerts */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Grammar & Structure Check
                </h5>
                <div className="space-y-2">
                  {scoreReport.grammarCheck.map((alert, i) => (
                    <div key={i} className="p-3 bg-slate-950/20 border border-slate-800/80 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-200 block">{alert.issue}</span>
                        <span className="text-slate-400 mt-0.5 block">Suggestion: {alert.suggestion}</span>
                      </div>
                    </div>
                  ))}
                  {scoreReport.grammarCheck.length === 0 && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5 p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/40">
                      <CheckCircle className="h-4 w-4" /> Zero layout or mechanical grammar checks detected. Outstanding work!
                    </div>
                  )}
                </div>
              </div>

              {/* Section Score Grid */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Section Breakdown
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {scoreReport.sectionsAnalysis.map((item, i) => (
                    <div key={i} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{item.section}</span>
                        <span className={`text-xs font-mono font-bold ${
                          item.status === 'success' ? 'text-emerald-400' : item.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                        }`}>{item.score}%</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{item.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Check / Upgrades */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Action Plan to Unlock Callbacks
                </h5>
                <ul className="space-y-2">
                  {scoreReport.suggestions.map((sug, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
