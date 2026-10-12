import React, { useState, useEffect } from "react";
import {
  Link2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Check,
  Layers,
  ExternalLink,
  X,
  User,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  HelpCircle
} from "lucide-react";
import { ResumeData, WorkExperience, Education } from "../types";

export interface ParsedLinkedInProfile {
  personalInfo: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    github: string;
    profilePhoto: string;
  };
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  projects?: any[];
  certifications?: any[];
  languages?: any[];
}

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProfile: (
    profile: ParsedLinkedInProfile,
    mode: "replace" | "merge",
    selectedSections: Record<string, boolean>
  ) => void;
  currentResume?: ResumeData;
  initialUrl?: string;
}

const SAMPLE_PROFILES = [
  {
    name: "Satya Nadella",
    role: "CEO at Microsoft",
    url: "https://www.linkedin.com/in/satyanadella"
  },
  {
    name: "Bill Gates",
    role: "Co-chair, Gates Foundation",
    url: "https://www.linkedin.com/in/williamhgates"
  },
  {
    name: "Sundar Pichai",
    role: "CEO at Alphabet & Google",
    url: "https://www.linkedin.com/in/sundarpichai"
  }
];

export default function LinkedInImportModal({
  isOpen,
  onClose,
  onImportProfile,
  currentResume,
  initialUrl = ""
}: LinkedInImportModalProps) {
  const [url, setUrl] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [showRawText, setShowRawText] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ParsedLinkedInProfile | null>(null);
  const [extractedStats, setExtractedStats] = useState<{ experienceCount: number; educationCount: number; skillsCount: number } | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    personalInfo: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    certifications: true,
    projects: true,
    languages: true
  });
  const [activePreviewTab, setActivePreviewTab] = useState<"experience" | "education" | "skills" | "summary">("experience");

  // Sync initial URL if provided and not yet filled
  useEffect(() => {
    if (isOpen) {
      if (initialUrl && !url) {
        setUrl(initialUrl);
      } else if (!url && currentResume?.personalInfo?.linkedin) {
        setUrl(currentResume.personalInfo.linkedin);
      }
      setError(null);
    }
  }, [isOpen, initialUrl, currentResume]);

  if (!isOpen) return null;

  const handleFetchLinkedIn = async (targetUrl?: string) => {
    const finalUrl = (targetUrl || url).trim();
    if (!finalUrl && !rawText.trim()) {
      setError("Please enter a LinkedIn profile URL (e.g., https://www.linkedin.com/in/username).");
      return;
    }

    // Basic format validation
    if (finalUrl && !finalUrl.includes("linkedin.com") && !finalUrl.includes("http") && !finalUrl.startsWith("@")) {
      setError("Please provide a valid LinkedIn URL (e.g., https://www.linkedin.com/in/username).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2800);

    try {
      const response = await fetch("/api/ai/parse-linkedin-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: finalUrl,
          rawText: rawText.trim() || undefined
        })
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const profile = data.profile || (data.personalInfo ? data : null);
      if (!profile || !profile.personalInfo) {
        throw new Error("Unable to parse profile data from the provided URL.");
      }

      setExtractedData(profile);
      setExtractedStats(data.stats || {
        experienceCount: profile.experience?.length || 0,
        educationCount: profile.education?.length || 0,
        skillsCount: profile.skills?.length || 0
      });
      setLoadingStep(3);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error("LinkedIn fetch error:", err);
      setError(err?.message || "Failed to retrieve public profile data. You can paste your profile text below to proceed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyImport = () => {
    if (!extractedData) return;
    onImportProfile(extractedData, importMode, selectedSections);
    onClose();
  };

  const toggleSection = (key: string) => {
    setSelectedSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isAnySectionSelected = Object.values(selectedSections).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl shadow-indigo-950/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with LinkedIn signature badge */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#0A66C2]/30 shrink-0">
              in
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  Import from LinkedIn
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0A66C2]/20 text-[#388bfd] border border-[#0A66C2]/40">
                  Public Profile Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Fetch and auto-populate your experience, education, skills, and summary directly into your resume.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* If NOT yet extracted: Input Form */}
          {!extractedData && (
            <div className="space-y-4">
              
              {/* URL Input Box */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-[#0A66C2]" /> Public LinkedIn Profile URL
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Format: linkedin.com/in/username
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                    in/
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoading) {
                        handleFetchLinkedIn();
                      }
                    }}
                    placeholder="https://www.linkedin.com/in/yourname"
                    disabled={isLoading}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-24 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] transition"
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={() => setUrl("")}
                      className="absolute inset-y-0 right-16 pr-2 flex items-center text-slate-500 hover:text-slate-300 text-xs"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleFetchLinkedIn()}
                    disabled={isLoading || !url.trim()}
                    className="absolute inset-y-1.5 right-1.5 px-3 bg-gradient-to-r from-[#0A66C2] to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>Fetch</span>
                  </button>
                </div>
              </div>

              {/* Instant Sample Profiles for 1-Click Verification */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Test Sample Profiles:
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Click to test instant live parsing
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_PROFILES.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => {
                        setUrl(sample.url);
                        handleFetchLinkedIn(sample.url);
                      }}
                      disabled={isLoading}
                      className="p-2 text-left bg-slate-900/90 hover:bg-slate-850 hover:border-[#0A66C2]/60 border border-slate-800 rounded-lg transition group"
                    >
                      <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 truncate">
                        {sample.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {sample.role}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional: Raw text supplement accordion */}
              <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>Have extra profile notes or private profile text? (Optional)</span>
                  </span>
                  {showRawText ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {showRawText && (
                  <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/80">
                    <p className="text-[11px] text-slate-400">
                      If your LinkedIn profile is set to strict private view, you can paste the text copied from your profile page below:
                    </p>
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      rows={4}
                      placeholder="Paste your 'About', 'Experience', or 'Skills' section text here..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#0A66C2]"
                    />
                  </div>
                )}
              </div>

              {/* Loading State Animation */}
              {isLoading && (
                <div className="p-5 bg-blue-950/20 border border-blue-900/40 rounded-xl space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white animate-spin">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {loadingStep <= 1 && "Connecting to LinkedIn profile..."}
                        {loadingStep === 2 && "Searching public career records & headline..."}
                        {loadingStep >= 3 && "Synthesizing experiences, skills & education..."}
                      </h4>
                      <p className="text-[11px] text-blue-300/80">
                        Extracting quantifiable achievements and structuring into resume format.
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0A66C2] to-blue-400 h-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(25 + loadingStep * 28, 95)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-rose-950/30 border border-rose-900/50 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{error}</p>
                    <p className="text-[11px] text-rose-400/80">
                      Tip: Ensure the profile is public or paste key text into the optional text box above.
                    </p>
                  </div>
                </div>
              )}

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
                  <User className="h-4 w-4 text-blue-400 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-300">Personal Info</div>
                  <div className="text-[10px] text-slate-500">Name, Title, Location</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
                  <Briefcase className="h-4 w-4 text-emerald-400 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-300">Work History</div>
                  <div className="text-[10px] text-slate-500">Roles & Bullet Points</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
                  <GraduationCap className="h-4 w-4 text-purple-400 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-300">Education</div>
                  <div className="text-[10px] text-slate-500">Degrees & Years</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
                  <Award className="h-4 w-4 text-amber-400 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-300">Skills & Badges</div>
                  <div className="text-[10px] text-slate-500">Keyword Matching</div>
                </div>
              </div>

            </div>
          )}

          {/* If EXTRACTED: Review & Customize Screen */}
          {extractedData && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Profile Overview Card */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0A66C2] to-blue-700 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 shadow-md">
                    {extractedData.personalInfo.profilePhoto ? (
                      <img
                        src={extractedData.personalInfo.profilePhoto}
                        alt={extractedData.personalInfo.fullName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Hide broken image and show initial
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      extractedData.personalInfo.fullName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {extractedData.personalInfo.fullName}
                      <a
                        href={extractedData.personalInfo.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-[#0A66C2] transition"
                        title="View profile on LinkedIn"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </h4>
                    <p className="text-xs text-blue-400 font-medium">
                      {extractedData.personalInfo.jobTitle}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {extractedData.personalInfo.location || "Location not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col items-end gap-1.5 text-xs text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 text-[10px] font-semibold">
                      {extractedStats?.experienceCount || extractedData.experience.length} Positions
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-400 border border-purple-900/40 text-[10px] font-semibold">
                      {extractedStats?.educationCount || extractedData.education.length} Degrees
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-950/40 text-blue-400 border border-blue-900/40 text-[10px] font-semibold">
                      {extractedStats?.skillsCount || extractedData.skills.length} Skills
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setExtractedData(null);
                      setError(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline mt-1"
                  >
                    Change URL / Re-fetch
                  </button>
                </div>
              </div>

              {/* Import Mode Selector: Replace vs Merge */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Import Strategy:</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Choose how data merges into your current resume
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("replace")}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      importMode === "replace"
                        ? "bg-[#0A66C2]/15 border-[#0A66C2] text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      importMode === "replace" ? "border-[#0A66C2] bg-[#0A66C2]" : "border-slate-600"
                    }`}>
                      {importMode === "replace" && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">Replace Current Content</div>
                      <div className="text-[10px] text-slate-400">
                        Replaces selected sections with newly parsed LinkedIn data
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode("merge")}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      importMode === "merge"
                        ? "bg-[#0A66C2]/15 border-[#0A66C2] text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      importMode === "merge" ? "border-[#0A66C2] bg-[#0A66C2]" : "border-slate-600"
                    }`}>
                      {importMode === "merge" && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">Smart Merge</div>
                      <div className="text-[10px] text-slate-400">
                        Keeps existing items and appends new experiences & skills
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Granular Section Checkboxes */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Sections to Populate:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSections({
                        personalInfo: true,
                        summary: true,
                        experience: true,
                        education: true,
                        skills: true,
                        certifications: true,
                        projects: true,
                        languages: true
                      })}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSections({
                        personalInfo: false,
                        summary: false,
                        experience: false,
                        education: false,
                        skills: false,
                        certifications: false,
                        projects: false,
                        languages: false
                      })}
                      className="text-[11px] text-slate-400 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "personalInfo", label: "Personal Details", count: null },
                    { key: "summary", label: "Executive Summary", count: null },
                    { key: "experience", label: "Experience", count: extractedData.experience.length },
                    { key: "education", label: "Education", count: extractedData.education.length },
                    { key: "skills", label: "Skills", count: extractedData.skills.length },
                    { key: "certifications", label: "Certifications", count: extractedData.certifications?.length || 0 },
                    { key: "projects", label: "Projects", count: extractedData.projects?.length || 0 },
                    { key: "languages", label: "Languages", count: extractedData.languages?.length || 0 }
                  ].map((sec) => (
                    <button
                      key={sec.key}
                      type="button"
                      onClick={() => toggleSection(sec.key)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition text-xs ${
                        selectedSections[sec.key]
                          ? "bg-slate-900 border-[#0A66C2]/60 text-slate-100"
                          : "bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <div className={`h-3.5 w-3.5 rounded flex items-center justify-center shrink-0 border ${
                          selectedSections[sec.key]
                            ? "bg-[#0A66C2] border-[#0A66C2] text-white"
                            : "border-slate-700 bg-slate-900"
                        }`}>
                          {selectedSections[sec.key] && <Check className="h-2.5 w-2.5" />}
                        </div>
                        <span className="font-medium truncate">{sec.label}</span>
                      </div>
                      {sec.count !== null && sec.count > 0 && (
                        <span className="text-[10px] text-slate-400 ml-1">
                          ({sec.count})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Preview Explorer Tabs */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                <div className="flex border-b border-slate-800 bg-slate-900/60 p-1">
                  {(["experience", "education", "skills", "summary"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActivePreviewTab(tab)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                        activePreviewTab === tab
                          ? "bg-slate-800 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-3.5 max-h-56 overflow-y-auto space-y-2.5 text-xs">
                  {/* Experience Tab */}
                  {activePreviewTab === "experience" && (
                    <div className="space-y-3">
                      {extractedData.experience.map((exp, idx) => (
                        <div key={exp.id || idx} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-100">{exp.position}</div>
                              <div className="text-blue-400 text-[11px] font-medium">{exp.company}</div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {exp.startDate} - {exp.endDate}
                            </span>
                          </div>
                          {exp.description && (
                            <div className="text-[11px] text-slate-300 whitespace-pre-line pt-1 border-t border-slate-800/50">
                              {exp.description}
                            </div>
                          )}
                        </div>
                      ))}
                      {extractedData.experience.length === 0 && (
                        <p className="text-slate-500 italic text-center py-2">No work experiences found.</p>
                      )}
                    </div>
                  )}

                  {/* Education Tab */}
                  {activePreviewTab === "education" && (
                    <div className="space-y-2">
                      {extractedData.education.map((edu, idx) => (
                        <div key={edu.id || idx} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
                          <div className="font-bold text-slate-100">{edu.school}</div>
                          <div className="text-[11px] text-purple-400 font-medium">
                            {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {edu.startDate} - {edu.endDate}
                          </div>
                        </div>
                      ))}
                      {extractedData.education.length === 0 && (
                        <p className="text-slate-500 italic text-center py-2">No education records found.</p>
                      )}
                    </div>
                  )}

                  {/* Skills Tab */}
                  {activePreviewTab === "skills" && (
                    <div className="flex flex-wrap gap-1.5">
                      {extractedData.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-blue-950/40 text-blue-300 border border-blue-900/40 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {extractedData.skills.length === 0 && (
                        <p className="text-slate-500 italic py-2">No skills detected.</p>
                      )}
                    </div>
                  )}

                  {/* Summary Tab */}
                  {activePreviewTab === "summary" && (
                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-slate-200 leading-relaxed text-xs">
                      {extractedData.summary || "No career summary detected."}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition"
          >
            Cancel
          </button>

          {extractedData ? (
            <button
              type="button"
              onClick={handleApplyImport}
              disabled={!isAnySectionSelected}
              className="px-5 py-2.5 bg-gradient-to-r from-[#0A66C2] via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Auto-Populate Resume</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleFetchLinkedIn()}
              disabled={isLoading || (!url.trim() && !rawText.trim())}
              className="px-5 py-2.5 bg-gradient-to-r from-[#0A66C2] to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Fetching Profile...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Fetch & Parse Profile</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
