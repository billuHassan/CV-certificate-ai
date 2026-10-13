import { ResumeData, ResumeSnapshot } from "../types";

/**
 * Computes summary metrics for a given resume state.
 */
export function extractResumeMetrics(resume: ResumeData): ResumeSnapshot["metrics"] {
  return {
    experienceCount: resume.experience?.length || 0,
    educationCount: resume.education?.length || 0,
    skillsCount: resume.skills?.length || 0,
    projectsCount: resume.projects?.length || 0,
    templateId: resume.templateId || "modern",
    hasSummary: Boolean(resume.summary && resume.summary.trim().length > 0),
  };
}

/**
 * LocalStorage key for storing resume snapshots as an immediate fallback & safety cache.
 */
function getLocalKey(resumeId: string): string {
  return `cvcraft_snapshots_${resumeId}`;
}

/**
 * Loads snapshots for a given resume from both resume.snapshots and localStorage backup.
 */
export function getResumeSnapshots(resume: ResumeData): ResumeSnapshot[] {
  const memorySnapshots = resume.snapshots || [];

  try {
    const rawLocal = localStorage.getItem(getLocalKey(resume.id));
    if (rawLocal) {
      const localSnapshots: ResumeSnapshot[] = JSON.parse(rawLocal);
      // Merge unique by snapshot id, prioritizing memorySnapshots
      const idMap = new Map<string, ResumeSnapshot>();
      localSnapshots.forEach((s) => idMap.set(s.id, s));
      memorySnapshots.forEach((s) => idMap.set(s.id, s));
      const merged = Array.from(idMap.values());
      // Sort newest first
      return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (err) {
    console.warn("Failed to load local snapshots cache:", err);
  }

  return [...memorySnapshots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Creates a brand new snapshot of current resume state.
 */
export function createResumeSnapshot(
  resume: ResumeData,
  label?: string,
  note?: string,
  tag: ResumeSnapshot["tag"] = "manual"
): ResumeSnapshot {
  const existing = getResumeSnapshots(resume);
  const nextVersionNumber = existing.length > 0 
    ? Math.max(...existing.map((s) => s.versionNumber || 0)) + 1 
    : 1;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const finalLabel = label && label.trim().length > 0 
    ? label.trim() 
    : `Version ${nextVersionNumber} • ${dateStr}`;

  // Deep clone resumeData without nested circular snapshots to keep memory lean
  const { snapshots: _ignored, ...cleanData } = resume;
  const clonedData: ResumeData = JSON.parse(JSON.stringify(cleanData));

  const snapshot: ResumeSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    resumeId: resume.id,
    versionNumber: nextVersionNumber,
    label: finalLabel,
    note: note?.trim() || undefined,
    createdAt: now.toISOString(),
    resumeData: clonedData,
    tag,
    metrics: extractResumeMetrics(resume),
  };

  return snapshot;
}

/**
 * Attaches a new snapshot to the resume and persists to localStorage.
 */
export function attachSnapshotToResume(resume: ResumeData, snapshot: ResumeSnapshot): ResumeData {
  const currentSnapshots = resume.snapshots || [];
  const updatedSnapshots = [snapshot, ...currentSnapshots.filter((s) => s.id !== snapshot.id)];

  try {
    localStorage.setItem(getLocalKey(resume.id), JSON.stringify(updatedSnapshots));
  } catch (err) {
    console.warn("Failed to cache snapshots in localStorage:", err);
  }

  return {
    ...resume,
    snapshots: updatedSnapshots,
  };
}

/**
 * Deletes a snapshot from the resume state and local cache.
 */
export function deleteSnapshotFromResume(resume: ResumeData, snapshotId: string): ResumeData {
  const currentSnapshots = resume.snapshots || [];
  const updatedSnapshots = currentSnapshots.filter((s) => s.id !== snapshotId);

  try {
    localStorage.setItem(getLocalKey(resume.id), JSON.stringify(updatedSnapshots));
  } catch (err) {
    console.warn("Failed to update snapshots in localStorage:", err);
  }

  return {
    ...resume,
    snapshots: updatedSnapshots,
  };
}

/**
 * Restores a snapshot into an active ResumeData object.
 * Preserves the existing snapshot history so versions are never lost upon restore!
 */
export function restoreResumeFromSnapshot(
  snapshot: ResumeSnapshot,
  currentResume: ResumeData
): ResumeData {
  const snapData = snapshot.resumeData;
  const cloned: ResumeData = JSON.parse(JSON.stringify(snapData));

  // Retain the current snapshots array so version history continues uninterrupted
  const preservedSnapshots = currentResume.snapshots || [];

  return {
    ...cloned,
    id: currentResume.id, // keep current resume ID
    updatedAt: new Date().toISOString(),
    snapshots: preservedSnapshots,
  };
}

/**
 * Computes a readable difference analysis between current resume and a snapshot.
 */
export interface SnapshotDiff {
  titleChanged: boolean;
  templateChanged: boolean;
  colorChanged: boolean;
  summaryChanged: boolean;
  expDiff: number; // positive means current has more, negative means snapshot had more
  eduDiff: number;
  skillsDiff: number;
  projectsDiff: number;
  addedSkills: string[];
  removedSkills: string[];
  currentTemplate: string;
  snapshotTemplate: string;
}

export function computeSnapshotDiff(current: ResumeData, snapshot: ResumeSnapshot): SnapshotDiff {
  const snap = snapshot.resumeData;

  const currentSkills = new Set(current.skills || []);
  const snapSkills = new Set(snap.skills || []);

  const addedSkills = (current.skills || []).filter((s) => !snapSkills.has(s));
  const removedSkills = (snap.skills || []).filter((s) => !currentSkills.has(s));

  return {
    titleChanged: (current.title || "") !== (snap.title || ""),
    templateChanged: current.templateId !== snap.templateId,
    colorChanged: current.colorTheme !== snap.colorTheme,
    summaryChanged: (current.summary || "").trim() !== (snap.summary || "").trim(),
    expDiff: (current.experience?.length || 0) - (snap.experience?.length || 0),
    eduDiff: (current.education?.length || 0) - (snap.education?.length || 0),
    skillsDiff: (current.skills?.length || 0) - (snap.skills?.length || 0),
    projectsDiff: (current.projects?.length || 0) - (snap.projects?.length || 0),
    addedSkills,
    removedSkills,
    currentTemplate: current.templateId,
    snapshotTemplate: snap.templateId,
  };
}
