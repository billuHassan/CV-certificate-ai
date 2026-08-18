import React, { useState, useRef } from "react";
import {
  Plus, FileText, Sparkles, Award, Trash2, Edit2, Copy, BarChart2, Check,
  ExternalLink, User, Settings as SettingsIcon, Layout, Eye, BookOpen, AlertCircle,
  FileSearch, Building2, Upload, Brain, ChevronLeft, ChevronRight, TrendingUp, Zap,
  Target, ShieldCheck, ArrowUpRight, CheckCircle2, RefreshCw, Filter, Compass, Briefcase, UserCheck, X, Users
} from "lucide-react";
import { ResumeData, CoverLetterData, UserSession } from "../types";
import { ThemeDefinition } from "./Settings";
import { BannerAd } from "./AdSystem";

interface DashboardProps {
  user: UserSession;
  resumes: ResumeData[];
  letters: CoverLetterData[];
  theme?: ThemeDefinition;
  onSelectResume: (id: string) => void;
  onSelectLetter: (id: string) => void;
  onCreateResume: (title: string, templateId: string) => void;
  onCreateLetter: (title: string, company: string, role: string) => void;
  onDuplicateResume: (resume: ResumeData) => void;
  onDeleteResume: (id: string) => void;
  onDeleteLetter: (id: string) => void;
  onSelectView: (view: "resumes" | "letters" | "score" | "settings" | "resume-coach" | any) => void;
  onUpgrade: () => void;
  onOpenUploadModal?: () => void;
}

export default function Dashboard({
  user,
  resumes,
  letters,
  theme,
  onSelectResume,
  onSelectLetter,
  onCreateResume,
  onCreateLetter,
  onDuplicateResume,
  onDeleteResume,
  onDeleteLetter,
  onSelectView,
  onUpgrade,
  onOpenUploadModal,
}: DashboardProps) {
  const [showCreateResumeModal, setShowCreateResumeModal] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");

  const [showCreateLetterModal, setShowCreateLetterModal] = useState(false);
  const [newLetterTitle, setNewLetterTitle] = useState("");
  const [newLetterCompany, setNewLetterCompany] = useState("");
  const [newLetterRole, setNewLetterRole] = useState("");

  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "resume" | "letter"; title: string } | null>(null);
  const tipsScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic AI Career Tips State
  const defaultTipsList = [
    {
      id: "tip_1",
      category: "Bullet Formula",
      title: "Google X-Y-Z Achievement Formula",
      description: "Structure bullet points as: Accomplished [X] as measured by [Y], by doing [Z]. Always lead with measurable impact.",
      action: "Example: 'Boosted deployment speed by 40% across 12 services by building automated CI/CD pipelines.'",
      isPersonalized: false,
    },
    {
      id: "tip_2",
      category: "ATS Filter",
      title: "Verbatim Keyword Mirroring",
      description: "Scan target job descriptions and incorporate key technical skills and tools directly into your Skills and Experience sections.",
      action: "Bypasses automated recruitment filters with 90%+ relevance.",
      isPersonalized: false,
    },
    {
      id: "tip_3",
      category: "Quantification",
      title: "Metrics in Every Work Role",
      description: "Ensure every work experience entry includes at least 2 quantified numbers ($ figures, percentages, scale of users).",
      action: "Quantified bullets double interview callback probabilities.",
      isPersonalized: false,
    },
    {
      id: "tip_4",
      category: "Interview Prep",
      title: "The STAR Framework Technique",
      description: "Frame all behavioral interview responses around Situation (15%), Task (15%), Action (50%), and Result (20%).",
      action: "Focus heavily on the Action and measurable Result.",
      isPersonalized: false,
    },
    {
      id: "tip_5",
      category: "Outreach",
      title: "The 3-Sentence Cold Outreach",
      description: "Send direct, concise messages to hiring managers: 1 line compliment, 1 line value proposition, 1 simple call-to-action.",
      action: "Generates 3x higher response rates than standard portals.",
      isPersonalized: false,
    },
    {
      id: "tip_6",
      category: "Salary Strategy",
      title: "Compensation Benchmarking",
      description: "Research market rates on levels.fyi and Glassdoor before first recruiter calls. Let them state their range first.",
      action: "Anchors negotiation in actual industry standard data.",
      isPersonalized: false,
    },
    {
      id: "tip_7",
      category: "Elevator Pitch",
      title: "The 30-Second Executive Intro",
      description: "Prepare a crisp pitch: Target role + Core competency + Signature achievement + What excites you about the company.",
      action: "Delivers an instant confident impression during opening questions.",
      isPersonalized: false,
    },
    {
      id: "tip_8",
      category: "Follow-Up",
      title: "24-Hour Thank You Note",
      description: "Send a personalized email within 24 hours referencing 1 specific insight discussed during the interview.",
      action: "Re-engages interviewers and demonstrates proactive commitment.",
      isPersonalized: false,
    }
  ];

  const [tipsList, setTipsList] = useState(defaultTipsList);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);
  const [tipFilter, setTipFilter] = useState<"all" | "personalized" | "general">("all");
  const [targetIndustry, setTargetIndustry] = useState("Software & Technology");
  const [selectedTipDetail, setSelectedTipDetail] = useState<any | null>(null);

  const handleGenerateAiTips = async () => {
    try {
      setIsGeneratingTips(true);
      const activeRes = resumes[0];
      const response = await fetch("/api/ai/career-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: activeRes,
          targetIndustry,
          focusArea: tipFilter
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.tips && Array.isArray(data.tips) && data.tips.length > 0) {
          setTipsList(data.tips);
        }
      }
    } catch (err) {
      console.warn("Failed to generate AI career tips:", err);
    } finally {
      setIsGeneratingTips(false);
    }
  };

  const filteredTips = tipsList.filter((tip) => {
    if (tipFilter === "personalized") return tip.isPersonalized;
    if (tipFilter === "general") return !tip.isPersonalized;
    return true;
  });

  const scrollTips = (direction: "left" | "right") => {
    if (tipsScrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      tipsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const isDark = theme?.isDark ?? false;
  const cardBg = theme?.cardClass || (isDark ? "bg-slate-900/80 border-slate-800 shadow-xl" : "bg-white border-slate-200/90 shadow-md shadow-indigo-100/30");
  const textPrimary = theme?.textPrimary || (isDark ? "text-slate-100" : "text-slate-900");
  const textSecondary = theme?.textMuted || (isDark ? "text-slate-400" : "text-slate-600");
  const subCardBg = theme?.subCardClass || (isDark ? "bg-slate-950/60 border-slate-850" : "bg-slate-50 border-slate-200/80");
  const modalBg = isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-2xl";
  const inputBg = isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900";

  // Calculate live dynamic metrics for embedded 3D dashboard
  const activeResume = resumes[0];
  const skillsList = activeResume?.skills || [];
  const expList = activeResume?.experience || [];
  const summaryText = activeResume?.summary || "";
  const eduList = activeResume?.education || [];
  const projList = activeResume?.projects || [];

  const hasMetricsInExp = expList.some((e) => /\d+%|\$\d+|\d+x|\d+ users/i.test(e.description || ""));
  const atsScore = Math.min(99, Math.max(68, 72 + (skillsList.length > 5 ? 14 : 6) + (hasMetricsInExp ? 10 : 0)));
  const keywordScore = Math.min(99, Math.max(62, 65 + skillsList.length * 3));
  const grammarScore = 96;
  const formattingScore = Math.min(98, 82 + (expList.length > 0 ? 10 : 0) + (eduList.length > 0 ? 6 : 0));
  const readabilityScore = Math.min(96, 76 + (summaryText.length > 80 ? 14 : 6));
  const impactScore = Math.min(98, Math.max(58, 62 + (hasMetricsInExp ? 26 : 6)));
  const recruiterReadiness = Math.round((atsScore + keywordScore + impactScore + formattingScore) / 4);
  const overallEmployability = Math.round((atsScore + keywordScore + grammarScore + formattingScore + readabilityScore + impactScore + recruiterReadiness) / 7);

  const metrics3D = [
    { label: "Overall Employability", score: overallEmployability, color: "from-indigo-500 to-purple-600", bg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400", desc: "Executive hiring probability index" },
    { label: "ATS Score", score: atsScore, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", desc: "Screener parsing match rate" },
    { label: "Keyword Score", score: keywordScore, color: "from-sky-500 to-blue-600", bg: "bg-sky-500/10 border-sky-500/30 text-sky-400", desc: "Skill alignment density" },
    { label: "Impact Score", score: impactScore, color: "from-amber-500 to-orange-600", bg: "bg-amber-500/10 border-amber-500/30 text-amber-400", desc: "Quantified metric achievements" },
    { label: "Grammar Score", score: grammarScore, color: "from-purple-500 to-pink-600", bg: "bg-purple-500/10 border-purple-500/30 text-purple-400", desc: "Vocabulary & spelling accuracy" },
    { label: "Formatting Score", score: formattingScore, color: "from-cyan-500 to-teal-600", bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400", desc: "Structural spacing & layout" },
    { label: "Readability", score: readabilityScore, color: "from-blue-500 to-indigo-600", bg: "bg-blue-500/10 border-blue-500/30 text-blue-400", desc: "Concise bullet scannability" },
    { label: "Recruiter Readiness", score: recruiterReadiness, color: "from-rose-500 to-pink-600", bg: "bg-rose-500/10 border-rose-500/30 text-rose-400", desc: "Human recruiter pass rate" },
  ];

  const jobTipsList = [
    {
      category: "Bullet Formula",
      title: "Google X-Y-Z Strategy",
      description: "Structure bullet points as: Accomplished [X] as measured by [Y], by doing [Z]. Always lead with measurable impact.",
      action: "Example: 'Boosted deployment speed by 40% (Y) across 12 microservices (X) by building automated CI/CD pipelines (Z).'"
    },
    {
      category: "ATS Filter",
      title: "Verbatim Keyword Mirroring",
      description: "Scan the target job description and incorporate key technical skills and tools directly into your Skills and Experience sections.",
      action: "Bypasses automated recruitment filters with 90%+ relevance."
    },
    {
      category: "Quantification",
      title: "Metrics in Every Role",
      description: "Ensure every work experience entry includes at least 2 quantified numbers ($ figures, percentages, scale of users).",
      action: "Quantified bullets double interview callback probabilities."
    },
    {
      category: "Interview Prep",
      title: "The STAR Framework",
      description: "Frame all behavioral interview responses around Situation (15%), Task (15%), Action (50%), and Result (20%).",
      action: "Focus heavily on the Action and measurable Result."
    },
    {
      category: "Outreach",
      title: "The 3-Sentence Cold Email",
      description: "Send direct, concise messages to hiring managers: 1 line compliment, 1 line value proposition, 1 simple call-to-action.",
      action: "Generates 3x higher response rates than standard portals."
    },
    {
      category: "Salary Strategy",
      title: "Compensation Benchmarking",
      description: "Research market rates on levels.fyi and Glassdoor before first recruiter calls. Let them state their range first.",
      action: "Anchors negotiation in actual industry standard data."
    },
    {
      category: "Elevator Pitch",
      title: "The 30-Second Intro",
      description: "Prepare a crisp pitch: Target role + Core competency + Signature achievement + What excites you about the company.",
      action: "Delivers an instant confident impression during opening questions."
    },
    {
      category: "Follow-Up",
      title: "24-Hour Thank You Note",
      description: "Send a personalized email within 24 hours referencing 1 specific insight discussed during the interview.",
      action: "Re-engages interviewers and demonstrates proactive commitment."
    }
  ];

  const handleCreateResumeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newResumeTitle.trim()) {
      onCreateResume(newResumeTitle.trim(), selectedTemplate);
      setShowCreateResumeModal(false);
      setNewResumeTitle("");
    }
  };

  const handleCreateLetterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLetterTitle.trim() && newLetterCompany.trim() && newLetterRole.trim()) {
      onCreateLetter(newLetterTitle.trim(), newLetterCompany.trim(), newLetterRole.trim());
      setShowCreateLetterModal(false);
      setNewLetterTitle("");
      setNewLetterCompany("");
      setNewLetterRole("");
    }
  };

  const templatesPreview = [
    { id: "canva_modern_emerald", name: "Canva Modern Emerald Pro", badge: "New Pro" },
    { id: "canva_executive_navy", name: "Canva Navy Executive", badge: "New Pro" },
    { id: "canva_creative_sage", name: "Canva Sage Editorial", badge: "New Pro" },
    { id: "canva_minimal_slate", name: "Canva Minimal Slate", badge: "New Pro" },
    { id: "canva_corporate_gold", name: "Canva Corporate Prestige", badge: "Premium" },
    { id: "canva_tech_horizon", name: "Canva Horizon Tech", badge: "New Pro" },
    { id: "canva_monochrome_chic", name: "Canva Monochrome Chic", badge: "Premium" },
    { id: "canva_nordic_clean", name: "Canva Nordic Frost", badge: "New Pro" },
    { id: "canva_rose_executive", name: "Canva Rose Gold Executive", badge: "Premium" },
    { id: "canva_hybrid_pro", name: "Canva Hybrid Pro Grid", badge: "New Pro" },
    { id: "minimal", name: "Minimalist ATS Pro", badge: "Unlocked" },
    { id: "executive", name: "Executive Split Slate", badge: "Unlocked" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 no-print">
      
      {/* Top Welcome Panel */}
      <div className={`${cardBg} rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-colors`}>
        {/* Decorative ambient gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 text-center md:text-left">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt="Profile" className="h-14 w-14 rounded-2xl object-cover border border-slate-300 dark:border-slate-700 shrink-0 shadow-lg" />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-lg font-bold text-xl">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h2 className={`text-xl font-bold ${textPrimary} font-display`}>Hello, {user.displayName}</h2>
            </div>
            <p className={`text-xs ${textSecondary} mt-1`}>
              Access all professional templates, ATS career coaches & cover letter generators at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Creators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Creator 1: Upload Existing Resume */}
        <button
          onClick={() => onOpenUploadModal?.()}
          className={`p-5 ${cardBg} hover:border-teal-500 rounded-2xl text-left transition group shadow-md hover:scale-[1.01] border border-teal-500/30 relative`}
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 border border-teal-500/20">
              <Upload className="h-5.5 w-5.5 text-teal-500" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 border border-teal-300 dark:border-teal-800 px-2 py-0.5 rounded uppercase font-bold">
              AI SCANNER
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-teal-600 dark:group-hover:text-teal-400 transition font-display flex items-center gap-1.5`}>
            Upload & Scan Resume
            <span className="text-[9px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-1.5 py-0.2 rounded font-mono">Active</span>
          </h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            Upload PDF/DOCX to extract full content, analyze ATS performance, and edit dynamically.
          </p>
        </button>

        {/* Creator 2: Resume */}
        <button
          onClick={() => setShowCreateResumeModal(true)}
          className={`p-5 ${cardBg} hover:border-indigo-500 rounded-2xl text-left transition group shadow-md hover:scale-[1.01]`}
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20">
              <FileText className="h-5.5 w-5.5" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-900 px-2 py-0.5 rounded uppercase font-bold">
              ATS Ready
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition font-display`}>New Resume</h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            Draft dynamic chronologically-optimized resumes engineered to pass recruitment algorithms.
          </p>
        </button>

        {/* Creator 3: Cover Letter */}
        <button
          onClick={() => setShowCreateLetterModal(true)}
          className={`p-5 ${cardBg} hover:border-emerald-500 rounded-2xl text-left transition group shadow-md hover:scale-[1.01]`}
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
              <Sparkles className="h-5.5 w-5.5" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded uppercase font-bold">
              Search Grounded
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition font-display`}>New Cover Letter</h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            Researches real online company data & job postings to draft tailored cover letters.
          </p>
        </button>

        {/* Creator 4: AI Resume Coach */}
        <button
          onClick={() => onSelectView("resume-coach")}
          className={`p-5 ${cardBg} hover:border-purple-500 rounded-2xl text-left transition group shadow-md hover:scale-[1.01]`}
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 border border-purple-500/20">
              <Sparkles className="h-5.5 w-5.5 animate-pulse" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900 px-2 py-0.5 rounded uppercase font-bold">
              AI Coach
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-purple-600 dark:group-hover:text-purple-400 transition font-display`}>AI Resume Coach</h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            Analyzes market trends to perfect your resume line-by-line with 1-click updates.
          </p>
        </button>

        {/* Creator 5: Job Poster & Company Intelligence */}
        <button
          onClick={() => onSelectView("job-intelligence")}
          className={`p-5 ${cardBg} hover:border-sky-500 rounded-2xl text-left transition group shadow-md hover:scale-[1.01]`}
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 border border-sky-500/20">
              <FileSearch className="h-5.5 w-5.5" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-900 px-2 py-0.5 rounded uppercase font-bold">
              10 Alts
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-sky-600 dark:group-hover:text-sky-400 transition font-display`}>Job Poster & Intelligence</h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            Upload posters, research companies, evaluate role suitability & find 10 local hiring alternatives.
          </p>
        </button>

        {/* Creator 6: 3D Resume Analytics */}
        <button
          onClick={() => onSelectView("resume-analytics")}
          className={`p-5 ${cardBg} hover:border-pink-500 rounded-2xl text-left transition group shadow-md hover:scale-[1.01]`}
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-3 border border-pink-500/20">
              <BarChart2 className="h-5.5 w-5.5" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-950 border border-pink-200 dark:border-pink-900 px-2 py-0.5 rounded uppercase font-bold">
              ⭐ 3D Dashboard
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-pink-600 dark:group-hover:text-pink-400 transition font-display`}>3D Resume Analytics</h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            8-metric dimensional audit with ATS, keyword, readability & recruiter readiness scores.
          </p>
        </button>

        {/* Creator 7: Interview Intelligence */}
        <button
          onClick={() => onSelectView("interview-intelligence")}
          className={`p-5 ${cardBg} hover:border-purple-500 rounded-2xl text-left transition group shadow-md hover:scale-[1.01]`}
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 border border-purple-500/20">
              <Brain className="h-5.5 w-5.5" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900 px-2 py-0.5 rounded uppercase font-bold">
              AI Mock Suite
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-purple-600 dark:group-hover:text-purple-400 transition font-display`}>Interview Intelligence</h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            Technical, HR & Behavioural questions, STAR framework guides & instant AI mock evaluation.
          </p>
        </button>

        {/* Creator 8: Daily Cognitive Skill Arena (Games & Leaderboard) */}
        <button
          onClick={() => onSelectView("skill-arena")}
          className={`p-5 ${cardBg} hover:border-amber-500 rounded-2xl text-left transition group shadow-md hover:scale-[1.01]`}
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
              <Zap className="h-5.5 w-5.5 text-amber-500" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded uppercase font-bold flex items-center gap-1">
              🔥 DAILY STREAK
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-amber-600 dark:group-hover:text-amber-400 transition font-display flex items-center gap-1.5`}>
            Daily Skill Arena
            <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-mono">3 Games</span>
          </h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            Play Sudoku Pro, Word Matrix & Math Crunch. Daily increasing levels, timer, live rankings & streaks.
          </p>
        </button>

        {/* Creator 9: Direct Messages (Peer-to-Peer Chat) */}
        <button
          onClick={() => onSelectView("direct-messages")}
          className={`p-5 ${cardBg} hover:border-indigo-500 rounded-2xl text-left transition group shadow-md hover:scale-[1.01]`}
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20">
              <Users className="h-5.5 w-5.5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-900 px-2 py-0.5 rounded uppercase font-bold flex items-center gap-1">
              💬 DIRECT CHAT
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition font-display flex items-center gap-1.5`}>
            Direct Messages
            <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-1.5 py-0.2 rounded font-mono">Live</span>
          </h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            Private encrypted 1-on-1 direct messaging between members with photos & video sharing.
          </p>
        </button>
      </div>

      {/* ⭐ EMBEDDED 3D RESUME ANALYTICS METRICS DASHBOARD ⭐ */}
      <div className={`${cardBg} rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden border border-indigo-500/20`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${textPrimary} font-display tracking-tight`}>⭐ 3D Resume Analytics & Employability Scores</h3>
                <span className="text-[10px] font-mono tracking-widest font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                  LIVE DATA
                </span>
              </div>
              <p className={`text-xs ${textSecondary} mt-0.5`}>
                8 dimensional analytics evaluating <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeResume?.title || "Active Resume"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectView("resume-analytics")}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5 shrink-0 self-start sm:self-center"
          >
            <span>Open Interactive 3D Suite</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* 8 3D Dimensional Metric Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {metrics3D.map((m, idx) => (
            <div
              key={idx}
              onClick={() => onSelectView("resume-analytics")}
              className={`p-3.5 ${subCardBg} hover:border-indigo-500/50 rounded-xl transition cursor-pointer group shadow-sm flex flex-col justify-between border relative overflow-hidden`}
            >
              <div className="space-y-1">
                <span className={`text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate group-hover:text-indigo-400 transition`}>
                  {m.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black ${textPrimary} font-mono tracking-tight`}>
                    {m.score}%
                  </span>
                </div>
              </div>

              {/* Progress mini bar */}
              <div className="mt-2.5 space-y-1">
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${m.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${m.score}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate block">
                  {m.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Horizontally Scrollable Job Hunting & AI Career Tips Carousel */}
      <div className={`${cardBg} rounded-2xl p-6 space-y-4 shadow-xl border border-indigo-500/10`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold shrink-0 shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${textPrimary} font-display`}>Dynamic Job Hunting & Career Tips</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 uppercase tracking-wider">
                  AI Powered
                </span>
              </div>
              <p className={`text-xs ${textSecondary}`}>
                Dynamic general & AI-personalized career advice referring directly to {activeResume?.personalInfo?.fullName ? `${activeResume.personalInfo.fullName}'s (${activeResume.personalInfo.jobTitle || 'Profile'})` : 'your resume background'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Target Industry Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="Software & Technology" className="dark:bg-slate-900">Software & Tech</option>
                <option value="Finance & Banking" className="dark:bg-slate-900">Finance & Banking</option>
                <option value="Healthcare & Biotech" className="dark:bg-slate-900">Healthcare & Biotech</option>
                <option value="Executive Management" className="dark:bg-slate-900">Executive Management</option>
                <option value="Marketing & Creative" className="dark:bg-slate-900">Marketing & Creative</option>
                <option value="Sales & Business Dev" className="dark:bg-slate-900">Sales & Business Dev</option>
                <option value="General Professional" className="dark:bg-slate-900">General Professional</option>
              </select>
            </div>

            {/* AI Generate Button */}
            <button
              onClick={handleGenerateAiTips}
              disabled={isGeneratingTips}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingTips ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating AI Tips...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Generate Fresh AI Tips
                </>
              )}
            </button>

            {/* Scroll Nav Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => scrollTips("left")}
                className="p-2 text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 rounded-xl transition shadow-sm"
                title="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollTips("right")}
                className="p-2 text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 rounded-xl transition shadow-sm"
                title="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setTipFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              tipFilter === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All Tips ({tipsList.length})
          </button>
          <button
            onClick={() => setTipFilter("personalized")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              tipFilter === "personalized"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
            AI Personalized ({tipsList.filter(t => t.isPersonalized).length})
          </button>
          <button
            onClick={() => setTipFilter("general")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              tipFilter === "general"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            General Strategies ({tipsList.filter(t => !t.isPersonalized).length})
          </button>
        </div>

        {/* Scrollable Container */}
        <div
          ref={tipsScrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        >
          {filteredTips.map((tip, idx) => (
            <div
              key={tip.id || idx}
              className={`min-w-[290px] sm:min-w-[330px] max-w-[350px] p-4.5 ${subCardBg} rounded-xl space-y-3 snap-start shrink-0 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition shadow-sm relative group flex flex-col justify-between`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {tip.category}
                  </span>
                  {tip.isPersonalized ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 fill-emerald-400" /> Tailored
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">General</span>
                  )}
                </div>

                <h4 className={`text-xs font-bold ${textPrimary} leading-snug group-hover:text-indigo-400 transition`}>
                  {tip.title}
                </h4>
                <p className={`text-xs ${textSecondary} leading-relaxed line-clamp-3`}>
                  {tip.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium line-clamp-2">
                  ⚡ {tip.action}
                </div>
                <button
                  onClick={() => setSelectedTipDetail(tip)}
                  className="w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/10 transition flex items-center justify-center gap-1 border border-indigo-500/20"
                >
                  <BookOpen className="w-3 h-3" /> View Action Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Split Dashboard content */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Main Column: Recent Resumes & Cover Letters */}
        <div className="space-y-6">
          
          {/* Recent Resumes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display">Recent Resumes</h3>
              <button
                onClick={() => onOpenUploadModal?.()}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Upload className="h-3.5 w-3.5" /> Upload & Scan Resume
              </button>
            </div>
            
            <div className="space-y-3">
              {resumes.map((res) => (
                <div
                  key={res.id}
                  className={`p-4 ${cardBg} rounded-xl flex items-center justify-between gap-4 transition shadow-md`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 ${subCardBg} rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${textPrimary}`}>{res.title}</h4>
                      <p className={`text-[10px] ${textSecondary} mt-0.5`}>
                        Template: <span className="capitalize text-indigo-600 dark:text-indigo-400 font-semibold">{res.templateId}</span> | Updated: {new Date(res.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectResume(res.id)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                      title="Edit Resume"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDuplicateResume(res)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete({ id: res.id, type: "resume", title: res.title })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition"
                      title="Delete Resume"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {resumes.length === 0 && (
                <div className={`text-center py-10 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl ${subCardBg}`}>
                  <p className={`text-xs ${textSecondary}`}>No resumes created yet. Click 'New Resume' above to start.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Cover Letters */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display">Recent Cover Letters</h3>
            
            <div className="space-y-3">
              {letters.map((letItem) => (
                <div
                  key={letItem.id}
                  className={`p-4 ${cardBg} rounded-xl flex items-center justify-between gap-4 transition shadow-md`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 ${subCardBg} rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0`}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${textPrimary}`}>{letItem.title}</h4>
                      <p className={`text-[10px] ${textSecondary} mt-0.5`}>
                        Target: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{letItem.recipientCompany}</span> | Date: {letItem.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectLetter(letItem.id)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete({ id: letItem.id, type: "letter", title: letItem.title })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition"
                      title="Delete Cover Letter"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {letters.length === 0 && (
                <div className={`text-center py-10 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl ${subCardBg}`}>
                  <p className={`text-xs ${textSecondary}`}>No cover letters generated yet. Click 'New Cover Letter' to compose.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CREATE RESUME MODAL --- */}
      {showCreateResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md ${modalBg} rounded-2xl p-6 shadow-2xl`}>
            <h3 className={`text-lg font-bold ${textPrimary} font-display mb-2`}>Create New Resume</h3>
            <p className={`text-xs ${textSecondary} mb-4`}>Enter a title and select a design layout to begin building your CV.</p>
            
            <form onSubmit={handleCreateResumeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${textPrimary}`}>Resume Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Backend Engineer Resume"
                  value={newResumeTitle}
                  onChange={(e) => setNewResumeTitle(e.target.value)}
                  className={`w-full ${inputBg} rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500`}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${textPrimary}`}>Select Initial Layout</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className={`w-full ${inputBg} rounded-xl p-3 text-xs focus:outline-none`}
                >
                  <option value="canva_modern_emerald">Canva Modern Emerald Pro</option>
                  <option value="canva_executive_navy">Canva Navy Executive Column</option>
                  <option value="canva_creative_sage">Canva Sage Editorial</option>
                  <option value="canva_minimal_slate">Canva Minimal Slate</option>
                  <option value="canva_corporate_gold">Canva Corporate Prestige</option>
                  <option value="canva_tech_horizon">Canva Horizon Tech</option>
                  <option value="canva_monochrome_chic">Canva Monochrome Chic</option>
                  <option value="canva_nordic_clean">Canva Nordic Frost</option>
                  <option value="canva_rose_executive">Canva Rose Gold Executive</option>
                  <option value="canva_hybrid_pro">Canva Hybrid Pro Grid</option>
                  <option value="minimal">Minimalist Traditional (ATS-Friendly)</option>
                  <option value="professional">Professional Corporate</option>
                  <option value="modern">Modern Developer Layout</option>
                  <option value="creative">Creative Art & Design</option>
                  <option value="executive">Executive Split Column</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateResumeModal(false)}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE LETTER MODAL --- */}
      {showCreateLetterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md ${modalBg} rounded-2xl p-6 shadow-2xl`}>
            <h3 className={`text-lg font-bold ${textPrimary} font-display mb-2`}>Create New Cover Letter</h3>
            <p className={`text-xs ${textSecondary} mb-4`}>Provide key job details to bootstrap your AI cover letter.</p>
            
            <form onSubmit={handleCreateLetterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${textPrimary}`}>Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Google Solutions Architect Letter"
                  value={newLetterTitle}
                  onChange={(e) => setNewLetterTitle(e.target.value)}
                  className={`w-full ${inputBg} rounded-xl p-3 text-xs`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold ${textPrimary}`}>Target Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Google"
                    value={newLetterCompany}
                    onChange={(e) => setNewLetterCompany(e.target.value)}
                    className={`w-full ${inputBg} rounded-xl p-3 text-xs`}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold ${textPrimary}`}>Target Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Solutions Architect"
                    value={newLetterRole}
                    onChange={(e) => setNewLetterRole(e.target.value)}
                    className={`w-full ${inputBg} rounded-xl p-3 text-xs`}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateLetterModal(false)}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className={`w-full max-w-sm ${modalBg} rounded-2xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${textPrimary}`}>Delete {itemToDelete.type === "resume" ? "Resume" : "Cover Letter"}</h3>
                <p className={`text-xs ${textSecondary}`}>This action cannot be undone.</p>
              </div>
            </div>

            <p className={`text-xs ${textPrimary} ${subCardBg} p-3 rounded-xl`}>
              Are you sure you want to delete <strong className="font-semibold">"{itemToDelete.title}"</strong>?
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (itemToDelete.type === "resume") {
                    onDeleteResume(itemToDelete.id);
                  } else {
                    onDeleteLetter(itemToDelete.id);
                  }
                  setItemToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- AI TIP DETAIL MODAL --- */}
      {selectedTipDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className={`w-full max-w-xl ${modalBg} rounded-2xl p-6 shadow-2xl space-y-5 border border-indigo-500/20 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0 font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {selectedTipDetail.category}
                    </span>
                    {selectedTipDetail.isPersonalized ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 fill-emerald-400" /> Tailored Strategy
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">General Best Practice</span>
                    )}
                  </div>
                  <h3 className={`text-base font-bold ${textPrimary} mt-1`}>{selectedTipDetail.title}</h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedTipDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-4 ${subCardBg} rounded-xl space-y-2 border border-slate-200 dark:border-slate-800`}>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Strategic Overview</h4>
                <p className={`text-xs ${textPrimary} leading-relaxed`}>{selectedTipDetail.description}</p>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Immediate Action Step
                </h4>
                <p className="text-xs text-slate-700 dark:text-emerald-100 font-medium leading-relaxed">
                  {selectedTipDetail.action}
                </p>
              </div>

              {activeResume && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Target className="w-4 h-4" /> Tailored Application to Your Resume
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-indigo-200 leading-relaxed">
                    Referencing <strong>{activeResume.personalInfo?.fullName || "Candidate"}</strong> ({activeResume.personalInfo?.jobTitle || "Professional"}): Implement this strategy across your top work experiences to improve hiring response probability.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTipDetail(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg"
              >
                Got It, Apply Strategy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
