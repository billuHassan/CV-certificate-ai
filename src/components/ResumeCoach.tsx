import React, { useState } from "react";
import { Sparkles, Award, ArrowLeft, RefreshCw, CheckCircle, Globe, ExternalLink, Zap, ShieldAlert, ArrowRight, Plus, Check, TrendingUp, Target, Building2, Briefcase, FileText, DollarSign, MapPin, Compass, BookOpen, MessageSquare, Send, ThumbsUp, HelpCircle, Star, UserCheck, Upload } from "lucide-react";
import { ResumeData } from "../types";
import { triggerRewarded, triggerInterstitial } from "./AdSystem";
import UploadResumeModal from "./UploadResumeModal";
import ArcGaugeChart from "./charts/ArcGaugeChart";
import PolygonRadarChart from "./charts/PolygonRadarChart";
import { safeExternalUrl } from "../utils/security";

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

interface TopJob {
  title: string;
  matchScore: number;
  salaryRange: string;
  whyGoodFit: string;
}

interface TopCountry {
  country: string;
  flag?: string;
  hiringDemand: string;
  visaEase: string;
  avgSalaryRange: string;
}

interface TopCert {
  name: string;
  provider: string;
  relevance: string;
  difficulty?: string;
}

interface PrepTip {
  title: string;
  details: string;
  strategicTip: string;
}

interface MockQuestion {
  id: string;
  question: string;
  category: "Behavioral" | "Technical" | "Situational" | "Leadership" | string;
  expectedKeyPoints?: string[];
  STARGuide?: string;
}

interface AnswerEvaluation {
  score: number;
  verdict: string;
  strengths: string[];
  areasToImprove: string[];
  exemplarAnswer: string;
  recruiterFeedback: string;
}

interface GlobalCompanyJob {
  jobTitle: string;
  approxSalaryRange: string;
  whySelected: string;
}

interface GlobalCompany {
  companyName: string;
  industry: string;
  companyUrl?: string;
  whyTargetThisCompany: string;
  topJobs: GlobalCompanyJob[];
}

interface GlobalCountry {
  countryName: string;
  flag?: string;
  visaEase: string;
  topCompanies: GlobalCompany[];
}

interface GlobalContinent {
  continentName: string;
  topCountries: GlobalCountry[];
}

interface HomeCountryAnalysis {
  countryName: string;
  flag?: string;
  overview: string;
  topCompanies: GlobalCompany[];
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
  topJobs?: TopJob[];
  topCountries?: TopCountry[];
  homeCountryAnalysis?: HomeCountryAnalysis;
  globalContinentMatrix?: GlobalContinent[];
  topCertifications?: TopCert[];
  interviewPrepTips?: PrepTip[];
  mockInterviewQuestions?: MockQuestion[];
  groundingSources?: GroundingSource[];
}

interface ResumeCoachProps {
  resume: ResumeData;
  onUpdateResume: (updated: ResumeData) => void;
  isPremium: boolean;
  onUpgrade: () => void;
  onBackToDashboard: () => void;
}

type CoachTab = "coach" | "global-matrix" | "top-jobs" | "countries" | "certifications" | "interview-prep" | "mock-interview";

export default function ResumeCoach({
  resume,
  onUpdateResume,
  isPremium,
  onUpgrade,
  onBackToDashboard,
}: ResumeCoachProps) {
  const [targetRole, setTargetRole] = useState(resume.personalInfo?.jobTitle || "");
  const [targetCompany, setTargetCompany] = useState("");
  const [candidateNationality, setCandidateNationality] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ResumeCoachResult | null>(null);
  const [appliedRecIds, setAppliedRecIds] = useState<Set<string>>(new Set());
  const [applyingAll, setApplyingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<CoachTab>("coach");
  const [selectedContinentIdx, setSelectedContinentIdx] = useState(0);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>("ALL");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Mock interview state
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [userAnswerText, setUserAnswerText] = useState("");
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [evaluationsMap, setEvaluationsMap] = useState<Record<string, AnswerEvaluation>>({});

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
            candidateNationality,
          }),
        });

        const data = await response.json();
        if (data && data.perfectionScore !== undefined) {
          setAnalysisResult(data);
          setAppliedRecIds(new Set());
          setSelectedQuestionIdx(0);
          setUserAnswerText("");
          setEvaluationsMap({});
        } else {
          alert("AI Coach Error: Unable to complete deep resume analysis. Please verify your internet connection or check that your resume has basic work experience and job title filled.");
        }
      } catch (err) {
        console.error("Resume Coach Error:", err);
        alert("AI Connection Error: Unable to reach the AI Coach service. Please check your network connection and retry.");
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

  const handleEvaluateAnswer = async (q: MockQuestion) => {
    if (!userAnswerText.trim()) return;

    const evalAction = async () => {
      setEvaluatingAnswer(true);
      try {
        const res = await fetch("/api/ai/evaluate-interview-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q.question,
            userAnswer: userAnswerText,
            targetRole: targetRole || resume.personalInfo?.jobTitle || "Professional",
            resumeSummary: resume.summary,
          }),
        });

        const data = await res.json();
        if (data && data.score !== undefined) {
          setEvaluationsMap((prev) => ({
            ...prev,
            [q.id]: data,
          }));
        }
      } catch (err) {
        console.error("Evaluation Error:", err);
      } finally {
        setEvaluatingAnswer(false);
      }
    };

    if (isPremium) {
      evalAction();
    } else {
      triggerRewarded(() => {
        evalAction();
      });
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition bg-slate-900/90 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-800 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1.5 rounded-xl">
            <Sparkles className="h-3.5 w-3.5 text-pink-400 animate-pulse" /> AI Resume Coach &amp; Market Strategist
          </span>
        </div>
      </div>

      {/* Target Setup Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 h-48 w-48 bg-indigo-500/10 blur-3xl rounded-full" />

        <div className="relative space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-400" /> Executive AI Resume Coach & Career Strategist
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl">
            Powered by live Google Search Grounding. Get line-by-line perfecting fixes, top matching jobs with salary ranges, global easy-visa countries, top certifications, and interactive AI mock interviews!
          </p>
        </div>

        {/* Inputs for target role, company, and nationality */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-indigo-400" /> Target Job Title
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer, Product Manager..."
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" /> Target Company (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Google, Stripe, Microsoft..."
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-purple-400" /> Candidate Nationality / Passport
            </label>
            <input
              type="text"
              placeholder="e.g. Nigerian, Indian, US, Egyptian, British..."
              value={candidateNationality}
              onChange={(e) => setCandidateNationality(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRunCoach}
            disabled={analyzing}
            className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 font-display"
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Gemini Searching Online Markets & Analyzing Resume...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate Full AI Resume Coaching & Career Strategy
              </>
            )}
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="py-3.5 px-5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" /> Upload Resume to Scan & Audit
          </button>
        </div>

        <UploadResumeModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onImportToBuilder={(newResume) => {
            onUpdateResume(newResume);
            setIsUploadModalOpen(false);
          }}
        />
      </div>

      {/* Navigation Tabs when analysisResult exists */}
      {analysisResult && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveTab("coach")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "coach"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <FileText className="h-4 w-4" /> Resume Perfection ({analysisResult.perfectionScore}/100)
            </button>

            <button
              onClick={() => setActiveTab("global-matrix")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "global-matrix"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Globe className="h-4 w-4 text-purple-400" /> 7 Continents Matrix (Top Companies & Target Jobs)
            </button>

            <button
              onClick={() => setActiveTab("top-jobs")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "top-jobs"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Briefcase className="h-4 w-4 text-emerald-400" /> Top 5 Jobs & Salaries
            </button>

            <button
              onClick={() => setActiveTab("countries")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "countries"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Compass className="h-4 w-4 text-blue-400" /> Top 5 Countries (Visa & Hiring)
            </button>

            <button
              onClick={() => setActiveTab("certifications")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "certifications"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Award className="h-4 w-4 text-amber-400" /> Top 5 Certifications & Skills
            </button>

            <button
              onClick={() => setActiveTab("interview-prep")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "interview-prep"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <BookOpen className="h-4 w-4 text-purple-400" /> Interview Strategy Guide
            </button>

            <button
              onClick={() => setActiveTab("mock-interview")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "mock-interview"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <MessageSquare className="h-4 w-4 text-rose-400 animate-pulse" /> Interactive Mock Interview
            </button>
          </div>

          {/* TAB 1: RESUME COACH & LINE-BY-LINE FIXES */}
          {activeTab === "coach" && (
            <div className="space-y-6">
              {/* Top Visual Analytics Row: Arc Gauge + Radar Polygon Chart + Verdict */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* 1. Arc Gauge Meter */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between shadow-xl relative overflow-hidden">
                  <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800 mb-1">
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                      Dial Gauge
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      Recruiter Threshold
                    </span>
                  </div>
                  <ArcGaugeChart
                    score={analysisResult.perfectionScore}
                    title="Perfection Score"
                    subtitle="COACH RATING"
                    size={220}
                  />
                  <div className="text-xs text-slate-400 text-center mt-2">
                    {appliedRecIds.size > 0 ? (
                      <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="h-4 w-4" /> {appliedRecIds.size} Coached Improvements Applied!
                      </span>
                    ) : (
                      <span>Apply suggestions below to raise your score.</span>
                    )}
                  </div>
                </div>

                {/* 2. Polygon Radar Chart for Multi-Dimensional Alignment */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between shadow-xl relative overflow-hidden">
                  <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800 mb-1">
                    <span className="text-[10px] font-mono tracking-widest text-indigo-400 font-bold uppercase">
                      Radar Skill Alignment
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      Polygon Web
                    </span>
                  </div>
                  <PolygonRadarChart
                    data={[
                      { axis: "Impact", value: analysisResult.dimensionScores.impactMetrics, benchmark: 85, description: "Quantifiable % / $ metrics" },
                      { axis: "Action Verbs", value: analysisResult.dimensionScores.actionVerbs, benchmark: 90, description: "High-power leadership verbs" },
                      { axis: "Keywords", value: analysisResult.dimensionScores.keywordAlignment, benchmark: 88, description: "Role-specific core keywords" },
                      { axis: "Formatting", value: analysisResult.dimensionScores.formatting, benchmark: 92, description: "Recruiter visual hierarchy" },
                      { axis: "Clarity", value: analysisResult.dimensionScores.clarity, benchmark: 86, description: "Tone, brevity & skim-scan speed" },
                    ]}
                    size={230}
                    currentLabel="Active Resume"
                    benchmarkLabel="Target Tier"
                  />
                </div>

                {/* 3. Executive Coach Verdict */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-xl">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-400" /> Executive Coach Verdict
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-850">
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
                        {analysisResult.groundingSources.map((source, i) => {
                          const safeHref = safeExternalUrl(source.uri);
                          if (!safeHref) return null;
                          return (
                            <a
                              key={i}
                              href={safeHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-xs"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0 text-indigo-400" />
                              <span className="truncate">{source.title || source.uri}</span>
                            </a>
                          );
                        })}
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
                              (score as number) >= 80 ? "bg-emerald-500" : (score as number) >= 65 ? "bg-amber-500" : "bg-rose-500"
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

          {/* TAB 7-CONTINENT GLOBAL MATRIX */}
          {activeTab === "global-matrix" && (
            <div className="space-y-8">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-400" /> 7 Continents Target Company & Job Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Select continents and top countries to explore top 5 companies and top 5 jobs tailored to your background and passport ({candidateNationality || "All Passports"}). Click any company link to research them directly.
                </p>
              </div>

              {/* CANDIDATE HOME COUNTRY TARGET COMPANIES SECTION */}
              {analysisResult.homeCountryAnalysis && (
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-5 shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{analysisResult.homeCountryAnalysis.flag || "📍"}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-display">
                            Home Country Spotlight: {analysisResult.homeCountryAnalysis.countryName}
                          </h4>
                          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">
                            Local Market Option
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {analysisResult.homeCountryAnalysis.overview}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-500/30">
                      {analysisResult.homeCountryAnalysis.topCompanies?.length || 0} Target Companies
                    </span>
                  </div>

                  <div className="space-y-4">
                    {analysisResult.homeCountryAnalysis.topCompanies?.map((comp, compIdx) => {
                      const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(comp.companyName + " careers")}`;
                      const linkUrl = safeExternalUrl(comp.companyUrl) || fallbackUrl;
                      return (
                        <div key={compIdx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-indigo-500/40 transition">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
                              <h6 className="text-xs sm:text-sm font-bold text-white font-display">{comp.companyName}</h6>
                              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {comp.industry}
                              </span>
                            </div>
                            <a
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 hover:bg-indigo-900/80 hover:text-white transition"
                            >
                              Visit Company <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                            <strong className="text-indigo-400 font-semibold">Why Target {comp.companyName}: </strong>
                            {comp.whyTargetThisCompany}
                          </p>

                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Top Jobs to Pursue ({comp.topJobs?.length || 0}):
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {comp.topJobs?.map((job, jobIdx) => (
                                <div key={jobIdx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 hover:border-indigo-500/30 transition">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                      <Briefcase className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> {job.jobTitle}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                      {job.approxSalaryRange}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-normal">
                                    <strong className="text-slate-300">Fit Reason: </strong>{job.whySelected}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7-CONTINENT GLOBAL MATRIX */}
              {analysisResult.globalContinentMatrix && analysisResult.globalContinentMatrix.length > 0 ? (
                <div className="space-y-6">
                  {/* Continent Selector Pills */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                      Select Continent:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
                      {analysisResult.globalContinentMatrix.map((cont, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => {
                            setSelectedContinentIdx(cIdx);
                            setSelectedCountryFilter("ALL");
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                            selectedContinentIdx === cIdx
                              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                          }`}
                        >
                          <Compass className="h-3.5 w-3.5" /> {cont.continentName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Continent Content */}
                  {(() => {
                    const activeContinent = analysisResult.globalContinentMatrix[selectedContinentIdx] || analysisResult.globalContinentMatrix[0];
                    if (!activeContinent) return null;

                    const allCountries = activeContinent.topCountries || [];
                    const filteredCountries = selectedCountryFilter === "ALL"
                      ? allCountries
                      : allCountries.filter(c => c.countryName === selectedCountryFilter);

                    return (
                      <div className="space-y-6">
                        <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🌍</span>
                            <div>
                              <h4 className="text-sm font-bold text-white font-display">{activeContinent.continentName} Regional Matrix</h4>
                              <p className="text-[11px] text-slate-400">
                                Explore top hiring countries and company targets across {activeContinent.continentName}.
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-purple-400 bg-purple-900/40 px-3 py-1 rounded-full border border-purple-500/30">
                            {allCountries.length} Key Country Options
                          </span>
                        </div>

                        {/* Country Options Selector Pills */}
                        {allCountries.length > 0 && (
                          <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-purple-400" /> Filter by Country Option:
                              </span>
                              {selectedCountryFilter !== "ALL" && (
                                <button
                                  onClick={() => setSelectedCountryFilter("ALL")}
                                  className="text-[10px] font-bold text-purple-400 hover:underline"
                                >
                                  Show All ({allCountries.length})
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                              <button
                                onClick={() => setSelectedCountryFilter("ALL")}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                                  selectedCountryFilter === "ALL"
                                    ? "bg-purple-600 text-white"
                                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                                }`}
                              >
                                Show All Countries ({allCountries.length})
                              </button>
                              {allCountries.map((c, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedCountryFilter(c.countryName)}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                                    selectedCountryFilter === c.countryName
                                      ? "bg-purple-600 text-white shadow"
                                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                                  }`}
                                >
                                  <span>{c.flag || "🌐"}</span>
                                  <span>{c.countryName}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Top Countries List */}
                        <div className="space-y-6">
                          {filteredCountries.map((country, countryIdx) => (
                            <div key={countryIdx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-2xl">{country.flag || "🌐"}</span>
                                  <div>
                                    <h5 className="text-sm font-bold text-white font-display">{country.countryName}</h5>
                                    <span className="text-[11px] text-purple-300 flex items-center gap-1">
                                      <ShieldAlert className="h-3 w-3 text-purple-400 shrink-0" /> Visa / Relocation Pathway: {country.visaEase}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                                  {country.topCompanies?.length || 0} Target Companies
                                </span>
                              </div>

                              {/* Companies list */}
                              <div className="space-y-4">
                                {country.topCompanies?.map((comp, compIdx) => {
                                  const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(comp.companyName + " careers")}`;
                                  const linkUrl = safeExternalUrl(comp.companyUrl) || fallbackUrl;
                                  return (
                                    <div key={compIdx} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3 hover:border-emerald-500/30 transition">
                                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                          <h6 className="text-xs sm:text-sm font-bold text-white font-display">{comp.companyName}</h6>
                                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                            {comp.industry}
                                          </span>
                                        </div>
                                        <a
                                          href={linkUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/80 hover:text-white transition"
                                        >
                                          Visit Company <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>

                                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                        <strong className="text-indigo-400 font-semibold">Why Target {comp.companyName}: </strong>
                                        {comp.whyTargetThisCompany}
                                      </p>

                                      {/* Top Jobs at this company */}
                                      <div className="space-y-2 pt-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                          Top Jobs to Pursue ({comp.topJobs?.length || 0}):
                                        </span>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                          {comp.topJobs?.map((job, jobIdx) => (
                                            <div key={jobIdx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 hover:border-indigo-500/30 transition">
                                              <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                                  <Briefcase className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> {job.jobTitle}
                                                </span>
                                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                                  {job.approxSalaryRange}
                                                </span>
                                              </div>
                                              <p className="text-[11px] text-slate-400 leading-normal">
                                                <strong className="text-slate-300">Fit Reason: </strong>{job.whySelected}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <Globe className="h-8 w-8 text-purple-400 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-300">
                    Run or re-run the AI Coach above to generate the full 7-Continent Global Company & Job Matrix customized for your passport and resume!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOP 5 JOBS & SALARIES */}
          {activeTab === "top-jobs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-display flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-emerald-400" /> Top 5 Job Roles to Apply For
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recommended based on your resume profile and real-time market demand benchmark data.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {analysisResult.topJobs?.map((job, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/30 transition space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20">
                          #{idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-white font-display">{job.title}</h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" /> {job.salaryRange}
                        </span>
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-500/30">
                          {job.matchScore}% Match
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-slate-200 font-semibold">Why this is a strong fit: </strong>
                      {job.whyGoodFit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TOP 5 COUNTRIES FOR EASY JOB SECURING */}
          {activeTab === "countries" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-display flex items-center gap-2">
                  <Compass className="h-5 w-5 text-blue-400" /> Top 5 Countries for Easy Job Securing & Visa Pathways
                </h3>
                <p className="text-xs text-slate-400">
                  Global job markets with high candidate demand, favorable visa policies, and strong compensation for your profile.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.topCountries?.map((item, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-blue-500/30 transition">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.flag || "🌐"}</span>
                        <h4 className="text-sm font-bold text-white font-display">{item.country}</h4>
                      </div>
                      <span className="text-[10px] font-bold text-blue-300 bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-500/30">
                        {item.avgSalaryRange}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-1.5 text-slate-300">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-200">Hiring Demand: </strong>
                          {item.hiringDemand}
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5 text-slate-300">
                        <UserCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-200">Visa & Relocation Ease: </strong>
                          {item.visaEase}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TOP 5 SKILLS & CERTIFICATIONS TO PURSUE */}
          {activeTab === "certifications" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-display flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-400" /> Top 5 Professional Certifications & Skills to Pursue
                </h3>
                <p className="text-xs text-slate-400">
                  Credentials that immediately boost your resume credibility and set you apart from competing applicants.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.topCertifications?.map((cert, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-amber-500/30 transition">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/20">
                          #{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-white font-display leading-snug">{cert.name}</h4>
                      </div>
                      {cert.difficulty && (
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {cert.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="text-slate-400">
                        <strong className="text-slate-300">Provider: </strong>
                        {cert.provider}
                      </div>
                      <div className="text-slate-300 leading-relaxed">
                        <strong className="text-amber-400">Market Relevance: </strong>
                        {cert.relevance}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: INTERVIEW PREPARATION STRATEGY GUIDE */}
          {activeTab === "interview-prep" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-display flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-400" /> Executive Interview Preparation Strategy
                </h3>
                <p className="text-xs text-slate-400">
                  Step-by-step master plan to prepare for technical, behavioral, and leadership interviews.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {analysisResult.interviewPrepTips?.map((tip, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                      <span className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-400 font-bold text-xs flex items-center justify-center border border-purple-500/20">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white font-display">{tip.title}</h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {tip.details}
                    </p>

                    <div className="bg-purple-950/30 border border-purple-500/20 p-3 rounded-xl text-xs text-purple-300 flex items-start gap-2">
                      <Zap className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Pro Preparation Tip: </strong>
                        {tip.strategicTip}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: INTERACTIVE MOCK INTERVIEW SIMULATOR */}
          {activeTab === "mock-interview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-display flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-rose-400 animate-pulse" /> Interactive AI Mock Interview Practice
                </h3>
                <p className="text-xs text-slate-400">
                  Answer tailored interview questions generated for your role. Receive instant AI scoring, recruiter feedback, and world-class exemplar responses!
                </p>
              </div>

              {analysisResult.mockInterviewQuestions && analysisResult.mockInterviewQuestions.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Question Navigator */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select Question ({analysisResult.mockInterviewQuestions.length}):</span>
                    <div className="space-y-2">
                      {analysisResult.mockInterviewQuestions.map((q, idx) => {
                        const isSelected = selectedQuestionIdx === idx;
                        const isAnswered = !!evaluationsMap[q.id];

                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setSelectedQuestionIdx(idx);
                              setUserAnswerText("");
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs transition space-y-1 ${
                              isSelected
                                ? "bg-indigo-600/20 border-indigo-500 text-white font-semibold"
                                : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase">{q.category}</span>
                              {isAnswered && (
                                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Score: {evaluationsMap[q.id].score}
                                </span>
                              )}
                            </div>
                            <p className="truncate font-medium">{q.question}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Question Simulator */}
                  <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                    {(() => {
                      const currentQ = analysisResult.mockInterviewQuestions[selectedQuestionIdx];
                      const currentEval = evaluationsMap[currentQ.id];

                      return (
                        <div className="space-y-4">
                          {/* Question Card */}
                          <div className="space-y-2 border-b border-slate-800 pb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase">
                                Question #{selectedQuestionIdx + 1} • {currentQ.category}
                              </span>
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-white font-display leading-snug">
                              "{currentQ.question}"
                            </h4>
                            {currentQ.STARGuide && (
                              <p className="text-xs text-slate-400 italic">
                                💡 Recommended Structure: {currentQ.STARGuide}
                              </p>
                            )}
                          </div>

                          {/* Answer Input */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                              <span>Your Answer (Speak or Type using STAR Method):</span>
                              <span className="text-[10px] text-slate-500 font-normal">Situation ➔ Task ➔ Action ➔ Result</span>
                            </label>
                            <textarea
                              rows={5}
                              placeholder="Type your response here... (e.g., In my recent role at X, I faced a situation where...)"
                              value={userAnswerText}
                              onChange={(e) => setUserAnswerText(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                            />
                          </div>

                          <button
                            onClick={() => handleEvaluateAnswer(currentQ)}
                            disabled={evaluatingAnswer || !userAnswerText.trim()}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                          >
                            {evaluatingAnswer ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" /> Gemini Recruiter Evaluating Your Response...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" /> Submit Answer for Instant AI Evaluation
                              </>
                            )}
                          </button>

                          {/* Evaluation Result View */}
                          {currentEval && (
                            <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 space-y-4 text-xs mt-4">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 text-amber-400" />
                                  <span className="font-bold text-white font-display text-sm">AI Recruiter Score & Feedback</span>
                                </div>
                                <div className={`px-3 py-1 rounded-xl text-sm font-bold border ${getScoreColor(currentEval.score)}`}>
                                  {currentEval.score}/100 Score
                                </div>
                              </div>

                              <p className="text-slate-300 italic bg-slate-900 p-3 rounded-xl border border-slate-800">
                                "{currentEval.verdict}"
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl space-y-1">
                                  <span className="font-bold text-emerald-400 block text-[11px] uppercase">Strengths:</span>
                                  <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                                    {currentEval.strengths?.map((s, i) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-amber-950/30 border border-amber-500/20 p-3 rounded-xl space-y-1">
                                  <span className="font-bold text-amber-400 block text-[11px] uppercase">Areas to Improve:</span>
                                  <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                                    {currentEval.areasToImprove?.map((a, i) => (
                                      <li key={i}>{a}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* Recruiter advice */}
                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                                <span className="font-bold text-indigo-400 block text-[11px]">Recruiter Coaching Advice:</span>
                                <p className="text-slate-300 text-[11px] leading-relaxed">
                                  {currentEval.recruiterFeedback}
                                </p>
                              </div>

                              {/* Exemplar 100/100 Answer */}
                              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-1.5">
                                <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-[11px] uppercase">
                                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> World-Class Exemplar Answer (100/100 STAR Benchmark):
                                </span>
                                <p className="text-slate-200 text-[11px] font-mono leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-850 whitespace-pre-line">
                                  {currentEval.exemplarAnswer}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
