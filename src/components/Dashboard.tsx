import React, { useState } from "react";
import {
  Plus, FileText, Sparkles, Award, Trash2, Edit2, Copy, BarChart2, Check,
  ExternalLink, User, Settings as SettingsIcon, Layout, Eye, BookOpen, AlertCircle
} from "lucide-react";
import { ResumeData, CoverLetterData, UserSession } from "../types";
import { BannerAd } from "./AdSystem";

interface DashboardProps {
  user: UserSession;
  resumes: ResumeData[];
  letters: CoverLetterData[];
  onSelectResume: (id: string) => void;
  onSelectLetter: (id: string) => void;
  onCreateResume: (title: string, templateId: string) => void;
  onCreateLetter: (title: string, company: string, role: string) => void;
  onDuplicateResume: (resume: ResumeData) => void;
  onDeleteResume: (id: string) => void;
  onDeleteLetter: (id: string) => void;
  onSelectView: (view: "resumes" | "letters" | "score" | "settings") => void;
  onUpgrade: () => void;
}

export default function Dashboard({
  user,
  resumes,
  letters,
  onSelectResume,
  onSelectLetter,
  onCreateResume,
  onCreateLetter,
  onDuplicateResume,
  onDeleteResume,
  onDeleteLetter,
  onSelectView,
  onUpgrade,
}: DashboardProps) {
  const [showCreateResumeModal, setShowCreateResumeModal] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");

  const [showCreateLetterModal, setShowCreateLetterModal] = useState(false);
  const [newLetterTitle, setNewLetterTitle] = useState("");
  const [newLetterCompany, setNewLetterCompany] = useState("");
  const [newLetterRole, setNewLetterRole] = useState("");

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
    { id: "minimal", name: "Minimalist ATS", badge: "Unlocked" },
    { id: "professional", name: "Professional Corporate", badge: "Unlocked" },
    { id: "modern", name: "Modern Developer", badge: "Unlocked" },
    { id: "creative", name: "Creative Art/Designer", badge: "Unlocked" },
    { id: "executive", name: "Executive Split", badge: "Unlocked" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 no-print">
      
      {/* Top Welcome Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        {/* Decorative ambient gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 text-center md:text-left">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt="Profile" className="h-14 w-14 rounded-2xl object-cover border border-slate-700 shrink-0 shadow-lg" />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
              <User className="h-7 w-7" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h2 className="text-xl font-bold text-white font-display">Hello, {user.displayName}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Access all professional templates, ATS score analyzer, and cover letter creator at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Creators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Creator 1: Resume */}
        <button
          onClick={() => setShowCreateResumeModal(true)}
          className="p-6 bg-indigo-600/10 border border-indigo-500/20 hover:border-indigo-500 rounded-2xl text-left transition group shadow-md"
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
              <FileText className="h-5.5 w-5.5" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 bg-indigo-950 border border-indigo-900 px-2 py-0.5 rounded uppercase font-bold">
              ATS Ready
            </span>
          </div>
          <h3 className="text-md font-bold text-white group-hover:text-indigo-400 transition font-display">New Resume</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Draft dynamic chronologically-optimized resumes engineered to pass recruitment scanning algorithms seamlessly.
          </p>
        </button>

        {/* Creator 2: Cover Letter */}
        <button
          onClick={() => setShowCreateLetterModal(true)}
          className="p-6 bg-emerald-600/10 border border-emerald-500/20 hover:border-emerald-500 rounded-2xl text-left transition group shadow-md"
        >
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Sparkles className="h-5.5 w-5.5" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-0.5 rounded uppercase font-bold">
              Gemini AI
            </span>
          </div>
          <h3 className="text-md font-bold text-white group-hover:text-emerald-400 transition font-display">New Cover Letter</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Compose tailored, persuasive cover letters specific to your target job descriptions with Gemini AI.
          </p>
        </button>
      </div>

      {/* Core Split Dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Resumes & Cover Letters */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Resumes */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-display">Recent Resumes</h3>
            
            <div className="space-y-3">
              {resumes.map((res) => (
                <div
                  key={res.id}
                  className="p-4 bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-between gap-4 transition shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{res.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Template: <span className="capitalize text-indigo-400 font-semibold">{res.templateId}</span> | Updated: {new Date(res.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectResume(res.id)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                      title="Edit Resume"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDuplicateResume(res)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectResume(res.id);
                        onSelectView("score");
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition"
                      title="ATS Audit"
                    >
                      <BarChart2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this resume?")) {
                          onDeleteResume(res.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {resumes.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                  <p className="text-xs text-slate-500">No resumes created yet. Click 'New Resume' above to start.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Cover Letters */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-display">Recent Cover Letters</h3>
            
            <div className="space-y-3">
              {letters.map((letItem) => (
                <div
                  key={letItem.id}
                  className="p-4 bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-between gap-4 transition shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{letItem.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Target: <span className="font-semibold text-emerald-400">{letItem.recipientCompany}</span> | Date: {letItem.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectLetter(letItem.id)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this cover letter?")) {
                          onDeleteLetter(letItem.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {letters.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                  <p className="text-xs text-slate-500">No cover letters generated yet. Click 'New Cover Letter' to compose.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Premium Templates preview & Tips */}
        <div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display flex items-center gap-1.5">
              <Layout className="h-4 w-4 text-indigo-400" /> Professional Design Presets
            </h3>
            
            <div className="space-y-2.5">
              {templatesPreview.map((tpl) => (
                <div key={tpl.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{tpl.name}</span>
                    <span className="text-[10px] text-slate-500">Chronological, ATS Optimized</span>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                    tpl.badge === 'Free' ? 'text-emerald-400 bg-emerald-950' : 'text-amber-400 bg-amber-950'
                  }`}>
                    {tpl.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-indigo-400" /> Job Hunting Tips
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="border-b border-slate-800 pb-2.5">
                <span className="font-bold text-white block mb-0.5">The X-Y-Z Formula</span>
                <p className="text-slate-400 text-[11px]">Accomplished [X] as measured by [Y], by doing [Z]. Always lead bullets with metrics.</p>
              </div>
              <div className="pb-1.5">
                <span className="font-bold text-white block mb-0.5">Customize per Job Description</span>
                <p className="text-slate-400 text-[11px]">Never send a general resume. Highlight the specific skills and frameworks requested in the job post.</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* --- CREATE RESUME MODAL --- */}
      {showCreateResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-display mb-2">Create New Resume</h3>
            <p className="text-xs text-slate-400 mb-4">Enter a title and select a design layout to begin building your CV.</p>
            
            <form onSubmit={handleCreateResumeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Resume Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Backend Engineer Resume"
                  value={newResumeTitle}
                  onChange={(e) => setNewResumeTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Select Initial Layout</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="minimal">Minimalist Traditional (ATS-Friendly)</option>
                  <option value="professional">Professional Corporate</option>
                  <option value="modern">Modern Developer Layout</option>
                  <option value="creative">Creative Art & Design</option>
                  <option value="executive">Executive Split Column</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateResumeModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-display mb-2">Create New Cover Letter</h3>
            <p className="text-xs text-slate-400 mb-4">Provide key job details to bootstrap your AI cover letter.</p>
            
            <form onSubmit={handleCreateLetterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Google Solutions Architect Letter"
                  value={newLetterTitle}
                  onChange={(e) => setNewLetterTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Google"
                    value={newLetterCompany}
                    onChange={(e) => setNewLetterCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Solutions Architect"
                    value={newLetterRole}
                    onChange={(e) => setNewLetterRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateLetterModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
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
    </div>
  );
}
