import React from "react";

interface RahmoraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  lightTheme?: boolean;
  showSubtitle?: boolean;
}

export function RahmoraLogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer ambient glow ring */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-500 via-teal-400 to-emerald-400 opacity-70 blur-[2px] transition group-hover:opacity-100" />
      
      {/* Inner crest container */}
      <div className="relative w-full h-full rounded-xl bg-slate-950 border border-teal-500/30 p-2 flex items-center justify-center text-teal-400 shadow-xl shadow-teal-500/10">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(20,184,166,0.4)]"
        >
          {/* Executive Career Shield & Rising Trajectory */}
          <path
            d="M16 3L27 7V15C27 21.5 22 26.5 16 29C10 26.5 5 21.5 5 15V7L16 3Z"
            fill="url(#crest-grad)"
            fillOpacity="0.15"
            stroke="url(#crest-border)"
            strokeWidth="1.8"
          />
          {/* Executive 'R' and Ascending Career Arrow */}
          <path
            d="M11 9H16.5C18.4 9 20 10.3 20 12.2C20 14.1 18.4 15.5 16.5 15.5H11V9Z"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11 9V22"
            stroke="#818cf8"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M15 15.5L21.5 22"
            stroke="#2dd4bf"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Upward Growth Spark Star */}
          <path
            d="M22 8L22.8 10.2L25 11L22.8 11.8L22 14L21.2 11.8L19 11L21.2 10.2L22 8Z"
            fill="#38bdf8"
          />

          <defs>
            <linearGradient id="crest-grad" x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" />
              <stop offset="0.5" stopColor="#14b8a6" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="crest-border" x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818cf8" />
              <stop offset="1" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

export function RahmoraGlitterBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Outer Multi-color Radial Aura */}
      <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-teal-500/30 via-indigo-500/30 to-emerald-500/30 blur-2xl animate-pulse pointer-events-none" />
      
      {/* Floating Sparkles around badge */}
      <div className="absolute -top-3 -right-2 text-amber-300 text-base animate-sparkle-1 pointer-events-none drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]">
        ✦
      </div>
      <div className="absolute -bottom-2 -left-3 text-teal-300 text-sm animate-sparkle-2 pointer-events-none drop-shadow-[0_0_8px_rgba(45,212,191,0.9)]">
        ✧
      </div>
      <div className="absolute top-1/2 -right-5 text-indigo-300 text-xs animate-sparkle-3 pointer-events-none drop-shadow-[0_0_8px_rgba(129,140,248,0.9)]">
        ✦
      </div>

      {/* Main 3D Gem-Faceted Badge Body */}
      <div className="relative group p-1 rounded-3xl bg-gradient-to-b from-teal-400 via-indigo-500 to-emerald-600 shadow-[0_12px_28px_-4px_rgba(0,0,0,0.7),0_6px_0_0_#0f172a] transform transition-transform duration-300 hover:scale-105">
        <div className="relative px-6 py-4 rounded-[22px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-teal-400/40 animate-shimmer flex flex-col items-center gap-2">
          
          {/* Inner Badge Top Glow Bar */}
          <div className="absolute top-0 inset-x-6 h-[2px] bg-gradient-to-r from-transparent via-teal-300 to-transparent" />

          {/* Badge Icon Emblem */}
          <div className="relative flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-b from-teal-500 to-emerald-700 p-0.5 shadow-[0_4px_0_0_#064e3b,0_6px_12px_rgba(16,185,129,0.4)] flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center p-2">
                <svg viewBox="0 0 32 32" fill="none" className="w-full h-full drop-shadow-[0_2px_8px_rgba(45,212,191,0.8)]">
                  <path d="M16 3L27 7V15C27 21.5 22 26.5 16 29C10 26.5 5 21.5 5 15V7L16 3Z" fill="url(#glitter-crest)" fillOpacity="0.35" stroke="#2dd4bf" strokeWidth="2" />
                  <path d="M11 9H16.5C18.4 9 20 10.3 20 12.2C20 14.1 18.4 15.5 16.5 15.5H11V9Z" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11 9V22" stroke="#818cf8" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M15 15.5L21.5 22" stroke="#34d399" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M22 7L22.8 9.2L25 10L22.8 10.8L22 13L21.2 10.8L19 10L21.2 9.2L22 7Z" fill="#fbbf24" />
                  <defs>
                    <linearGradient id="glitter-crest" x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366f1" />
                      <stop offset="0.5" stopColor="#14b8a6" />
                      <stop offset="1" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Badge Title Typography */}
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black font-display tracking-wider bg-gradient-to-r from-white via-teal-100 to-emerald-200 bg-clip-text text-transparent">
                  RAHMORA PRO
                </span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_2px_0_0_#9a3412]">
                  OFFICIAL
                </span>
              </div>
              <p className="text-[10px] font-mono text-teal-300 font-semibold tracking-wide">
                CAREER INTELLIGENCE & RESUME ARCHITECT
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RahmoraLogo({
  className = "",
  size = "md",
  lightTheme = false,
  showSubtitle = false
}: RahmoraLogoProps) {
  if (size === "hero") {
    return (
      <div className={`flex flex-col items-center text-center group ${className}`}>
        {/* Standout Big Logo Emblem above words */}
        <div className="relative mb-6">
          <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-indigo-600 via-teal-500 to-emerald-400 opacity-30 blur-2xl animate-pulse" />
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-slate-950 border-2 border-teal-500/40 p-4 flex items-center justify-center text-teal-400 shadow-2xl shadow-teal-500/25 transform hover:scale-105 transition duration-300">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_6px_16px_rgba(20,184,166,0.6)]"
            >
              <path
                d="M16 3L27 7V15C27 21.5 22 26.5 16 29C10 26.5 5 21.5 5 15V7L16 3Z"
                fill="url(#hero-crest-grad)"
                fillOpacity="0.25"
                stroke="url(#hero-crest-border)"
                strokeWidth="2.2"
              />
              <path
                d="M11 9H16.5C18.4 9 20 10.3 20 12.2C20 14.1 18.4 15.5 16.5 15.5H11V9Z"
                stroke="#38bdf8"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 9V22"
                stroke="#818cf8"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <path
                d="M15 15.5L21.5 22"
                stroke="#2dd4bf"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M22 7L23 9.8L26 10.8L23 11.8L22 14.6L21 11.8L18 10.8L21 9.8L22 7Z"
                fill="#38bdf8"
              />
              <defs>
                <linearGradient id="hero-crest-grad" x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="0.5" stopColor="#14b8a6" />
                  <stop offset="1" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="hero-crest-border" x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#818cf8" />
                  <stop offset="1" stopColor="#2dd4bf" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight font-display text-white">
          RAHMORA
        </h1>
        <div className="flex items-center justify-center gap-3 mt-2.5">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-teal-500/60" />
          <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-teal-300 uppercase font-mono">
            Career Intelligence Platform
          </span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-teal-500/60" />
        </div>
      </div>
    );
  }

  const sizeClasses = {
    sm: { icon: "h-6 w-6", text: "text-base" },
    md: { icon: "h-8 w-8", text: "text-lg" },
    lg: { icon: "h-10 w-10", text: "text-xl" },
    xl: { icon: "h-12 w-12", text: "text-2xl" }
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <RahmoraLogoIcon className={sizeClasses.icon} />
      <div>
        <span className={`font-extrabold tracking-tight font-display ${sizeClasses.text} ${lightTheme ? "text-slate-900" : "text-white"}`}>
          RAHMORA
        </span>
        {showSubtitle && (
          <span className="text-[10px] text-teal-400/90 block font-mono font-medium -mt-1 tracking-wider uppercase">
            Career Suite
          </span>
        )}
      </div>
    </div>
  );
}
