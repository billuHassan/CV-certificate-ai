import React, { useState } from "react";
import {
  FileSearch,
  Building2,
  Upload,
  Link as LinkIcon,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Briefcase,
  Target,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  ChevronRight,
  Search,
  X,
  UserCheck
} from "lucide-react";
import { ResumeData } from "../types";

interface JobIntelligenceProps {
  resumes: ResumeData[];
  selectedResumeId: string | null;
  onSelectResume: (id: string) => void;
  onCreateCoverLetterFromJob?: (jobTitle: string, companyName: string, jobDesc: string) => void;
}

interface PosterAnalysisResult {
  jobTitle: string;
  companyName: string;
  jobAbout: string;
  keyRequirements: string[];
  idealCandidateProfile: string;
  howToStandOut: string[];
  candidateResumeFit: {
    matchScore: number;
    fitSummary: string;
    matchingStrengths: string[];
    missingGapsToBridge: string[];
  };
  alternativeCompaniesInArea?: {
    companyName: string;
    location: string;
    whyGoodMatch: string;
    targetRoles: string[];
    keyApplicationTip: string;
  }[];
  groundingSources?: { uri: string; title: string }[];
}

interface CompanyIntelligenceResult {
  targetCompany: string;
  location: string;
  position: string;
  companyOverview: string;
  isSuitable: boolean;
  suitabilityAnalysis: string;
  howToStandOutAndImpress: string[];
  alternativeCompaniesInArea: {
    companyName: string;
    location: string;
    whyGoodMatch: string;
    targetRoles: string[];
    keyApplicationTip: string;
  }[];
  groundingSources?: { uri: string; title: string }[];
}

export default function JobIntelligence({
  resumes,
  selectedResumeId,
  onSelectResume,
  onCreateCoverLetterFromJob
}: JobIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<"poster" | "company">("poster");

  // Poster Tab States
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [posterImageName, setPosterImageName] = useState<string | null>(null);
  const [jobPostingUrl, setJobPostingUrl] = useState<string>("");
  const [jobText, setJobText] = useState<string>("");
  const [analyzingPoster, setAnalyzingPoster] = useState<boolean>(false);
  const [posterResult, setPosterResult] = useState<PosterAnalysisResult | null>(null);

  // Company Tab States
  const [companyNameOrLink, setCompanyNameOrLink] = useState<string>("");
  const [companyLocation, setCompanyLocation] = useState<string>("");
  const [desiredPosition, setDesiredPosition] = useState<string>("");
  const [analyzingCompany, setAnalyzingCompany] = useState<boolean>(false);
  const [companyResult, setCompanyResult] = useState<CompanyIntelligenceResult | null>(null);

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeResume = resumes.find((r) => r.id === selectedResumeId) || resumes[0];

  // Handle Poster Image Upload with client-side image downscaling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Invalid File Type: Please upload a valid image file (PNG, JPG, WEBP, etc.) of the job poster or flyer.");
      return;
    }

    setErrorMessage(null);
    setPosterImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // Optimize image size client-side to prevent network payload timeout
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setPosterImage(compressed);
        } else {
          setPosterImage(rawDataUrl);
        }
      };
      img.onerror = () => {
        setPosterImage(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleClearPosterImage = () => {
    setPosterImage(null);
    setPosterImageName(null);
  };

  // Run Poster Analysis
  const handleAnalyzePoster = async () => {
    if (!posterImage && !jobPostingUrl.trim() && !jobText.trim()) {
      setErrorMessage("Missing Input: Please upload a poster image, paste a job link, or enter job description text to run analysis.");
      return;
    }

    setErrorMessage(null);
    setAnalyzingPoster(true);
    setPosterResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch("/api/ai/analyze-job-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posterImage,
          jobPostingUrl: jobPostingUrl.trim(),
          jobText: jobText.trim(),
          userResume: activeResume || {},
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "Failed to analyze job poster. Please try again with valid inputs.");
        return;
      }

      setPosterResult(data);
    } catch (err: any) {
      console.error("Poster analysis error:", err);
      if (err?.name === "AbortError") {
        setErrorMessage("Request Timeout: Analysis took longer than expected. Please try again or paste the job text directly.");
      } else {
        setErrorMessage("AI Connection Error: Unable to connect to Job Intelligence service. Please check your network and retry.");
      }
    } finally {
      setAnalyzingPoster(false);
    }
  };

  // Run Company Analysis
  const handleAnalyzeCompany = async () => {
    if (!companyNameOrLink.trim() || !companyLocation.trim() || !desiredPosition.trim()) {
      setErrorMessage("Missing Required Fields: Please fill in the Company Name/Link, Location, and Desired Position.");
      return;
    }

    setErrorMessage(null);
    setAnalyzingCompany(true);
    setCompanyResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch("/api/ai/analyze-company-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyNameOrLink: companyNameOrLink.trim(),
          companyLocation: companyLocation.trim(),
          desiredPosition: desiredPosition.trim(),
          userResume: activeResume || {},
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "Failed to analyze company intelligence. Please verify inputs and retry.");
        return;
      }

      setCompanyResult(data);
    } catch (err: any) {
      console.error("Company analysis error:", err);
      if (err?.name === "AbortError") {
        setErrorMessage("Request Timeout: Company intelligence research took longer than expected. Please retry.");
      } else {
        setErrorMessage("AI Connection Error: Unable to research company intelligence. Please check your connection and retry.");
      }
    } finally {
      setAnalyzingCompany(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-sky-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI Job & Company Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Job Poster & Targeted Company Intelligence
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Upload job posters or flyers, paste job URLs, or research targeted companies in any city. 
            CVCraft AI dissects core requirements, standing-out strategies, suitability against your resume, and finds up to 10 active alternative hiring companies in the same region!
          </p>

          {/* Resume Selection Selector */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              Comparing Against Resume Profile:
            </span>
            <select
              value={selectedResumeId || (resumes[0]?.id || "")}
              onChange={(e) => onSelectResume(e.target.value)}
              className="bg-slate-800/90 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.personalInfo?.jobTitle || "No Title"})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-4 text-xs sm:text-sm text-rose-200 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-md font-semibold text-xs transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-700/60 space-x-1 sm:space-x-4">
        <button
          onClick={() => setActiveTab("poster")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === "poster"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-lg"
          }`}
        >
          <FileSearch className="w-4 h-4" />
          Job Poster / Ad / Link Analyzer
        </button>
        <button
          onClick={() => setActiveTab("company")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === "company"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-lg"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company Intelligence & Local Alternatives (10)
        </button>
      </div>

      {/* TAB 1: JOB POSTER / LINK ANALYZER */}
      {activeTab === "poster" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form Column */}
          <div className="lg:col-span-5 space-y-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="space-y-1 border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                Upload Job Poster or Paste Link / Text
              </h2>
              <p className="text-xs text-slate-400">
                Provide a flyer picture, advertisement URL, or paste description text below.
              </p>
            </div>

            {/* 1. File Upload Poster Image */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                1. Upload Poster / Ad Flyer Image
              </label>
              {posterImage ? (
                <div className="relative border border-slate-700 bg-slate-950/80 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={posterImage}
                      alt="Uploaded Poster"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {posterImageName || "Job Poster Image"}
                      </p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready for AI Analysis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearPosterImage}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/70 bg-slate-950/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 mb-1.5 transition" />
                  <span className="text-xs font-medium text-slate-300">
                    Click to upload flyer or job poster image
                  </span>
                  <span className="text-[10px] text-slate-500">
                    PNG, JPG, WEBP, or screenshot
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 2. Job Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                2. Job Posting URL / Link (Optional)
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="url"
                  placeholder="https://company.com/careers/job-id or LinkedIn link"
                  value={jobPostingUrl}
                  onChange={(e) => setJobPostingUrl(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 3. Job Description Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                3. Paste Job Description / Ad Text (Optional)
              </label>
              <textarea
                rows={4}
                placeholder="Paste responsibilities, qualifications, or requirements from poster or job ad..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAnalyzePoster}
              disabled={analyzingPoster}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {analyzingPoster ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Analyzing Poster & Matching Resume...
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4" />
                  Analyze Poster & Requirements
                </>
              )}
            </button>
          </div>

          {/* Right Results Column */}
          <div className="lg:col-span-7">
            {posterResult ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6 animate-in fade-in">
                {/* Header Banner Result */}
                <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-400 shrink-0" />
                      {posterResult.jobTitle}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      Company / Organization: <span className="font-semibold text-slate-200">{posterResult.companyName}</span>
                    </p>
                  </div>

                  {onCreateCoverLetterFromJob && (
                    <button
                      onClick={() =>
                        onCreateCoverLetterFromJob(
                          posterResult.jobTitle,
                          posterResult.companyName,
                          posterResult.jobAbout
                        )
                      }
                      className="px-3.5 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition flex items-center gap-1.5 shadow shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Draft Cover Letter for Role
                    </button>
                  )}
                </div>

                {/* Match Score Gauge & Alignment Banner */}
                <div className="space-y-3">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="currentColor"
                          strokeWidth="5"
                          className="text-slate-800"
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="currentColor"
                          strokeWidth="5"
                          className={`${
                            posterResult.candidateResumeFit.matchScore >= 80
                              ? "text-emerald-500"
                              : posterResult.candidateResumeFit.matchScore >= 60
                              ? "text-amber-500"
                              : "text-rose-500"
                          }`}
                          fill="transparent"
                          strokeDasharray={163}
                          strokeDashoffset={
                            163 - (163 * posterResult.candidateResumeFit.matchScore) / 100
                          }
                        />
                      </svg>
                      <span className="absolute text-sm font-bold text-slate-100">
                        {posterResult.candidateResumeFit.matchScore}%
                      </span>
                    </div>
                    <div className="space-y-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Resume Compatibility & Reality Audit Match
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          posterResult.candidateResumeFit.matchScore >= 80
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : posterResult.candidateResumeFit.matchScore >= 60
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          {posterResult.candidateResumeFit.matchScore >= 80 ? "Strong Fit" : posterResult.candidateResumeFit.matchScore >= 60 ? "Moderate Fit" : "Discrepancy / Gap Alert"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {posterResult.candidateResumeFit.fitSummary}
                      </p>
                    </div>
                  </div>

                  {/* Title / Experience Mismatch Alert Banner */}
                  {(posterResult.candidateResumeFit.matchScore < 60 ||
                    posterResult.candidateResumeFit.fitSummary.toLowerCase().includes("discrepancy") ||
                    posterResult.candidateResumeFit.fitSummary.toLowerCase().includes("mismatch")) && (
                    <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-3 shadow-md">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="font-bold text-amber-300 block">
                          Headline Title & Work Experience Alignment Notice
                        </strong>
                        <p className="leading-relaxed">
                          Your declared job title and actual work experience entries have been audited against recruiter ATS screening standards. Resolving headline discrepancies (e.g. changing headline title from a non-aligned role like "Doctor" to "Software Engineer") will immediately eliminate recruiter flags and significantly raise your match percentage.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 1. What the job is about */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-400" />
                    What the Job is About
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                    {posterResult.jobAbout}
                  </p>
                </div>

                {/* 2. Key Requirements */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-sky-400" />
                    Core Requirements & Qualifications
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {posterResult.keyRequirements.map((req, idx) => (
                      <li
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-200 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Who is Best Suited & How to Stand Out */}
                <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Ideal Candidate Profile & How to Stand Out
                  </h4>
                  <p className="text-xs text-slate-300 italic">
                    "{posterResult.idealCandidateProfile}"
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-200 block">
                      Key Strategies to Stand Out to Hiring Managers:
                    </span>
                    <ul className="space-y-1.5">
                      {posterResult.howToStandOut.map((strategy, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Strengths vs Missing Gaps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3.5 space-y-2">
                    <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Matching Strengths
                    </h5>
                    <ul className="space-y-1">
                      {posterResult.candidateResumeFit.matchingStrengths.map((str, i) => (
                        <li key={i} className="text-xs text-emerald-200/90 flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3.5 space-y-2">
                    <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Gaps to Bridge in Resume
                    </h5>
                    <ul className="space-y-1">
                      {posterResult.candidateResumeFit.missingGapsToBridge.map((gap, i) => (
                        <li key={i} className="text-xs text-amber-200/90 flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* UP TO 10 ALTERNATIVE COMPANIES IN THE SAME AREA (FROM POSTER/LINK) */}
                {posterResult.alternativeCompaniesInArea && posterResult.alternativeCompaniesInArea.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sky-400" />
                        Up to 10 Alternative Hiring Companies in the Same Region
                      </h4>
                      <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                        {posterResult.alternativeCompaniesInArea.length} Options
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 max-h-[420px] overflow-y-auto pr-1">
                      {posterResult.alternativeCompaniesInArea.map((altCompany, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-xs flex items-center justify-center font-mono shrink-0">
                                {idx + 1}
                              </span>
                              {altCompany.companyName}
                            </h5>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              {altCompany.location}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            <strong className="text-slate-200 font-semibold">Why it fits your profile:</strong>{" "}
                            {altCompany.whyGoodMatch}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                            <span className="text-slate-400 font-semibold">Target Roles:</span>
                            {altCompany.targetRoles.map((role, rIdx) => (
                              <span
                                key={rIdx}
                                className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium"
                              >
                                {role}
                              </span>
                            ))}
                          </div>

                          <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded p-2 flex items-start gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>Application Tip:</strong> {altCompany.keyApplicationTip}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grounding Sources */}
                {posterResult.groundingSources && posterResult.groundingSources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Live Search Grounding Citations:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {posterResult.groundingSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] rounded-lg border border-slate-700 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="max-w-[200px] truncate">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3 h-full min-h-[350px]">
                <FileSearch className="w-12 h-12 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-300">
                  Ready to Analyze Job Poster or Posting
                </h3>
                <p className="text-xs max-w-sm text-slate-400">
                  Upload an image of a job flyer/poster, paste a direct job URL, or paste description text on the left to view comprehensive AI requirements, standing-out strategies, and resume matching.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY INTELLIGENCE & LOCAL ALTERNATIVES */}
      {activeTab === "company" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Inputs Column */}
          <div className="lg:col-span-5 space-y-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="space-y-1 border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Target Company & Location Research
              </h2>
              <p className="text-xs text-slate-400">
                AI will research this specific company, evaluate suitability for your role, and find up to 10 active alternative companies in the same area.
              </p>
            </div>

            {/* Company Name or Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Company Name or Website URL *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g., Stripe, Google, or https://stripe.com"
                  value={companyNameOrLink}
                  onChange={(e) => setCompanyNameOrLink(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Location / City */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Company Location / City / Area *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g., San Francisco CA, London UK, Nairobi, Berlin"
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Desired Position */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Desired Job Title / Position *
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g., Senior Software Engineer, Marketing Manager"
                  value={desiredPosition}
                  onChange={(e) => setDesiredPosition(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAnalyzeCompany}
              disabled={analyzingCompany}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {analyzingCompany ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Researching Company & Finding 10 Local Alternatives...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Research Company & Find 10 Local Alternatives
                </>
              )}
            </button>
          </div>

          {/* Right Results Column */}
          <div className="lg:col-span-7">
            {companyResult ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6 animate-in fade-in">
                {/* Header Banner */}
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      {companyResult.targetCompany}
                    </h3>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        companyResult.isSuitable
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                          : "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                      }`}
                    >
                      {companyResult.isSuitable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> High Role Suitability Match
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" /> Qualification Bridge Needed
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    Target Location: <span className="font-semibold text-slate-200">{companyResult.location}</span>
                    <span className="mx-1">•</span>
                    Position: <span className="font-semibold text-indigo-300">{companyResult.position}</span>
                  </p>
                </div>

                {/* 1. Company Overview */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-400" />
                    Company Intelligence Overview & Culture
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                    {companyResult.companyOverview}
                  </p>
                </div>

                {/* 2. Suitability Analysis */}
                <div className="space-y-2 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Candidate Suitability Assessment
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {companyResult.suitabilityAnalysis}
                  </p>
                </div>

                {/* 3. How to Stand Out & Impress */}
                <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    How to Stand Out & Impress {companyResult.targetCompany}
                  </h4>
                  <ul className="space-y-2">
                    {companyResult.howToStandOutAndImpress.map((strategy, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. UP TO 10 ALTERNATIVE COMPANIES IN THE SAME AREA */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-400" />
                      Up to 10 Recommended Alternative Companies in {companyResult.location}
                    </h4>
                    <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                      {companyResult.alternativeCompaniesInArea?.length || 0} Companies
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                    {companyResult.alternativeCompaniesInArea &&
                    companyResult.alternativeCompaniesInArea.length > 0 ? (
                      companyResult.alternativeCompaniesInArea.map((altCompany, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-xs flex items-center justify-center font-mono shrink-0">
                                {idx + 1}
                              </span>
                              {altCompany.companyName}
                            </h5>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              {altCompany.location}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            <strong className="text-slate-200 font-semibold">Why it fits your resume:</strong>{" "}
                            {altCompany.whyGoodMatch}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                            <span className="text-slate-400 font-semibold">Target Positions:</span>
                            {altCompany.targetRoles.map((role, rIdx) => (
                              <span
                                key={rIdx}
                                className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium"
                              >
                                {role}
                              </span>
                            ))}
                          </div>

                          <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded p-2 flex items-start gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>Application Tip:</strong> {altCompany.keyApplicationTip}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No alternative companies found for this location.</p>
                    )}
                  </div>
                </div>

                {/* Grounding Sources */}
                {companyResult.groundingSources && companyResult.groundingSources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Google Search Grounding Sources:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {companyResult.groundingSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] rounded-lg border border-slate-700 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="max-w-[200px] truncate">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3 h-full min-h-[350px]">
                <Building2 className="w-12 h-12 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-300">
                  Ready for Company Intelligence & Regional Search
                </h3>
                <p className="text-xs max-w-sm text-slate-400">
                  Enter any company name or web link, location/city, and desired position on the left. The AI will research culture, analyze your suitability, and locate up to 10 active alternative hiring companies in the area.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
