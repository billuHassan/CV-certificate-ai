import React, { useState } from "react";
import { Sparkles, Award, ArrowLeft, RefreshCw, CheckCircle, Globe, ExternalLink, Zap, ShieldAlert, ArrowRight, Plus, Check, TrendingUp, Target, Building2, Briefcase, FileText } from "lucide-react";
import { ResumeData } from "../types";
import { triggerRewarded, triggerInterstitial } from "./AdSystem";

interface GroundingSource {
  title: string;
  uri: string;
}

interface CoachRecommendation {
  id: string;
  section: "summary" | "experience" | "skills" | "projects" | string;
  itemTitle: string;
  currentText: string;
  suggestedText: string;
  reasoning: string;
  impactRating: "Critical" | "High" | "Medium" | string;
  targetId?: string;
}

interface ResumeCoachResult {
  perfectionScore: number;
  executiveSummary: string;
  companyAnalysis?: string;
  dimensionScores: {
    impactMetrics: number;
    actionVerbs: number;
    keywordAlignment: number;
    formatting: number;
    clarity: number;
  };
  coachRecommendations: CoachRecommendation[];
  suggestedNewSkills: string[];
  groundingSources?: GroundingSource[];
}

interface ResumeCoachProps {
  resume: ResumeData;
  onUpdateResume: (updated: ResumeData) => void;
  isPremium: boolean;
  onUpgrade: () => void;
  onBackToDashboard: () => void;
}

export default function ResumeCoach({
  resume,
  onUpdateResume,
  isPremium,
  onUpgrade,
  onBackToDashboard,
}: ResumeCoachProps) {
  const [targetRole, setTargetRole] = useState(resume.personalInfo?.jobTitle || "");
  const [targetCompany, setTargetCompany] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ResumeCoachResult | null>(null);
  const [appliedRecIds, setAppliedRecIds] = useState<Set<string>>(new Set());
  const [applyingAll, setApplyingAll] = useState(false);

  const handleRunCoach = async () => {
    const runAction = async () => {
      setAnalyzing(true);
      try {
        const response = await fetch("/api/ai/resume-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume,
            targetRole: targetRole || resume.personalInfo?.jobTitle || "Professional",
            targetCompany,
          }),
        });

        const data = await response.json();
        if (data && data.perfectionScore !== undefined) {
          setAnalysisResult(data);
          setAppliedRecIds(new Set());
        } else {
          alert("Could not complete AI resume analysis. Please try again.");
        }
      } catch (err) {
        console.error("Resume Coach Error:", err);
        alert("Failed to analyze resume with AI Coach.");
      } finally {
        setAnalyzing(false);
      }
    };

    if (isPremium) {
      runAction();
    } else {
      triggerRewarded(() => {
        runAction();
      });
    }
  };

  const handleApplyRecommendation = (rec: CoachRecommendation) => {
    let updatedResume = { ...resume };

    if (rec.section === "summary") {
      updatedResume.summary = rec.suggestedText;
    } else if (rec.section === "skills") {
      // Parse skills comma-separated
      const newSkillList = rec.suggestedText
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      updatedResume.skills = Array.from(new Set([...(updatedResume.skills || []), ...newSkillList]));
    } else if (rec.section === "experience") {
      const expIndex = updatedResume.experience?.findIndex((e) => e.id === rec.targetId);
      if (expIndex !== undefined && expIndex !== -1 && updatedResume.experience) {
        const expList = [...updatedResume.experience];
        expList[expIndex] = { ...expList[expIndex], description: rec.suggestedText };
        updatedResume.experience = expList;
      } else if (updatedResume.experience && updatedResume.experience.length > 0) {
        // Fallback to first experience
        const expList = [...updatedResume.experience];
        expList[0] = { ...expList[0], description: rec.suggestedText };
        updatedResume.experience = expList;
      }
    } else if (rec.section === "projects") {
      const projIndex = updatedResume.projects?.findIndex((p) => p.id === rec.targetId);
      if (projIndex !== undefined && projIndex !== -1 && updatedResume.projects) {
        const projList = [...updatedResume.projects];
        projList[projIndex] = { ...projList[projIndex], description: rec.suggestedText };
        updatedResume.projects = projList;
      }
    }

    updatedResume.updatedAt = new Date().toISOString();
    onUpdateResume(updatedResume);

    setAppliedRecIds((prev) => new Set(prev).add(rec.id));
  };

  const handleApplyAll = () => {
    if (!analysisResult || !analysisResult.coachRecommendations) return;

    setApplyingAll(true);
    let currentResume = { ...resume };

    analysisResult.coachRecommendations.forEach((rec) => {
      if (rec.section === "summary") {
        currentResume.summary = rec.suggestedText;
      } else if (rec.section === "skills") {
        const newSkills = rec.suggestedText.split(",").map((s) => s.trim()).filter(Boolean);
        currentResume.skills = Array.from(new Set([...(currentResume.skills || []), ...newSkills]));
      } else if (rec.section === "experience") {
        const idx = currentResume.experience?.findIndex((e) => e.id === rec.targetId);
        if (idx !== undefined && idx !== -1 && currentResume.experience) {
          currentResume.experience[idx] = { ...currentResume.experience[idx], description: rec.suggestedText };
        } else if (currentResume.experience && currentResume.experience.length > 0) {
          currentResume.experience[0] = { ...currentResume.experience[0], description: rec.suggestedText };
        }
      }
    });

    currentResume.updatedAt = new Date().toISOString();
    onUpdateResume(currentResume);

    const allIds = new Set(analysisResult.coachRecommendations.map((r) => r.id));
    setAppliedRecIds(allIds);
    setApplyingAll(false);
  };

  const handleAddSkill = (skill: string) => {
    if (!resume.skills?.includes(skill)) {
      const updated = {
        ...resume,
        skills: [...(resume.skills || []), skill],
        updatedAt: new Date().toISOString(),
      };
      onUpdateResume(updated);
    }
  };

  const getImpactColor = (rating: string) => {
    if (rating === "Critical") return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    if (rating === "High") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
    if (score >= 70) return "text-amber-400 border-amber-500/30 bg-amber-950/20";
    return "text-rose-400 border-rose-500/30 bg-rose-950/20";
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition bg-slate-900 px-3 py-2 rounded-lg border border-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" /> AI Resume Coach & Web Grounding
          </span>
        </div>
      </div>

      {/* Target Setup Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 h-48 w-48 bg-indigo-500/10 blur-3xl rounded-full" />

        <div className="relative space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-400" /> Resume Coach & Market Analyzer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl">
            Let Gemini analyze your resume against real online job postings and market standards. Get line-by-line perfecting suggestions with one-click instant updates!
          </p>
        </div>

        {/* Inputs for target role and company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-indigo-400" /> Target Job Title
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer, Project Manager..."
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" /> Target Company (Optional for Live Research)
            </label>
            <input
              type="text"
              placeholder="e.g. Google, Microsoft, Stripe, Local Startup..."
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={handleRunCoach}
          disabled={analyzing}
          className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 font-display"
        >
          {analyzing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Gemini Searching Online Pages & Analyzing Resume...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Run AI Resume Coach Analysis
            </>
          )}
        </button>
      </div>

      {/* Analysis Results View */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Top Verdict & Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between items-center text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resume Perfection Score</span>
              
              <div className="relative flex items-center justify-center">
                <div className={`text-5xl font-black font-display px-6 py-4 rounded-2xl border ${getScoreColor(analysisResult.perfectionScore)}`}>
                  {analysisResult.perfectionScore}<span className="text-lg text-slate-500 font-normal">/100</span>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                {appliedRecIds.size > 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> {appliedRecIds.size} Coached Improvements Applied!
                  </span>
                ) : (
                  <span>Apply suggestions below to raise your perfection score.</span>
                )}
              </div>
            </div>

            {/* Verdict & Online Grounding Summary */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" /> Executive Coach Verdict
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                  {analysisResult.executiveSummary}
                </p>
              </div>

              {analysisResult.companyAnalysis && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                    <Globe className="h-3.5 w-3.5" /> Live Online Grounding Analysis ({targetRole || "Role"})
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {analysisResult.companyAnalysis}
                  </p>
                </div>
              )}

              {/* Grounding Sources links if present */}
              {analysisResult.groundingSources && analysisResult.groundingSources.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Online Web Pages Researched:
                  </span>
                  <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                    {analysisResult.groundingSources.map((source, i) => (
                      <a
                        key={i}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-xs"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0 text-indigo-400" />
                        <span className="truncate">{source.title || source.uri}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5 Dimensions Health Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" /> Dimensional Health Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(analysisResult.dimensionScores).map(([key, score]) => {
                const titleMap: Record<string, string> = {
                  impactMetrics: "Impact Metrics",
                  actionVerbs: "Action Verbs",
                  keywordAlignment: "Keyword Match",
                  formatting: "Formatting",
                  clarity: "Clarity & Tone",
                };

                return (
                  <div key={key} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">{titleMap[key] || key}</span>
                      <span className="font-bold text-white">{score}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score >= 80 ? "bg-emerald-500" : score >= 65 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Skills Pill Cloud */}
          {analysisResult.suggestedNewSkills && analysisResult.suggestedNewSkills.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-400" /> High-Demand Missing Skills Discovered Online
                </h4>
                <span className="text-[10px] text-slate-500">Click to add directly to resume</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {analysisResult.suggestedNewSkills.map((skill, idx) => {
                  const isAdded = resume.skills?.includes(skill);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAddSkill(skill)}
                      disabled={isAdded}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                        isAdded
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30 cursor-default"
                          : "bg-slate-950 text-slate-200 border-slate-800 hover:border-indigo-500 hover:text-white"
                      }`}
                    >
                      {isAdded ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Plus className="h-3.5 w-3.5 text-indigo-400" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Line-by-Line Coached Recommendations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" /> Line-by-Line Perfecting Recommendations ({analysisResult.coachRecommendations.length})
              </h3>

              <button
                onClick={handleApplyAll}
                disabled={applyingAll || appliedRecIds.size === analysisResult.coachRecommendations.length}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/10"
              >
                <CheckCircle className="h-4 w-4" /> Apply All ({analysisResult.coachRecommendations.length}) Coached Perfection Changes
              </button>
            </div>

            <div className="space-y-4">
              {analysisResult.coachRecommendations.map((rec) => {
                const isApplied = appliedRecIds.has(rec.id);

                return (
                  <div
                    key={rec.id}
                    className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition ${
                      isApplied ? "border-emerald-500/30 bg-emerald-950/10" : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getImpactColor(rec.impactRating)}`}>
                          {rec.impactRating} Impact
                        </span>
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                          {rec.section}
                        </span>
                        <h4 className="text-xs font-bold text-white font-display">{rec.itemTitle}</h4>
                      </div>

                      <button
                        onClick={() => handleApplyRecommendation(rec)}
                        disabled={isApplied}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                          isApplied
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10"
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Change Applied
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" /> Apply Coach Perfection
                          </>
                        )}
                      </button>
                    </div>

                    {/* Diff View: Before vs After */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current / Before */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-500/20 space-y-1">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Current Text (Before):</span>
                        <p className="text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed">
                          {rec.currentText || "(Empty section)"}
                        </p>
                      </div>

                      {/* Coached / After */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/20 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Coached Perfected Version (After):</span>
                        <p className="text-xs text-emerald-200 font-mono whitespace-pre-line leading-relaxed font-semibold">
                          {rec.suggestedText}
                        </p>
                      </div>
                    </div>

                    {/* Coach Reasoning */}
                    <div className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200 font-semibold">Why this change improves your resume: </strong>
                        {rec.reasoning}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
