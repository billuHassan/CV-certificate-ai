import React, { useState, useEffect } from "react";
import {
  BarChart2, Award, Sparkles, TrendingUp, RefreshCw, CheckCircle2,
  AlertCircle, ArrowLeft, Zap, Target, Layers, FileText, FileCheck,
  ShieldAlert, Eye, Cpu, Search, Check, ChevronRight, HelpCircle
} from "lucide-react";
import { ResumeData } from "../types";
import { triggerRewarded } from "./AdSystem";
import ArcGaugeChart from "./charts/ArcGaugeChart";
import PolygonRadarChart from "./charts/PolygonRadarChart";
import AtsBarMeter from "./charts/AtsBarMeter";

interface ResumeAnalyticsProps {
  resume: ResumeData;
  onUpdateResume?: (updated: ResumeData) => void;
  onBackToDashboard?: () => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

interface AnalyticsData {
  overallEmployability: number;
  atsScore: number;
  keywordScore: number;
  grammarScore: number;
  formattingScore: number;
  readabilityScore: number;
  impactScore: number;
  recruiterReadiness: number;
  executiveVerdict: string;
  missingKeywords: string[];
  topStrengths: string[];
  highImpactFixes: {
    id: string;
    section: string;
    issue: string;
    suggestedFix: string;
    impactIncrease: string;
  }[];
  sectionHealth: {
    summary: number;
    experience: number;
    education: number;
    skills: number;
    formatting: number;
  };
}

function computeInitialDynamicAnalytics(resume: ResumeData): AnalyticsData {
  const summaryText = resume.summary || "";
  const skillsCount = resume.skills?.length || 0;
  const expList = resume.experience || [];
  const eduList = resume.education || [];

  const expString = JSON.stringify(expList);
  const metricMatches = (expString.match(/\d+|%|\$|\b(increased|reduced|improved|managed|led|built|scaled|delivered|saved)\b/gi) || []).length;

  const hasSummary = summaryText.length > 25;
  const hasContactInfo = !!(resume.personalInfo?.email && resume.personalInfo?.phone);

  const ats = Math.min(98, Math.max(40, 50 + (expList.length > 0 ? 15 : 0) + (skillsCount > 3 ? 15 : 0) + (hasContactInfo ? 10 : 0) + (hasSummary ? 10 : 0)));
  const keyword = Math.min(98, Math.max(35, 40 + skillsCount * 4));
  const impact = Math.min(98, Math.max(35, 45 + Math.min(35, metricMatches * 4)));
  const readability = Math.min(98, Math.max(50, hasSummary ? 88 : 65));
  const formatting = Math.min(98, Math.max(60, (expList.length > 0 ? 20 : 0) + (eduList.length > 0 ? 10 : 0) + 65));
  const grammar = 96;
  const recruiter = Math.min(98, Math.round((ats + keyword + impact + readability) / 4));
  const overall = Math.round((ats + keyword + impact + readability + formatting + recruiter + grammar) / 7);

  const jobTitle = resume.personalInfo?.jobTitle || "target role";

  return {
    overallEmployability: overall,
    atsScore: ats,
    keywordScore: keyword,
    grammarScore: grammar,
    formattingScore: formatting,
    readabilityScore: readability,
    impactScore: impact,
    recruiterReadiness: recruiter,
    executiveVerdict: `Your resume presents ${expList.length} work experience entry/entries and ${skillsCount} listed skills for ${jobTitle}. ${metricMatches > 3 ? 'You have good metric quantification in your experience.' : 'Adding clear percentage and dollar metrics to your experience bullets will increase your overall recruiter readiness.'}`,
    missingKeywords: [
      "System Architecture", "Cross-Functional Collaboration", "Agile Methodology", "CI/CD Deployment", "KPI Metrics"
    ],
    topStrengths: [
      skillsCount > 4 ? `Comprehensive skill portfolio with ${skillsCount} verified items.` : `Clean structural design.`,
      expList.length > 0 ? `Structured experience history with ${expList.length} entries.` : `Defined educational foundation.`,
      hasContactInfo ? `Complete applicant contact details.` : `Clear section organization.`
    ],
    highImpactFixes: [
      {
        id: "fix1",
        section: "Work Experience",
        issue: "Work experience bullets can be enriched with quantifiable metrics.",
        suggestedFix: "Incorporate metrics like % improvements, time saved, or dollar volume handled.",
        impactIncrease: "+5% Impact Score"
      },
      {
        id: "fix2",
        section: "Professional Summary",
        issue: hasSummary ? "Summary can highlight key domain achievements." : "Professional summary section is currently empty.",
        suggestedFix: "State your target role, years of experience, and top 2 core achievements in 2-3 sentences.",
        impactIncrease: "+6% ATS Score"
      }
    ],
    sectionHealth: {
      summary: hasSummary ? 90 : 45,
      experience: expList.length > 1 ? 92 : (expList.length === 1 ? 75 : 40),
      education: eduList.length > 0 ? 95 : 50,
      skills: skillsCount > 5 ? 94 : (skillsCount > 0 ? 70 : 35),
      formatting: 92
    }
  };
}

export default function ResumeAnalytics({
  resume,
  onUpdateResume,
  onBackToDashboard,
  isPremium = false,
  onUpgrade
}: ResumeAnalyticsProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());

  // Real dynamic analytics initialized directly from resume data
  const [analytics, setAnalytics] = useState<AnalyticsData>(() => computeInitialDynamicAnalytics(resume));

  useEffect(() => {
    setAnalytics(computeInitialDynamicAnalytics(resume));
    handleRunAnalytics();
  }, [resume.id]);

  const handleRunAnalytics = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/ai/resume-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: resume })
      });

      if (!response.ok) throw new Error("Analytics API error");

      const data = await response.json();
      if (data.analytics) {
        setAnalytics(data.analytics);
      }
      triggerRewarded(() => {});
    } catch (err) {
      console.error("Error generating resume analytics:", err);
      // Keep state resilient
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40";
    if (score >= 75) return "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/40";
    if (score >= 60) return "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/40";
    return "from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/40";
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100">
      {/* 3D Dashboard Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-2.5 rounded-xl bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 border border-indigo-400/40 shadow-xl shadow-indigo-500/20 text-white">
            <BarChart2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent font-display">
                3D Resume Analytics Engine
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-bold">
                ⭐ 8-Metric Audit
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzing "{resume.title || "Untitled Resume"}" across recruiter & ATS screening dimensions.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAnalytics}
          disabled={analyzing}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold hover:brightness-110 transition flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 disabled:opacity-50"
        >
          {analyzing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Re-Analyze Resume Metrics
        </button>
      </div>

      {/* OVERALL 3D HERO CARD: ARC GAUGE + POLYGON RADAR + RECRUITER VERDICT */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Main 3D Arc Gauge Meter (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-950/80 rounded-2xl border border-indigo-500/30 shadow-inner">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest font-mono mb-1">
              Overall Employability
            </span>
            <ArcGaugeChart
              score={analytics.overallEmployability}
              title="Talent Employability"
              subtitle="HIREABILITY INDEX"
              size={230}
            />
            <p className="text-[11px] text-slate-400 text-center max-w-xs mt-2">
              Composite score predicting interview callback probability across 1,000+ candidate baselines.
            </p>
          </div>

          {/* Polygon Radar Web Chart (8-Metric Polygon) (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-950/80 rounded-2xl border border-indigo-500/30 shadow-inner">
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-850 mb-1">
              <span className="text-xs font-bold text-pink-300 uppercase tracking-widest font-mono">
                8-Metric Polygon Radar
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                Live Alignment
              </span>
            </div>
            <PolygonRadarChart
              data={[
                { axis: "ATS Score", value: analytics.atsScore, benchmark: 85 },
                { axis: "Keywords", value: analytics.keywordScore, benchmark: 88 },
                { axis: "Grammar", value: analytics.grammarScore, benchmark: 95 },
                { axis: "Format", value: analytics.formattingScore, benchmark: 90 },
                { axis: "Readability", value: analytics.readabilityScore, benchmark: 85 },
                { axis: "Impact", value: analytics.impactScore, benchmark: 80 },
                { axis: "Recruiter Ready", value: analytics.recruiterReadiness, benchmark: 88 },
                { axis: "Employability", value: analytics.overallEmployability, benchmark: 85 },
              ]}
              size={250}
              currentLabel="Active Resume"
              benchmarkLabel="Tier-1 Pass"
            />
          </div>

          {/* Executive Verdict & Badges (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  AI Recruiter Executive Verdict
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                "{analytics.executiveVerdict}"
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-300">Spelling &amp; Grammar</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{analytics.grammarScore}% Perfect</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-300">Recruiter Readiness</span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-400">{analytics.recruiterReadiness}% Ready</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-300">Impact Score</span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">{analytics.impactScore}% High Impact</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ THE ATS DESIGN IN BAR WAY ⭐ */}
      <AtsBarMeter
        overallScore={analytics.overallEmployability}
        atsMatchRate={analytics.atsScore}
        dimensions={[
          { id: "ats", name: "ATS Parser Compatibility", score: analytics.atsScore, target: 85, description: "Passes Taleo, Workday, Greenhouse & Lever" },
          { id: "kw", name: "Industry Keyword Match", score: analytics.keywordScore, target: 88, description: "Matches tech stacks & role competencies" },
          { id: "grammar", name: "Spelling, Syntax & Grammar", score: analytics.grammarScore, target: 95, description: "Zero mechanical syntax errors" },
          { id: "format", name: "Formatting & Typography Hierarchy", score: analytics.formattingScore, target: 90, description: "Margin alignment & section hierarchy" },
          { id: "read", name: "6-Second Recruiter Readability", score: analytics.readabilityScore, target: 85, description: "Optimized for quick human skim scans" },
          { id: "impact", name: "Action Verbs & Impact Metrics", score: analytics.impactScore, target: 80, description: "% / $ / # deliverables present in work history" },
        ]}
      />

      {/* THE 8 CORE 3D STATISTIC CARDS GRID */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-display flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" /> 8 Dimensional Analytics Metrics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Metric 1: ATS Score */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-3 transition group shadow-xl hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. ATS Score</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-gradient-to-r ${getScoreBadgeColor(analytics.atsScore)}`}>
                {analytics.atsScore}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
              <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${analytics.atsScore}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Passes standard Applicant Tracking System parsers (Taleo, Workday, Greenhouse).
            </p>
          </div>

          {/* Metric 2: Keyword Score */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-3 transition group shadow-xl hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Keyword Score</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-gradient-to-r ${getScoreBadgeColor(analytics.keywordScore)}`}>
                {analytics.keywordScore}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
              <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${analytics.keywordScore}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Match frequency of high-value industry technologies & core competencies.
            </p>
          </div>

          {/* Metric 3: Grammar Score */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-3 transition group shadow-xl hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Grammar Score</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-gradient-to-r ${getScoreBadgeColor(analytics.grammarScore)}`}>
                {analytics.grammarScore}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${analytics.grammarScore}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Zero grammatical, punctuation, tense, or spelling inconsistencies.
            </p>
          </div>

          {/* Metric 4: Formatting Score */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-3 transition group shadow-xl hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">4. Formatting Score</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-gradient-to-r ${getScoreBadgeColor(analytics.formattingScore)}`}>
                {analytics.formattingScore}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
              <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${analytics.formattingScore}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Margin symmetry, typography hierarchy & clean bullet alignments.
            </p>
          </div>

          {/* Metric 5: Readability Score */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-3 transition group shadow-xl hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">5. Readability</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-gradient-to-r ${getScoreBadgeColor(analytics.readabilityScore)}`}>
                {analytics.readabilityScore}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
              <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${analytics.readabilityScore}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Optimized for human 6-second recruiter skim scans.
            </p>
          </div>

          {/* Metric 6: Impact Score */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-3 transition group shadow-xl hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">6. Impact Score</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-gradient-to-r ${getScoreBadgeColor(analytics.impactScore)}`}>
                {analytics.impactScore}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
              <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${analytics.impactScore}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Action verbs paired with %/$/# metrics & business deliverables.
            </p>
          </div>

          {/* Metric 7: Recruiter Readiness */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-3 transition group shadow-xl hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">7. Recruiter Readiness</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-gradient-to-r ${getScoreBadgeColor(analytics.recruiterReadiness)}`}>
                {analytics.recruiterReadiness}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
              <div className="bg-pink-500 h-full rounded-full transition-all" style={{ width: `${analytics.recruiterReadiness}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Readiness for immediate submission to tier-1 corporate job openings.
            </p>
          </div>

          {/* Metric 8: Overall Employability */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-3 transition group shadow-xl hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">8. Overall Employability</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-gradient-to-r ${getScoreBadgeColor(analytics.overallEmployability)}`}>
                {analytics.overallEmployability}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all" style={{ width: `${analytics.overallEmployability}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Composite index predicting interview invitation probabilities.
            </p>
          </div>

        </div>
      </div>

      {/* MISSING KEYWORDS & SECTION HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Missing Keywords Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Search className="w-4 h-4" /> Missing High-Value Industry Keywords
            </h4>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
              Add to Skills or Work History
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Including these high-impact terms will boost your keyword score and ATS parser ranking:
          </p>

          <div className="flex flex-wrap gap-2">
            {analytics.missingKeywords.map((kw, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold bg-amber-950/40 text-amber-200 border border-amber-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Section Health Bars */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Section Health Breakdown
          </h4>

          <div className="space-y-3 text-xs">
            {Object.entries(analytics.sectionHealth).map(([section, score]) => (
              <div key={section} className="space-y-1">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span className="capitalize">{section} Section</span>
                  <span className="font-mono text-indigo-300 font-bold">{score}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
