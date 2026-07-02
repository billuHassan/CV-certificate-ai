import React, { useState } from "react";
import { Sparkles, FileText, TrendingUp, Award, ChevronRight, Zap } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      title: "Design a High-Impact Resume in Minutes",
      subtitle: "Welcome to CVCraft AI",
      description: "Harness modern templates combined with industry-specific structures designed by professional recruitment specialists.",
      icon: (
        <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-slate-800/80 border border-slate-700 text-indigo-400 shadow-xl">
          <FileText className="h-16 w-16" />
          <Zap className="absolute top-2 right-2 h-6 w-6 text-amber-400 animate-bounce" />
        </div>
      ),
      accent: "text-indigo-400 bg-indigo-950/40 border-indigo-800/60",
    },
    {
      title: "Optimized for Applicant Tracking Systems",
      subtitle: "Smart ATS Matching",
      description: "Our proprietary scoring analyzer evaluates keyword density, formatting structures, and grammar triggers to assure you bypass filters.",
      icon: (
        <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-slate-800/80 border border-slate-700 text-emerald-400 shadow-xl">
          <TrendingUp className="h-16 w-16" />
          <Award className="absolute top-2 right-2 h-6 w-6 text-amber-400" />
        </div>
      ),
      accent: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
    },
    {
      title: "AI Writing Powered by Google Gemini",
      subtitle: "Full-Stack AI Assistance",
      description: "Instantly re-write weak descriptors, polish summaries, generate targeted achievements, and draft customized cover letters.",
      icon: (
        <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-slate-800/80 border border-slate-700 text-amber-400 shadow-xl">
          <Sparkles className="h-16 w-16 animate-pulse" />
        </div>
      ),
      accent: "text-amber-400 bg-amber-950/40 border-amber-800/60",
    },
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const current = pages[currentPage];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          <span className="font-bold tracking-tight text-white font-display">CVCraft AI</span>
        </div>
        {currentPage < pages.length - 1 && (
          <button
            onClick={onComplete}
            className="text-xs font-mono text-slate-400 hover:text-white transition uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
          >
            Skip
          </button>
        )}
      </div>

      {/* Content Center */}
      <div className="flex flex-col items-center text-center max-w-lg mx-auto my-auto py-12 z-10">
        <div className="mb-8">
          {current.icon}
        </div>

        <span className={`inline-block text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${current.accent} mb-4`}>
          {current.subtitle}
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-display mb-4">
          {current.title}
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          {current.description}
        </p>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col gap-6 z-10 max-w-md mx-auto w-full">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentPage ? "w-8 bg-indigo-500" : "w-2 bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/10 hover:shadow-indigo-600/20 transition duration-200 flex items-center justify-center gap-2 group"
        >
          {currentPage === pages.length - 1 ? (
            "Get Started"
          ) : (
            <>
              Next Step <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
