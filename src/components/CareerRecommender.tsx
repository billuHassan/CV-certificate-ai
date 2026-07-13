import React, { useState, useEffect } from "react";
import {
  Compass, Sparkles, AlertCircle, Loader2, ChevronRight, Briefcase, Building,
  TrendingUp, Download, Trash2, Calendar, CheckCircle, ArrowRight, Star, Globe
} from "lucide-react";
import { ResumeData, UserSession, CareerRecommendation } from "../types";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, setDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";

interface CareerRecommenderProps {
  user: UserSession;
  resumes: ResumeData[];
}

export default function CareerRecommender({ user, resumes }: CareerRecommenderProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [activeReport, setActiveReport] = useState<CareerRecommendation | null>(null);
  const [activeTab, setActiveTab] = useState<"roles" | "companies" | "countries" | "strategy">("roles");
  const [error, setError] = useState<string | null>(null);

  // Synchronous loader stage rotation
  useEffect(() => {
    if (!loading) return;
    const steps = [
      "Analyzing professional resume vectors...",
      "Mapping skillset onto market opportunities...",
      "Sifting top-tier employer profiles and SaaS scaleups...",
      "Compiling interview frameworks and tactical recommendations...",
      "Structuring long-term strategic pathing..."
    ];
    let index = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      index = (index + 1) % steps.length;
      setLoadingStep(steps[index]);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  // Real-time Firestore Sync for Career Recommendations history
  useEffect(() => {
    if (!user.uid) return;
    const recsColPath = `users/${user.uid}/career_recommendations`;
    const q = query(collection(db, recsColPath), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CareerRecommendation[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CareerRecommendation);
        });
        setRecommendations(list);
        if (list.length > 0 && !activeReport) {
          setActiveReport(list[0]);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, recsColPath);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  const handleGenerateRecommendation = async () => {
    if (!selectedResumeId) {
      setError("Please select a resume to analyze.");
      return;
    }
    const targetResume = resumes.find(r => r.id === selectedResumeId);
    if (!targetResume) {
      setError("Selected resume was not found.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/career-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: targetResume })
      });

      if (!response.ok) {
        throw new Error("Failed to generate career recommendations. Please try again.");
      }

      const responseData = await response.json();
      if (!responseData.report) {
        throw new Error("Invalid AI payload received.");
      }

      const report = responseData.report;

      // Persistence: Write back to user's Firestore subcollection
      const recsColPath = `users/${user.uid}/career_recommendations`;
      const docId = "rec-" + Date.now();
      const newRec: CareerRecommendation = {
        id: docId,
        resumeId: targetResume.id,
        resumeTitle: targetResume.title,
        overallFitSummary: report.overallFitSummary || "No summary provided.",
        recommendedRoles: report.recommendedRoles || [],
        recommendedCompanies: report.recommendedCompanies || [],
        careerStrategy: report.careerStrategy || [],
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, recsColPath, docId), newRec);
      
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred while communicating with Gemini.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this career recommendation report?")) return;
    
    const recsDocPath = `users/${user.uid}/career_recommendations/${reportId}`;
    try {
      await deleteDoc(doc(db, recsDocPath));
      if (activeReport?.id === reportId) {
        setActiveReport(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, recsDocPath);
    }
  };

  const handleDownloadText = (report: CareerRecommendation) => {
    let text = `====================================================\n`;
    text += `   CVCRAFT AI - PERSONALIZED CAREER STRATEGY REPORT  \n`;
    text += `====================================================\n\n`;
    text += `Generated At: ${new Date(report.createdAt).toLocaleString()}\n`;
    text += `Based on Resume: ${report.resumeTitle}\n\n`;
    text += `--- EXECUTIVE FIT ANALYSIS ---\n`;
    text += `${report.overallFitSummary}\n\n`;
    
    text += `--- TARGET PROFESSIONAL ROLES ---\n`;
    report.recommendedRoles.forEach((role, idx) => {
      text += `${idx + 1}. ${role.title} (Fit Score: ${role.fitScore}%)\n`;
      text += `   Expected Salary Range: ${role.expectedSalaryRange}\n`;
      text += `   Rationale: ${role.rationale}\n`;
      text += `   Recommended Upskilling: ${role.skillsToAcquire.join(", ")}\n`;
      if (role.topCompanies && role.topCompanies.length > 0) {
        text += `   Top 5 Target Employers: ${role.topCompanies.join(", ")}\n`;
      }
      if (role.skillsToUpgrade && role.skillsToUpgrade.length > 0) {
        text += `   Standout Skill Upgrades:\n`;
        role.skillsToUpgrade.forEach((skill) => {
          text += `     - ${skill.skillName}: ${skill.whyItStandsOut}\n`;
        });
      }
      text += `\n`;
    });

    if (report.recommendedCountries && report.recommendedCountries.length > 0) {
      text += `--- TOP 10 RECOMMENDED COUNTRIES TO WORK ---\n`;
      report.recommendedCountries.forEach((c, idx) => {
        text += `${idx + 1}. ${c.country} (Top Cities: ${c.topCities.join(", ")})\n`;
        text += `   Expected Salary Level: ${c.averageSalaryLevel}\n`;
        text += `   Market Rationale: ${c.rationale}\n\n`;
      });
    }

    text += `--- RECOMMENDED COMPANIES & SECTOR COHORTS ---\n`;
    report.recommendedCompanies.forEach((comp, idx) => {
      text += `${idx + 1}. ${comp.companyName}\n`;
      text += `   Why it fits: ${comp.fitRationale}\n`;
      text += `   Job Positions to Watch: ${comp.positionsToWatch.join(", ")}\n`;
      text += `   Interview Strategy: ${comp.interviewTips}\n\n`;
    });

    text += `--- HIGH-IMPACT STRATEGIC NEXT STEPS ---\n`;
    report.careerStrategy.forEach((step, idx) => {
      text += `[ ] Step ${idx + 1}: ${step}\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `CVCraft_Career_Strategy_${report.resumeTitle.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="career-recommender-view" className="w-full max-w-7xl mx-auto space-y-6">
      {/* Upper header segment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight font-display">AI Career Recommender</h2>
            <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950 border border-indigo-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Gemini Guided
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Let Gemini analyze your technical competencies and professional experiences to match you with matching job roles, outline strategic company cohorts, and design an actionable path forward.
          </p>
        </div>

        {resumes.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Resume Profile</label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition min-w-[200px]"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateRecommendation}
              disabled={loading}
              className="mt-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Analyze & Recommend
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-950/20 border border-rose-900 text-rose-200 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl gap-4 shadow-xl">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
            <Loader2 className="h-10 w-10 text-indigo-400 animate-spin relative" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-white font-display">Generating Strategic Blueprint</h3>
            <p className="text-[11px] text-indigo-300 font-mono animate-pulse">{loadingStep}</p>
          </div>
        </div>
      ) : resumes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
          <div className="h-12 w-12 bg-slate-950 rounded-full border border-slate-850 flex items-center justify-center mx-auto">
            <Briefcase className="h-5 w-5 text-slate-500" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-white font-display">No resumes detected</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We need a completed resume profile to run the AI career diagnostic. Head over to the dashboard to seed or compile your first resume!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Historical Recommendations Sidebar */}
          <div className="lg:col-span-1 space-y-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-800 pb-2 mb-2">
              Previous Analyses
            </h3>

            {recommendations.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-6 leading-relaxed">
                No analyses completed yet. Click &apos;Analyze &amp; Recommend&apos; above to trigger your first career strategy report.
              </p>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {recommendations.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => {
                      setActiveReport(rec);
                      setActiveTab("roles");
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition relative group flex flex-col gap-1 ${
                      activeReport?.id === rec.id
                        ? "bg-indigo-600/15 border-indigo-500 text-white"
                        : "bg-slate-950/40 border-slate-850 hover:bg-slate-950 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <span className="font-bold truncate text-white max-w-[150px]">{rec.resumeTitle}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => handleDeleteReport(rec.id, e)}
                      className="absolute right-2 top-3 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition"
                      title="Delete Report"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Recommendation Report Container */}
          <div className="lg:col-span-3">
            {activeReport ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                {/* Report Header */}
                <div className="p-6 bg-slate-950/50 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                      Career Diagnostic Report
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight">{activeReport.resumeTitle}</h3>
                    <p className="text-[10px] text-slate-500">
                      Generated on {new Date(activeReport.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadText(activeReport)}
                    className="self-start sm:self-center bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Download className="h-4 w-4" /> Export Report
                  </button>
                </div>

                {/* Overall Executive Summary Block */}
                <div className="p-6 bg-gradient-to-r from-indigo-950/15 to-transparent border-b border-slate-850">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-indigo-400" /> Executive Match Summary
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {activeReport.overallFitSummary}
                  </p>
                </div>

                {/* Sub-tabs Selection */}
                <div className="flex border-b border-slate-850 bg-slate-950/20 p-1.5 gap-1 overflow-x-auto">
                  {(["roles", "companies", "countries", "strategy"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center gap-1.5 shrink-0 ${
                        activeTab === tab
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                      }`}
                    >
                      {tab === "roles" && <Briefcase className="h-4 w-4" />}
                      {tab === "companies" && <Building className="h-4 w-4" />}
                      {tab === "countries" && <Globe className="h-4 w-4" />}
                      {tab === "strategy" && <TrendingUp className="h-4 w-4" />}
                      <span className="capitalize">
                        {tab === "roles" && "Target Roles"}
                        {tab === "companies" && "Target Cohorts"}
                        {tab === "countries" && "Global Options (Top 10)"}
                        {tab === "strategy" && "Action Roadmap"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div className="p-6">
                  {activeTab === "roles" && (
                    <div className="space-y-6">
                      {activeReport.recommendedRoles.map((role, i) => (
                        <div key={i} className="bg-slate-950/30 border border-slate-850/80 rounded-xl p-5 hover:border-slate-700/60 transition group space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-850/40 pb-3">
                            <div className="space-y-1">
                              <h5 className="text-sm font-bold text-white group-hover:text-indigo-400 transition flex items-center gap-2">
                                {role.title}
                              </h5>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Expected Compensation: <span className="text-emerald-400 font-bold">{role.expectedSalaryRange}</span>
                              </p>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-900/60 px-2.5 py-1 rounded-lg">
                              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Fit Index:</span>
                              <span className="text-xs font-black text-indigo-300 font-mono">{role.fitScore}%</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed mt-3 border-l-2 border-slate-800 pl-3">
                            {role.rationale}
                          </p>

                          {role.skillsToAcquire && role.skillsToAcquire.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Recommended Upskilling</span>
                              <div className="flex flex-wrap gap-1.5">
                                {role.skillsToAcquire.map((skill, sIdx) => (
                                  <span key={sIdx} className="px-2 py-0.5 rounded-lg text-[9px] bg-slate-900 text-indigo-300 border border-slate-800/80 font-mono">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Top 5 Target Companies */}
                          {role.topCompanies && role.topCompanies.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Top 5 Target Employers (Real Values)</span>
                              <div className="flex flex-wrap gap-2">
                                {role.topCompanies.map((company, cIdx) => (
                                  <span key={cIdx} className="px-2.5 py-1 rounded-lg text-[10px] bg-indigo-950/30 text-indigo-300 border border-indigo-900/40 font-semibold shadow-sm">
                                    {company}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Standout Skill Upgrades */}
                          {role.skillsToUpgrade && role.skillsToUpgrade.length > 0 && (
                            <div className="pt-2 space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Recommended Skill Upgrades (To Stand Out)</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {role.skillsToUpgrade.map((item, suIdx) => (
                                  <div key={suIdx} className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-xl space-y-1 hover:border-slate-800 transition">
                                    <span className="text-xs font-bold text-indigo-300 block">{item.skillName}</span>
                                    <span className="text-[10px] text-slate-400 leading-relaxed block">{item.whyItStandsOut}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "countries" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-2">
                        <Globe className="h-5 w-5 text-indigo-400" />
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">Top 10 Global Job Markets & Relocation Options</h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(activeReport.recommendedCountries || []).map((c, i) => (
                          <div key={i} className="bg-slate-950/30 border border-slate-850/80 rounded-xl p-4 space-y-3 hover:border-slate-700/65 transition flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                                <h6 className="text-sm font-bold text-white flex items-center gap-2">
                                  <span className="text-xs font-mono text-slate-500">#{i + 1}</span>
                                  {c.country}
                                </h6>
                                <span className="text-[10px] bg-indigo-950/40 border border-indigo-900/60 text-indigo-300 font-bold px-2 py-0.5 rounded-lg">
                                  {c.averageSalaryLevel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {c.rationale}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-850/40">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Top Cities to Watch</span>
                              <div className="flex flex-wrap gap-1">
                                {c.topCities.map((city, cIdx) => (
                                  <span key={cIdx} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-slate-300 border border-slate-800 font-mono">
                                    {city}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "companies" && (
                    <div className="space-y-6">
                      {activeReport.recommendedCompanies.map((comp, i) => (
                        <div key={i} className="bg-slate-950/30 border border-slate-850/80 rounded-xl p-5 hover:border-slate-700/60 transition space-y-4">
                          <div className="border-b border-slate-850/60 pb-3">
                            <h5 className="text-sm font-bold text-white flex items-center gap-2">
                              <Building className="h-4 w-4 text-indigo-400" />
                              {comp.companyName}
                            </h5>
                            <p className="text-xs text-slate-400 leading-relaxed mt-2 pl-6">
                              {comp.fitRationale}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 bg-slate-900/40 p-3 rounded-lg border border-slate-850/40">
                              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block">Roles to Target</span>
                              <ul className="space-y-1">
                                {comp.positionsToWatch.map((pos, pIdx) => (
                                  <li key={pIdx} className="text-xs text-slate-300 flex items-center gap-1.5">
                                    <ChevronRight className="h-3 w-3 text-indigo-500" /> {pos}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1.5 bg-slate-900/40 p-3 rounded-lg border border-slate-850/40">
                              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block">Interview Playbook</span>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                {comp.interviewTips}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "strategy" && (
                    <div className="bg-slate-950/20 border border-slate-850/60 rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-2 border-b border-slate-850 pb-3">
                        <TrendingUp className="h-5 w-5 text-indigo-400" />
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">Milestones & Actionable Tactics</h5>
                      </div>
                      
                      <div className="space-y-3">
                        {activeReport.careerStrategy.map((step, sIdx) => (
                          <div key={sIdx} className="flex gap-3 items-start bg-slate-900/30 border border-slate-850/40 p-3.5 rounded-xl hover:bg-slate-900/50 transition">
                            <div className="h-5 w-5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-900/40 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {sIdx + 1}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs text-slate-300 leading-relaxed font-medium">{step}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
                <Compass className="h-8 w-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300 font-display">No report selected</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Select an analytical report from the history list on the left, or initiate a brand-new review on your resume profile.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
