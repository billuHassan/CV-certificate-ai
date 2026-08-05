import React, { useState } from "react";
import {
  Plus, FileText, Sparkles, Award, Trash2, Edit2, Copy, BarChart2, Check,
  ExternalLink, User, Settings as SettingsIcon, Layout, Eye, BookOpen, AlertCircle, FileSearch, Building2, Upload
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

  const isDark = theme?.isDark ?? false;
  const cardBg = theme?.cardClass || (isDark ? "bg-slate-900/80 border-slate-800 shadow-xl" : "bg-white border-slate-200/90 shadow-md shadow-indigo-100/30");
  const textPrimary = isDark ? "text-slate-100" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600";
  const subCardBg = isDark ? "bg-slate-950/60 border-slate-850" : "bg-slate-50 border-slate-200/80";
  const modalBg = isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-2xl";
  const inputBg = isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900";

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
    { id: "minimal", name: "Minimalist ATS Pro", badge: "Unlocked" },
    { id: "executive", name: "Executive Split Slate", badge: "Unlocked" },
    { id: "elegant", name: "Warm Editorial Cream", badge: "Unlocked" },
    { id: "cyber", name: "Cyberpunk Terminal", badge: "Premium" },
    { id: "berlin", name: "Berlin Neo-Brutalist", badge: "Premium" },
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
          className={`p-5 ${cardBg} hover:border-amber-500 rounded-2xl text-left transition group shadow-md hover:scale-[1.01] border-2 border-dashed border-amber-500/30 dark:border-amber-500/30`}
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
              <Upload className="h-5.5 w-5.5 animate-bounce" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded uppercase font-bold">
              PDF / DOCX
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-amber-600 dark:group-hover:text-amber-400 transition font-display`}>Upload & Scan Resume</h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            Upload PDF/DOCX to preserve design, audit ATS score, get line-by-line fixes & smart edit.
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
              10 Local Alts
            </span>
          </div>
          <h3 className={`text-sm font-bold ${textPrimary} group-hover:text-sky-600 dark:group-hover:text-sky-400 transition font-display`}>Job Poster & Intelligence</h3>
          <p className={`text-xs ${textSecondary} mt-1.5 leading-relaxed`}>
            Upload posters, research companies, evaluate role suitability & find 10 local hiring alternatives.
          </p>
        </button>
      </div>

      {/* Core Split Dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Resumes & Cover Letters */}
        <div className="lg:col-span-2 space-y-6">
          
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

        {/* Right Column: Premium Presets & Tips */}
        <div className="space-y-6">
          <div className={`p-5 ${cardBg} rounded-2xl space-y-4 shadow-xl`}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display flex items-center gap-1.5">
              <Layout className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Professional Design Presets
            </h3>
            
            <div className="space-y-2.5">
              {templatesPreview.map((tpl) => (
                <div key={tpl.id} className={`p-3 ${subCardBg} rounded-xl flex items-center justify-between`}>
                  <div>
                    <span className={`text-xs font-bold ${textPrimary} block`}>{tpl.name}</span>
                    <span className={`text-[10px] ${textSecondary}`}>Chronological, ATS Optimized</span>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                    tpl.badge === 'Unlocked' ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950' : 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950'
                  }`}>
                    {tpl.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-5 ${cardBg} rounded-2xl space-y-3 shadow-xl`}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Job Hunting Tips
            </h3>
            <div className={`space-y-3 text-xs leading-relaxed ${textSecondary}`}>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <span className={`font-bold ${textPrimary} block mb-0.5`}>The X-Y-Z Formula</span>
                <p className="text-[11px]">Accomplished [X] as measured by [Y], by doing [Z]. Always lead bullets with metrics.</p>
              </div>
              <div className="pb-1.5">
                <span className={`font-bold ${textPrimary} block mb-0.5`}>Customize per Job Description</span>
                <p className="text-[11px]">Never send a general resume. Highlight the specific skills and frameworks requested in the job post.</p>
              </div>
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
    </div>
  );
}
