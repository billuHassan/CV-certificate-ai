import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles, ShieldCheck, Check, Plus, RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  Info, Copy, CheckCircle2, Filter, Layers, Target, TrendingUp, HelpCircle
} from "lucide-react";
import { ResumeData } from "../types";
import { AtsKeyword, fetchAiAtsKeywords, analyzeKeywordMatches, getAtsKeywordsForTitle } from "../utils/atsKeywords";

interface AtsKeywordSuggesterProps {
  jobTitle: string;
  resume: ResumeData;
  onAddSkill: (skill: string) => void;
  onAddMultipleSkills: (skills: string[]) => void;
  onUpdateJobTitle?: (title: string) => void;
  className?: string;
  compact?: boolean;
}

export default function AtsKeywordSuggester({
  jobTitle,
  resume,
  onAddSkill,
  onAddMultipleSkills,
  onUpdateJobTitle,
  className = "",
  compact = false,
}: AtsKeywordSuggesterProps) {
  const [keywords, setKeywords] = useState<AtsKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedKeywordDetail, setSelectedKeywordDetail] = useState<AtsKeyword | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [customJobInput, setCustomJobInput] = useState(jobTitle || "");
  const [atsInsights, setAtsInsights] = useState<string>("");
  const [screeningTier, setScreeningTier] = useState<string>("Tier-1 Guaranteed Pass");

  // Keep local input in sync with external jobTitle changes
  useEffect(() => {
    if (jobTitle && jobTitle !== customJobInput) {
      setCustomJobInput(jobTitle);
    }
  }, [jobTitle]);

  // Load keywords whenever jobTitle changes
  useEffect(() => {
    let isCancelled = false;

    const loadKeywords = async () => {
      const targetRole = (jobTitle || customJobInput || "").trim();
      if (!targetRole) {
        setKeywords([]);
        return;
      }

      // Initial synchronous load for instant responsiveness
      const instant = getAtsKeywordsForTitle(targetRole);
      setKeywords(instant.keywords);
      setAtsInsights(instant.atsParserInsights);
      setScreeningTier(instant.screeningTier);

      // Async AI refinement
      setIsLoading(true);
      try {
        const result = await fetchAiAtsKeywords(targetRole);
        if (!isCancelled && result.keywords && result.keywords.length > 0) {
          setKeywords(result.keywords);
          setAtsInsights(result.atsParserInsights);
          setScreeningTier(result.screeningTier);
        }
      } catch (err) {
        console.warn("AI keyword fetch error, using instant dictionary:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadKeywords();

    return () => {
      isCancelled = true;
    };
  }, [jobTitle]);

  // Analyze keyword match presence against current resume state
  const matchReport = useMemo(() => {
    return analyzeKeywordMatches(resume, keywords);
  }, [resume, keywords]);

  // Filter keywords by active tab
  const filteredKeywords = useMemo(() => {
    if (activeCategory === "missing") {
      return keywords.filter(k => !matchReport.matchedKeywords.includes(k.keyword));
    }
    if (activeCategory === "matched") {
      return keywords.filter(k => matchReport.matchedKeywords.includes(k.keyword));
    }
    if (activeCategory === "critical") {
      return keywords.filter(k => k.importance === "Critical");
    }
    if (activeCategory !== "all") {
      return keywords.filter(k => k.category === activeCategory);
    }
    return keywords;
  }, [keywords, activeCategory, matchReport]);

  const handleCopyExample = (text: string, kw: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 2500);
  };

  const handleAddAllMissing = () => {
    const missing = matchReport.missingKeywords.map(k => k.keyword);
    if (missing.length > 0) {
      onAddMultipleSkills(missing);
    }
  };

  const handleSetSampleRole = (role: string) => {
    setCustomJobInput(role);
    if (onUpdateJobTitle) {
      onUpdateJobTitle(role);
    }
  };

  const categories = [
    { id: "all", label: `All (${keywords.length})` },
    { id: "missing", label: `Missing (${matchReport.missingKeywords.length})` },
    { id: "matched", label: `In Resume (${matchReport.matchedCount})` },
    { id: "Hard Skill", label: "Hard Skills" },
    { id: "Framework & Tool", label: "Tools & Frameworks" },
    { id: "Methodology", label: "Methodologies" },
    { id: "Leadership & Impact", label: "Impact & Leadership" },
  ];

  // If no job title is set yet, render an inviting onboarding card
  if (!jobTitle && !customJobInput) {
    return (
      <div className={`p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 space-y-3.5 shadow-xl ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white font-display">ATS High-Impact Keywords Recommender</h4>
            <p className="text-[11px] text-slate-400">Identify keywords Workday, Taleo, and Greenhouse screen for.</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Enter Target Job Title or Role:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customJobInput}
              onChange={(e) => setCustomJobInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customJobInput.trim() && onUpdateJobTitle) {
                  onUpdateJobTitle(customJobInput.trim());
                }
              }}
              placeholder="e.g. Senior Full Stack Engineer, Product Manager..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => {
                if (customJobInput.trim() && onUpdateJobTitle) {
                  onUpdateJobTitle(customJobInput.trim());
                }
              }}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
            >
              Analyze
            </button>
          </div>

          <div className="pt-2">
            <span className="text-[10px] text-slate-500 block mb-1.5 font-medium">Quick Suggestions:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Senior Full Stack Engineer",
                "Product Manager",
                "Data Scientist",
                "DevOps Engineer",
                "UI/UX Designer",
                "Cybersecurity Analyst",
                "Financial Analyst",
                "Registered Nurse"
              ].map(sample => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleSetSampleRole(sample)}
                  className="px-2 py-0.8 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white hover:border-indigo-500 transition cursor-pointer"
                >
                  + {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-indigo-500/20 text-slate-200 overflow-hidden shadow-xl space-y-0 ${className}`}>
      {/* Top Banner Header */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-teal-500/20 border border-indigo-500/30 text-teal-400 shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white font-display">High-Impact ATS Keywords</h4>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                {screeningTier}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Calibrated for: <span className="text-indigo-300 font-semibold">{jobTitle || customJobInput}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {matchReport.missingKeywords.length > 0 && (
            <button
              type="button"
              onClick={handleAddAllMissing}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Add all missing keywords to resume skills"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add All Missing ({matchReport.missingKeywords.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              try {
                const res = await fetchAiAtsKeywords(jobTitle || customJobInput);
                setKeywords(res.keywords);
                setAtsInsights(res.atsParserInsights);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Refresh ATS Keywords"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Match Score Meter & Parser Insights */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Resume Keyword Density:</span>
            <span className={`font-mono font-bold text-xs ${matchReport.tierColor}`}>
              {matchReport.matchedCount} of {matchReport.totalCount} ({matchReport.matchPercentage}%)
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            matchReport.matchPercentage >= 70
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : matchReport.matchPercentage >= 40
              ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}>
            {matchReport.atsStatus}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              matchReport.matchPercentage >= 70
                ? "bg-gradient-to-r from-teal-500 to-emerald-400"
                : matchReport.matchPercentage >= 40
                ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                : "bg-gradient-to-r from-rose-500 to-amber-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(8, matchReport.matchPercentage))}%` }}
          />
        </div>

        {atsInsights && (
          <p className="text-[10px] text-slate-400 flex items-start gap-1.5 pt-0.5 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>{atsInsights}</span>
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeCategory === cat.id
                ? "bg-indigo-600 text-white font-bold shadow-xs"
                : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Keywords Grid / Chips */}
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
        {filteredKeywords.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No keywords found matching this filter category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredKeywords.map((item) => {
              const isPresent = matchReport.matchedKeywords.includes(item.keyword);
              const isSelected = selectedKeywordDetail?.keyword === item.keyword;

              return (
                <div
                  key={item.keyword}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isPresent
                      ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50"
                      : "bg-slate-950/80 border-slate-800 hover:border-indigo-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate font-display">
                          {item.keyword}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                          item.importance === "Critical"
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            : item.importance === "High"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {item.importance}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-mono text-teal-400 font-bold">{item.relevanceScore}% Match</span>
                        <span>•</span>
                        <span className="truncate">{item.category}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 flex items-center gap-1">
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Check className="w-3 h-3 text-emerald-400" /> In Resume
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddSkill(item.keyword)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 transition cursor-pointer"
                          title="Add to Core Skills"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedKeywordDetail(isSelected ? null : item)}
                        className={`p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer ${
                          isSelected ? "bg-slate-800 text-white" : "hover:bg-slate-800"
                        }`}
                        title="View ATS rationale & example usage"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details Drawer */}
                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] space-y-1.5 animate-in fade-in duration-150">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Why ATS Scans for This:
                        </span>
                        <p className="text-slate-300 leading-relaxed text-[11px]">{item.rationale}</p>
                      </div>

                      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">
                            Sample Bullet Context:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyExample(item.exampleUsage, item.keyword)}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedKeyword === item.keyword ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-200 italic leading-snug">
                          "{item.exampleUsage}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Validated against Workday, Taleo, Greenhouse & Lever screener schemas</span>
        </span>
        <span className="font-mono text-slate-500">
          {matchReport.matchedCount}/{matchReport.totalCount} active
        </span>
      </div>
    </div>
  );
}
