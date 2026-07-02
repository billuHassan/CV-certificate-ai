import React, { useState, useEffect } from "react";
import {
  User, Briefcase, GraduationCap, Code, FolderGit, Languages, Award, Users, AlignLeft,
  Plus, Trash2, ArrowUp, ArrowDown, Settings, Sliders, Palette, Type as FontIcon, Sparkles,
  Download, Printer, ChevronDown, ChevronUp, Image, AlertCircle, Sparkle, Copy, RefreshCw
} from "lucide-react";
import { ResumeData, WorkExperience, Education, Project, Language, Certification, Reference } from "../types";
import ResumeTemplates from "./ResumeTemplates";
import { triggerRewarded, triggerInterstitial } from "./AdSystem";

interface ResumeBuilderProps {
  initialResume: ResumeData;
  onSave: (resume: ResumeData) => void;
  onBackToDashboard: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
}

export default function ResumeBuilder({
  initialResume,
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

  const updatePersonalInfo = (field: string, value: string) => {
    setResume((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResume((prev) => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, profilePhoto: reader.result as string },
        }));
      };
      reader.readAsDataURL(file);
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
    { label: "Classic Serif (Times)", value: "font-serif" },
    { label: "Modern Inter (Sans)", value: "font-sans" },
    { label: "Developer Mono (JetBrains)", value: "font-mono" },
    { label: "Display Grotesk", value: "font-display" },
  ];

  const templatesList = [
    // --- 10 FREE TEMPLATES ---
    { id: "minimal", name: "Minimal ATS", desc: "Sleek, traditional single-column design maximizing readability and machine parsing.", isPremium: false },
    { id: "classic", name: "Classic Corporate", desc: "Double line dividers with bold titles for high-volume recruitment.", isPremium: false },
    { id: "professional", name: "Professional Executive", desc: "A beautifully structured executive template highlighting professional timelines.", isPremium: false },
    { id: "modern", name: "Modern Technical", desc: "Features high-impact code-friendly blocks and robust tag layouts.", isPremium: false },
    { id: "creative", name: "Creative Designer", desc: "Spacious header styling with a beautiful modular profile structure.", isPremium: false },
    { id: "executive", name: "Executive Split", desc: "Sleek split layout placing contacts and skill chips in an elegant side rail.", isPremium: false },
    { id: "elegant", name: "Warm Editorial", desc: "Soft amber tones paired with elegant serif typography for luxury listings.", isPremium: false },
    { id: "clean", name: "Clean Functional", desc: "Highly structured standard format emphasizing operational milestones.", isPremium: false },
    { id: "simple", name: "Simple Compact", desc: "Condensed single-page template with subtle borders and elegant typography.", isPremium: false },
    { id: "standard", name: "Standard Business", desc: "Traditional layout suitable for legal, medical, and executive roles.", isPremium: false },

    // --- 40 PREMIUM TEMPLATES ---
    { id: "tokyo", name: "Tokyo Minimalist 👑", desc: "Japanese-inspired layout utilizing ultra-thin borders and a neat visual grid.", isPremium: true },
    { id: "paris", name: "Paris Fashion House 👑", desc: "Chic, high-contrast editorial layout utilizing gorgeous serif typography.", isPremium: true },
    { id: "silicon", name: "Silicon Valley Developer 👑", desc: "Tech-focused developer resume with monospace typography and modern tag highlights.", isPremium: true },
    { id: "ny_firm", name: "Wall Street Analyst 👑", desc: "Authoritative design optimized with compact spacing and elegant traditional serif.", isPremium: true },
    { id: "berlin", name: "Berlin Brutalist 👑", desc: "Stark structural borders and asymmetrical lines for modern creative professionals.", isPremium: true },
    { id: "swiss", name: "Swiss Bauhaus 👑", desc: "A clean, avant-garde design following functional typographic grids with red color accents.", isPremium: true },
    { id: "london", name: "London Academic 👑", desc: "Refined double border header ideal for researchers, professors, and scholars.", isPremium: true },
    { id: "nordic", name: "Nordic Clean 👑", desc: "A friendly, geometric sans format utilizing cozy grey backdrops and forest-green headings.", isPremium: true },
    { id: "sydney", name: "Sydney Startup Founder 👑", desc: "Features bright custom gradient accent buttons, dynamic tags, and clean margins.", isPremium: true },
    { id: "toronto", name: "Toronto Corporate Pro 👑", desc: "Premium bold navy header style with structured alignment and clean margin layout.", isPremium: true },
    { id: "aurora", name: "Aurora Holographic 👑", desc: "Modern portfolio-style resume featuring sleek glowing highlights and a cosmic edge.", isPremium: true },
    { id: "monochrome", name: "Monochrome Ink 👑", desc: "An ultra-clean print-optimized template emphasizing high-contrast readability.", isPremium: true },
    { id: "slate_pro", name: "Slate Pro Executive 👑", desc: "Beautiful deep-charcoal split sidebars presenting a modern executive presence.", isPremium: true },
    { id: "gold_luxe", name: "Golden Luxury 👑", desc: "Elegant gold borders and typography on premium off-white cream paper styling.", isPremium: true },
    { id: "royal", name: "Royal Heritage 👑", desc: "Regal burgundy accents, formal editorial headers, and classic serif elegance.", isPremium: true },
    { id: "cyber", name: "Cybersecurity Terminal 👑", desc: "Green-on-black terminal design tailored for DevOps, security, and systems engineering.", isPremium: true },
    { id: "vintage", name: "Vintage Press 👑", desc: "Features slab-serif typography and warm textures mimicking traditional typewriters.", isPremium: true },
    { id: "amsterdam", name: "Amsterdam Creative 👑", desc: "Vibrant orange accent highlights with asymmetrical header placements.", isPremium: true },
    { id: "vibrant", name: "Vibrant Violet 👑", desc: "Neon violet accents, stylish rounded badge tags, and creative layouts.", isPremium: true },
    { id: "teal_grid", name: "Teal Matrix 👑", desc: "Advanced grid alignment presenting technical skills and stats in a structured list.", isPremium: true },
    { id: "minimal_plus", name: "Minimal ATS Plus 👑", desc: "Optimized with generous white space and professional margins for senior roles.", isPremium: true },
    { id: "milano", name: "Milano Editorial 👑", desc: "High-fashion aesthetic utilizing elegant italicized headers and luxury spacing.", isPremium: true },
    { id: "chicago", name: "Chicago Legal 👑", desc: "Highly professional, authoritative double-divided borders for law & consulting.", isPremium: true },
    { id: "boston", name: "Boston Medical 👑", desc: "A serene teal-toned medical template featuring professional structural grids.", isPremium: true },
    { id: "austin", name: "Austin Indie Studio 👑", desc: "Warm desert sunrise accents, energetic headers, and highly expressive labels.", isPremium: true },
    { id: "san_fran", name: "San Francisco SaaS 👑", desc: "Sleek, modern indigo-accented split sidebar tailored for startup career lines.", isPremium: true },
    { id: "dublin", name: "Dublin Agency 👑", desc: "Creative emerald-tinted headings and spacious modern grid layouts.", isPremium: true },
    { id: "seattle", name: "Seattle Cloud Architect 👑", desc: "High-impact tech design utilizing structured sky-blue highlights.", isPremium: true },
    { id: "denver", name: "Rocky Mountain 👑", desc: "Rugged serif headings paired with warm natural forest tones.", isPremium: true },
    { id: "miami", name: "Miami Sunset 👑", desc: "Vibrant gradient headers mimicking ocean sunsets, for lifestyle professionals.", isPremium: true },
    { id: "singapore", name: "Singapore Venture 👑", desc: "Corporate red-gold highlights designed for venture capital & fintech leaders.", isPremium: true },
    { id: "munich", name: "Munich Engineering 👑", desc: "Extremely structured layouts with precise division lines and high visual logic.", isPremium: true },
    { id: "brussels", name: "Brussels Diplomat 👑", desc: "Highly formal, gold-accented headers for diplomacy, NGO, and government roles.", isPremium: true },
    { id: "geneva", name: "Geneva Watchmaker 👑", desc: "Refined, ultra-thin grey line borders emphasizing master craftsmanship.", isPremium: true },
    { id: "oslo", name: "Oslo Architect 👑", desc: "Ultra-minimalistic geometric layout utilizing subtle grey typography.", isPremium: true },
    { id: "vienna", name: "Vienna Opera 👑", desc: "Classical editorial serif layout pairing deep crimson accents and cream paper.", isPremium: true },
    { id: "copenhagen", name: "Copenhagen Hygge 👑", desc: "Warm grey backgrounds paired with soft charcoal typography and cozy spacing.", isPremium: true },
    { id: "mumbai", name: "Mumbai Tech Hub 👑", desc: "Dynamic orange-blue developer split layout highlighting project portfolios.", isPremium: true },
    { id: "shanghai", name: "Shanghai Executive 👑", desc: "Bold corporate layout pairing deep crimson highlights and structured sections.", isPremium: true },
    { id: "sao_paulo", name: "São Paulo Creative 👑", desc: "Energetic green-yellow highlights and fresh asymmetrical heading styling.", isPremium: true }
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
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-emerald-600/10"
          >
            <Printer className="h-3.5 w-3.5" /> Export PDF
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
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Profile Photo</label>
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                          <label htmlFor="photo-upload" className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition">
                            Upload Photo
                          </label>
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
                            className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300"
                          >
                            <option value="Native">Native</option>
                            <option value="Fluent">Fluent</option>
                            <option value="Professional">Professional</option>
                            <option value="Conversational">Conversational</option>
                            <option value="Elementary">Elementary</option>
                          </select>
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
              </div>
            )}

            {activeTab === "design" && (
              <div className="space-y-6 p-1">
                {/* 1. Template Picker */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-indigo-400" /> Pick Structural Template
                  </h4>

                  {/* Search and Category Filters */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search 50 templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />

                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/40 rounded-xl border border-slate-800/60">
                      {(["all", "free", "premium"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setTemplateFilter(type)}
                          className={`py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition ${
                            templateFilter === type
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable Templates List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                    {templatesList
                      .filter((tpl) => {
                        if (templateFilter === "free" && tpl.isPremium) return false;
                        if (templateFilter === "premium" && !tpl.isPremium) return false;
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
                            if (tpl.isPremium && !isPremium) {
                              onUpgrade();
                            } else {
                              setResume((prev) => ({ ...prev, templateId: tpl.id }));
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition relative overflow-hidden group ${
                            resume.templateId === tpl.id
                              ? "bg-indigo-600/10 border-indigo-500 shadow-md"
                              : tpl.isPremium && !isPremium
                              ? "bg-slate-950/30 border-slate-900 hover:border-amber-500/30"
                              : "bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700"
                          }`}
                        >
                          {/* Premium indicator overlay for non-premium users */}
                          {tpl.isPremium && !isPremium && (
                            <div className="absolute top-0 right-0 bg-amber-500/10 border-l border-b border-amber-500/20 px-2 py-0.5 rounded-bl-lg text-[8px] font-mono font-bold tracking-widest text-amber-400 flex items-center gap-1">
                              👑 PREMIUM
                            </div>
                          )}

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
          <div className="w-full max-w-[210mm] shadow-2xl print:shadow-none shrink-0 border border-slate-800/40 rounded-sm overflow-hidden print:border-none">
            <ResumeTemplates data={resume} />
          </div>
        </div>
      </div>
    </div>
  );
}
