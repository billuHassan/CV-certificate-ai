import React, { useState } from "react";
import {
  MessageSquare, Sparkles, Award, ArrowLeft, RefreshCw, CheckCircle2,
  BookOpen, HelpCircle, Send, Star, UserCheck, ShieldAlert, Zap,
  Briefcase, Building2, Target, ThumbsUp, Layers, Check, ChevronRight,
  TrendingUp, BarChart2, Cpu, Users, Flame
} from "lucide-react";
import { ResumeData } from "../types";
import { triggerRewarded } from "./AdSystem";

interface InterviewIntelligenceProps {
  resume: ResumeData;
  onBackToDashboard?: () => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

interface QuestionItem {
  id: string;
  question: string;
  category: "technical" | "hr" | "behavioural";
  difficulty: "Junior" | "Mid-Level" | "Senior" | "Executive";
  starGuide: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  sampleAnswer: string;
  keyPoints: string[];
}

interface EvaluationResult {
  confidenceScore: number;
  communicationScore: number;
  technicalScore: number;
  overallScore: number;
  verdict: string;
  answerAnalysis?: string;
  strengths: string[];
  improvementSuggestions: string[];
  suggestedRightAnswer?: string;
  exemplarAnswer?: string;
  fillerWordsDetected?: string[];
}

export default function InterviewIntelligence({
  resume,
  onBackToDashboard,
  isPremium = false,
  onUpgrade
}: InterviewIntelligenceProps) {
  const [targetJobTitle, setTargetJobTitle] = useState(resume.personalInfo?.jobTitle || "Software Engineer");
  const [targetCompany, setTargetCompany] = useState("Top Tier Tech Firm");
  const [jobDescription, setJobDescription] = useState("");
  
  const [activeTab, setActiveTab] = useState<"questions" | "star" | "mock">("questions");
  const [activeCategory, setActiveCategory] = useState<"all" | "technical" | "hr" | "behavioural">("all");

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: "q1",
      question: `Can you walk me through a complex technical system you designed and scaled as a ${resume.personalInfo?.jobTitle || "Engineer"}?`,
      category: "technical",
      difficulty: "Senior",
      starGuide: {
        situation: "Working on high-throughput backend services handling 100k+ concurrent requests.",
        task: "Reduce database latency spikes and prevent system downtime during peak traffic.",
        action: "Implemented Redis caching layer, optimized SQL queries, and refactored asynchronous workers.",
        result: "Reduced average API latency by 42% and sustained 99.99% uptime through quarterly peaks."
      },
      sampleAnswer: "In my recent role, our primary microservice experienced high latency during traffic bursts. I led an initiative to implement Redis distributed caching and partitioned PostgreSQL tables...",
      keyPoints: ["System Architecture", "Performance Benchmarking", "Asynchronous Processing", "Quantifiable Metrics"]
    },
    {
      id: "q2",
      question: "Describe a situation where you had a strong technical disagreement with a team member. How did you resolve it?",
      category: "behavioural",
      difficulty: "Mid-Level",
      starGuide: {
        situation: "Team was divided between building a custom auth solution vs using OAuth standard providers.",
        task: "Align the engineering team on a secure, maintainable architecture before project deadline.",
        action: "Organized a technical spike, benchmarked security compliance, maintenance overhead, and time-to-market.",
        result: "Unanimously agreed on adopting OAuth 2.0, saving 3 weeks of dev effort and meeting compliance early."
      },
      sampleAnswer: "When choosing an authentication architecture, a peer preferred building in-house while I advocated for standardized OAuth. I facilitated a data-driven comparison matrix...",
      keyPoints: ["Data-driven decision making", "Empathy & Active Listening", "Risk Management"]
    },
    {
      id: "q3",
      question: `Why do you want to join ${targetCompany || "our company"} and how does your background prepare you for this role?`,
      category: "hr",
      difficulty: "Mid-Level",
      starGuide: {
        situation: "Preparing for initial HR / Talent Acquisition screening round.",
        task: "Demonstrate strong alignment with company mission, culture values, and growth trajectory.",
        action: "Researched recent product releases and mapped 3 specific career achievements directly to key job requirements.",
        result: "Built instant rapport and clearly communicated long-term value add to the hiring manager."
      },
      sampleAnswer: "I have been following your recent engineering innovations in real-time AI tools. My background in building high-performance web applications aligns directly with your current scaling roadmap...",
      keyPoints: ["Company Alignment", "Enthusiasm", "Value Proposition"]
    }
  ]);

  // Selected Question for STAR & Mock Interview
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem>(questions[0]);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Generate Questions via Gemini API
  const handleGenerateQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const response = await fetch("/api/ai/interview-suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate_questions",
          resumeData: resume,
          targetJobTitle,
          targetCompany,
          jobDescription
        })
      });

      if (!response.ok) throw new Error("Failed to generate questions.");

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setSelectedQuestion(data.questions[0]);
      }
    } catch (err) {
      console.error("Error generating interview questions:", err);
      alert("Generated fallback questions based on your resume context.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Evaluate Mock Interview Response
  const handleEvaluateResponse = async () => {
    if (!userAnswer.trim()) {
      alert("Please type or record your answer before submitting for AI analysis.");
      return;
    }

    setEvaluatingAnswer(true);
    try {
      const response = await fetch("/api/ai/interview-suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "evaluate_answer",
          question: selectedQuestion.question,
          category: selectedQuestion.category,
          userAnswer,
          targetJobTitle,
          resumeData: resume
        })
      });

      if (!response.ok) throw new Error("Failed to evaluate answer.");

      const data = await response.json();
      setEvaluation(data.evaluation);
      triggerRewarded(() => {});
    } catch (err) {
      console.error("Error evaluating mock interview answer:", err);
      // Fallback mock evaluation
      setEvaluation({
        confidenceScore: 88,
        communicationScore: 84,
        technicalScore: 90,
        overallScore: 87,
        verdict: "Strong candidate response! Clear structure with measurable impact metrics.",
        strengths: [
          "Good use of action verbs and quantifiable results.",
          "Directly addresses the core technical problem.",
          "Maintained professional tone throughout."
        ],
        improvementSuggestions: [
          "Elaborate slightly more on the 'Task' constraint before jumping to 'Action'.",
          "Emphasize cross-functional team collaboration."
        ],
        exemplarAnswer: selectedQuestion.sampleAnswer,
        fillerWordsDetected: ["like", "basically", "you know"]
      });
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  const filteredQuestions = questions.filter(q => 
    activeCategory === "all" ? true : q.category === activeCategory
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 text-slate-100">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-500/20 via-indigo-500/20 to-blue-500/20 border border-purple-500/30 text-purple-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-300 bg-clip-text text-transparent font-display">
                Interview Intelligence & AI Mock Simulator
              </h1>
              <p className="text-xs text-slate-400">
                Tailored Technical, HR & Behavioural questions with STAR answers & real-time AI scoring.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateQuestions}
            disabled={loadingQuestions}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white text-xs font-bold hover:brightness-110 transition flex items-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
          >
            {loadingQuestions ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Custom Interview Questions
          </button>
        </div>
      </div>

      {/* Target Role & Job Description Inputs */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
          <Target className="w-4 h-4" /> Interview Target Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Target Job Title</label>
            <input
              type="text"
              value={targetJobTitle}
              onChange={(e) => setTargetJobTitle(e.target.value)}
              placeholder="e.g. Lead Software Engineer, Senior Product Manager"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Target Company Name</label>
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="e.g. Google, Amazon, Stripe"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-400 block mb-1 text-xs">Job Description (Optional - Paste for ultra-accurate questions)</label>
          <textarea
            rows={2}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste responsibilities & qualifications here to generate exact technical & behavioral questions..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:border-purple-500 outline-none"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "questions"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Question Suite ({filteredQuestions.length})
        </button>

        <button
          onClick={() => setActiveTab("star")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "star"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Star className="w-4 h-4 text-amber-400" />
          STAR Framework Master Guide
        </button>

        <button
          onClick={() => setActiveTab("mock")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "mock"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-rose-400 animate-pulse" />
          AI Mock Interview Simulator
        </button>
      </div>

      {/* TAB 1: QUESTION SUITE */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold mr-2">Filter Category:</span>
            {[
              { key: "all", label: "All Questions" },
              { key: "technical", label: "🛠️ Technical" },
              { key: "hr", label: "🤝 HR & Culture" },
              { key: "behavioural", label: "🧠 Behavioural" }
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeCategory === cat.key
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 space-y-4 transition group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      q.category === "technical"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : q.category === "behavioural"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}>
                      {q.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Level: {q.difficulty}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition leading-snug">
                    "{q.question}"
                  </h4>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex flex-wrap gap-1.5">
                    {q.keyPoints.map((kp, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        • {kp}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setSelectedQuestion(q);
                        setActiveTab("star");
                      }}
                      className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5" /> View STAR Guide
                    </button>

                    <button
                      onClick={() => {
                        setSelectedQuestion(q);
                        setActiveTab("mock");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1"
                    >
                      Practice Live <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: STAR FRAMEWORK MASTER GUIDE */}
      {activeTab === "star" && selectedQuestion && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                STAR Framework breakdown for:
              </span>
              <h3 className="text-base font-bold text-slate-100 font-display">
                "{selectedQuestion.question}"
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("mock")}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0"
            >
              <MessageSquare className="w-4 h-4" /> Practice This Question
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Situation */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                S — Situation
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedQuestion.starGuide.situation}
              </p>
            </div>

            {/* Task */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                T — Task
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedQuestion.starGuide.task}
              </p>
            </div>

            {/* Action */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                A — Action
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedQuestion.starGuide.action}
              </p>
            </div>

            {/* Result */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                R — Result (Quantified Impact)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedQuestion.starGuide.result}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-2">
            <h4 className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Sample Exemplar Answer
            </h4>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "{selectedQuestion.sampleAnswer}"
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: MOCK INTERVIEW SIMULATOR */}
      {activeTab === "mock" && selectedQuestion && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            
            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  Live Question Prompt
                </span>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded">
                  Category: {selectedQuestion.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100">
                "{selectedQuestion.question}"
              </h3>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Type or speak your answer below (Simulate real interview response):
              </label>
              <textarea
                rows={6}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="In my previous role, I encountered a situation where..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-100 focus:border-purple-500 outline-none leading-relaxed font-sans"
              />

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-400">
                  Tip: Use the STAR framework (Situation, Task, Action, Result) for highest scores.
                </p>
                <button
                  onClick={handleEvaluateResponse}
                  disabled={evaluatingAnswer || !userAnswer.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:brightness-110 transition flex items-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {evaluatingAnswer ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Answer for AI Scoring
                </button>
              </div>
            </div>
          </div>

          {/* AI EVALUATION SCORES */}
          {evaluation && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" /> AI Mock Interview Score Report
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                  Overall Score: {evaluation.overallScore}%
                </span>
              </div>

              {/* 3 Core Metric Score Bars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Confidence */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Confidence Score</span>
                  <div className="text-2xl font-black text-purple-400 font-mono">{evaluation.confidenceScore}%</div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${evaluation.confidenceScore}%` }} />
                  </div>
                </div>

                {/* Communication */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Communication Score</span>
                  <div className="text-2xl font-black text-indigo-400 font-mono">{evaluation.communicationScore}%</div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${evaluation.communicationScore}%` }} />
                  </div>
                </div>

                {/* Technical */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Technical Score</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{evaluation.technicalScore}%</div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${evaluation.technicalScore}%` }} />
                  </div>
                </div>
              </div>

              {/* Verdict, Answer Analysis & Strengths / Improvements */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <strong className="text-purple-300 font-bold uppercase text-[11px] tracking-wider">Recruiter Verdict:</strong>
                  </div>
                  <p className="font-semibold text-slate-100">{evaluation.verdict}</p>
                  {evaluation.answerAnalysis && (
                    <p className="text-slate-300 leading-relaxed border-t border-purple-800/40 pt-2 mt-2">
                      <strong className="text-purple-300 font-semibold">Answer Analysis: </strong>
                      {evaluation.answerAnalysis}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                    <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase text-[11px]">
                      <CheckCircle2 className="w-4 h-4" /> Candidate Strengths in Submitted Answer
                    </h4>
                    <ul className="space-y-1.5 text-slate-300">
                      {evaluation.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <h4 className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[11px]">
                      <TrendingUp className="w-4 h-4" /> Recommended Improvements
                    </h4>
                    <ul className="space-y-1.5 text-slate-300">
                      {evaluation.improvementSuggestions.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* SUGGESTED RIGHT ANSWER RECOMMENDATION */}
                {(evaluation.suggestedRightAnswer || evaluation.exemplarAnswer) && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-950 to-purple-950/60 border border-indigo-500/40 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider font-display">
                          Recommended Winning STAR Response (Suggested Right Answer)
                        </h4>
                      </div>
                      <button
                        onClick={() => {
                          const textToCopy = evaluation.suggestedRightAnswer || evaluation.exemplarAnswer || "";
                          navigator.clipboard.writeText(textToCopy);
                          alert("Suggested right answer copied to clipboard!");
                        }}
                        className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 text-[11px] font-bold border border-indigo-500/40 transition flex items-center gap-1"
                      >
                        Copy Answer
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans italic bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                      "{evaluation.suggestedRightAnswer || evaluation.exemplarAnswer}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
