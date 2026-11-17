import React, { useState, useEffect } from "react";
import { Sparkles, Printer, Copy, RefreshCw, Send, CheckCircle, ChevronLeft, Mail, Phone, MapPin, Download, Globe, ExternalLink, ShieldCheck, Wand2, FileText, Sliders, Check } from "lucide-react";
import { CoverLetterData, ResumeData } from "../types";
import { triggerRewarded, triggerInterstitial } from "./AdSystem";
import { escapeHtml, safeExternalUrl } from "../utils/security";

interface GroundingSource {
  title: string;
  uri: string;
}

interface CoverLetterBuilderProps {
  initialLetter: CoverLetterData;
  resumes: ResumeData[];
  onSave: (letter: CoverLetterData) => void;
  onBackToDashboard: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
}

export default function CoverLetterBuilder({
  initialLetter,
  resumes,
  onSave,
  onBackToDashboard,
  isPremium,
  onUpgrade,
}: CoverLetterBuilderProps) {
  const [letter, setLetter] = useState<CoverLetterData>(initialLetter);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || "");
  const [generating, setGenerating] = useState(false);
  const [autoDrafting, setAutoDrafting] = useState(false);
  const [autoDraftNotice, setAutoDraftNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [specifications, setSpecifications] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Live Grounding online analysis state
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [companyAnalysis, setCompanyAnalysis] = useState<string | null>(null);
  const [keyKeywordsUsed, setKeyKeywordsUsed] = useState<string[]>([]);

  useEffect(() => {
    onSave(letter);
  }, [letter]);

  // Auto-draft cover letter on mount if content is empty and resumes exist
  useEffect(() => {
    if ((!letter.content || letter.content.includes("Please fill in")) && resumes.length > 0) {
      const target = resumes.find(r => r.id === selectedResumeId) || resumes[0];
      if (target) {
        handleAutoDraftFromResume(target);
      }
    }
  }, []);

  const updateSenderInfo = (field: string, value: string) => {
    setLetter((prev) => ({
      ...prev,
      senderInfo: { ...prev.senderInfo, [field]: value },
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letter.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-draft cover letter by analyzing filled resume
  const handleAutoDraftFromResume = async (targetResume?: ResumeData) => {
    const resToAnalyze = targetResume || resumes.find((r) => r.id === selectedResumeId) || resumes[0];
    if (!resToAnalyze) {
      setErrorMessage("No Resume Found: Please create or fill out a resume first so CVCraft AI can draft your cover letter based on your specifications.");
      return;
    }

    setAutoDrafting(true);
    setAutoDraftNotice(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/ai/auto-draft-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resToAnalyze,
          isPremium,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "Failed to auto-draft cover letter. Please verify your resume contains personal information and work experience.");
        return;
      }

      if (data.content) {
        setLetter((prev) => ({
          ...prev,
          title: data.title || prev.title || `Cover Letter - ${resToAnalyze.personalInfo?.jobTitle || resToAnalyze.title}`,
          jobTitle: data.jobTitle || resToAnalyze.personalInfo?.jobTitle || prev.jobTitle,
          recipientCompany: prev.recipientCompany || data.recipientCompany || "Target Company",
          recipientName: prev.recipientName || data.recipientName || "Hiring Manager",
          senderInfo: {
            name: data.senderInfo?.name || resToAnalyze.personalInfo?.fullName || prev.senderInfo.name,
            email: data.senderInfo?.email || resToAnalyze.personalInfo?.email || prev.senderInfo.email,
            phone: data.senderInfo?.phone || resToAnalyze.personalInfo?.phone || prev.senderInfo.phone,
            location: data.senderInfo?.location || resToAnalyze.personalInfo?.location || prev.senderInfo.location,
          },
          content: data.content,
        }));
        setAutoDraftNotice(`✨ Auto-drafted from analyzed resume: ${resToAnalyze.title || resToAnalyze.personalInfo?.fullName}`);
      }
    } catch (err) {
      console.error("Auto-drafting error:", err);
      setErrorMessage("AI Connection Error: Unable to auto-generate cover letter right now. Please check your internet connection and try again.");
    } finally {
      setAutoDrafting(false);
    }
  };

  // Generate or refine cover letter with AI specifications and live web search
  const handleGenerateLetter = async (customSpec?: string) => {
    const activeSpec = customSpec !== undefined ? customSpec : specifications;
    if (!letter.jobTitle && !letter.recipientCompany && !activeSpec) {
      setErrorMessage("Missing Required Details: Please provide a Target Job Title, Company Name, or custom specifications to generate your tailored cover letter.");
      return;
    }

    const generateAction = async () => {
      setGenerating(true);
      setGroundingSources([]);
      setCompanyAnalysis(null);
      setKeyKeywordsUsed([]);
      setErrorMessage(null);

      try {
        const selectedResume = resumes.find((r) => r.id === selectedResumeId);
        let resumeContext = "";
        if (selectedResume) {
          resumeContext = selectedResume.summary || `${selectedResume.personalInfo?.fullName} is a professional ${selectedResume.personalInfo?.jobTitle}`;
        }

        const response = await fetch("/api/ai/generate-cover-letter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: letter.jobTitle || selectedResume?.personalInfo?.jobTitle || "Professional",
            company: letter.recipientCompany || "Target Employer",
            recipientName: letter.recipientName,
            jobDescription: letter.jobDescription,
            senderName: letter.senderInfo.name || selectedResume?.personalInfo?.fullName,
            senderEmail: letter.senderInfo.email || selectedResume?.personalInfo?.email,
            senderPhone: letter.senderInfo.phone || selectedResume?.personalInfo?.phone,
            senderLocation: letter.senderInfo.location || selectedResume?.personalInfo?.location,
            resumeSummary: resumeContext,
            resumeData: selectedResume,
            userSpecifications: activeSpec,
            existingContent: letter.content,
            isPremium,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setErrorMessage(data.error || "Generation Error: Unable to complete cover letter generation. Please check your inputs and try again.");
          return;
        }

        if (data.content) {
          setLetter((prev) => ({ ...prev, content: data.content }));
        }
        if (data.groundingSources) {
          setGroundingSources(data.groundingSources);
        }
        if (data.companyAnalysis) {
          setCompanyAnalysis(data.companyAnalysis);
        }
        if (data.keyKeywordsUsed) {
          setKeyKeywordsUsed(data.keyKeywordsUsed);
        }
      } catch (err) {
        console.error("Error generating cover letter:", err);
        setErrorMessage("AI Connection Error: Unable to generate cover letter. Please verify your internet connection and retry.");
      } finally {
        setGenerating(false);
      }
    };

    if (isPremium) {
      generateAction();
    } else {
      triggerRewarded(() => {
        generateAction();
      });
    }
  };

  const PRESET_SPECS = [
    { label: "🚀 Enthusiastic & Driven", spec: "Make the cover letter enthusiastic, ambitious, and highly energetic, showcasing passion for the company." },
    { label: "📊 Metrics & Impact Focus", spec: "Focus heavily on quantitative metrics, ROI, latency reductions, and specific achievements from past experience." },
    { label: "🎯 Role & Company Tailored", spec: "Deeply align and tailor the letter to the target role requirements and company culture." },
    { label: "⚡ Concise (< 200 words)", spec: "Keep the cover letter crisp, impactful, and under 200 words for quick recruiter scanning." },
    { label: "💼 Executive Formal Tone", spec: "Rewrite in a sophisticated, executive-level formal tone tailored for leadership positions." },
    { label: "🌐 Remote & Global Focus", spec: "Highlight remote collaboration, cross-functional autonomy, and global adaptability." },
  ];

  const handlePrint = () => {
    triggerInterstitial(() => {
      window.print();
    });
  };

  const handleDownloadHTML = () => {
    const container = document.getElementById("letter-preview-container");
    if (!container) {
      alert("Letter preview not found.");
      return;
    }

    const letterHtml = container.innerHTML;
    const title = letter.title || "Cover_Letter";
    const name = letter.senderInfo.name || "User";

    const fullPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)} - ${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&display=swap');
    
    body {
      background-color: #0f172a;
      color: #f1f5f9;
      margin: 0;
      padding: 0;
      font-family: "Inter", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      body {
        background-color: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .print-shadow-none {
        box-shadow: none !important;
      }
      .print-border-none {
        border: none !important;
      }
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center py-8 print:p-0 print:bg-white print:text-black">
  
  <!-- Interactive instructions bar -->
  <div class="no-print mb-8 max-w-[210mm] w-full bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
    <div>
      <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-widest">CVCraft AI • Export Assistant</h3>
      <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
        This is a fully styled, offline-ready HTML version of your cover letter. Open this file in any browser and print (Ctrl+P) to save as a high-fidelity PDF document.
      </p>
    </div>
    <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer shrink-0">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <!-- Main Letter Content Frame -->
  <div class="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl print:shadow-none print-shadow-none border border-slate-800/20 print-border-none rounded-sm overflow-hidden p-16">
    ${letterHtml}
  </div>

</body>
</html>`;

    const blob = new Blob([fullPageContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/\s+/g, "_")}_Cover_Letter.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col no-print">

      {/* Top action header */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 no-print">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToDashboard}
              className="text-xs px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition flex items-center gap-1.5 shrink-0 border border-slate-700/60 font-medium cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
            </button>
            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
            <h2 className="text-xs sm:text-sm font-bold text-white font-display truncate max-w-[160px] sm:max-w-xs flex items-center gap-2">
              <span className="hidden sm:inline text-slate-400 font-normal">Target:</span>
              <span className="text-teal-400 font-semibold">{letter.recipientCompany || "Executive Recruiter"} &bull; {letter.jobTitle || "Role"}</span>
            </h2>
          </div>

          {/* Mobile View Segmented Switch (< lg) */}
          <div className="flex lg:hidden bg-slate-950 p-0.5 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setMobileMode("edit")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                mobileMode === "edit" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setMobileMode("preview")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                mobileMode === "preview" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {resumes.length > 0 && (
            <button
              onClick={() => handleAutoDraftFromResume()}
              disabled={autoDrafting}
              className="px-2.5 sm:px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              title="Auto-analyze your filled resume and generate a tailored cover letter draft immediately!"
            >
              {autoDrafting ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" /> : <Wand2 className="h-3.5 w-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{autoDrafting ? "Analyzing..." : "Auto-Draft from Resume"}</span>
              <span className="sm:hidden">Auto-Draft</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition flex items-center gap-1"
          >
            {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy Content"}</span>
          </button>

          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-indigo-600/10"
            title="Download fully styled offline-ready HTML. Best format for printing or converting to PDF!"
          >
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Download </span>PDF / HTML
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition border border-slate-700"
            title="Open standard browser print dialog"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Auto-Draft Notification Notice */}
      {autoDraftNotice && (
        <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{autoDraftNotice}</span>
          </div>
          <button
            onClick={() => setAutoDraftNotice(null)}
            className="text-[10px] text-emerald-400 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Meaningful Actionable Error Banner */}
      {errorMessage && (
        <div className="bg-rose-950/70 border-b border-rose-500/40 px-4 py-2.5 text-xs text-rose-200 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-bold text-rose-300 hover:text-white underline shrink-0 cursor-pointer px-2 py-0.5 rounded bg-rose-900/50 hover:bg-rose-800 transition"
          >
            Dismiss & Retry
          </button>
        </div>
      )}

      {/* Split interface */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Control Panel */}
        <div className={`w-full lg:w-[480px] shrink-0 border-r border-slate-800 p-4 overflow-y-auto space-y-4 bg-slate-950 no-print ${
          mobileMode === "edit" ? "block" : "hidden lg:block"
        }`}>
          
          {/* Linked Resume & Auto Draft Card */}
          {resumes.length > 0 && (
            <div className="p-3.5 bg-slate-900 border border-indigo-500/20 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-400" /> Linked Resume Profile
                </label>
                <button
                  onClick={() => handleAutoDraftFromResume()}
                  disabled={autoDrafting}
                  className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded font-bold transition flex items-center gap-1"
                >
                  {autoDrafting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  Auto-Draft Now
                </button>
              </div>
              <select
                value={selectedResumeId}
                onChange={(e) => {
                  setSelectedResumeId(e.target.value);
                  const found = resumes.find(r => r.id === e.target.value);
                  if (found) {
                    handleAutoDraftFromResume(found);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || "Untitled Resume"} ({r.personalInfo?.fullName || "Candidate"} - {r.personalInfo?.jobTitle || "Role"})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Selecting a resume instantly analyzes your work history, contact details, and top skills to auto-draft your cover letter.
              </p>
            </div>
          )}

          {/* AI Specification & Custom Modification Box */}
          <div className="p-4 bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border border-indigo-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
                <Wand2 className="h-4 w-4 text-indigo-400" /> AI Specifications & Custom Modifiers
              </h4>
              <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                Gemini Powered
              </span>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Specify how you want AI to draft or modify the cover letter (e.g., tone, length, target achievements, key roles, or custom instructions).
            </p>

            <textarea
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              placeholder="e.g. 'Emphasize my leadership in cloud migration and metrics', 'Adapt for a Senior Product Manager role at Stripe focusing on API growth', 'Keep it concise under 200 words'..."
              className="w-full bg-slate-900 border border-slate-700/60 rounded p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
              rows={3}
            />

            {/* Quick Specification Preset Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium block">Quick AI Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SPECS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSpecifications(preset.spec);
                      handleGenerateLetter(preset.spec);
                    }}
                    disabled={generating}
                    className="text-[10px] bg-slate-900 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 px-2 py-1 rounded transition flex items-center gap-1"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleGenerateLetter()}
              disabled={generating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 mt-2 shadow-md shadow-indigo-600/10 text-white cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Modifying Cover Letter with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Apply AI Specification & Draft
                </>
              )}
            </button>
          </div>

          {/* Form details */}
          <div className="space-y-3.5">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sender Details (User Editable)</h5>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Sender Full Name"
                value={letter.senderInfo.name}
                onChange={(e) => updateSenderInfo("name", e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
              <input
                type="email"
                placeholder="Sender Email"
                value={letter.senderInfo.email}
                onChange={(e) => updateSenderInfo("email", e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Sender Phone"
                value={letter.senderInfo.phone}
                onChange={(e) => updateSenderInfo("phone", e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Sender Location"
                value={letter.senderInfo.location}
                onChange={(e) => updateSenderInfo("location", e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
            </div>

            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Target Job / Recipient</h5>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Hiring Manager Name"
                value={letter.recipientName}
                onChange={(e) => setLetter((prev) => ({ ...prev, recipientName: e.target.value }))}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Company Name"
                value={letter.recipientCompany}
                onChange={(e) => setLetter((prev) => ({ ...prev, recipientCompany: e.target.value }))}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Job Title / Role"
                value={letter.jobTitle}
                onChange={(e) => setLetter((prev) => ({ ...prev, jobTitle: e.target.value }))}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Recipient Address"
                value={letter.recipientAddress || ""}
                onChange={(e) => setLetter((prev) => ({ ...prev, recipientAddress: e.target.value }))}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Target Job Description Summary</label>
              <textarea
                value={letter.jobDescription || ""}
                onChange={(e) => setLetter((prev) => ({ ...prev, jobDescription: e.target.value }))}
                placeholder="Paste responsibilities or target job posting snippet..."
                className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white font-mono"
                rows={2}
              />
            </div>

            {/* Live Web Research Insights */}
            {(companyAnalysis || groundingSources.length > 0) && (
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-2.5 mt-3 text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-emerald-400" /> Live Web Research Grounded
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" /> Verified Online
                  </span>
                </div>
                {companyAnalysis && (
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {companyAnalysis}
                  </p>
                )}
                {keyKeywordsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {keyKeywordsUsed.map((kw, i) => (
                      <span key={i} className="text-[10px] bg-slate-900 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
                {groundingSources.length > 0 && (
                  <div className="pt-2 border-t border-emerald-900/40">
                    <span className="text-[10px] text-slate-400 font-medium block mb-1">Online Sources Analyzed by Gemini:</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {groundingSources.map((source, idx) => {
                        const safeHref = safeExternalUrl(source.uri);
                        if (!safeHref) return null;
                        return (
                          <a
                            key={idx}
                            href={safeHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{source.title || source.uri}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Manual Refinements Textarea */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manual User Refinements</h5>
              <span className="text-[10px] text-slate-500">Real-time sync</span>
            </div>
            <textarea
              value={letter.content}
              onChange={(e) => setLetter((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Your cover letter text will appear here. You can edit any line directly..."
              className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-100 font-sans leading-relaxed focus:outline-none focus:border-slate-700"
              rows={14}
            />
          </div>
        </div>

        {/* Right Preview Pane */}
        <div className={`flex-1 bg-slate-900/90 p-3 sm:p-6 lg:p-8 flex flex-col items-center overflow-y-auto print:bg-white print:p-0 ${
          mobileMode === "preview" ? "flex" : "hidden lg:flex"
        }`}>
          {/* Scale controls */}
          <div className="mb-3 flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg no-print self-center sm:self-end">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mr-1">Scale:</span>
            {[
              { label: "50%", val: 50 },
              { label: "75%", val: 75 },
              { label: "100%", val: 100 }
            ].map(z => (
              <button
                key={z.val}
                type="button"
                onClick={() => setPreviewZoom(z.val)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${
                  previewZoom === z.val ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>

          <div className="w-full overflow-x-auto flex justify-center pb-8">
            <div
              id="letter-preview-container"
              style={{
                transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
                transformOrigin: "top center",
                transition: "transform 0.2s ease",
              }}
              className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-10 sm:p-16 space-y-6 print:shadow-none print:w-full print:p-0 font-sans shrink-0 border border-slate-800/40 rounded-sm"
            >
              {/* Header info */}
              <div className="border-b pb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">{letter.senderInfo.name || "Your Name"}</h1>
                  <p className="text-xs text-slate-500 mt-0.5">{letter.jobTitle || "Professional Title"}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                  {letter.senderInfo.email && <div className="flex items-center gap-1 justify-end"><Mail className="h-3 w-3" /> {letter.senderInfo.email}</div>}
                  {letter.senderInfo.phone && <div className="flex items-center gap-1 justify-end"><Phone className="h-3 w-3" /> {letter.senderInfo.phone}</div>}
                  {letter.senderInfo.location && <div className="flex items-center gap-1 justify-end"><MapPin className="h-3 w-3" /> {letter.senderInfo.location}</div>}
                </div>
              </div>

              {/* Recipient block */}
              <div className="space-y-1 text-xs text-slate-700">
                <span className="text-slate-400 text-[10px] block font-mono">{letter.date || "Date"}</span>
                <div className="font-bold text-slate-900">{letter.recipientName || "Hiring Manager"}</div>
                <div className="font-semibold text-indigo-600">{letter.recipientCompany || "Company Name"}</div>
                {letter.recipientAddress && <div className="text-slate-500 text-[11px]">{letter.recipientAddress}</div>}
              </div>

              {/* Letter Content body */}
              <div className="text-xs text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap pt-4 font-sans">
                {letter.content || "Dear Hiring Manager,\n\n[Please select a resume or enter target specifications to auto-draft your customized cover letter.]"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

