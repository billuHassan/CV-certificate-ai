import React, { useState } from "react";
import {
  Sparkles,
  Layout,
  Sliders,
  Check,
  Search,
  CheckCircle2,
  Columns,
  Square,
  Compass,
  Briefcase,
  Terminal,
  Palette,
  ChevronDown,
} from "lucide-react";

export interface TemplateDefinition {
  id: string;
  name: string;
  desc: string;
  category: "modern" | "minimal" | "executive" | "creative" | "tech";
  layoutType: "single" | "split" | "banner" | "editorial";
  isPremium?: boolean;
  accentColorPreview?: string;
  atsScore?: number; // 1-100 ATS friendly rating
  badge?: string;
}

export const PREDEFINED_TEMPLATES: TemplateDefinition[] = [
  // --- MODERN ---
  {
    id: "modern",
    name: "Modern Contemporary Pro",
    desc: "Sleek top-tier layout with contemporary typography, pill contact badges, and clean visual section dividers.",
    category: "modern",
    layoutType: "single",
    accentColorPreview: "#4f46e5",
    atsScore: 98,
    badge: "Most Popular",
  },
  {
    id: "canva_modern_emerald",
    name: "Canva Modern Emerald Pro",
    desc: "Deep emerald forest banner with rounded skill chips and high-contrast experience blocks.",
    category: "modern",
    layoutType: "banner",
    accentColorPreview: "#059669",
    atsScore: 95,
  },
  {
    id: "canva_tech_horizon",
    name: "Horizon Gradient Modern",
    desc: "Indigo-to-cyan horizon header with clean card divisions and developer skill badges.",
    category: "modern",
    layoutType: "banner",
    accentColorPreview: "#0284c7",
    atsScore: 94,
  },
  {
    id: "canva_nordic_clean",
    name: "Nordic Clean Frost",
    desc: "Cool slate and ice-blue minimal lines inspired by Scandinavian design architecture.",
    category: "modern",
    layoutType: "single",
    accentColorPreview: "#38bdf8",
    atsScore: 96,
  },

  // --- MINIMAL ---
  {
    id: "minimal",
    name: "Minimalist ATS Pro",
    desc: "Clean chronological layout engineered for 100% ATS parser compatibility and fast hiring-manager scannability.",
    category: "minimal",
    layoutType: "single",
    accentColorPreview: "#334155",
    atsScore: 100,
    badge: "100% ATS Ready",
  },
  {
    id: "canva_minimal_slate",
    name: "Canva Minimal Slate",
    desc: "Ultra-compact single-column resume with left accent border and high-density information layout.",
    category: "minimal",
    layoutType: "single",
    accentColorPreview: "#475569",
    atsScore: 97,
  },
  {
    id: "tokyo",
    name: "Tokyo Zen Minimalist",
    desc: "Balanced Japanese aesthetic with delicate line dividers and calm, structured spacing.",
    category: "minimal",
    layoutType: "single",
    accentColorPreview: "#e11d48",
    atsScore: 96,
  },
  {
    id: "oslo",
    name: "Oslo Architectural Minimal",
    desc: "Geometric sans typography, soft muted accents, and crisp architectural margins.",
    category: "minimal",
    layoutType: "single",
    accentColorPreview: "#15803d",
    atsScore: 95,
  },

  // --- EXECUTIVE ---
  {
    id: "executive",
    name: "Executive Split Slate",
    desc: "Authoritative split-pane layout highlighting core competencies and credentials in a charcoal side rail.",
    category: "executive",
    layoutType: "split",
    accentColorPreview: "#1e293b",
    atsScore: 92,
    badge: "C-Level Classic",
  },
  {
    id: "canva_executive_navy",
    name: "Canva Navy Executive Column",
    desc: "Midnight navy sidebar paired with champagne gold section markers and executive hierarchy.",
    category: "executive",
    layoutType: "split",
    accentColorPreview: "#1e3a8a",
    atsScore: 93,
  },
  {
    id: "canva_corporate_gold",
    name: "Canva Corporate Prestige",
    desc: "Financial & advisory template with double-ruled borders and regal warm paper tone.",
    category: "executive",
    layoutType: "editorial",
    accentColorPreview: "#b45309",
    atsScore: 90,
    isPremium: true,
  },
  {
    id: "chicago",
    name: "Chicago Legal & Advisory",
    desc: "Formal double-divided margins tailored for attorneys, executives, partners, and medical professionals.",
    category: "executive",
    layoutType: "single",
    accentColorPreview: "#0f172a",
    atsScore: 95,
  },
  {
    id: "toronto",
    name: "Toronto Corporate Navy",
    desc: "Commanding solid navy header banner showcasing corporate stability and leadership presence.",
    category: "executive",
    layoutType: "banner",
    accentColorPreview: "#1e3a8a",
    atsScore: 94,
  },

  // --- CREATIVE ---
  {
    id: "canva_creative_sage",
    name: "Canva Sage Editorial",
    desc: "Calm eucalyptus and sage tones paired with refined serif title typography for design & creative leaders.",
    category: "creative",
    layoutType: "editorial",
    accentColorPreview: "#047857",
    atsScore: 91,
  },
  {
    id: "elegant",
    name: "Warm Editorial Cream",
    desc: "Parchment warm background, editorial serif typography, and balanced white space.",
    category: "creative",
    layoutType: "editorial",
    accentColorPreview: "#854d0e",
    atsScore: 90,
  },
  {
    id: "sydney",
    name: "Sydney Startup Dynamic",
    desc: "Energetic purple-indigo gradient banner with startup-ready achievement callouts.",
    category: "creative",
    layoutType: "banner",
    accentColorPreview: "#7c3aed",
    atsScore: 92,
  },
  {
    id: "milano",
    name: "Milano Fashion & Luxury",
    desc: "High-fashion aesthetic with wide letter tracking and centered editorial section dividers.",
    category: "creative",
    layoutType: "editorial",
    accentColorPreview: "#18181b",
    atsScore: 89,
    isPremium: true,
  },
  {
    id: "austin",
    name: "Austin Terracotta Indie",
    desc: "Terracotta warm clay header with expressive labels for product designers and agency leads.",
    category: "creative",
    layoutType: "banner",
    accentColorPreview: "#c2410c",
    atsScore: 91,
  },

  // --- TECH ---
  {
    id: "silicon",
    name: "Silicon Valley Developer",
    desc: "Tech-forward format with monospace tags, GitHub highlights, and engineer-optimized bullet points.",
    category: "tech",
    layoutType: "single",
    accentColorPreview: "#2563eb",
    atsScore: 98,
    badge: "Engineer Favorite",
  },
  {
    id: "teal_grid",
    name: "Teal Matrix Columnar",
    desc: "Dual columns presenting complex technical stacks and engineering deliverables cleanly.",
    category: "tech",
    layoutType: "split",
    accentColorPreview: "#0d9488",
    atsScore: 93,
  },
  {
    id: "cyber",
    name: "Cyberpunk Terminal",
    desc: "Radical green-on-black terminal theme built for DevOps, Linux sysadmins, and cybersecurity pros.",
    category: "tech",
    layoutType: "single",
    accentColorPreview: "#10b981",
    atsScore: 80,
    isPremium: true,
  },
  {
    id: "berlin",
    name: "Berlin Neo-Brutalist",
    desc: "High-contrast bold borders, hard offset shadows, and distinctive punchy geometry.",
    category: "tech",
    layoutType: "single",
    accentColorPreview: "#000000",
    atsScore: 88,
    isPremium: true,
  },
  {
    id: "swiss",
    name: "Swiss Bauhaus Avant-Garde",
    desc: "Bauhaus grid layout with bold red accent spine and asymmetrical visual hierarchy.",
    category: "tech",
    layoutType: "single",
    accentColorPreview: "#dc2626",
    atsScore: 89,
    isPremium: true,
  },
];

export interface TemplateSelectorProps {
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  selectedColorTheme?: string;
  onSelectColorTheme?: (color: string) => void;
  variant?: "quick-bar" | "full" | "compact";
  isPremium?: boolean;
  className?: string;
}

export default function TemplateSelector({
  selectedTemplateId,
  onSelectTemplate,
  selectedColorTheme,
  onSelectColorTheme,
  variant = "quick-bar",
  isPremium = false,
  className = "",
}: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | "modern" | "minimal" | "executive" | "creative" | "tech">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Core predefined flagship themes for instant 1-click toggle
  const flagshipThemes: { id: string; label: string; icon: string; category: string }[] = [
    { id: "modern", label: "Modern", icon: "✨", category: "modern" },
    { id: "minimal", label: "Minimal", icon: "📄", category: "minimal" },
    { id: "executive", label: "Executive", icon: "👔", category: "executive" },
    { id: "creative", label: "Creative", icon: "🎨", category: "creative" },
    { id: "tech", label: "Tech", icon: "💻", category: "tech" },
  ];

  const currentTemplate = PREDEFINED_TEMPLATES.find((t) => t.id === selectedTemplateId) || {
    id: selectedTemplateId,
    name: selectedTemplateId.replace(/_/g, " ").toUpperCase(),
    desc: "Active resume template",
    category: "modern" as const,
    layoutType: "single" as const,
    atsScore: 95,
  };

  const filteredTemplates = PREDEFINED_TEMPLATES.filter((tpl) => {
    const matchesCategory = activeCategory === "all" || tpl.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Miniature layout thumbnail renderer
  const renderLayoutThumbnail = (layoutType: "single" | "split" | "banner" | "editorial", color = "#4f46e5") => {
    if (layoutType === "split") {
      return (
        <div className="w-10 h-13 rounded bg-white border border-slate-200 overflow-hidden flex shadow-xs shrink-0">
          <div className="w-3.5 h-full bg-slate-800 p-0.5 flex flex-col gap-0.5">
            <div className="w-2 h-2 rounded-full bg-slate-600 mb-0.5" />
            <div className="w-full h-0.5 bg-slate-500 rounded" />
            <div className="w-full h-0.5 bg-slate-600 rounded" />
            <div className="w-2 h-0.5 bg-slate-600 rounded" />
          </div>
          <div className="flex-1 p-1 flex flex-col gap-1">
            <div className="w-4 h-1 rounded" style={{ backgroundColor: color }} />
            <div className="w-full h-0.5 bg-slate-200 rounded" />
            <div className="w-5 h-0.5 bg-slate-200 rounded" />
            <div className="w-full h-0.5 bg-slate-200 rounded mt-0.5" />
            <div className="w-3 h-0.5 bg-slate-200 rounded" />
          </div>
        </div>
      );
    }

    if (layoutType === "banner") {
      return (
        <div className="w-10 h-13 rounded bg-white border border-slate-200 overflow-hidden flex flex-col shadow-xs shrink-0">
          <div className="w-full h-3.5 p-0.5 flex items-center justify-between" style={{ backgroundColor: color }}>
            <div className="w-3 h-1 bg-white/90 rounded" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
          </div>
          <div className="flex-1 p-1 flex flex-col gap-1">
            <div className="w-full h-0.5 bg-slate-200 rounded" />
            <div className="w-4 h-0.5 bg-slate-200 rounded" />
            <div className="w-full h-0.5 bg-slate-200 rounded mt-0.5" />
            <div className="w-5 h-0.5 bg-slate-200 rounded" />
          </div>
        </div>
      );
    }

    if (layoutType === "editorial") {
      return (
        <div className="w-10 h-13 rounded bg-[#fffdfa] border border-amber-900/20 overflow-hidden flex flex-col p-1 gap-1 shadow-xs shrink-0">
          <div className="w-full flex justify-center pb-0.5 border-b border-amber-900/20">
            <div className="w-5 h-1 rounded" style={{ backgroundColor: color }} />
          </div>
          <div className="w-full h-0.5 bg-stone-300 rounded" />
          <div className="w-4 h-0.5 bg-stone-300 rounded" />
          <div className="w-full h-0.5 bg-stone-300 rounded" />
          <div className="w-3 h-0.5 bg-stone-300 rounded" />
        </div>
      );
    }

    // Default single column
    return (
      <div className="w-10 h-13 rounded bg-white border border-slate-200 overflow-hidden flex flex-col p-1 gap-1 shadow-xs shrink-0">
        <div className="w-5 h-1 rounded" style={{ backgroundColor: color }} />
        <div className="w-full h-0.5 bg-slate-200 rounded" />
        <div className="w-4 h-0.5 bg-slate-200 rounded" />
        <div className="w-full h-[1px] bg-slate-100 my-0.5" />
        <div className="w-full h-0.5 bg-slate-200 rounded" />
        <div className="w-3 h-0.5 bg-slate-200 rounded" />
      </div>
    );
  };

  // --- 1. QUICK-BAR VARIANT (Sits directly above the live editor preview or workspace) ---
  if (variant === "quick-bar") {
    return (
      <div className={`w-full bg-slate-900/95 border border-slate-800 rounded-xl p-2.5 shadow-md ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Label & Active Name */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 shrink-0">
              <Layout className="h-3.5 w-3.5 text-indigo-400" />
              <span>Theme:</span>
            </span>

            {/* Current Active Indicator Pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="truncate max-w-[130px] sm:max-w-none">{currentTemplate.name}</span>
            </span>
          </div>

          {/* Quick Predefined Layout Toggle Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
            {flagshipThemes.map((item) => {
              const isActive =
                selectedTemplateId === item.id ||
                currentTemplate.category === item.category;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTemplate(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30 scale-102"
                      : "bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50"
                  }`}
                  title={`Switch layout to ${item.label} theme`}
                >
                  <span className="text-xs">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Dropdown Toggle for More Templates */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-all border shrink-0 cursor-pointer ${
                  isDropdownOpen
                    ? "bg-indigo-900/60 border-indigo-500 text-indigo-200"
                    : "bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300"
                }`}
                title="Browse all 20+ layout templates"
              >
                <span>20+ More</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Flyout template dropdown */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                  style={{ maxHeight: "420px" }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Predefined Layout Gallery
                    </span>
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                    >
                      Close
                    </button>
                  </div>

                  {/* Category filter pills inside dropdown */}
                  <div className="flex gap-1 overflow-x-auto pb-2 mb-2 no-scrollbar border-b border-slate-800/60">
                    {(["all", "modern", "minimal", "executive", "creative", "tech"] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium transition shrink-0 ${
                          activeCategory === cat
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable list */}
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {filteredTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          onSelectTemplate(tpl.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg border transition flex items-center gap-2.5 cursor-pointer ${
                          selectedTemplateId === tpl.id
                            ? "bg-indigo-600/20 border-indigo-500 text-white"
                            : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800 text-slate-300"
                        }`}
                      >
                        {renderLayoutThumbnail(tpl.layoutType, tpl.accentColorPreview)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate text-white">{tpl.name}</span>
                            {tpl.atsScore && (
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1 rounded ml-1 shrink-0">
                                {tpl.atsScore}% ATS
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{tpl.desc}</p>
                        </div>
                        {selectedTemplateId === tpl.id && (
                          <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. FULL DESIGN TAB VARIANT (For the left panel / dedicated design manager) ---
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Pills Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-indigo-400" /> Select Layout Theme
          </h4>
          <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-900/60">
            Live Preview Updated
          </span>
        </div>

        {/* Quick Category Buttons: Modern, Minimal, Executive, etc. */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {(
            [
              { id: "all", label: "All", icon: "✨" },
              { id: "modern", label: "Modern", icon: "🚀" },
              { id: "minimal", label: "Minimal", icon: "📄" },
              { id: "executive", label: "Executive", icon: "👔" },
              { id: "creative", label: "Creative", icon: "🎨" },
              { id: "tech", label: "Tech", icon: "💻" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                // If clicking modern, minimal, or executive directly, switch to flagship
                if (cat.id !== "all") {
                  onSelectTemplate(cat.id);
                }
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition text-center flex items-center justify-center gap-1 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <span className="text-xs">{cat.icon}</span>
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search templates (e.g., modern, minimal, executive)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Grid of Templates with Miniature Layout Blueprint Thumbnails */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredTemplates.map((tpl) => {
          const isSelected = selectedTemplateId === tpl.id;

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate(tpl.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden group flex items-start gap-3 cursor-pointer ${
                isSelected
                  ? "bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                  : "bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700"
              }`}
            >
              {/* Layout Blueprint Graphic */}
              {renderLayoutThumbnail(tpl.layoutType, tpl.accentColorPreview)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-xs font-bold transition truncate ${
                        isSelected ? "text-indigo-400" : "text-white group-hover:text-indigo-300"
                      }`}
                    >
                      {tpl.name}
                    </span>
                    {tpl.badge && (
                      <span className="text-[9px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-1.5 py-0.2 rounded shrink-0">
                        {tpl.badge}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="text-[9px] font-mono tracking-widest text-indigo-400 bg-indigo-950 border border-indigo-800 px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {tpl.desc}
                </p>

                {/* Metadata Pills */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-mono text-slate-500 capitalize bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                    {tpl.layoutType} layout
                  </span>
                  {tpl.atsScore && (
                    <span className="text-[9px] font-mono text-emerald-400/90 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30">
                      ATS: {tpl.atsScore}%
                    </span>
                  )}
                  {tpl.category && (
                    <span className="text-[9px] font-mono text-indigo-400/80 capitalize">
                      #{tpl.category}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs">
            No templates matching "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
}
