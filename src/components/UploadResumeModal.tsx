import React, { useState } from "react";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, Download, Edit3, ArrowRight, X, RefreshCw, Eye, Wand2, ShieldCheck, Palette
} from "lucide-react";
import { ResumeData, Reference } from "../types";
import ResumeTemplates from "./ResumeTemplates";

interface AuditSection {
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

interface AuditReport {
  overallRealityScore: number;
  headlineTitleMismatchDetected: boolean;
  titleMismatchExplanation: string;
  sections: AuditSection[];
}

interface ExtractedTemplateStyle {
  templateId: string;
  templateName: string;
  description: string;
  colorTheme: string;
  fontFamily: string;
  layoutStyle: string;
  bgClass: string;
  sidebarClass?: string;
  accentClass?: string;
  isDark?: boolean;
}

interface UploadResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToBuilder: (resume: ResumeData, extractedStyle?: ExtractedTemplateStyle) => void;
}

export default function UploadResumeModal({ isOpen, onClose, onImportToBuilder }: UploadResumeModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Audit Results
  const [parsedResume, setParsedResume] = useState<ResumeData | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [extractedStyle, setExtractedStyle] = useState<ExtractedTemplateStyle | null>(null);

  // Mode: "audit" | "edit" | "preview"
  const [activeView, setActiveView] = useState<"audit" | "edit" | "preview">("audit");

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

  const processResumeUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setLoadingStep("Reading document file contents...");

    try {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const fileDataUri = reader.result as string;
          let textContent = "";

          // If text file, get string directly
          if (file.type.includes("text") || file.name.endsWith(".txt")) {
            textContent = fileDataUri;
          }

          setLoadingStep("AI Scanning document structure & parsing details...");

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
          setLoadingStep("Auditing profile, experience, and references for deficiencies...");

          // Format parsed resume to full standard structure
          const fullData: ResumeData = {
            id: `uploaded_${Date.now()}`,
            title: data.parsedResume?.title || file.name.replace(/\.[^/.]+$/, "") || "Uploaded Resume",
            personalInfo: {
              fullName: data.parsedResume?.personalInfo?.fullName || "Candidate",
              jobTitle: data.parsedResume?.personalInfo?.jobTitle || "Professional",
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
            templateId: data.extractedTemplateStyle?.templateId || "minimal",
            colorTheme: data.extractedTemplateStyle?.colorTheme || "#0f766e",
            fontFamily: data.extractedTemplateStyle?.fontFamily || "font-sans",
            spacing: "comfortable",
            layoutMode: "auto",
            updatedAt: new Date().toISOString()
          };

          setParsedResume(fullData);
          setAuditReport(data.auditReport);
          setExtractedStyle(data.extractedTemplateStyle);

          // Save extracted custom template to localStorage library
          if (data.extractedTemplateStyle) {
            try {
              const existing = JSON.parse(localStorage.getItem("customSavedTemplates") || "[]");
              const updated = [data.extractedTemplateStyle, ...existing.filter((t: any) => t.templateId !== data.extractedTemplateStyle.templateId)];
              localStorage.setItem("customSavedTemplates", JSON.stringify(updated));
            } catch (e) {
              console.warn("Template storage warning:", e);
            }
          }

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

  const handleApplyFix = (sectionKey: string, field: string, value: string) => {
    if (!parsedResume) return;

    if (sectionKey === "personalInfo") {
      setParsedResume(prev => prev ? ({
        ...prev,
        personalInfo: { ...prev.personalInfo, [field]: value }
      }) : null);
    } else if (sectionKey === "summary") {
      setParsedResume(prev => prev ? ({
        ...prev,
        summary: value
      }) : null);
    }

    // Update audit report status for that change
    if (auditReport) {
      setAuditReport(prev => prev ? ({
        ...prev,
        sections: prev.sections.map(s => {
          if (s.sectionKey === sectionKey) {
            return {
              ...s,
              deficiencies: s.deficiencies.filter(d => !d.toLowerCase().includes(field.toLowerCase())),
              suggestedChanges: s.suggestedChanges.filter(c => c.field !== field)
            };
          }
          return s;
        })
      }) : null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-teal-500/30 text-teal-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-100 via-teal-100 to-emerald-400 bg-clip-text text-transparent">
                AI Resume Scanner & Reality Auditor
              </h2>
              <p className="text-xs text-slate-400">
                Upload your existing resume to scan for deficiencies, generate reality scores, and extract custom template styles.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!parsedResume ? (
            /* Upload Screen */
            <div className="max-w-2xl mx-auto space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-teal-500/30 hover:border-teal-400/60 rounded-2xl p-10 text-center bg-slate-900/50 hover:bg-slate-850 transition cursor-pointer relative group"
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
                <h3 className="text-lg font-semibold text-slate-200 mb-1">
                  {file ? file.name : "Drag and drop your resume file here"}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Supports PDF, DOCX, TXT, or Image scans up to 10MB
                </p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-semibold text-xs group-hover:bg-teal-400 transition">
                  <Upload className="w-4 h-4" />
                  {file ? "Change File" : "Browse Files"}
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
                  <p className="text-xs text-slate-400">Analyzing skills, title alignment, and extracting template styles...</p>
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
              
              {/* Reality Score & Headline Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Score Card */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold font-mono border ${
                    (auditReport?.overallRealityScore || 0) >= 80
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : (auditReport?.overallRealityScore || 0) >= 60
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                      : "bg-rose-500/10 border-rose-500/40 text-rose-400"
                  }`}>
                    {auditReport?.overallRealityScore || 0}%
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Resume Reality Score</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(auditReport?.overallRealityScore || 0) >= 80
                        ? "High market alignment & clean ATS structure."
                        : (auditReport?.overallRealityScore || 0) >= 60
                        ? "Moderate alignment. Minor deficiencies found."
                        : "Headline or section mismatch detected!"}
                    </p>
                  </div>
                </div>

                {/* Extracted Style Badge */}
                {extractedStyle && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-950/40 to-slate-950 border border-teal-500/30 flex items-center gap-4 md:col-span-2">
                    <div className="p-3 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                      <Palette className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          Template Extracted & Saved
                        </span>
                        <span className="text-xs text-slate-400">{extractedStyle.templateName}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {extractedStyle.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Title Discrepancy Alert */}
              {auditReport?.headlineTitleMismatchDetected && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Headline Title Mismatch Detected: </span>
                    <span>{auditReport.titleMismatchExplanation}</span>
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setActiveView("audit")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    activeView === "audit"
                      ? "bg-teal-500 text-slate-950"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Section Deficiencies Audit
                </button>

                <button
                  onClick={() => setActiveView("edit")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    activeView === "edit"
                      ? "bg-teal-500 text-slate-950"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  Interactive Editable Mode
                </button>

                <button
                  onClick={() => setActiveView("preview")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    activeView === "preview"
                      ? "bg-teal-500 text-slate-950"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Live Formatted Preview
                </button>
              </div>

              {/* VIEW 1: DEFICIENCY AUDIT */}
              {activeView === "audit" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300">
                    Section-by-Section Deficiency Analysis (Profile to References):
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
              )}

              {/* VIEW 2: INTERACTIVE EDITABLE MODE */}
              {activeView === "edit" && parsedResume && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-teal-400">Personal Information & Headline</h3>
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
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="text-sm font-bold text-teal-400">Professional Summary</h3>
                    <textarea
                      rows={3}
                      value={parsedResume.summary}
                      onChange={(e) => setParsedResume({ ...parsedResume, summary: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                    />
                  </div>

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
                      placeholder="Comma-separated skills (e.g. React, TypeScript, Leadership)"
                    />
                  </div>
                </div>
              )}

              {/* VIEW 3: LIVE PREVIEW */}
              {activeView === "preview" && parsedResume && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto flex justify-center">
                  <div className="w-[800px] shadow-2xl rounded-xl overflow-hidden bg-white text-slate-900">
                    <ResumeTemplates data={parsedResume} scale={1} />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => { setParsedResume(null); setFile(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                >
                  Upload Different Resume
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (parsedResume) {
                        onImportToBuilder(parsedResume, extractedStyle || undefined);
                        onClose();
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
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
