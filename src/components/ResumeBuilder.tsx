import React, { useState, useEffect } from "react";
import {
  User, Briefcase, GraduationCap, Code, FolderGit, Languages, Award, Users, AlignLeft,
  Plus, Trash2, ArrowUp, ArrowDown, Settings, Sliders, Palette, Type as FontIcon, Sparkles,
  Download, Printer, ChevronDown, ChevronUp, Image, AlertCircle, Sparkle, Copy, RefreshCw, Layout
} from "lucide-react";
import { ResumeData, WorkExperience, Education, Project, Language, Certification, Reference, UserSession } from "../types";
import { compressImage } from "../lib/imageUtils";
import ResumeTemplates from "./ResumeTemplates";
import { triggerRewarded, triggerInterstitial } from "./AdSystem";

interface ResumeBuilderProps {
  initialResume: ResumeData;
  user?: UserSession;
  onSave: (resume: ResumeData) => void;
  onBackToDashboard: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
}

export default function ResumeBuilder({
  initialResume,
  user,
  onSave,
  onBackToDashboard,
  isPremium,
  onUpgrade,
}: ResumeBuilderProps) {
  const [resume, setResume] = useState<ResumeData>(initialResume);
  const [activeTab, setActiveTab] = useState<"edit" | "design" | "ai">("edit");
  const [openSection, setOpenSection] = useState<string>("personal");
  const [newSkill, setNewSkill] = useState("");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<"all" | "free" | "premium">("all");
  const [templateSearch, setTemplateSearch] = useState("");

  // Auto-save changes
  useEffect(() => {
    onSave(resume);
  }, [resume]);

  // Sync state when switching to a different resume document
  useEffect(() => {
    setResume(initialResume);
  }, [initialResume.id]);

  const updatePersonalInfo = (field: string, value: string) => {
    setResume((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 160, 160, 0.75);
        setResume((prev) => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, profilePhoto: compressedBase64 },
        }));
      } catch (err) {
        console.error("Image processing error:", err);
        alert("Failed to process image. Please try another file.");
      }
    }
  };

  // --- EXPERIENCE HANDLERS ---
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: crypto.randomUUID(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      location: "",
      description: "",
    };
    setResume((prev) => ({ ...prev, experience: [...prev.experience, newExp] }));
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)),
    }));
  };

  const deleteExperience = (id: string) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  };

  const handleAiRewriteExperience = async (id: string, exp: WorkExperience) => {
    if (!exp.description) {
      alert("Please write a draft description first before asking AI to optimize it.");
      return;
    }

    const rewriteAction = async () => {
      setAiLoading(`exp-${id}`);
      try {
        const response = await fetch("/api/ai/rewrite-experience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            position: exp.position,
            company: exp.company,
            description: exp.description,
          }),
        });
        const data = await response.json();
        if (data.rewritten) {
          updateExperience(id, "description", data.rewritten);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAiLoading(null);
      }
    };

    if (isPremium) {
      rewriteAction();
    } else {
      triggerRewarded(() => {
        rewriteAction();
      });
    }
  };

  // --- EDUCATION HANDLERS ---
  const addEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      school: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      current: false,
      location: "",
      gpa: "",
    };
    setResume((prev) => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)),
    }));
  };

  const deleteEducation = (id: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  // --- PROJECTS HANDLERS ---
  const addProject = () => {
    const newProj: Project = {
      id: crypto.randomUUID(),
      name: "",
      role: "",
      startDate: "",
      endDate: "",
      url: "",
      description: "",
    };
    setResume((prev) => ({ ...prev, projects: [...prev.projects, newProj] }));
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) => (proj.id === id ? { ...proj, [field]: value } : proj)),
    }));
  };

  const deleteProject = (id: string) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id),
    }));
  };

  // --- SKILLS HANDLERS ---
  const addSkill = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newSkill.trim() && !resume.skills.includes(newSkill.trim())) {
      setResume((prev) => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setResume((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skillToRemove) }));
  };

  const handleAiSuggestSkills = async () => {
    if (!resume.personalInfo.jobTitle) {
      alert("Please provide a Professional Job Title in the Personal Information block first.");
      return;
    }

    const suggestAction = async () => {
      setAiLoading("skills");
      try {
        const response = await fetch("/api/ai/suggest-skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle: resume.personalInfo.jobTitle }),
        });
        const data = await response.json();
        if (data.skills) {
          // Merge lists and prevent duplicates
          const uniqueSkills = Array.from(new Set([...resume.skills, ...data.skills]));
          setResume((prev) => ({ ...prev, skills: uniqueSkills }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAiLoading(null);
      }
    };

    if (isPremium) {
      suggestAction();
    } else {
      triggerRewarded(() => {
        suggestAction();
      });
    }
  };

  // --- LANGUAGES HANDLERS ---
  const addLanguage = () => {
    const newLang: Language = { id: crypto.randomUUID(), name: "", proficiency: "Professional" };
    setResume((prev) => ({ ...prev, languages: [...prev.languages, newLang] }));
  };

  const updateLanguage = (id: string, field: keyof Language, value: string) => {
    setResume((prev) => ({
      ...prev,
      languages: prev.languages.map((lang) => (lang.id === id ? { ...lang, [field]: value } : lang)),
    }));
  };

  const deleteLanguage = (id: string) => {
    setResume((prev) => ({
      ...prev,
      languages: prev.languages.filter((lang) => lang.id !== id),
    }));
  };

  // --- CERTIFICATIONS HANDLERS ---
  const addCertification = () => {
    const newCert: Certification = {
      id: crypto.randomUUID(),
      name: "",
      issuer: "",
      date: "",
    };
    setResume((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), newCert],
    }));
  };

  const updateCertification = (id: string, field: keyof Certification, value: any) => {
    setResume((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert
      ),
    }));
  };

  const deleteCertification = (id: string) => {
    setResume((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((cert) => cert.id !== id),
    }));
  };

  // --- REFERENCES HANDLERS ---
  const addReference = () => {
    const newRef: Reference = {
      id: crypto.randomUUID(),
      name: "",
      company: "",
      title: "",
      email: "",
      phone: "",
    };
    setResume((prev) => ({
      ...prev,
      references: [...(prev.references || []), newRef],
    }));
  };

  const updateReference = (id: string, field: keyof Reference, value: any) => {
    setResume((prev) => ({
      ...prev,
      references: (prev.references || []).map((ref) =>
        ref.id === id ? { ...ref, [field]: value } : ref
      ),
    }));
  };

  const deleteReference = (id: string) => {
    setResume((prev) => ({
      ...prev,
      references: (prev.references || []).filter((ref) => ref.id !== id),
    }));
  };

  // --- SECTION ORDER REORDERING ---
  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...resume.sectionsOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      // Swap
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setResume((prev) => ({ ...prev, sectionsOrder: newOrder }));
    }
  };

  // AI Career Summary Generator
  const handleAiGenerateSummary = async () => {
    if (!resume.personalInfo.jobTitle) {
      alert("Please provide a Professional Job Title in Personal Info first.");
      return;
    }

    const summaryAction = async () => {
      setAiLoading("summary");
      try {
        const response = await fetch("/api/ai/generate-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: resume.personalInfo.jobTitle,
            skills: resume.skills,
            experienceYears: "5+",
          }),
        });
        const data = await response.json();
        if (data.summary) {
          setResume((prev) => ({ ...prev, summary: data.summary }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAiLoading(null);
      }
    };

    if (isPremium) {
      summaryAction();
    } else {
      triggerRewarded(() => {
        summaryAction();
      });
    }
  };

  const handlePrint = () => {
    // Show an interstitial ad before triggering the print sheet download for non-premium users
    triggerInterstitial(() => {
      window.print();
    });
  };

  const handleDownloadHTML = () => {
    const container = document.getElementById("resume-preview-container");
    if (!container) {
      alert("Resume preview not found.");
      return;
    }

    const resumeHtml = container.innerHTML;
    const title = resume.title || "Resume";
    const fullName = resume.personalInfo.fullName || "User";

    const fullPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullName} - ${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
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
        This is a fully styled, offline-ready HTML version of your resume. Open this file in any browser and print (Ctrl+P) to save as a high-fidelity PDF document.
      </p>
    </div>
    <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer shrink-0">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <!-- Main Resume Content Frame -->
  <div class="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl print:shadow-none print-shadow-none border border-slate-800/20 print-border-none rounded-sm overflow-hidden p-8 print:p-0">
    ${resumeHtml}
  </div>

</body>
</html>`;

    const blob = new Blob([fullPageContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fullName.replace(/\s+/g, "_")}_Resume.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSectionToggle = (sect: string) => {
    setOpenSection(openSection === sect ? "" : sect);
  };

  const templateThemes = [
    { name: "Slate Corporate", color: "#1e293b" },
    { name: "Executive Indigo", color: "#4f46e5" },
    { name: "Modern Emerald", color: "#059669" },
    { name: "Crimson Bold", color: "#dc2626" },
    { name: "Classic Navy", color: "#1d4ed8" },
    { name: "Elegant Gold", color: "#b45309" },
  ];

  const fontFamilies = [
    { label: "Template Default", value: "auto" },
    { label: "Modern Inter (Sans)", value: "font-sans" },
    { label: "Classic Serif (Times)", value: "font-serif" },
    { label: "Developer Mono (JetBrains)", value: "font-mono" },
    { label: "Display Grotesk", value: "font-display" },
    { label: "Playful Handwriting", value: "font-handwritten" },
  ];

  const templatesList = [
    { id: "minimal", name: "Minimalist ATS Pro", desc: "Ultra-clean chronological layout optimized for maximum machine readability and applicant tracking systems.", isPremium: false },
    { id: "executive", name: "Executive Split Slate", desc: "A sleek split-pane layout highlighting core attributes in a deep charcoal side rail.", isPremium: false },
    { id: "elegant", name: "Warm Editorial Cream", desc: "Soft warm tones paired with elegant serif typography and double margins for creative leaders.", isPremium: false },
    { id: "silicon", name: "Silicon Valley Developer", desc: "Tech-forward format with monospace typography, tags, and clean layout optimized for engineers.", isPremium: false },
    { id: "cyber", name: "Cyberpunk Terminal", desc: "A radical green-on-black retro-futuristic terminal theme tailored for DevOps and security pros.", isPremium: true },
    { id: "berlin", name: "Berlin Neo-Brutalist", desc: "Stark, high-contrast black borders and bold asymmetrical accents for design renegades.", isPremium: true },
    { id: "tokyo", name: "Tokyo Zen Minimalist", desc: "An elegant, clean layout incorporating Japanese architectural symmetry and subtle red accents.", isPremium: false },
    { id: "sydney", name: "Sydney Startup Founder", desc: "Vibrant custom gradient headers, clean borders, and highly energetic layouts for innovators.", isPremium: false },
    { id: "gold_luxe", name: "Golden Luxury Royal", desc: "Opulent gold borders on warm cream paper styled with regal double-ruled divisions.", isPremium: true },
    { id: "vintage", name: "Vintage Press Typewriter", desc: "Typewriter monospace aesthetics and warm parchment styling resembling traditional print presses.", isPremium: false },
    { id: "toronto", name: "Toronto Corporate Navy", desc: "An authoritative deep navy banner header presenting strong corporate stability.", isPremium: false },
    { id: "aurora", name: "Aurora Cosmic Glow", desc: "Deep space-dark paper paired with glowing neon highlights for a truly distinctive portfolio.", isPremium: true },
    { id: "munich", name: "Munich Engineering Grid", desc: "Highly structured engineering format with technical quadrants and high-logic division lines.", isPremium: false },
    { id: "chicago", name: "Chicago Legal Executive", desc: "Highly professional double-divided margins suited for law firms, medical experts, and elite advisory.", isPremium: false },
    { id: "milano", name: "Milano Fashion Editorial", desc: "Luxurious, spacious spacing utilizing stunning italicized serif headings for premium lifestyle brands.", isPremium: true },
    { id: "austin", name: "Austin Terracotta Indie", desc: "Warm southwestern sunset clay tones and highly expressive, energetic label tags.", isPremium: false },
    { id: "royal", name: "Royal Heritage Burgundy", desc: "Regal crimson borders, formal divided banners, and classical editorial dignity.", isPremium: false },
    { id: "teal_grid", name: "Teal Matrix Columnar", desc: "Dual columns presenting complex tech skills and project histories in a structured layout.", isPremium: false },
    { id: "oslo", name: "Oslo Nordic Architect", desc: "An ultra-minimalistic geometric sans format styled with subtle grey backdrops and forest-green headings.", isPremium: false },
    { id: "swiss", name: "Swiss Bauhaus Avant-Garde", desc: "Iconic Swiss design principles pairing stark bold headings, red highlights, and architectural grids.", isPremium: true }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col no-print">
      {/* Top action header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            Dashboard
          </button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <h2 className="text-sm font-bold text-white font-display">
            Editing: <span className="text-indigo-400">{resume.title || "Untitled Resume"}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-indigo-600/10"
            title="Download fully styled offline-ready HTML. Best format for printing or converting to PDF!"
          >
            <Download className="h-3.5 w-3.5" /> Download HTML (Get PDF)
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition border border-slate-700"
            title="Open the browser print/PDF dialog directly"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Main split dashboard layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Control Panel */}
        <div className="w-full lg:w-[480px] shrink-0 border-r border-slate-800 flex flex-col bg-slate-950 no-print">
          {/* Sub Navigation tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/55 p-1 m-3 rounded-xl border">
            <button
              onClick={() => setActiveTab("edit")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === "edit" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab("design")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === "design" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Design Templates
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === "ai" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sections Reorder
            </button>
          </div>

          {/* Tab Content Body scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "edit" && (
              <div className="space-y-3">
                
                {/* 1. PERSONAL INFORMATION */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => handleSectionToggle("personal")}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-900/80 transition"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <User className="h-4.5 w-4.5 text-indigo-400" /> Personal Details
                    </span>
                    {openSection === "personal" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {openSection === "personal" && (
                    <div className="p-4 border-t border-slate-800 space-y-3.5 bg-slate-950/40">
                      <div className="flex gap-4 items-center">
                        <div className="h-14 w-14 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 relative overflow-hidden shrink-0">
                          {resume.personalInfo.profilePhoto ? (
                            <img src={resume.personalInfo.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <Image className="h-5 w-5" />
                          )}
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <label className="text-xs text-slate-400 block">Profile Photo</label>
                          <div className="flex flex-wrap gap-2">
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                            <label htmlFor="photo-upload" className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition">
                              Upload Photo
                            </label>
                            {user?.profilePhoto && (
                              <button
                                type="button"
                                onClick={() => updatePersonalInfo("profilePhoto", user.profilePhoto!)}
                                className="px-3 py-1.5 bg-indigo-950/40 text-indigo-300 border border-indigo-900/40 hover:bg-indigo-900/20 rounded-lg text-xs font-semibold transition"
                              >
                                Use Account Photo
                              </button>
                            )}
                            {resume.personalInfo.profilePhoto && (
                              <button
                                type="button"
                                onClick={() => updatePersonalInfo("profilePhoto", "")}
                                className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 rounded-lg text-xs font-semibold transition"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">Full Name</label>
                          <input
                            type="text"
                            value={resume.personalInfo.fullName}
                            onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">Job Title</label>
                          <input
                            type="text"
                            value={resume.personalInfo.jobTitle}
                            onChange={(e) => updatePersonalInfo("jobTitle", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            placeholder="Software Engineer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">Email Address</label>
                          <input
                            type="email"
                            value={resume.personalInfo.email}
                            onChange={(e) => updatePersonalInfo("email", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                            placeholder="you@email.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">Phone</label>
                          <input
                            type="text"
                            value={resume.personalInfo.phone}
                            onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600"
                            placeholder="+1 (555) 0199"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-400">Location</label>
                        <input
                          type="text"
                          value={resume.personalInfo.location}
                          onChange={(e) => updatePersonalInfo("location", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                          placeholder="San Francisco, CA"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">Website</label>
                          <input
                            type="text"
                            value={resume.personalInfo.website}
                            onChange={(e) => updatePersonalInfo("website", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            placeholder="https://yourportfolio.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">LinkedIn</label>
                          <input
                            type="text"
                            value={resume.personalInfo.linkedin}
                            onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            placeholder="linkedin.com/in/username"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">GitHub</label>
                          <input
                            type="text"
                            value={resume.personalInfo.github}
                            onChange={(e) => updatePersonalInfo("github", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            placeholder="github.com/username"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SUMMARY SECTION */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => handleSectionToggle("summary")}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-900/80 transition"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <AlignLeft className="h-4.5 w-4.5 text-indigo-400" /> Career Summary
                    </span>
                    {openSection === "summary" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {openSection === "summary" && (
                    <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-slate-400">Professional Objective Summary</label>
                        <button
                          onClick={handleAiGenerateSummary}
                          disabled={aiLoading === "summary"}
                          className="flex items-center gap-1 text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900 hover:bg-indigo-900 px-2 py-1 rounded transition"
                        >
                          {aiLoading === "summary" ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" /> Drafting...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" /> Auto Summary
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={resume.summary}
                        onChange={(e) => setResume((prev) => ({ ...prev, summary: e.target.value }))}
                        rows={5}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                        placeholder="Detail your professional highlights, years of expertise, and technical specialties..."
                      />
                    </div>
                  )}
                </div>

                {/* 3. WORK EXPERIENCE */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => handleSectionToggle("experience")}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-900/80 transition"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4.5 w-4.5 text-indigo-400" /> Work Experience
                    </span>
                    {openSection === "experience" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {openSection === "experience" && (
                    <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/40">
                      {resume.experience.map((exp, idx) => (
                        <div key={exp.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 relative group">
                          <button
                            onClick={() => deleteExperience(exp.id)}
                            className="absolute top-2 right-2 text-slate-600 hover:text-rose-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Position #{idx + 1}</span>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                              placeholder="Company Name"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                            <input
                              type="text"
                              value={exp.position}
                              onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                              placeholder="Role / Title"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                              placeholder="Start Date (e.g. Jan 2022)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                            <input
                              type="text"
                              value={exp.endDate}
                              disabled={exp.current}
                              onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                              placeholder="End Date (or Present)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs disabled:opacity-40"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <input
                              type="text"
                              value={exp.location || ""}
                              onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                              placeholder="Job Location (e.g. Austin, TX)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <label className="flex items-center gap-2 text-xs text-slate-400 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => updateExperience(exp.id, "current", e.target.checked)}
                              className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                            />
                            Currently work here
                          </label>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-medium">Description Bullets (separated by newlines)</span>
                              <button
                                onClick={() => handleAiRewriteExperience(exp.id, exp)}
                                disabled={aiLoading === `exp-${exp.id}`}
                                className="flex items-center gap-1 text-[9px] bg-indigo-950 text-indigo-400 border border-indigo-900 hover:bg-indigo-900 px-2 py-0.5 rounded transition"
                              >
                                {aiLoading === `exp-${exp.id}` ? (
                                  <>
                                    <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Polishing...
                                  </>
                                ) : (
                                  <>
                                    <Sparkle className="h-2.5 w-2.5 text-indigo-400 fill-indigo-400" /> Professional AI Rewrite
                                  </>
                                )}
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                              placeholder="• Spearheaded product requirements reduction cycle\n• Led strategic analytics sync across 4 global teams"
                              className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs font-mono"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={addExperience}
                        className="w-full py-2.5 border border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Professional Experience
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. EDUCATION */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => handleSectionToggle("education")}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-900/80 transition"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4.5 w-4.5 text-indigo-400" /> Education
                    </span>
                    {openSection === "education" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {openSection === "education" && (
                    <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/40">
                      {resume.education.map((edu, idx) => (
                        <div key={edu.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 relative group">
                          <button
                            onClick={() => deleteEducation(edu.id)}
                            className="absolute top-2 right-2 text-slate-600 hover:text-rose-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => updateEducation(edu.id, "school", e.target.value)}
                              placeholder="University / College"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                              placeholder="Degree (e.g. Bachelor of Science)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={edu.fieldOfStudy}
                              onChange={(e) => updateEducation(edu.id, "fieldOfStudy", e.target.value)}
                              placeholder="Field of Study (e.g. Physics)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                            <input
                              type="text"
                              value={edu.gpa}
                              onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                              placeholder="GPA / Grade (Optional)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                              placeholder="Start Date"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                            <input
                              type="text"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                              placeholder="End Date"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <input
                              type="text"
                              value={edu.location || ""}
                              onChange={(e) => updateEducation(edu.id, "location", e.target.value)}
                              placeholder="School Location (e.g. Austin, TX)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={addEducation}
                        className="w-full py-2.5 border border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Education
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. PROJECTS */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => handleSectionToggle("projects")}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-900/80 transition"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <FolderGit className="h-4.5 w-4.5 text-indigo-400" /> Projects
                    </span>
                    {openSection === "projects" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {openSection === "projects" && (
                    <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/40">
                      {resume.projects.map((proj) => (
                        <div key={proj.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 relative group">
                          <button
                            onClick={() => deleteProject(proj.id)}
                            className="absolute top-2 right-2 text-slate-600 hover:text-rose-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={proj.name}
                              onChange={(e) => updateProject(proj.id, "name", e.target.value)}
                              placeholder="Project Name"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                            <input
                              type="text"
                              value={proj.role}
                              onChange={(e) => updateProject(proj.id, "role", e.target.value)}
                              placeholder="Role (e.g. Lead Developer)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                            />
                          </div>

                          <input
                            type="text"
                            value={proj.url}
                            onChange={(e) => updateProject(proj.id, "url", e.target.value)}
                            placeholder="Project Live Link (GitHub/Website)"
                            className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs"
                          />

                          <textarea
                            value={proj.description}
                            onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                            placeholder="Describe project mechanics, libraries used and quantifiable outcome..."
                            className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs font-mono"
                            rows={2}
                          />
                        </div>
                      ))}

                      <button
                        onClick={addProject}
                        className="w-full py-2.5 border border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Project
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. SKILLS */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => handleSectionToggle("skills")}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-900/80 transition"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Code className="h-4.5 w-4.5 text-indigo-400" /> Core Skills
                    </span>
                    {openSection === "skills" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {openSection === "skills" && (
                    <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-400">Add Key Tech Stack Elements</span>
                        <button
                          onClick={handleAiSuggestSkills}
                          disabled={aiLoading === "skills"}
                          className="flex items-center gap-1 text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900 hover:bg-indigo-900 px-2 py-1 rounded transition"
                        >
                          {aiLoading === "skills" ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" /> Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" /> AI Suggest Skills
                            </>
                          )}
                        </button>
                      </div>

                      <form onSubmit={addSkill} className="flex gap-2">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="e.g. React, TypeScript, Docker"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                        />
                        <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition">
                          Add
                        </button>
                      </form>

                      {/* Display skills chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {resume.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="text-slate-500 hover:text-slate-300 transition"
                            >
                              <Trash2 className="h-3 w-3 text-rose-400" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. LANGUAGES */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => handleSectionToggle("languages")}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-900/80 transition"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Languages className="h-4.5 w-4.5 text-indigo-400" /> Languages
                    </span>
                    {openSection === "languages" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {openSection === "languages" && (
                    <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/40">
                      {resume.languages.map((lang) => (
                        <div key={lang.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={lang.name}
                            onChange={(e) => updateLanguage(lang.id, "name", e.target.value)}
                            placeholder="Language (e.g. French)"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-xs"
                          />
                          <select
                            value={lang.proficiency}
                            onChange={(e) => updateLanguage(lang.id, "proficiency", e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 animate-fade-in"
                          >
                            <option value="Native">Native</option>
                            <option value="Fluent">Fluent</option>
                            <option value="Professional">Professional</option>
                            <option value="Conversational">Conversational</option>
                            <option value="Elementary">Elementary</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => deleteLanguage(lang.id)}
                            className="text-slate-600 hover:text-rose-400 p-1.5 transition"
                            title="Delete Language"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addLanguage}
                        className="w-full py-2 border border-dashed border-slate-800 hover:border-slate-600 rounded-xl text-xs text-slate-400 hover:text-white transition"
                      >
                        Add Language
                      </button>
                    </div>
                  )}
                </div>

                {/* 8. CERTIFICATIONS */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleSectionToggle("certifications")}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-900/80 transition"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Award className="h-4.5 w-4.5 text-indigo-400" /> Certifications
                    </span>
                    {openSection === "certifications" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {openSection === "certifications" && (
                    <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/40">
                      {(resume.certifications || []).map((cert, idx) => (
                        <div key={cert.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 relative group">
                          <button
                            type="button"
                            onClick={() => deleteCertification(cert.id)}
                            className="absolute top-2 right-2 text-slate-600 hover:text-rose-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Certification #{idx + 1}</span>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) => updateCertification(cert.id, "name", e.target.value)}
                              placeholder="Certification Name (e.g. AWS Solutions Architect)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={cert.issuer}
                              onChange={(e) => updateCertification(cert.id, "issuer", e.target.value)}
                              placeholder="Issuer (e.g. Amazon Web Services)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <input
                              type="text"
                              value={cert.date}
                              onChange={(e) => updateCertification(cert.id, "date", e.target.value)}
                              placeholder="Date Earned / Year (e.g. 2023)"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addCertification}
                        className="w-full py-2.5 border border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Certification
                      </button>
                    </div>
                  )}
                </div>

                {/* 9. REFERENCES */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleSectionToggle("references")}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-200 hover:bg-slate-900/80 transition"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Users className="h-4.5 w-4.5 text-indigo-400" /> References
                    </span>
                    {openSection === "references" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {openSection === "references" && (
                    <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/40">
                      {(resume.references || []).map((ref, idx) => (
                        <div key={ref.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 relative group">
                          <button
                            type="button"
                            onClick={() => deleteReference(ref.id)}
                            className="absolute top-2 right-2 text-slate-600 hover:text-rose-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Reference #{idx + 1}</span>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={ref.name}
                              onChange={(e) => updateReference(ref.id, "name", e.target.value)}
                              placeholder="Reference Person Name"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={ref.company}
                              onChange={(e) => updateReference(ref.id, "company", e.target.value)}
                              placeholder="Company"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={ref.title}
                              onChange={(e) => updateReference(ref.id, "title", e.target.value)}
                              placeholder="Job Title"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white placeholder-slate-600"
                            />
                            <input
                              type="email"
                              value={ref.email}
                              onChange={(e) => updateReference(ref.id, "email", e.target.value)}
                              placeholder="Email Address"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white placeholder-slate-600"
                            />
                            <input
                              type="text"
                              value={ref.phone}
                              onChange={(e) => updateReference(ref.id, "phone", e.target.value)}
                              placeholder="Phone Number"
                              className="bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white placeholder-slate-600"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addReference}
                        className="w-full py-2.5 border border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-900/40 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Reference
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "design" && (
              <div className="space-y-6 p-1">
                {/* 1. Template Picker */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-indigo-400" /> Pick Structural Template
                  </h4>

                  {/* Search bar */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search 20 premium templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Scrollable Templates List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                    {templatesList
                      .filter((tpl) => {
                        if (templateSearch.trim()) {
                          const query = templateSearch.toLowerCase();
                          return tpl.name.toLowerCase().includes(query) || tpl.desc.toLowerCase().includes(query);
                        }
                        return true;
                      })
                      .map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => {
                            setResume((prev) => ({ ...prev, templateId: tpl.id }));
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition relative overflow-hidden group ${
                            resume.templateId === tpl.id
                              ? "bg-indigo-600/10 border-indigo-500 shadow-md"
                              : "bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between pr-12">
                            <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition flex items-center gap-1.5">
                              {tpl.name}
                            </span>
                            {resume.templateId === tpl.id && (
                              <span className="text-[9px] font-mono tracking-widest text-indigo-400 bg-indigo-950 border border-indigo-900 px-1.5 py-0.5 rounded uppercase font-semibold">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{tpl.desc}</p>
                        </button>
                      ))}
                  </div>
                </div>

                {/* 2. Color Theme */}
                <div className="space-y-3 border-t border-slate-800 pt-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Palette className="h-4 w-4 text-indigo-400" /> Color Accent Accent
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {templateThemes.map((theme) => (
                      <button
                        key={theme.color}
                        onClick={() => setResume((prev) => ({ ...prev, colorTheme: theme.color }))}
                        className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center gap-2 ${
                          resume.colorTheme === theme.color
                            ? "border-indigo-500 bg-slate-900"
                            : "border-slate-800 bg-slate-950/40 hover:bg-slate-900"
                        }`}
                      >
                        <div className="h-5 w-5 rounded-full shadow border border-white/20" style={{ backgroundColor: theme.color }} />
                        <span className="text-[10px] text-slate-300 truncate w-full font-medium">{theme.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Hex Color Picker */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-900/60 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Custom Color:</span>
                    <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 w-full gap-2">
                      <input
                        type="color"
                        value={resume.colorTheme && resume.colorTheme.startsWith("#") && resume.colorTheme.length === 7 ? resume.colorTheme : "#3b82f6"}
                        onChange={(e) => setResume((prev) => ({ ...prev, colorTheme: e.target.value }))}
                        className="h-7 w-9 bg-transparent border-none cursor-pointer rounded"
                      />
                      <input
                        type="text"
                        value={resume.colorTheme}
                        onChange={(e) => setResume((prev) => ({ ...prev, colorTheme: e.target.value }))}
                        placeholder="#3B82F6"
                        className="bg-transparent border-none text-xs text-white focus:outline-none w-full font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Fonts */}
                <div className="space-y-3 border-t border-slate-800 pt-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FontIcon className="h-4 w-4 text-indigo-400" /> Typography Font Styles
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {fontFamilies.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => setResume((prev) => ({ ...prev, fontFamily: font.value }))}
                        className={`p-3 rounded-lg border text-left transition ${
                          resume.fontFamily === font.value
                            ? "border-indigo-500 bg-slate-900/40 text-white"
                            : "border-slate-800 bg-slate-950/20 text-slate-400 hover:bg-slate-900/60"
                        }`}
                      >
                        <span className={`text-xs block ${font.value}`}>{font.label}</span>
                        <span className="text-[9px] text-slate-500 mt-1 block">Aa Bb Cc Dd Ee</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Density Spacing */}
                <div className="space-y-3 border-t border-slate-800 pt-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-indigo-400" /> Layout Density Spacing
                  </h4>
                  <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                    {(["compact", "comfortable", "spacious"] as const).map((spaceOption) => (
                      <button
                        key={spaceOption}
                        onClick={() => setResume((prev) => ({ ...prev, spacing: spaceOption }))}
                        className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-lg transition ${
                          resume.spacing === spaceOption
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {spaceOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Column Layout Structure Override */}
                <div className="space-y-3 border-t border-slate-800 pt-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Layout className="h-4 w-4 text-indigo-400" /> Structure Column Layout
                  </h4>
                  <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                    {([
                      { label: "Template Default", value: "auto" },
                      { label: "Single Column", value: "single" },
                      { label: "Split Columns", value: "split" }
                    ] as const).map((layoutOption) => (
                      <button
                        key={layoutOption.value}
                        onClick={() => setResume((prev) => ({ ...prev, layoutMode: layoutOption.value }))}
                        className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition ${
                          (resume.layoutMode || "auto") === layoutOption.value
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {layoutOption.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="text-xs font-bold text-white mb-2 font-display">Structure Reordering</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Instantly adjust the chronological flow of your resume. Pick sections and move them up or down to align with specific application requirements.
                  </p>
                </div>

                <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-900/40">
                  {resume.sectionsOrder.map((sectionId, idx) => {
                    // Capitalize label
                    const label = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
                    return (
                      <div
                        key={sectionId}
                        className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-xl"
                      >
                        <span className="text-xs font-semibold text-slate-200">{label}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveSection(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveSection(idx, "down")}
                            disabled={idx === resume.sectionsOrder.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Pane (Desktop) */}
        <div className="flex-1 overflow-y-auto bg-slate-900 p-8 flex justify-center items-start border-l border-slate-850 print:p-0 print:border-none">
          <div id="resume-preview-container" className="w-full max-w-[210mm] shadow-2xl print:shadow-none shrink-0 border border-slate-800/40 rounded-sm overflow-hidden print:border-none bg-white text-slate-900">
            <ResumeTemplates data={resume} />
          </div>
        </div>
      </div>
    </div>
  );
}
