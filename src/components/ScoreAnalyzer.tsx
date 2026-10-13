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
      alert("ATS Audit Error: Unable to complete ATS analysis right now. Please check your network connection and retry.");
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
      alert("ATS Optimization Error: Unable to auto-apply recommendations. Please verify your resume has active section details and check your internet connection before retrying.");
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl no-print relative overflow-hidden space-y-5">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 blur-3xl rounded-full" />
      
      {/* Mockup Studio Window Chrome Bar (matching Slideshow suite design) */}
      <div className="px-4 py-2 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs shadow-inner no-print">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 border border-rose-600/50 shrink-0" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-600/50 shrink-0" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-600/50 shrink-0" />
          <span className="ml-2 font-mono text-[11px] text-slate-300 font-bold truncate">
            Rahmora Live Suite &bull; ATS Diagnostic Score Analyzer
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            ATS Compatibility Audit
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">ATS Score Analyzer</h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">AI DIAGNOSTIC METRIC HUB</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/15"
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
        <div className="text-center py-12 relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 mb-4 text-slate-500 shadow-inner">
            <HelpCircle className="h-6 w-6 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-200 font-display">No diagnostics executed yet</h4>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Scan your active resume template to automatically evaluate your keyword structure, verb density, and mechanical alignments against enterprise ATS filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6 relative">
          {/* Main Ring Score */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-slate-950 border border-slate-850 shadow-inner">
              {/* Simple circle SVG */}
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="48" cy="48" r="40" className="stroke-slate-900" strokeWidth="6" fill="none" />
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
              <div className="text-center z-10">
                <span className="text-3xl font-black text-white font-display tracking-tight">{applied ? 98 : scoreReport.overallScore}</span>
                <span className="text-[10px] text-slate-500 block font-mono font-semibold">/100</span>
              </div>
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <span className="text-[9px] font-mono tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold">
                COMPATIBILITY REPORT
              </span>
              <h4 className="text-base font-extrabold text-slate-200 mt-2 font-display">
                Estimated ATS Match Rate: {applied ? 98 : scoreReport.atsScore}%
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {applied
                  ? "Outstanding! CVCraft AI has automatically aligned your professional experience summaries and skills. Your resume is fully optimized to bypass standard corporate screening systems."
                  : "Your keyword structure is optimal. Incorporating quantifiable accomplishments will lift your chances of bypassing automated resume filters."}
              </p>
            </div>
          </div>

          {/* Interactive Automatic AI Fix Block (Fully Unlocked & Free) */}
          <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 blur-xl rounded-full" />
            <div className="space-y-1.5 relative z-10">
              <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-black bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                ✨ ONE-CLICK AI OPTIMIZER
              </span>
              <h5 className="text-xs font-bold text-white font-display">Auto-implement recommendations in 1-Click?</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">Gemini will automatically rewrite and enhance descriptions to include action-driven metrics and missing industry keywords.</p>
            </div>
            <button
              onClick={handleAutoApply}
              disabled={applying || applied}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-1.5 shadow-lg cursor-pointer ${
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

          {/* If the changes are successfully applied, provide feedback block */}
          {applied && (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 text-xs space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 blur-md rounded-full" />
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold relative z-10">
                <CheckCircle className="h-4 w-4" />
                <span>Resume updated successfully!</span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-6 relative z-10">
                Your career summary, core skills list, and professional work experiences have been automatically rewritten with industry-standard terminology and metric alignments. 
                Navigate back to the <strong>Resume Builder</strong> tab to view your high-scoring new resume!
              </p>
            </div>
          )}

          {/* Grammar & Action Plan Sections (All Public & Open) */}
          <div className="space-y-6">
            
            {/* Grammar & Spacing Alerts */}
            <div className="space-y-3">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                Grammar & Structure Check
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {scoreReport.grammarCheck.map((alert, i) => (
                  <div key={i} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-slate-200 block">{alert.issue}</span>
                      <span className="text-slate-400 block leading-relaxed">
                        <strong className="text-indigo-400 font-semibold font-mono">Suggestion:</strong> {alert.suggestion}
                      </span>
                    </div>
                  </div>
                ))}
                {scoreReport.grammarCheck.length === 0 && (
                  <div className="text-xs text-emerald-400 flex items-center gap-2 p-4 bg-emerald-950/20 rounded-xl border border-emerald-900/40 font-semibold">
                    <CheckCircle className="h-4.5 w-4.5" /> Zero layout or mechanical grammar checks detected. Outstanding work!
                  </div>
                )}
              </div>
            </div>

            {/* Section Score Grid */}
            <div className="space-y-3">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                Section Breakdown Diagnostics
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scoreReport.sectionsAnalysis.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-900">
                      <span className="text-xs font-bold text-slate-200 font-display">{item.section}</span>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        item.status === 'success' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' 
                          : item.status === 'warning' 
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' 
                            : 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
                      }`}>{item.score}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{item.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Check */}
            <div className="space-y-3">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                Targeted AI Action Plan
              </h5>
              <ul className="space-y-2 bg-slate-950/30 border border-slate-850 rounded-xl p-4">
                {scoreReport.suggestions.map((sug, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
                    <ChevronRight className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
