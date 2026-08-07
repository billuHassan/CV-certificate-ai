import React from "react";

interface RahmoraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  lightTheme?: boolean;
}

export function RahmoraLogoIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Career badge glow container */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-teal-500 to-emerald-400 opacity-80 blur-[2px]" />
      <div className="relative w-full h-full rounded-xl bg-slate-950 border border-slate-700/80 p-1.5 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full text-teal-400"
        >
          {/* Executive Career Briefcase & Rising Growth Arrow */}
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" className="text-indigo-400" opacity="0.6" />
          <rect x="2" y="7" width="20" height="14" rx="3" className="stroke-indigo-300" />
          <path d="M6 15l4-4 3 3 5-5" className="stroke-teal-300" strokeWidth="2.5" />
          <path d="M15 6h3v3" className="stroke-teal-300" strokeWidth="2.5" />
        </svg>
      </div>
    </div>
  );
}

export default function RahmoraLogo({ className = "", size = "md", lightTheme = false }: RahmoraLogoProps) {
  const sizeClasses = {
    sm: { icon: "h-6 w-6", text: "text-base" },
    md: { icon: "h-8 w-8", text: "text-lg" },
    lg: { icon: "h-10 w-10", text: "text-xl" },
    xl: { icon: "h-12 w-12", text: "text-2xl" }
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <RahmoraLogoIcon className={sizeClasses.icon} />
      <span className={`font-extrabold tracking-tight font-display ${sizeClasses.text} ${lightTheme ? "text-slate-900" : "text-white"}`}>
        RAHMORA
      </span>
    </div>
  );
}
