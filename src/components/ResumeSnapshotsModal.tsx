import React, { useState } from "react";
import {
  History,
  Bookmark,
  RotateCcw,
  Clock,
  Tag,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  ArrowRight,
  GitBranch,
  Copy,
  ChevronRight,
  Split,
  Eye,
  FileText,
  Sparkles,
} from "lucide-react";
import { ResumeData, ResumeSnapshot } from "../types";
import {
  createResumeSnapshot,
  attachSnapshotToResume,
  deleteSnapshotFromResume,
  restoreResumeFromSnapshot,
  computeSnapshotDiff,
  getResumeSnapshots,
} from "../utils/snapshotManager";

interface ResumeSnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResume: ResumeData;
  onRestoreSnapshot: (restoredResume: ResumeData) => void;
  onUpdateResumeSnapshots: (updatedResume: ResumeData) => void;
  onBranchAsNewResume?: (snapshotResume: ResumeData, newTitle: string) => void;
  onPreviewSnapshotPdf?: (snapshotData: ResumeData) => void;
}

export default function ResumeSnapshotsModal({
  isOpen,
  onClose,
  currentResume,
  onRestoreSnapshot,
  onUpdateResumeSnapshots,
  onBranchAsNewResume,
  onPreviewSnapshotPdf,
}: ResumeSnapshotsModalProps) {
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [snapshotNote, setSnapshotNote] = useState("");
  const [selectedTag, setSelectedTag] = useState<ResumeSnapshot["tag"]>("manual");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [autoBackupBeforeRestore, setAutoBackupBeforeRestore] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "create" | "compare">("list");
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "info" } | null>(null);

  if (!isOpen) return null;

  const snapshots = getResumeSnapshots(currentResume);
  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0] || null;

  const showNotification = (text: string, type: "success" | "info" = "success") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3500);
  };

  const handleCreateSnapshot = () => {
    const newSnapshot = createResumeSnapshot(currentResume, snapshotLabel, snapshotNote, selectedTag);
    const updatedResume = attachSnapshotToResume(currentResume, newSnapshot);
    onUpdateResumeSnapshots(updatedResume);

    // Reset inputs
    setSnapshotLabel("");
    setSnapshotNote("");
    setIsCreating(false);
    setActiveTab("list");
    setSelectedSnapshotId(newSnapshot.id);
    showNotification(`Snapshot "${newSnapshot.label}" created successfully!`, "success");
  };

  const handleDeleteSnapshot = (snapshotId: string, label: string) => {
    if (window.confirm(`Are you sure you want to delete snapshot "${label}"? This action cannot be undone.`)) {
      const updatedResume = deleteSnapshotFromResume(currentResume, snapshotId);
      onUpdateResumeSnapshots(updatedResume);
      if (selectedSnapshotId === snapshotId) {
        setSelectedSnapshotId(null);
      }
      showNotification(`Snapshot deleted.`, "info");
    }
  };

  const handleExecuteRestore = (snapshot: ResumeSnapshot) => {
    let baseResume = currentResume;

    // Optionally take an automatic snapshot of current work before overwriting
    if (autoBackupBeforeRestore) {
      const autoSave = createResumeSnapshot(
        currentResume,
        `Auto-backup before restoring v${snapshot.versionNumber}`,
        `Automatically saved state prior to rolling back to "${snapshot.label}"`,
        "auto"
      );
      baseResume = attachSnapshotToResume(currentResume, autoSave);
    }

    const restored = restoreResumeFromSnapshot(snapshot, baseResume);
    onRestoreSnapshot(restored);
    setConfirmRestoreId(null);
    showNotification(`Restored resume to snapshot "${snapshot.label}"!`, "success");
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleBranchToNewResume = (snapshot: ResumeSnapshot) => {
    if (onBranchAsNewResume) {
      const newTitle = `${snapshot.resumeData.title || "Resume"} (from v${snapshot.versionNumber})`;
      onBranchAsNewResume(snapshot.resumeData, newTitle);
      showNotification(`Branched into new document "${newTitle}"!`, "success");
      onClose();
    }
  };

  const PRESET_LABELS = [
    { label: "Before major re-structure", tag: "milestone" as const },
    { label: "Pre-AI Bullet Optimization", tag: "pre-ai" as const },
    { label: "Baseline Executive Version", tag: "milestone" as const },
    { label: "Targeted for Tech / Lead Role", tag: "custom" as const },
    { label: "Before Template Switch", tag: "pre-template" as const },
  ];

  const diff = selectedSnapshot ? computeSnapshotDiff(currentResume, selectedSnapshot) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Studio Window Bar */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[11px] text-slate-300 font-bold truncate">
              Rahmora Live Suite &bull; Resume Snapshots &amp; Version History
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
              {snapshots.length} {snapshots.length === 1 ? "Version Saved" : "Versions Saved"}
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Close versioning panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Header Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
                  <span>Resume Versioning &amp; Snapshots</span>
                  <span className="text-xs font-mono font-normal text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    Safe Editing Mode
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Freeze copies of your resume before major edits, compare changes side-by-side, or restore anytime.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("create");
                setIsCreating(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Snapshot</span>
            </button>
          </div>
        </div>

        {/* Feedback alert toast */}
        {feedbackMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between gap-2 shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Tab switcher */}
        <div className="px-4 pt-3 flex items-center gap-2 border-b border-slate-800 bg-slate-900/40 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "list"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Version Timeline ({snapshots.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "create"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Take New Snapshot</span>
          </button>
          {selectedSnapshot && (
            <button
              onClick={() => setActiveTab("compare")}
              className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "compare"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Split className="h-3.5 w-3.5" />
              <span>Compare v{selectedSnapshot.versionNumber} vs Current</span>
            </button>
          )}
        </div>

        {/* Main Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: CREATE SNAPSHOT FORM */}
          {activeTab === "create" && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-indigo-400" />
                    <span>Create Snapshot of Current Resume</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Save the entire current resume state ({currentResume.experience?.length || 0} experiences,{" "}
                    {currentResume.skills?.length || 0} skills) under a descriptive label.
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Quick Label Presets:</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LABELS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setSnapshotLabel(p.label);
                        setSelectedTag(p.tag);
                      }}
                      className="px-2.5 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Snapshot Name / Label <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder={`e.g. Version ${snapshots.length + 1} - Before Work Experience Overhaul`}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Note / Context */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Notes / Context <span className="text-slate-500 text-[11px] font-normal">(Optional)</span>
                </label>
                <textarea
                  value={snapshotNote}
                  onChange={(e) => setSnapshotNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Preserved all bullets before asking AI to rewrite for Staff Software Engineer profile..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Tag Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Tag Category:</label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(
                    [
                      { id: "manual", label: "Manual Snapshot", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
                      { id: "pre-ai", label: "Pre-AI Rewrite", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
                      { id: "pre-template", label: "Pre-Template Change", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
                      { id: "milestone", label: "Milestone Copy", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
                      { id: "custom", label: "Role Tailored", color: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTag(t.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        selectedTag === t.id
                          ? `${t.color} font-bold ring-1 ring-indigo-500`
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Resume Metadata Preview */}
              <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300 font-medium">Currently capturing:</span>
                  <span className="font-semibold text-white">{currentResume.title || "Untitled Resume"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>{currentResume.experience?.length || 0} Exps</span>
                  <span>&bull;</span>
                  <span>{currentResume.skills?.length || 0} Skills</span>
                  <span>&bull;</span>
                  <span>{currentResume.education?.length || 0} Edu</span>
                  <span>&bull;</span>
                  <span className="capitalize">{currentResume.templateId}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSnapshot}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Freeze Snapshot Now</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VERSION LIST / TIMELINE */}
          {activeTab === "list" && (
            <div className="space-y-4">
              {snapshots.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <History className="h-7 w-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-base font-bold text-white">No Snapshots Created Yet</h4>
                    <p className="text-xs text-slate-400">
                      Snapshots safeguard your work before making significant rewrites, experimenting with new
                      templates, or reordering sections. You can roll back anytime with zero data loss.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("create");
                      setIsCreating(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Your First Snapshot</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>
                      Showing {snapshots.length} saved {snapshots.length === 1 ? "version" : "versions"}
                    </span>
                    <span className="text-[11px] text-slate-500">Sorted by newest first</span>
                  </div>

                  <div className="space-y-3">
                    {snapshots.map((snap) => {
                      const isSelected = selectedSnapshotId === snap.id;
                      const isConfirmingRestore = confirmRestoreId === snap.id;

                      return (
                        <div
                          key={snap.id}
                          className={`border rounded-2xl transition p-4 relative ${
                            isSelected
                              ? "bg-slate-900 border-indigo-500/60 ring-1 ring-indigo-500/30"
                              : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/60">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold shrink-0">
                                v{snap.versionNumber}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                  <span>{snap.label}</span>
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                                  <Clock className="h-3 w-3 text-slate-500" />
                                  <span>{new Date(snap.createdAt).toLocaleString()}</span>
                                  {snap.tag && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="capitalize text-slate-300 px-1.5 py-0.2 bg-slate-800/80 rounded border border-slate-700 text-[10px]">
                                        {snap.tag}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Top Quick Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                onClick={() => {
                                  setSelectedSnapshotId(snap.id);
                                  setActiveTab("compare");
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition border border-slate-700 flex items-center gap-1 cursor-pointer"
                                title="Compare this version with your current resume"
                              >
                                <Split className="h-3 w-3 text-indigo-400" />
                                <span>Compare</span>
                              </button>

                              {onPreviewSnapshotPdf && (
                                <button
                                  onClick={() => onPreviewSnapshotPdf(snap.resumeData)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700 cursor-pointer"
                                  title="View Snapshot PDF"
                                >
                                  <Eye className="h-3.5 w-3.5 text-teal-400" />
                                </button>
                              )}

                              {onBranchAsNewResume && (
                                <button
                                  onClick={() => handleBranchToNewResume(snap)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700 cursor-pointer"
                                  title="Branch into a new resume document"
                                >
                                  <GitBranch className="h-3.5 w-3.5 text-purple-400" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteSnapshot(snap.id, snap.label)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition border border-slate-700 hover:border-rose-800 cursor-pointer"
                                title="Delete Snapshot"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Notes if provided */}
                          {snap.note && (
                            <div className="mt-2.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 italic flex items-start gap-2">
                              <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <span>{snap.note}</span>
                            </div>
                          )}

                          {/* Metrics & Content Summary */}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md">
                                {snap.metrics?.experienceCount ?? snap.resumeData.experience?.length ?? 0} Experiences
                              </span>
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md">
                                {snap.metrics?.skillsCount ?? snap.resumeData.skills?.length ?? 0} Skills
                              </span>
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md">
                                {snap.metrics?.educationCount ?? snap.resumeData.education?.length ?? 0} Educations
                              </span>
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md capitalize">
                                Template: {snap.metrics?.templateId || snap.resumeData.templateId}
                              </span>
                            </div>

                            {/* Restore CTA */}
                            {!isConfirmingRestore ? (
                              <button
                                onClick={() => setConfirmRestoreId(snap.id)}
                                className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ml-auto"
                              >
                                <RotateCcw className="h-3 w-3 text-emerald-400" />
                                <span>Restore This Version</span>
                              </button>
                            ) : (
                              <div className="w-full mt-2 p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-2 animate-fade-in">
                                <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                                  <span>Confirm restoration to Version {snap.versionNumber}?</span>
                                </div>
                                <p className="text-[11px] text-slate-300">
                                  This will load "{snap.label}" into your active editor.
                                </p>
                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                                  <input
                                    type="checkbox"
                                    checked={autoBackupBeforeRestore}
                                    onChange={(e) => setAutoBackupBeforeRestore(e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span>Automatically snapshot current editor state before restoring (Recommended)</span>
                                </label>
                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setConfirmRestoreId(null)}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleExecuteRestore(snap)}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>Yes, Restore Now</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMPARE & DIFF VIEW */}
          {activeTab === "compare" && selectedSnapshot && diff && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Split className="h-4 w-4 text-indigo-400" />
                    <span>Comparing Version {selectedSnapshot.versionNumber} vs Active Editor</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Snapshot created {new Date(selectedSnapshot.createdAt).toLocaleString()} &bull; "
                    {selectedSnapshot.label}"
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmRestoreId(selectedSnapshot.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore v{selectedSnapshot.versionNumber}</span>
                  </button>
                </div>
              </div>

              {/* Side-by-side Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Snapshot Card */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                      Snapshot (v{selectedSnapshot.versionNumber})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(selectedSnapshot.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Resume Title:</span>
                      <span className="font-semibold text-slate-200">
                        {selectedSnapshot.resumeData.title || "Untitled"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Template:</span>
                      <span className="font-mono text-slate-300 capitalize">{diff.snapshotTemplate}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-center">
                        <span className="block text-slate-400">Experiences</span>
                        <span className="font-bold text-white text-sm">
                          {selectedSnapshot.resumeData.experience?.length || 0}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-center">
                        <span className="block text-slate-400">Skills</span>
                        <span className="font-bold text-white text-sm">
                          {selectedSnapshot.resumeData.skills?.length || 0}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-center">
                        <span className="block text-slate-400">Educations</span>
                        <span className="font-bold text-white text-sm">
                          {selectedSnapshot.resumeData.education?.length || 0}
                        </span>
                      </div>
                    </div>

                    {selectedSnapshot.resumeData.summary && (
                      <div className="pt-2">
                        <span className="text-slate-500 block text-[11px]">Summary Excerpt:</span>
                        <p className="text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 line-clamp-3 text-[11px] italic">
                          "{selectedSnapshot.resumeData.summary}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Active Editor Card */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                      Current Active Resume
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">Live in Editor</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Resume Title:</span>
                      <span className="font-semibold text-slate-200">{currentResume.title || "Untitled"}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Template:</span>
                      <span className="font-mono text-slate-300 capitalize">{diff.currentTemplate}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-center">
                        <span className="block text-slate-400">Experiences</span>
                        <span className="font-bold text-white text-sm">
                          {currentResume.experience?.length || 0}
                          {diff.expDiff !== 0 && (
                            <span
                              className={`text-[10px] ml-1 ${diff.expDiff > 0 ? "text-emerald-400" : "text-rose-400"}`}
                            >
                              ({diff.expDiff > 0 ? `+${diff.expDiff}` : diff.expDiff})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-center">
                        <span className="block text-slate-400">Skills</span>
                        <span className="font-bold text-white text-sm">
                          {currentResume.skills?.length || 0}
                          {diff.skillsDiff !== 0 && (
                            <span
                              className={`text-[10px] ml-1 ${diff.skillsDiff > 0 ? "text-emerald-400" : "text-rose-400"}`}
                            >
                              ({diff.skillsDiff > 0 ? `+${diff.skillsDiff}` : diff.skillsDiff})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-center">
                        <span className="block text-slate-400">Educations</span>
                        <span className="font-bold text-white text-sm">
                          {currentResume.education?.length || 0}
                          {diff.eduDiff !== 0 && (
                            <span
                              className={`text-[10px] ml-1 ${diff.eduDiff > 0 ? "text-emerald-400" : "text-rose-400"}`}
                            >
                              ({diff.eduDiff > 0 ? `+${diff.eduDiff}` : diff.eduDiff})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {currentResume.summary && (
                      <div className="pt-2">
                        <span className="text-slate-500 block text-[11px]">Summary Excerpt:</span>
                        <p className="text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 line-clamp-3 text-[11px] italic">
                          "{currentResume.summary}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills Delta Breakdown */}
              {(diff.addedSkills.length > 0 || diff.removedSkills.length > 0) && (
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-slate-200 block">Skills Delta:</span>
                  <div className="flex flex-wrap gap-2">
                    {diff.addedSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-md font-mono text-[11px]"
                      >
                        + {s}
                      </span>
                    ))}
                    {diff.removedSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-md font-mono text-[11px] line-through"
                      >
                        - {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <History className="h-3.5 w-3.5 text-indigo-400" />
            <span>Snapshots are safely stored and synced with your account.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
