import React, { useState, useEffect } from "react";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, Download, Edit3, ArrowRight, X, RefreshCw, Eye, Wand2, ShieldCheck, Palette, Plus, Trash2, Printer, Check, LayoutGrid, Layers, ArrowUpRight
} from "lucide-react";
import { ResumeData, WorkExperience, Education, Project, Certification, Language, Reference } from "../types";
import ResumeTemplates from "./ResumeTemplates";

export interface AuditSection {
  sectionKey: string;
  sectionTitle: string;
  score: number;
  status: "error" | "warning" | "success";
  deficiencies: string[];
  suggestedChanges: {
    field: string;
    currentValue: string;
    suggestedValue: string;
    explanation: string;
  }[];
}

export interface AuditReport {
  overallRealityScore: number;
  headlineTitleMismatchDetected: boolean;
  titleMismatchExplanation: string;
  strengths?: string[];
  weaknesses?: string[];
  missingInformation?: string[];
  suggestedImprovements?: string[];
  sections: AuditSection[];
}

export interface ExtractedTemplateStyle {
  templateId: string;
  templateName: string;
  description: string;
  colorTheme: string;
  fontFamily: string;
  layoutStyle: string;
  bgClass?: string;
  sidebarClass?: string;
  accentClass?: string;
  isDark?: boolean;
}

export interface ContentLayer {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  profilePhoto: string;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: string[];
  languages: Language[];
  certifications: Certification[];
  references: Reference[];
}

export interface TemplateLayer {
  templateId: string;
  templateName: string;
  colorTheme: string;
  fontFamily: string;
  spacing: "compact" | "comfortable" | "spacious";
  layoutMode: "auto" | "single" | "split";
  layoutStyle?: string;
}

interface UploadResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToBuilder: (resume: ResumeData, extractedStyle?: ExtractedTemplateStyle) => void;
}

export const PRESET_TEMPLATES = [
  { id: "minimal", name: "Clean Minimalist", category: "Modern", color: "#0f766e", font: "font-sans", desc: "Single-column sleek ATS optimized layout." },
  { id: "executive", name: "Executive Sapphire", category: "Corporate", color: "#1e3a8a", font: "font-sans", desc: "Split sidebar layout for high impact leaders." },
  { id: "modern", name: "Modern Teal", category: "Tech & Product", color: "#0d9488", font: "font-sans", desc: "Balanced structure with accent dividers." },
  { id: "elegant", name: "Classic Elegant", category: "Academic & Legal", color: "#334155", font: "font-serif", desc: "Traditional serif typography with refined margins." },
  { id: "creative", name: "Creative Coral", category: "Design & Marketing", color: "#c2410c", font: "font-sans", desc: "Bold headers with modern tag badges." },
  { id: "berlin", name: "Berlin Neo-Brutalist", category: "Creative", color: "#000000", font: "font-sans", desc: "High contrast borders and thick header blocks." },
  { id: "cyber", name: "Silicon Cyber Mono", category: "Engineering", color: "#10b981", font: "font-mono", desc: "Developer terminal dark/light aesthetic." },
  { id: "toronto", name: "Toronto Modern Two-Tone", category: "Corporate", color: "#2563eb", font: "font-sans", desc: "Clean dual-tone accent header banner." },
  { id: "sydney", name: "Sydney Tech Minimal", category: "Tech & Product", color: "#6366f1", font: "font-sans", desc: "Spacious layout with icon indicators." },
  { id: "austin", name: "Austin Compact ATS", category: "ATS Ultra", color: "#475569", font: "font-sans", desc: "Dense 1-page max content layout." },
  { id: "munich", name: "Munich Corporate Clean", category: "Corporate", color: "#0369a1", font: "font-sans", desc: "Structured grid alignment for senior roles." },
  { id: "oslo", name: "Oslo Minimal Nord", category: "Minimal", color: "#0f766e", font: "font-sans", desc: "Subtle lines with muted pastel accents." }
];

export default function UploadResumeModal({ isOpen, onClose, onImportToBuilder }: UploadResumeModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resume Data (Combines Content Layer & Template Layer)
  const [parsedResume, setParsedResume] = useState<ResumeData | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [extractedStyle, setExtractedStyle] = useState<ExtractedTemplateStyle | null>(null);
  const [savedCustomTemplates, setSavedCustomTemplates] = useState<ExtractedTemplateStyle[]>([]);
  const [templateStatusNotice, setTemplateStatusNotice] = useState<string | null>(null);

  // Active Tab View: "audit" | "edit" | "template" | "preview"
  const [activeView, setActiveView] = useState<"audit" | "edit" | "template" | "preview">("audit");

  // Load custom templates from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("customSavedTemplates") || "[]");
      setSavedCustomTemplates(stored);
    } catch (e) {
      console.warn("Error loading custom templates:", e);
    }
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  // Check template deduplication and save if new
  const deduplicateAndSaveTemplate = (extracted: ExtractedTemplateStyle): { finalId: string; isNew: boolean; templateName: string } => {
    // 1. Check matching in preset built-in templates
    const matchPreset = PRESET_TEMPLATES.find(p =>
      p.id === extracted.templateId ||
      p.name.toLowerCase() === extracted.templateName?.toLowerCase() ||
      (p.color.toLowerCase() === extracted.colorTheme?.toLowerCase() && p.font === extracted.fontFamily)
    );

    if (matchPreset) {
      return { finalId: matchPreset.id, isNew: false, templateName: matchPreset.name };
    }

    // 2. Check matching in custom saved templates
    let existingCustom: ExtractedTemplateStyle[] = [];
    try {
      existingCustom = JSON.parse(localStorage.getItem("customSavedTemplates") || "[]");
    } catch (e) {}

    const matchCustom = existingCustom.find(c =>
      c.templateId === extracted.templateId ||
      (c.templateName && c.templateName.toLowerCase() === extracted.templateName.toLowerCase()) ||
      (c.colorTheme === extracted.colorTheme && c.fontFamily === extracted.fontFamily && c.layoutStyle === extracted.layoutStyle)
    );

    if (matchCustom) {
      return { finalId: matchCustom.templateId, isNew: false, templateName: matchCustom.templateName };
    }

    // 3. Unique template -> Save to template library
    const newId = extracted.templateId.startsWith("custom_")
      ? extracted.templateId
      : `custom_${Date.now()}`;

    const newTemplateToSave: ExtractedTemplateStyle = {
      ...extracted,
      templateId: newId
    };

    const updatedCustomList = [newTemplateToSave, ...existingCustom];
    try {
      localStorage.setItem("customSavedTemplates", JSON.stringify(updatedCustomList));
      setSavedCustomTemplates(updatedCustomList);
    } catch (e) {
      console.warn("Storage save error:", e);
    }

    return { finalId: newId, isNew: true, templateName: extracted.templateName };
  };

  const processResumeUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setTemplateStatusNotice(null);
    setLoadingStep("Reading uploaded document file...");

    try {
      let textContent = "";
      if (file.type.includes("text") || file.name.endsWith(".txt")) {
        try {
          textContent = await file.text();
        } catch (e) {
          console.warn("Could not read text directly:", e);
        }
      }

      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const fileDataUri = reader.result as string;

          setLoadingStep("AI Multimodal Scanning document & parsing Content + Template layers...");

          const response = await fetch("/api/ai/parse-and-audit-resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resumeText: textContent,
              fileDataUri: fileDataUri,
              fileName: file.name
            })
          });

          if (!response.ok) {
            throw new Error("Failed to parse and audit uploaded resume.");
          }

          const data = await response.json();
          setLoadingStep("Running ATS Reality Audit & Template Deduplication check...");

          // Handle Template Layer Deduplication
          let activeTemplateId = "minimal";
          if (data.extractedTemplateStyle) {
            const deduplicationResult = deduplicateAndSaveTemplate(data.extractedTemplateStyle);
            activeTemplateId = deduplicationResult.finalId;

            if (deduplicationResult.isNew) {
              setTemplateStatusNotice(`New template "${deduplicationResult.templateName}" extracted and added to your template library!`);
            } else {
              setTemplateStatusNotice(`Matched existing template "${deduplicationResult.templateName}" from library (no duplicate created).`);
            }
          }

          // Build standard ResumeData combining Content Layer and Template Layer
          const fullData: ResumeData = {
            id: `uploaded_${Date.now()}`,
            title: data.parsedResume?.title || file.name.replace(/\.[^/.]+$/, "") || "Uploaded Resume",
            personalInfo: {
              fullName: data.parsedResume?.personalInfo?.fullName || "Candidate Name",
              jobTitle: data.parsedResume?.personalInfo?.jobTitle || "Professional Title",
              email: data.parsedResume?.personalInfo?.email || "",
              phone: data.parsedResume?.personalInfo?.phone || "",
              location: data.parsedResume?.personalInfo?.location || "",
              website: data.parsedResume?.personalInfo?.website || "",
              linkedin: data.parsedResume?.personalInfo?.linkedin || "",
              github: data.parsedResume?.personalInfo?.github || "",
              profilePhoto: data.parsedResume?.personalInfo?.profilePhoto || ""
            },
            summary: data.parsedResume?.summary || "",
            experience: (data.parsedResume?.experience || []).map((e: any) => ({
              ...e,
              id: e.id || crypto.randomUUID()
            })),
            education: (data.parsedResume?.education || []).map((e: any) => ({
              ...e,
              id: e.id || crypto.randomUUID()
            })),
            projects: (data.parsedResume?.projects || []).map((p: any) => ({
              ...p,
              id: p.id || crypto.randomUUID()
            })),
            skills: data.parsedResume?.skills || [],
            languages: (data.parsedResume?.languages || []).map((l: any) => ({
              ...l,
              id: l.id || crypto.randomUUID()
            })),
            certifications: (data.parsedResume?.certifications || []).map((c: any) => ({
              ...c,
              id: c.id || crypto.randomUUID()
            })),
            references: (data.parsedResume?.references || []).map((r: any) => ({
              ...r,
              id: r.id || crypto.randomUUID()
            })),
            sectionsOrder: ["summary", "experience", "education", "projects", "skills", "languages", "certifications", "references"],
            templateId: activeTemplateId,
            colorTheme: data.extractedTemplateStyle?.colorTheme || "#0f766e",
            fontFamily: data.extractedTemplateStyle?.fontFamily || "font-sans",
            spacing: "comfortable",
            layoutMode: "auto",
            updatedAt: new Date().toISOString()
          };

          setParsedResume(fullData);
          setAuditReport(data.auditReport);
          setExtractedStyle(data.extractedTemplateStyle);
          setActiveView("audit");
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to process uploaded file.");
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Error reading uploaded file.");
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "File upload failed.");
      setLoading(false);
    }
  };

  // 1-Click Apply Single Fix
  const handleApplyFix = (sectionKey: string, field: string, value: string) => {
    if (!parsedResume) return;

    let updated = { ...parsedResume };

    if (sectionKey === "personalInfo") {
      updated.personalInfo = { ...updated.personalInfo, [field]: value };
    } else if (sectionKey === "summary") {
      updated.summary = value;
    } else if (sectionKey === "skills") {
      const skillsArray = Array.from(new Set([...updated.skills, ...value.split(",").map(s => s.trim()).filter(Boolean)]));
      updated.skills = skillsArray;
    } else if (sectionKey === "experience" && updated.experience.length > 0) {
      updated.experience = updated.experience.map((exp, idx) => idx === 0 ? { ...exp, [field]: value } : exp);
    } else if (sectionKey === "education" && updated.education.length > 0) {
      updated.education = updated.education.map((edu, idx) => idx === 0 ? { ...edu, [field]: value } : edu);
    }

    setParsedResume(updated);

    // Update audit report status
    if (auditReport) {
      setAuditReport(prev => prev ? ({
        ...prev,
        sections: prev.sections.map(s => {
          if (s.sectionKey === sectionKey) {
            return {
              ...s,
              score: Math.min(100, s.score + 15),
              deficiencies: s.deficiencies.filter(d => !d.toLowerCase().includes(field.toLowerCase())),
              suggestedChanges: s.suggestedChanges.filter(c => c.field !== field)
            };
          }
          return s;
        })
      }) : null);
    }

    setSuccessMessage(`Applied suggestion for ${field} successfully!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // "Apply All Suggestions" Feature
  const handleApplyAllSuggestions = () => {
    if (!parsedResume || !auditReport) return;

    let updatedResume = { ...parsedResume };
    let totalApplied = 0;

    auditReport.sections.forEach(sec => {
      sec.suggestedChanges?.forEach(change => {
        totalApplied++;
        if (sec.sectionKey === "personalInfo") {
          updatedResume.personalInfo = {
            ...updatedResume.personalInfo,
            [change.field]: change.suggestedValue
          };
        } else if (sec.sectionKey === "summary") {
          updatedResume.summary = change.suggestedValue;
        } else if (sec.sectionKey === "skills") {
          const newSkills = change.suggestedValue.split(",").map(s => s.trim()).filter(Boolean);
          updatedResume.skills = Array.from(new Set([...updatedResume.skills, ...newSkills]));
        } else if (sec.sectionKey === "experience" && updatedResume.experience.length > 0) {
          updatedResume.experience = updatedResume.experience.map((exp, idx) =>
            idx === 0 ? { ...exp, [change.field]: change.suggestedValue } : exp
          );
        } else if (sec.sectionKey === "education" && updatedResume.education.length > 0) {
          updatedResume.education = updatedResume.education.map((edu, idx) =>
            idx === 0 ? { ...edu, [change.field]: change.suggestedValue } : edu
          );
        }
      });
    });

    setParsedResume(updatedResume);

    // Upgrade audit score to 100%
    setAuditReport(prev => prev ? ({
      ...prev,
      overallRealityScore: 100,
      headlineTitleMismatchDetected: false,
      sections: prev.sections.map(s => ({
        ...s,
        score: 100,
        status: "success",
        deficiencies: [],
        suggestedChanges: []
      }))
    }) : null);

    setSuccessMessage(`Applied all ${totalApplied} AI recommendations across all sections while maintaining original layout!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Select/Change Template (Template Layer)
  const handleSelectTemplate = (tplId: string, colorHex?: string, fontName?: string) => {
    if (!parsedResume) return;

    setParsedResume({
      ...parsedResume,
      templateId: tplId,
      colorTheme: colorHex || parsedResume.colorTheme,
      fontFamily: fontName || parsedResume.fontFamily,
      updatedAt: new Date().toISOString()
    });

    setSuccessMessage(`Switched resume template to "${tplId}" seamlessly! All content preserved.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Download PDF / Print
  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !parsedResume) return;

    const previewElem = document.getElementById("scanned-resume-preview-pane");
    const resumeHtml = previewElem ? previewElem.innerHTML : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${parsedResume.personalInfo.fullName || "Resume"} - Download PDF</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { padding: 0; margin: 0; background: white; }
            }
            body { font-family: sans-serif; background: white; color: black; padding: 20px; }
          </style>
        </head>
        <body>
          <div>${resumeHtml}</div>
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-teal-500/30 text-teal-400">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-100 via-teal-100 to-emerald-400 bg-clip-text text-transparent">
                Resume Scanner, Analysis & Smart Editor
              </h2>
              <p className="text-xs text-slate-400">
                Full-content document scanning, ATS reality audit, 1-click recommendations, & layout preservation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success/Status Toast Banner */}
        {successMessage && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-5 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {!parsedResume ? (
            /* Upload Screen */
            <div className="max-w-2xl mx-auto space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-teal-500/30 hover:border-teal-400/60 rounded-2xl p-8 sm:p-12 text-center bg-slate-900/50 hover:bg-slate-850 transition cursor-pointer relative group"
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-1">
                  {file ? file.name : "Drag and drop your resume file here"}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Supports PDF, DOCX, TXT, or Image scans up to 10MB
                </p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-semibold text-xs group-hover:bg-teal-400 transition">
                  <Upload className="w-4 h-4" />
                  {file ? "Change Selected File" : "Browse Files"}
                </span>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loading && (
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-teal-500/30 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-teal-300">{loadingStep}</p>
                  <p className="text-xs text-slate-400">Extracting full text, work experience, skills, and detecting layout template...</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={processResumeUpload}
                  disabled={!file || loading}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 disabled:opacity-50 transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Start AI Scan & Reality Audit
                </button>
              </div>
            </div>
          ) : (
            /* Results Screen */
            <div className="space-y-6">

              {/* Status Header Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Reality Score Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold font-mono border shrink-0 ${
                    (auditReport?.overallRealityScore || 0) >= 80
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : (auditReport?.overallRealityScore || 0) >= 60
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                      : "bg-rose-500/10 border-rose-500/40 text-rose-400"
                  }`}>
                    {auditReport?.overallRealityScore || 0}%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">ATS Reality Score</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {(auditReport?.overallRealityScore || 0) >= 80
                        ? "High market alignment & clean ATS structure."
                        : (auditReport?.overallRealityScore || 0) >= 60
                        ? "Moderate alignment. Deficiencies identified."
                        : "Headline or section gaps detected!"}
                    </p>
                  </div>
                </div>

                {/* Template Layer Badge */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 to-slate-950 border border-teal-500/30 flex items-center justify-between md:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          Template Layer: {parsedResume.templateId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {templateStatusNotice || "Content Layer & Template Layer decoupled cleanly for fast editing and layout preservation."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveView("template")}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition shrink-0 flex items-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Change Template
                  </button>
                </div>
              </div>

              {/* Title Discrepancy Alert */}
              {auditReport?.headlineTitleMismatchDetected && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Headline Title Discrepancy: </span>
                    <span>{auditReport.titleMismatchExplanation}</span>
                  </div>
                </div>
              )}

              {/* Navigation Tabs Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveView("audit")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      activeView === "audit"
                        ? "bg-teal-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Audit & Analysis
                  </button>

                  <button
                    onClick={() => setActiveView("edit")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      activeView === "edit"
                        ? "bg-teal-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    Content Editor
                  </button>

                  <button
                    onClick={() => setActiveView("template")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      activeView === "template"
                        ? "bg-teal-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Change Template
                  </button>

                  <button
                    onClick={() => setActiveView("preview")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      activeView === "preview"
                        ? "bg-teal-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Formatted Preview
                  </button>
                </div>

                {/* Prominent "Apply All Suggestions" Button */}
                {auditReport && auditReport.sections.some(s => s.suggestedChanges?.length > 0) && (
                  <button
                    onClick={handleApplyAllSuggestions}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 hover:brightness-110 transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    Apply All AI Suggestions
                  </button>
                )}
              </div>

              {/* VIEW 1: AUDIT & ANALYSIS */}
              {activeView === "audit" && (
                <div className="space-y-6">

                  {/* Summary Strengths / Weaknesses / Missing Info Grid */}
                  {(auditReport?.strengths?.length || auditReport?.weaknesses?.length || auditReport?.missingInformation?.length) ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Strengths */}
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                        <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                          <CheckCircle2 className="w-4 h-4" /> Strengths
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {(auditReport.strengths || ["Clean overall structure", "Key skills extracted"]).map((s, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                        <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase">
                          <AlertTriangle className="w-4 h-4" /> Weaknesses
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {(auditReport.weaknesses || ["Missing metric achievements"]).map((w, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-400 font-bold">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Missing Info */}
                      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                        <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                          <AlertCircle className="w-4 h-4" /> Missing Information
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {(auditReport.missingInformation || ["LinkedIn URL not provided"]).map((m, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}

                  {/* Section-by-Section Deficiency Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                      <span>Section-by-Section Reality Audit Breakdown:</span>
                      <span className="text-xs text-slate-400 font-normal">Click "Apply Fix" to auto-upgrade individual sections</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {auditReport?.sections?.map((sec) => (
                        <div
                          key={sec.sectionKey}
                          className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                              <span>{sec.sectionTitle}</span>
                            </h4>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                              sec.status === "success"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : sec.status === "warning"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            }`}>
                              Score: {sec.score}%
                            </span>
                          </div>

                          {/* Deficiencies */}
                          {sec.deficiencies.length > 0 ? (
                            <ul className="space-y-1 text-xs text-slate-300">
                              {sec.deficiencies.map((def, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <span>{def}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>No major deficiencies detected in this section.</span>
                            </div>
                          )}

                          {/* Suggested 1-click Auto-Fixes */}
                          {sec.suggestedChanges?.map((change, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/20 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-teal-300 uppercase text-[10px]">Auto-Fix Available: {change.field}</span>
                                <button
                                  onClick={() => handleApplyFix(sec.sectionKey, change.field, change.suggestedValue)}
                                  className="px-2.5 py-1 rounded-lg bg-teal-500 text-slate-950 font-bold text-[11px] hover:bg-teal-400 transition flex items-center gap-1"
                                >
                                  <Wand2 className="w-3 h-3" />
                                  Apply Fix
                                </button>
                              </div>
                              <p className="text-slate-300 text-[11px]">{change.explanation}</p>
                              <p className="text-[11px] text-teal-200 font-mono bg-slate-900/80 p-2 rounded border border-teal-500/20">
                                {change.suggestedValue}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: INTERACTIVE CONTENT EDITOR */}
              {activeView === "edit" && parsedResume && (
                <div className="space-y-6">

                  {/* Personal Info & Contact */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-teal-400">Personal Information & Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={parsedResume.personalInfo.fullName}
                          onChange={(e) => setParsedResume({
                            ...parsedResume,
                            personalInfo: { ...parsedResume.personalInfo, fullName: e.target.value }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Headline Job Title</label>
                        <input
                          type="text"
                          value={parsedResume.personalInfo.jobTitle}
                          onChange={(e) => setParsedResume({
                            ...parsedResume,
                            personalInfo: { ...parsedResume.personalInfo, jobTitle: e.target.value }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Email</label>
                        <input
                          type="email"
                          value={parsedResume.personalInfo.email}
                          onChange={(e) => setParsedResume({
                            ...parsedResume,
                            personalInfo: { ...parsedResume.personalInfo, email: e.target.value }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Phone</label>
                        <input
                          type="text"
                          value={parsedResume.personalInfo.phone}
                          onChange={(e) => setParsedResume({
                            ...parsedResume,
                            personalInfo: { ...parsedResume.personalInfo, phone: e.target.value }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Location</label>
                        <input
                          type="text"
                          value={parsedResume.personalInfo.location}
                          onChange={(e) => setParsedResume({
                            ...parsedResume,
                            personalInfo: { ...parsedResume.personalInfo, location: e.target.value }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">LinkedIn Profile</label>
                        <input
                          type="text"
                          value={parsedResume.personalInfo.linkedin}
                          onChange={(e) => setParsedResume({
                            ...parsedResume,
                            personalInfo: { ...parsedResume.personalInfo, linkedin: e.target.value }
                          })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="text-sm font-bold text-teal-400">Professional Summary</h3>
                    <textarea
                      rows={3}
                      value={parsedResume.summary}
                      onChange={(e) => setParsedResume({ ...parsedResume, summary: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                    />
                  </div>

                  {/* Core Skills */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="text-sm font-bold text-teal-400">Core Skills</h3>
                    <input
                      type="text"
                      value={parsedResume.skills.join(", ")}
                      onChange={(e) => setParsedResume({
                        ...parsedResume,
                        skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-100"
                      placeholder="Comma-separated skills (e.g. React, TypeScript, Product Management)"
                    />
                  </div>

                  {/* Work Experience */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-teal-400">Work Experience ({parsedResume.experience.length})</h3>
                      <button
                        type="button"
                        onClick={() => {
                          const newExp: WorkExperience = {
                            id: crypto.randomUUID(),
                            company: "New Company",
                            position: "Role Position",
                            startDate: "2023",
                            endDate: "Present",
                            current: true,
                            location: "City, Country",
                            description: "Key achievement or quantitative metric bullet."
                          };
                          setParsedResume({ ...parsedResume, experience: [newExp, ...parsedResume.experience] });
                        }}
                        className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-teal-500/30 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Experience
                      </button>
                    </div>

                    <div className="space-y-4">
                      {parsedResume.experience.map((exp, idx) => (
                        <div key={exp.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300">Experience #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setParsedResume({
                                  ...parsedResume,
                                  experience: parsedResume.experience.filter(e => e.id !== exp.id)
                                });
                              }}
                              className="text-rose-400 hover:text-rose-300 text-xs p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <input
                              type="text"
                              value={exp.position}
                              onChange={(e) => setParsedResume({
                                ...parsedResume,
                                experience: parsedResume.experience.map(item => item.id === exp.id ? { ...item, position: e.target.value } : item)
                              })}
                              placeholder="Job Position Title"
                              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                            />
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => setParsedResume({
                                ...parsedResume,
                                experience: parsedResume.experience.map(item => item.id === exp.id ? { ...item, company: e.target.value } : item)
                              })}
                              placeholder="Company Name"
                              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                            />
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => setParsedResume({
                                ...parsedResume,
                                experience: parsedResume.experience.map(item => item.id === exp.id ? { ...item, startDate: e.target.value } : item)
                              })}
                              placeholder="Start Date"
                              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                            />
                            <input
                              type="text"
                              value={exp.endDate}
                              onChange={(e) => setParsedResume({
                                ...parsedResume,
                                experience: parsedResume.experience.map(item => item.id === exp.id ? { ...item, endDate: e.target.value } : item)
                              })}
                              placeholder="End Date"
                              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                            />
                          </div>

                          <textarea
                            rows={2}
                            value={exp.description}
                            onChange={(e) => setParsedResume({
                              ...parsedResume,
                              experience: parsedResume.experience.map(item => item.id === exp.id ? { ...item, description: e.target.value } : item)
                            })}
                            placeholder="Achievements, metrics, key responsibilities..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-teal-400">Education ({parsedResume.education.length})</h3>
                      <button
                        type="button"
                        onClick={() => {
                          const newEdu: Education = {
                            id: crypto.randomUUID(),
                            school: "University Name",
                            degree: "Bachelor of Science",
                            fieldOfStudy: "Computer Science",
                            startDate: "2018",
                            endDate: "2022",
                            current: false,
                            location: "City, Country",
                            gpa: "3.8"
                          };
                          setParsedResume({ ...parsedResume, education: [...parsedResume.education, newEdu] });
                        }}
                        className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-teal-500/30 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Education
                      </button>
                    </div>

                    <div className="space-y-3">
                      {parsedResume.education.map((edu, idx) => (
                        <div key={edu.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-300">Education #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setParsedResume({
                                  ...parsedResume,
                                  education: parsedResume.education.filter(e => e.id !== edu.id)
                                });
                              }}
                              className="text-rose-400 hover:text-rose-300 text-xs p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => setParsedResume({
                                ...parsedResume,
                                education: parsedResume.education.map(item => item.id === edu.id ? { ...item, degree: e.target.value } : item)
                              })}
                              placeholder="Degree"
                              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                            />
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => setParsedResume({
                                ...parsedResume,
                                education: parsedResume.education.map(item => item.id === edu.id ? { ...item, school: e.target.value } : item)
                              })}
                              placeholder="School / University"
                              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* References */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-teal-400">References ({parsedResume.references?.length || 0})</h3>
                      <button
                        type="button"
                        onClick={() => {
                          const newRef: Reference = {
                            id: crypto.randomUUID(),
                            name: "Reference Name",
                            title: "Engineering Director",
                            company: "Company",
                            email: "ref@example.com",
                            phone: "+1 555-0199"
                          };
                          setParsedResume({ ...parsedResume, references: [...(parsedResume.references || []), newRef] });
                        }}
                        className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-teal-500/30 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Reference
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(parsedResume.references || []).map((ref, idx) => (
                        <div key={ref.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-300">Reference #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setParsedResume({
                                  ...parsedResume,
                                  references: (parsedResume.references || []).filter(r => r.id !== ref.id)
                                });
                              }}
                              className="text-rose-400 hover:text-rose-300 text-xs p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={ref.name}
                              onChange={(e) => setParsedResume({
                                ...parsedResume,
                                references: (parsedResume.references || []).map(r => r.id === ref.id ? { ...r, name: e.target.value } : r)
                              })}
                              placeholder="Full Name"
                              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                            />
                            <input
                              type="text"
                              value={ref.title}
                              onChange={(e) => setParsedResume({
                                ...parsedResume,
                                references: (parsedResume.references || []).map(r => r.id === ref.id ? { ...r, title: e.target.value } : r)
                              })}
                              placeholder="Title / Relationship"
                              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                            />
                            <input
                              type="email"
                              value={ref.email || ""}
                              onChange={(e) => setParsedResume({
                                ...parsedResume,
                                references: (parsedResume.references || []).map(r => r.id === ref.id ? { ...r, email: e.target.value } : r)
                              })}
                              placeholder="Email Address"
                              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                            />
                            <input
                              type="text"
                              value={ref.phone || ""}
                              onChange={(e) => setParsedResume({
                                ...parsedResume,
                                references: (parsedResume.references || []).map(r => r.id === ref.id ? { ...r, phone: e.target.value } : r)
                              })}
                              placeholder="Phone Number"
                              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: CHANGE TEMPLATE (TEMPLATE LAYER) */}
              {activeView === "template" && parsedResume && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h3 className="text-sm font-bold text-teal-400">Template Layer Switcher</h3>
                    <p className="text-xs text-slate-400">
                      Switching template changes layout, typography, colors, and margins instantly without modifying your Content Layer!
                    </p>
                  </div>

                  {/* Extracted Custom Templates Section */}
                  {savedCustomTemplates.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                        Extracted Custom Templates ({savedCustomTemplates.length}):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {savedCustomTemplates.map((custom) => {
                          const isSelected = parsedResume.templateId === custom.templateId;
                          return (
                            <div
                              key={custom.templateId}
                              onClick={() => handleSelectTemplate(custom.templateId, custom.colorTheme, custom.fontFamily)}
                              className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                                isSelected
                                  ? "bg-teal-950/40 border-teal-400 shadow-lg shadow-teal-500/20"
                                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-100">{custom.templateName}</span>
                                  {isSelected && <Check className="w-4 h-4 text-teal-400" />}
                                </div>
                                <p className="text-[11px] text-slate-400 line-clamp-2">{custom.description}</p>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: custom.colorTheme }} />
                                  {custom.colorTheme}
                                </span>
                                <span>{custom.fontFamily}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Standard Application Presets */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Application Template Library:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {PRESET_TEMPLATES.map((tpl) => {
                        const isSelected = parsedResume.templateId === tpl.id;
                        return (
                          <div
                            key={tpl.id}
                            onClick={() => handleSelectTemplate(tpl.id, tpl.color, tpl.font)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                              isSelected
                                ? "bg-teal-950/40 border-teal-400 shadow-lg shadow-teal-500/20"
                                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-100">{tpl.name}</span>
                                {isSelected && <Check className="w-4 h-4 text-teal-400" />}
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-teal-300 font-mono inline-block">
                                {tpl.category}
                              </span>
                              <p className="text-[11px] text-slate-400 line-clamp-2">{tpl.desc}</p>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: tpl.color }} />
                                {tpl.color}
                              </span>
                              <span>{tpl.font}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 4: LIVE PREVIEW */}
              {activeView === "preview" && parsedResume && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto flex justify-center">
                    <div id="scanned-resume-preview-pane" className="w-[800px] shadow-2xl rounded-xl overflow-hidden bg-white text-slate-900">
                      <ResumeTemplates data={parsedResume} scale={1} />
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => { setParsedResume(null); setFile(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                >
                  Upload Different Resume
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {parsedResume && (
                    <button
                      onClick={handleDownloadPDF}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 transition flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print / Download PDF
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (parsedResume) {
                        onImportToBuilder(parsedResume, extractedStyle || undefined);
                        onClose();
                      }
                    }}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Load & Edit in Resume Builder
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
