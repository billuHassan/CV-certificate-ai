import React from "react";
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Sparkles } from "lucide-react";
import { ResumeData } from "../types";

interface ResumeTemplatesProps {
  data: ResumeData;
  scale?: number;
}

export default function ResumeTemplates({ data, scale = 1 }: ResumeTemplatesProps) {
  const {
    personalInfo = {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      profilePhoto: "",
    },
    summary = "",
    experience = [],
    education = [],
    projects = [],
    skills = [],
    languages = [],
    certifications = [],
    references = [],
    sectionsOrder = ["summary", "experience", "education", "projects", "skills", "languages", "certifications", "references"],
    templateId = "minimal",
    colorTheme = "#3b82f6", // Default blue
    fontFamily = "font-sans",
    spacing = "comfortable",
    layoutMode = "auto",
  } = data;

  // Spacing configurations
  const spacingClasses = {
    compact: "space-y-2 py-1 gap-2",
    comfortable: "space-y-4 py-2 gap-4",
    spacious: "space-y-6 py-4 gap-6",
  };

  const itemSpacingClasses = {
    compact: "space-y-1.5 mt-1",
    comfortable: "space-y-3 mt-2.5",
    spacious: "space-y-4.5 mt-3.5",
  };

  // Determine structural types based on templateId
  const getTemplateConfig = () => {
    // 1. Sidebar/Split Layout Templates
    const splitTemplates = [
      "executive", "canva_executive_navy", "canva_hybrid_pro"
    ];
    
    // 2. Academic / Serif / Cream templates
    const serifTemplates = [
      "elegant", "gold_luxe", "royal", "vintage", "milano", "chicago", "canva_creative_sage", "canva_corporate_gold", "canva_rose_executive"
    ];

    // 3. Monospace / Code templates
    const monoTemplates = [
      "silicon", "cyber", "oslo"
    ];

    // Check if custom extracted template
    let customTpl: any = null;
    if (templateId.startsWith("custom_") || templateId.startsWith("extracted_")) {
      try {
        const saved = JSON.parse(localStorage.getItem("customSavedTemplates") || "[]");
        customTpl = saved.find((t: any) => t.templateId === templateId);
      } catch (e) {}
    }

    let isSplit = splitTemplates.includes(templateId) || (customTpl && customTpl.layoutStyle === "split");
    if (layoutMode === "single") {
      isSplit = false;
    } else if (layoutMode === "split") {
      isSplit = true;
    }

    // Determine font family
    let font = fontFamily;
    if (customTpl && customTpl.fontFamily) font = customTpl.fontFamily;
    else if (fontFamily === "auto" || !fontFamily) {
      if (serifTemplates.includes(templateId)) font = "font-serif";
      else if (monoTemplates.includes(templateId)) font = "font-mono";
      else font = "font-sans";
    }

    // Dynamic styling category
    let styleCategory: "standard" | "sidebar" | "banner" | "cream" | "cyber" | "brutalist" | "modern-card" = "standard";
    
    if (templateId === "cyber" || customTpl?.layoutStyle === "cyber") {
      styleCategory = "cyber";
    } else if (templateId === "berlin" || customTpl?.layoutStyle === "brutalist") {
      styleCategory = "brutalist";
    } else if (isSplit) {
      styleCategory = "sidebar";
    } else if (["toronto", "sydney", "austin", "canva_modern_emerald", "canva_tech_horizon", "canva_nordic_clean", "canva_rose_executive"].includes(templateId) || customTpl?.layoutStyle === "banner") {
      styleCategory = "banner";
    } else if (serifTemplates.includes(templateId) || customTpl?.layoutStyle === "cream") {
      styleCategory = "cream";
    } else if (["munich", "oslo", "teal_grid", "aurora", "swiss", "canva_minimal_slate", "canva_monochrome_chic"].includes(templateId) || customTpl?.layoutStyle === "modern-card") {
      styleCategory = "modern-card";
    }

    return { isSplit, font, styleCategory };
  };

  const config = getTemplateConfig();
  const fontStyle = config.font;

  // Custom styling colors based on specific templateId
  const getSidebarBgClass = () => {
    switch (templateId) {
      case "executive":
        return "bg-slate-900 text-slate-100 border-r border-slate-850";
      case "canva_executive_navy":
        return "bg-[#0f172a] text-slate-100 border-r border-amber-500/30";
      case "canva_hybrid_pro":
        return "bg-slate-900 text-slate-100 border-r border-indigo-500/30";
      default:
        return "bg-slate-50 text-slate-800 border-r border-slate-200";
    }
  };

  const getTopBannerStyles = () => {
    switch (templateId) {
      case "canva_modern_emerald":
        return { bg: "bg-[#064e3b]", text: "text-emerald-50", border: "border-b-4 border-emerald-400" };
      case "canva_tech_horizon":
        return { bg: "bg-gradient-to-r from-slate-900 via-indigo-950 to-sky-950", text: "text-white", border: "border-b-4 border-sky-500" };
      case "canva_nordic_clean":
        return { bg: "bg-[#f0f9ff]", text: "text-slate-900", border: "border-b-2 border-sky-400" };
      case "canva_rose_executive":
        return { bg: "bg-fuchsia-950", text: "text-pink-50", border: "border-b-4 border-pink-400" };
      case "toronto":
        return { bg: "bg-[#1e3a8a]", text: "text-white", border: "border-b-4 border-indigo-500" };
      case "sydney":
        return { bg: "bg-gradient-to-r from-[#6366f1] to-[#a855f7]", text: "text-white", border: "border-b-2 border-purple-300" };
      case "austin":
        return { bg: "bg-[#c2410c]", text: "text-white", border: "border-b-4 border-amber-950" };
      default:
        return { bg: "bg-slate-800", text: "text-white", border: "" };
    }
  };

  const getPaperBgStyles = () => {
    switch (config.styleCategory) {
      case "cyber":
        return "bg-black text-[#00ff66] border-2 border-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.3)]";
      case "brutalist":
        return "bg-white text-slate-950 border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";
      case "cream":
        if (templateId === "canva_corporate_gold") {
          return "bg-[#fffdfa] text-slate-900 border-[6px] border-double border-[#d4af37] shadow-xl";
        }
        if (templateId === "canva_creative_sage") {
          return "bg-[#f4f7f4] text-stone-900 border-t-8 border-emerald-800 shadow-md";
        }
        if (templateId === "canva_rose_executive") {
          return "bg-[#fdfbfd] text-stone-900 border-t-8 border-fuchsia-950 shadow-lg";
        }
        if (templateId === "gold_luxe") {
          return "bg-[#faf7f0] text-slate-900 border-[8px] border-double border-[#d4af37] shadow-xl";
        }
        if (templateId === "royal") {
          return "bg-[#fefcf8] text-slate-900 border-t-8 border-red-800 border-b-8 border-red-800/10 shadow-xl";
        }
        if (templateId === "vintage") {
          return "bg-[#fbf9f3] text-stone-900 border-2 border-stone-300 shadow-md";
        }
        if (templateId === "milano") {
          return "bg-[#fffdfa] text-slate-900 border-t-8 border-slate-950 shadow-lg";
        }
        if (templateId === "chicago") {
          return "bg-[#fcfcfc] text-slate-950 border-4 border-double border-slate-950 shadow-md";
        }
        return "bg-[#faf6ee] text-slate-900 border border-amber-900/10 shadow-lg";
      case "modern-card":
        if (templateId === "canva_monochrome_chic") {
          return "bg-white text-black border-2 border-black shadow-lg";
        }
        if (templateId === "canva_minimal_slate") {
          return "bg-slate-50 text-slate-900 border-l-[10px] border-slate-700 shadow-md";
        }
        if (templateId === "canva_nordic_clean") {
          return "bg-[#f8fafc] text-slate-900 border-l-8 border-sky-600 shadow-md";
        }
        if (templateId === "aurora") {
          return "bg-[#090d16] text-slate-100 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]";
        }
        if (templateId === "swiss") {
          return "bg-white text-black border-l-[12px] border-red-600 shadow-lg";
        }
        return "bg-slate-50 text-slate-900 border border-slate-200 shadow-sm";
      default:
        if (templateId === "tokyo") {
          return "bg-stone-50 text-stone-900 border border-stone-200 shadow-sm";
        }
        return "bg-white text-slate-900 shadow-lg border border-slate-100";
    }
  };

  // Section heading element with high aesthetic differences
  const SectionHeader = ({ title }: { title: string }) => {
    if (templateId === "canva_modern_emerald") {
      return (
        <div className="flex items-center gap-2 mb-3.5 border-b-2 border-emerald-600/30 pb-1.5">
          <div className="h-3 w-3 bg-emerald-600 rounded-sm" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-800 font-sans">
            {title}
          </h3>
        </div>
      );
    }

    if (templateId === "canva_corporate_gold") {
      return (
        <div className="text-center mb-4 font-serif">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1e3a8a]">
            {title}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="h-[1px] w-12 bg-[#d4af37]" />
            <div className="h-1.5 w-1.5 bg-[#d4af37] rotate-45" />
            <div className="h-[1px] w-12 bg-[#d4af37]" />
          </div>
        </div>
      );
    }

    if (templateId === "canva_creative_sage") {
      return (
        <div className="border-b-2 border-emerald-700/20 pb-1.5 mb-3.5 font-serif">
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-700 inline-block" />
            {title}
          </h3>
        </div>
      );
    }

    if (templateId === "canva_minimal_slate") {
      return (
        <div className="border-l-4 border-slate-700 pl-3 py-0.5 mb-3.5 font-sans">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800">
            {title}
          </h3>
        </div>
      );
    }

    if (templateId === "canva_monochrome_chic") {
      return (
        <div className="border-b-2 border-black pb-1 mb-4 font-sans">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-black">
            {title}
          </h3>
        </div>
      );
    }

    if (templateId === "canva_rose_executive") {
      return (
        <div className="border-b border-fuchsia-900/30 pb-1.5 mb-3.5 font-serif">
          <h3 className="text-xs font-bold uppercase tracking-widest text-fuchsia-950 flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-fuchsia-800 rotate-45" />
            {title}
          </h3>
        </div>
      );
    }

    if (templateId === "canva_nordic_clean") {
      return (
        <div className="flex items-center gap-3 mb-3.5 font-sans">
          <h3 className="text-xs font-bold uppercase tracking-widest text-sky-900">
            {title}
          </h3>
          <div className="h-[2px] grow bg-sky-200" />
        </div>
      );
    }

    if (templateId === "canva_tech_horizon") {
      return (
        <div className="border-b border-indigo-200 pb-1.5 mb-3.5 flex items-center justify-between font-sans">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-900">
            {title}
          </h3>
          <div className="h-1.5 w-1.5 bg-sky-500 rounded-full" />
        </div>
      );
    }

    if (config.styleCategory === "cyber") {
      return (
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#00ff66] border-b border-dashed border-[#00ff66] pb-1.5 mb-3 flex items-center gap-2">
          <span>&gt;&gt;</span>
          <span>{title}</span>
          <span className="animate-pulse">_</span>
        </div>
      );
    }

    if (config.styleCategory === "brutalist") {
      return (
        <div className="bg-black text-white px-3 py-1.5 mb-4 border-2 border-black inline-block font-sans font-black tracking-wider uppercase text-xs">
          {title}
        </div>
      );
    }

    if (templateId === "gold_luxe") {
      return (
        <div className="text-center mb-4">
          <div className="text-xs font-bold uppercase tracking-widest text-[#b89742] font-serif">
            {title}
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="h-[1px] w-12 bg-[#d4af37]" />
            <div className="h-1.5 w-1.5 rotate-45 border border-[#d4af37]" />
            <div className="h-[1px] w-12 bg-[#d4af37]" />
          </div>
        </div>
      );
    }

    if (templateId === "royal") {
      return (
        <div className="border-b border-red-900/40 pb-1.5 mb-3.5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-800 font-serif flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-red-800 rounded-full" />
            {title}
          </h3>
        </div>
      );
    }

    if (templateId === "vintage") {
      return (
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-stone-800 border-b-2 border-double border-stone-400 pb-1 mb-3.5">
          --- {title} ---
        </div>
      );
    }

    if (templateId === "milano") {
      return (
        <div className="border-b border-slate-350 pb-1.5 mb-4 text-center">
          <h3 className="text-xs font-serif italic uppercase tracking-[0.2em] text-slate-900 font-medium">
            {title}
          </h3>
        </div>
      );
    }

    if (templateId === "chicago") {
      return (
        <div className="border-t border-b-2 border-black py-1 mb-4">
          <h3 className="text-xs font-serif font-black uppercase tracking-wider text-black text-center">
            {title}
          </h3>
        </div>
      );
    }

    if (templateId === "tokyo") {
      return (
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 bg-red-600 rotate-45" />
          <h3 className="text-xs font-sans font-bold uppercase tracking-[0.15em] text-stone-800">
            {title}
          </h3>
          <div className="h-[1px] grow bg-stone-200" />
        </div>
      );
    }

    if (templateId === "aurora") {
      return (
        <div className="border-b border-indigo-500/30 pb-2 mb-4 flex items-center justify-between">
          <h3 className="text-xs font-sans font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            {title}
          </h3>
          <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
        </div>
      );
    }

    if (templateId === "swiss") {
      return (
        <div className="border-l-4 border-red-600 pl-3.5 py-1 mb-4">
          <h3 className="text-xs font-sans font-extrabold uppercase tracking-widest text-black">
            {title}
          </h3>
        </div>
      );
    }

    if (config.styleCategory === "banner") {
      return (
        <div className="flex items-center gap-3.5 mb-3.5">
          <h3 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: colorTheme }}>
            {title}
          </h3>
          <div className="h-[1px] grow bg-slate-200" />
        </div>
      );
    }

    if (config.styleCategory === "sidebar") {
      return (
        <div className="border-l-3 pl-3 py-0.5 mb-3.5" style={{ borderColor: colorTheme }}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {title}
          </h3>
        </div>
      );
    }

    // Default neat horizontal bar
    return (
      <div className="border-b pb-1.5 mb-3.5" style={{ borderColor: `${colorTheme}25` }}>
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: colorTheme }}>
          {title}
        </h3>
      </div>
    );
  };

  // Render a section's contents
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "summary":
        if (!summary) return null;
        return (
          <div key="summary" className="break-inside-avoid">
            <SectionHeader title="Professional Summary" />
            <p className={`text-xs leading-relaxed text-slate-600 mt-1 font-sans ${config.styleCategory === 'cyber' ? '!text-[#00ff66] !font-mono' : ''}`}>
              {summary}
            </p>
          </div>
        );

      case "experience":
        if (!experience || experience.length === 0) return null;
        return (
          <div key="experience">
            <SectionHeader title="Professional Experience" />
            <div className={itemSpacingClasses[spacing]}>
              {experience.map((exp) => {
                const isCyber = config.styleCategory === "cyber";
                return (
                  <div key={exp.id} className={`text-xs break-inside-avoid relative p-1 rounded transition ${config.styleCategory === 'modern-card' ? 'bg-white p-3 border border-slate-100 rounded-lg hover:shadow-sm' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold text-slate-800">
                      <span className={isCyber ? "text-[#00ff66]" : ""}>{exp.position}</span>
                      <span className={`text-[10px] text-slate-500 font-normal ${isCyber ? "text-[#00ff66]/75 font-mono" : ""}`}>
                        {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 font-medium mt-0.5">
                      <span style={{ color: !isCyber ? colorTheme : undefined }} className={isCyber ? "text-[#00ff66]" : ""}>{exp.company}</span>
                      <span className={`italic font-normal ${isCyber ? "text-[#00ff66]/60 font-mono" : ""}`}>{exp.location}</span>
                    </div>
                    {exp.description && (
                      <ul className={`list-disc pl-4 mt-2 space-y-1 text-slate-600 ${isCyber ? "text-[#00ff66]/80 list-none !pl-1 font-mono" : ""}`}>
                        {exp.description.split("\n").map((bullet, i) => (
                          <li key={i}>
                            {isCyber ? `* ${bullet.replace(/^[•\-\*\s]+/, "")}` : bullet.replace(/^[•\-\*\s]+/, "")}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "education":
        if (!education || education.length === 0) return null;
        return (
          <div key="education">
            <SectionHeader title="Education" />
            <div className={itemSpacingClasses[spacing]}>
              {education.map((edu) => (
                <div key={edu.id} className={`text-xs break-inside-avoid p-1 rounded ${config.styleCategory === 'modern-card' ? 'bg-white p-3 border border-slate-100 rounded-lg' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold text-slate-800">
                    <span className={config.styleCategory === 'cyber' ? "text-[#00ff66]" : ""}>{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</span>
                    <span className={`text-[10px] text-slate-500 font-normal ${config.styleCategory === 'cyber' ? "text-[#00ff66]/70" : ""}`}>
                      {edu.startDate} – {edu.current ? "Present" : edu.endDate}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 font-medium mt-0.5">
                    <span className={config.styleCategory === 'cyber' ? "text-[#00ff66]" : ""}>{edu.school}</span>
                    <span className={`italic font-normal ${config.styleCategory === 'cyber' ? "text-[#00ff66]/60" : ""}`}>
                      {edu.location} {edu.gpa && `| GPA: ${edu.gpa}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "projects":
        if (!projects || projects.length === 0) return null;
        return (
          <div key="projects">
            <SectionHeader title="Key Projects" />
            <div className={itemSpacingClasses[spacing]}>
              {projects.map((proj) => (
                <div key={proj.id} className={`text-xs break-inside-avoid p-1 rounded ${config.styleCategory === 'modern-card' ? 'bg-white p-3 border border-slate-100 rounded-lg' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className={config.styleCategory === 'cyber' ? "text-[#00ff66]" : ""}>{proj.name}</span>
                      {proj.role && <span className={`text-[11px] font-normal text-slate-500 ${config.styleCategory === 'cyber' ? "text-[#00ff66]/75" : ""}`}>({proj.role})</span>}
                    </div>
                    <span className={`text-[10px] text-slate-500 font-normal ${config.styleCategory === 'cyber' ? "text-[#00ff66]/70" : ""}`}>{proj.startDate} – {proj.endDate}</span>
                  </div>
                  {proj.url && (
                    <a href={proj.url} target="_blank" rel="noreferrer" className={`text-[10px] text-blue-500 underline block mb-1.5 ${config.styleCategory === 'cyber' ? "!text-[#00ff66]/90" : ""}`}>
                      {proj.url}
                    </a>
                  )}
                  {proj.description && (
                    <p className={`text-slate-600 mt-1.5 leading-relaxed ${config.styleCategory === 'cyber' ? "text-[#00ff66]/85" : ""}`}>{proj.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "skills":
        if (!skills || skills.length === 0) return null;
        return (
          <div key="skills" className="break-inside-avoid">
            <SectionHeader title="Core Skills" />
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                    config.styleCategory === "cyber"
                      ? "bg-black text-[#00ff66] border-[#00ff66]/40 font-mono"
                      : config.styleCategory === "brutalist"
                      ? "bg-white text-black border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] font-bold"
                      : "bg-slate-100/80 text-slate-800 border-slate-200/60"
                  }`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );

      case "languages":
        if (!languages || languages.length === 0) return null;
        return (
          <div key="languages" className="break-inside-avoid">
            <SectionHeader title="Languages" />
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              {languages.map((lang) => (
                <div key={lang.id} className={`text-xs flex items-center justify-between border-b pb-1.5 ${config.styleCategory === 'cyber' ? 'border-[#00ff66]/20 text-[#00ff66]' : 'border-slate-100'}`}>
                  <span className="font-semibold text-slate-800">{lang.name}</span>
                  <span className={`text-[10px] text-slate-500 ${config.styleCategory === 'cyber' ? '!text-[#00ff66]/70' : ''}`}>{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "certifications":
        if (!certifications || certifications.length === 0) return null;
        return (
          <div key="certifications" className="break-inside-avoid">
            <SectionHeader title="Certifications" />
            <div className="space-y-2 mt-2">
              {certifications.map((cert) => (
                <div key={cert.id} className="text-xs flex justify-between items-start break-inside-avoid">
                  <div>
                    <span className={`font-bold text-slate-800 ${config.styleCategory === 'cyber' ? 'text-[#00ff66]' : ''}`}>{cert.name}</span>
                    <span className={`text-slate-500 text-[11px] block mt-0.5 ${config.styleCategory === 'cyber' ? 'text-[#00ff66]/80' : ''}`}>{cert.issuer}</span>
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noreferrer" className={`text-[10px] text-indigo-500 underline block mt-0.5 ${config.styleCategory === 'cyber' ? '!text-[#00ff66]/90' : ''}`}>
                        {cert.url}
                      </a>
                    )}
                  </div>
                  <span className={`text-[10px] text-slate-400 shrink-0 ${config.styleCategory === 'cyber' ? 'text-[#00ff66]/60' : ''}`}>{cert.date}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "references":
        if (!references || references.length === 0) return null;
        return (
          <div key="references" className="break-inside-avoid">
            <SectionHeader title="References" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {references.map((ref) => (
                <div
                  key={ref.id}
                  className={`text-xs break-inside-avoid p-3 rounded border ${
                    config.styleCategory === "cyber"
                      ? "bg-black border-[#00ff66]/40 text-[#00ff66]"
                      : config.styleCategory === "brutalist"
                      ? "bg-white border-2 border-black rounded-none shadow-[3px_3px_0px_rgba(0,0,0,1)] text-black"
                      : "bg-slate-50/50 border-slate-100/80"
                  }`}
                >
                  <span className="font-bold text-slate-800 block">{ref.name}</span>
                  <span className="text-slate-500 text-[11px] block">{ref.title} at {ref.company}</span>
                  <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                    {ref.email && <div className={config.styleCategory === 'cyber' ? 'text-[#00ff66]/80' : ''}>Email: {ref.email}</div>}
                    {ref.phone && <div className={config.styleCategory === 'cyber' ? 'text-[#00ff66]/80' : ''}>Phone: {ref.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Header layouts with high design distinctions
  const renderHeader = () => {
    const hasPhoto = !!personalInfo.profilePhoto;

    // Canva Modern Emerald
    if (templateId === "canva_modern_emerald") {
      return (
        <div className="-mx-8 -mt-8 p-8 mb-6 bg-[#064e3b] text-emerald-50 border-b-4 border-emerald-400 relative font-sans">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {hasPhoto && (
                <img
                  src={personalInfo.profilePhoto}
                  alt={personalInfo.fullName}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-xl object-cover ring-4 ring-emerald-300/40 shadow-lg"
                />
              )}
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-black tracking-tight text-white">
                  {personalInfo.fullName || "Your Full Name"}
                </h1>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 mt-1">
                  {personalInfo.jobTitle || "Professional Title"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-3 gap-y-1.5 text-[10px] text-emerald-100 max-w-md">
              {personalInfo.email && <div className="flex items-center gap-1 bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-700/50"><Mail className="h-3 w-3 text-emerald-300" /> {personalInfo.email}</div>}
              {personalInfo.phone && <div className="flex items-center gap-1 bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-700/50"><Phone className="h-3 w-3 text-emerald-300" /> {personalInfo.phone}</div>}
              {personalInfo.location && <div className="flex items-center gap-1 bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-700/50"><MapPin className="h-3 w-3 text-emerald-300" /> {personalInfo.location}</div>}
              {personalInfo.website && <div className="flex items-center gap-1 bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-700/50"><Globe className="h-3 w-3 text-emerald-300" /> {personalInfo.website}</div>}
              {personalInfo.linkedin && <div className="flex items-center gap-1 bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-700/50"><Linkedin className="h-3 w-3 text-emerald-300" /> {personalInfo.linkedin}</div>}
              {personalInfo.github && <div className="flex items-center gap-1 bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-700/50"><Github className="h-3 w-3 text-emerald-300" /> {personalInfo.github}</div>}
            </div>
          </div>
        </div>
      );
    }

    // Canva Corporate Gold Prestige
    if (templateId === "canva_corporate_gold") {
      return (
        <div className="text-center pb-6 mb-6 border-b-2 border-[#d4af37] font-serif">
          <div className="text-[10px] font-bold tracking-[0.25em] text-[#b89742] uppercase mb-2">
            Curriculum Vitae
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1e3a8a] tracking-wide">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-xs font-serif italic text-slate-600 mt-1 uppercase tracking-widest font-semibold">
            {personalInfo.jobTitle || "Professional Title"}
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px] text-slate-700 mt-4 max-w-2xl mx-auto border-t border-b border-[#d4af37]/40 py-2 italic">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.location && <span>• {personalInfo.location}</span>}
            {personalInfo.website && <span>• {personalInfo.website}</span>}
            {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
            {personalInfo.github && <span>• {personalInfo.github}</span>}
          </div>
        </div>
      );
    }

    // Canva Sage Editorial
    if (templateId === "canva_creative_sage") {
      return (
        <div className="-mx-8 -mt-8 p-8 mb-6 bg-[#166534] text-emerald-50 relative overflow-hidden font-serif">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {hasPhoto && (
                <img
                  src={personalInfo.profilePhoto}
                  alt={personalInfo.fullName}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-emerald-200/40 shadow-md"
                />
              )}
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-serif font-bold tracking-tight text-white">
                  {personalInfo.fullName || "Your Full Name"}
                </h1>
                <p className="text-xs font-serif italic tracking-widest text-emerald-200 mt-1 font-semibold">
                  {personalInfo.jobTitle || "Professional Title"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-1 text-[11px] text-emerald-100 italic">
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>• {personalInfo.phone}</div>}
              {personalInfo.location && <div>• {personalInfo.location}</div>}
              {personalInfo.website && <div>• {personalInfo.website}</div>}
              {personalInfo.linkedin && <div>• {personalInfo.linkedin}</div>}
              {personalInfo.github && <div>• {personalInfo.github}</div>}
            </div>
          </div>
        </div>
      );
    }

    // Canva Minimal Slate
    if (templateId === "canva_minimal_slate") {
      return (
        <div className="pb-6 mb-6 border-b-2 border-slate-700 font-sans">
          <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
                {personalInfo.fullName || "Your Full Name"}
              </h1>
              <p className="text-xs font-bold tracking-[0.2em] text-slate-600 uppercase mt-1">
                {personalInfo.jobTitle || "Professional Title"}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-600">
              {personalInfo.email && <span className="bg-slate-200/80 px-2 py-0.5 rounded">{personalInfo.email}</span>}
              {personalInfo.phone && <span className="bg-slate-200/80 px-2 py-0.5 rounded">{personalInfo.phone}</span>}
              {personalInfo.location && <span className="bg-slate-200/80 px-2 py-0.5 rounded">{personalInfo.location}</span>}
              {personalInfo.website && <span className="bg-slate-200/80 px-2 py-0.5 rounded">{personalInfo.website}</span>}
              {personalInfo.linkedin && <span className="bg-slate-200/80 px-2 py-0.5 rounded">{personalInfo.linkedin}</span>}
              {personalInfo.github && <span className="bg-slate-200/80 px-2 py-0.5 rounded">{personalInfo.github}</span>}
            </div>
          </div>
        </div>
      );
    }

    // Canva Monochrome Chic
    if (templateId === "canva_monochrome_chic") {
      return (
        <div className="text-center pb-6 mb-6 border-b-2 border-black font-sans">
          <h1 className="text-4xl font-black tracking-[0.15em] text-black uppercase leading-none mb-2">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-xs font-black tracking-[0.3em] text-stone-600 uppercase border-t border-b border-black/20 py-1.5 my-2">
            {personalInfo.jobTitle || "Professional Title"}
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[10px] font-bold text-black uppercase tracking-wider mt-3">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.website && <span>{personalInfo.website}</span>}
            {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
            {personalInfo.github && <span>{personalInfo.github}</span>}
          </div>
        </div>
      );
    }

    // Canva Tech Horizon
    if (templateId === "canva_tech_horizon") {
      return (
        <div className="-mx-8 -mt-8 p-8 mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-sky-950 text-white border-b-4 border-sky-500 font-sans">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {hasPhoto && (
                <img
                  src={personalInfo.profilePhoto}
                  alt={personalInfo.fullName}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-sky-400/50 shadow-xl"
                />
              )}
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-black tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-sky-100 to-sky-300">
                  {personalInfo.fullName || "Your Full Name"}
                </h1>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-sky-400 mt-1 font-semibold">
                  &lt;{personalInfo.jobTitle || "Tech Specialist"}&gt;
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-3 gap-y-1.5 text-[10px] text-sky-100 font-mono">
              {personalInfo.email && <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded backdrop-blur-sm"><Mail className="h-3 w-3 text-sky-400" /> {personalInfo.email}</div>}
              {personalInfo.phone && <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded backdrop-blur-sm"><Phone className="h-3 w-3 text-sky-400" /> {personalInfo.phone}</div>}
              {personalInfo.location && <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded backdrop-blur-sm"><MapPin className="h-3 w-3 text-sky-400" /> {personalInfo.location}</div>}
              {personalInfo.website && <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded backdrop-blur-sm"><Globe className="h-3 w-3 text-sky-400" /> {personalInfo.website}</div>}
              {personalInfo.linkedin && <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded backdrop-blur-sm"><Linkedin className="h-3 w-3 text-sky-400" /> {personalInfo.linkedin}</div>}
              {personalInfo.github && <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded backdrop-blur-sm"><Github className="h-3 w-3 text-sky-400" /> {personalInfo.github}</div>}
            </div>
          </div>
        </div>
      );
    }

    // Canva Nordic Frost & Slate
    if (templateId === "canva_nordic_clean") {
      return (
        <div className="-mx-8 -mt-8 p-8 mb-6 bg-[#f0f9ff] text-slate-900 border-b-2 border-sky-400 font-sans">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <h1 className="text-3xl font-extrabold tracking-wider text-sky-950 uppercase">
                {personalInfo.fullName || "Your Full Name"}
              </h1>
              <p className="text-xs font-bold tracking-[0.25em] text-sky-700 uppercase mt-1">
                {personalInfo.jobTitle || "Professional Title"}
              </p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-600">
              {personalInfo.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-sky-600" /> {personalInfo.email}</div>}
              {personalInfo.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-sky-600" /> {personalInfo.phone}</div>}
              {personalInfo.location && <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-sky-600" /> {personalInfo.location}</div>}
              {personalInfo.website && <div className="flex items-center gap-1"><Globe className="h-3 w-3 text-sky-600" /> {personalInfo.website}</div>}
              {personalInfo.linkedin && <div className="flex items-center gap-1"><Linkedin className="h-3 w-3 text-sky-600" /> {personalInfo.linkedin}</div>}
              {personalInfo.github && <div className="flex items-center gap-1"><Github className="h-3 w-3 text-sky-600" /> {personalInfo.github}</div>}
            </div>
          </div>
        </div>
      );
    }

    // Canva Rose Gold Executive
    if (templateId === "canva_rose_executive") {
      return (
        <div className="-mx-8 -mt-8 p-8 mb-6 bg-fuchsia-950 text-fuchsia-50 border-b-4 border-pink-400 relative font-serif">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {hasPhoto && (
                <img
                  src={personalInfo.profilePhoto}
                  alt={personalInfo.fullName}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-xl object-cover ring-4 ring-pink-300/40 shadow-lg"
                />
              )}
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-serif font-bold tracking-tight text-white">
                  {personalInfo.fullName || "Your Full Name"}
                </h1>
                <p className="text-xs font-serif italic tracking-widest text-pink-200 mt-1 font-semibold">
                  {personalInfo.jobTitle || "Professional Title"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-1.5 text-[10px] text-pink-100 font-sans">
              {personalInfo.email && <div className="flex items-center gap-1 bg-fuchsia-900/60 px-2.5 py-1 rounded border border-pink-800/50"><Mail className="h-3 w-3 text-pink-300" /> {personalInfo.email}</div>}
              {personalInfo.phone && <div className="flex items-center gap-1 bg-fuchsia-900/60 px-2.5 py-1 rounded border border-pink-800/50"><Phone className="h-3 w-3 text-pink-300" /> {personalInfo.phone}</div>}
              {personalInfo.location && <div className="flex items-center gap-1 bg-fuchsia-900/60 px-2.5 py-1 rounded border border-pink-800/50"><MapPin className="h-3 w-3 text-pink-300" /> {personalInfo.location}</div>}
              {personalInfo.website && <div className="flex items-center gap-1 bg-fuchsia-900/60 px-2.5 py-1 rounded border border-pink-800/50"><Globe className="h-3 w-3 text-pink-300" /> {personalInfo.website}</div>}
              {personalInfo.linkedin && <div className="flex items-center gap-1 bg-fuchsia-900/60 px-2.5 py-1 rounded border border-pink-800/50"><Linkedin className="h-3 w-3 text-pink-300" /> {personalInfo.linkedin}</div>}
              {personalInfo.github && <div className="flex items-center gap-1 bg-fuchsia-900/60 px-2.5 py-1 rounded border border-pink-800/50"><Github className="h-3 w-3 text-pink-300" /> {personalInfo.github}</div>}
            </div>
          </div>
        </div>
      );
    }

    // A. Aurora Cosmic Glow Header (Glowing highlights on space dark background)
    if (templateId === "aurora") {
      return (
        <div className="border-b border-indigo-500/40 pb-5 mb-5 font-sans relative overflow-hidden">
          <div className="absolute top-0 right-0 animate-pulse text-indigo-400">
            <Sparkles className="h-5 w-5 text-indigo-400 opacity-60" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {hasPhoto && (
                <img
                  src={personalInfo.profilePhoto}
                  alt={personalInfo.fullName}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-xl object-cover ring-2 ring-purple-500/40"
                />
              )}
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-black tracking-tight text-white font-display bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                  {personalInfo.fullName || "Your Full Name"}
                </h1>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-400 mt-1 font-semibold">
                  // {personalInfo.jobTitle || "Professional Title"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-1.5 text-[10px] text-slate-400 max-w-md font-mono">
              {personalInfo.email && <div className="flex items-center gap-1 text-indigo-300/90"><Mail className="h-3 w-3 text-indigo-400" /> {personalInfo.email}</div>}
              {personalInfo.phone && <div className="flex items-center gap-1 text-indigo-300/90"><Phone className="h-3 w-3 text-indigo-400" /> {personalInfo.phone}</div>}
              {personalInfo.location && <div className="flex items-center gap-1 text-indigo-300/90"><MapPin className="h-3 w-3 text-indigo-400" /> {personalInfo.location}</div>}
              {personalInfo.website && <div className="flex items-center gap-1 text-indigo-300/90"><Globe className="h-3 w-3 text-indigo-400" /> {personalInfo.website}</div>}
              {personalInfo.linkedin && <div className="flex items-center gap-1 text-indigo-300/90"><Linkedin className="h-3 w-3 text-indigo-400" /> {personalInfo.linkedin}</div>}
              {personalInfo.github && <div className="flex items-center gap-1 text-indigo-300/90"><Github className="h-3 w-3 text-indigo-400" /> {personalInfo.github}</div>}
            </div>
          </div>
        </div>
      );
    }

    // B. Vintage Press Typewriter Header (Typewriter slab-serif, warm paper)
    if (templateId === "vintage") {
      return (
        <div className="text-center pb-6 mb-6 border-b-2 border-stone-400 font-mono text-stone-800">
          <div className="text-[10px] tracking-widest text-stone-500 uppercase mb-3">*** CONFIDENTIAL & PERSONAL RESUME ***</div>
          <h1 className="text-3xl font-black tracking-normal uppercase">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-xs italic text-stone-600 mt-1.5 font-bold uppercase tracking-wider">
            == {personalInfo.jobTitle || "Professional Title"} ==
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px] mt-4 max-w-xl mx-auto border-t border-b border-dashed border-stone-400 py-2">
            {personalInfo.email && <span>Email: {personalInfo.email}</span>}
            {personalInfo.phone && <span>Tel: {personalInfo.phone}</span>}
            {personalInfo.location && <span>Loc: {personalInfo.location}</span>}
            {personalInfo.website && <span>Web: {personalInfo.website}</span>}
            {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
            {personalInfo.github && <span>GitHub: {personalInfo.github}</span>}
          </div>
        </div>
      );
    }

    // C. Swiss Bauhaus Avant-Garde Header (Stark bold, red highlights)
    if (templateId === "swiss") {
      return (
        <div className="pb-6 mb-6 border-b-4 border-black font-sans relative">
          <div className="absolute top-0 right-0 text-red-600 text-5xl font-black opacity-10 font-sans select-none">
            CH
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-black uppercase leading-none">
              {personalInfo.fullName || "Your Full Name"}
            </h1>
            <p className="text-sm font-extrabold uppercase tracking-widest text-red-600">
              {personalInfo.jobTitle || "Professional Title"}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-[10px] text-stone-700 mt-5 pt-4 border-t border-stone-200 font-medium">
            {personalInfo.email && <div><span className="font-bold text-black uppercase block text-[9px] text-red-600">Email</span>{personalInfo.email}</div>}
            {personalInfo.phone && <div><span className="font-bold text-black uppercase block text-[9px] text-red-600">Telephone</span>{personalInfo.phone}</div>}
            {personalInfo.location && <div><span className="font-bold text-black uppercase block text-[9px] text-red-600">Location</span>{personalInfo.location}</div>}
            {personalInfo.website && <div><span className="font-bold text-black uppercase block text-[9px] text-red-600">Website</span>{personalInfo.website}</div>}
            {personalInfo.linkedin && <div><span className="font-bold text-black uppercase block text-[9px] text-red-600">LinkedIn</span>{personalInfo.linkedin}</div>}
            {personalInfo.github && <div><span className="font-bold text-black uppercase block text-[9px] text-red-600">GitHub</span>{personalInfo.github}</div>}
          </div>
        </div>
      );
    }

    // D. Cyber Terminal Retro Header
    if (config.styleCategory === "cyber") {
      return (
        <div className="border-b border-[#00ff66] pb-4 mb-5 font-mono">
          <div className="flex justify-between text-[10px] text-[#00ff66]/60 mb-2">
            <span>CVCRAFT_AI_TERMINAL_V1.0</span>
            <span>SYSTEM_STATUS: ONLINE</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#00ff66] tracking-tight uppercase">
              {personalInfo.fullName || "GUEST_USER"}
            </h1>
            <p className="text-sm font-semibold tracking-wider text-[#00ff66] uppercase">
              // ROLE: {personalInfo.jobTitle || "DEVELOPER_SYSTEMS_ENGINEER"}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-[#00ff66]/80 mt-3 border-t border-dashed border-[#00ff66]/30 pt-3">
            {personalInfo.email && <div>$ cat contact/email.txt &gt; {personalInfo.email}</div>}
            {personalInfo.phone && <div>$ cat contact/phone.txt &gt; {personalInfo.phone}</div>}
            {personalInfo.location && <div>$ cat contact/location.txt &gt; {personalInfo.location}</div>}
            {personalInfo.website && <div>$ cat contact/website.txt &gt; {personalInfo.website}</div>}
            {personalInfo.linkedin && <div>$ cat contact/linkedin.txt &gt; {personalInfo.linkedin}</div>}
            {personalInfo.github && <div>$ cat contact/github.txt &gt; {personalInfo.github}</div>}
          </div>
        </div>
      );
    }

    // E. Brutalist High Contrast Header
    if (config.styleCategory === "brutalist") {
      return (
        <div className="border-b-[6px] border-black pb-5 mb-5 flex flex-col md:flex-row items-start justify-between gap-4 font-sans">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-black tracking-tight uppercase text-black">
              {personalInfo.fullName || "Your Full Name"}
            </h1>
            <div className="bg-black text-white px-2 py-1 inline-block text-xs font-bold uppercase tracking-widest">
              {personalInfo.jobTitle || "Professional Title"}
            </div>
          </div>
          <div className="text-xs font-bold border-4 border-black p-3.5 bg-yellow-300 shadow-[3px_3px_0px_rgba(0,0,0,1)] text-black space-y-1">
            {personalInfo.email && <div>EMAIL: {personalInfo.email}</div>}
            {personalInfo.phone && <div>PHONE: {personalInfo.phone}</div>}
            {personalInfo.location && <div>LOCATION: {personalInfo.location}</div>}
            {personalInfo.website && <div>WEBSITE: {personalInfo.website}</div>}
            {personalInfo.linkedin && <div>LINKEDIN: {personalInfo.linkedin}</div>}
            {personalInfo.github && <div>GITHUB: {personalInfo.github}</div>}
          </div>
        </div>
      );
    }

    // F. Solid Banner Header (Bold bands with solid colors or gradients)
    if (config.styleCategory === "banner") {
      const banner = getTopBannerStyles();
      return (
        <div className={`-mx-8 -mt-8 p-8 mb-6 ${banner.bg} ${banner.text} ${banner.border} relative overflow-hidden`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              {hasPhoto && (
                <img
                  src={personalInfo.profilePhoto}
                  alt={personalInfo.fullName}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-xl object-cover ring-4 ring-white/35 shadow-md"
                />
              )}
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-black tracking-tight font-display">
                  {personalInfo.fullName || "Your Full Name"}
                </h1>
                <p className="text-xs font-mono uppercase tracking-widest opacity-85 mt-1 font-semibold">
                  {personalInfo.jobTitle || "Professional Title"}
                </p>
              </div>
            </div>
            {/* Horizontal Contact layout */}
            <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-1.5 text-[10px] font-mono opacity-90 text-center md:text-right max-w-md">
              {personalInfo.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" /> {personalInfo.email}</div>}
              {personalInfo.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" /> {personalInfo.phone}</div>}
              {personalInfo.location && <div className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /> {personalInfo.location}</div>}
              {personalInfo.website && <div className="flex items-center gap-1"><Globe className="h-3 w-3 shrink-0" /> {personalInfo.website}</div>}
              {personalInfo.linkedin && <div className="flex items-center gap-1"><Linkedin className="h-3 w-3 shrink-0" /> {personalInfo.linkedin}</div>}
              {personalInfo.github && <div className="flex items-center gap-1"><Github className="h-3 w-3 shrink-0" /> {personalInfo.github}</div>}
            </div>
          </div>
        </div>
      );
    }

    // G. Classic Serif and Cream Layout Header
    if (config.styleCategory === "cream") {
      return (
        <div className="text-center pb-5 mb-5 border-b border-stone-200">
          <h1 className="text-3xl font-serif tracking-normal text-stone-900 font-medium">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-xs font-serif italic text-stone-500 mt-1 uppercase tracking-widest font-semibold">
            {personalInfo.jobTitle || "Professional Title"}
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-stone-500 mt-3 font-medium font-serif italic">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.location && <span>• {personalInfo.location}</span>}
            {personalInfo.website && <span>• {personalInfo.website}</span>}
            {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
            {personalInfo.github && <span>• {personalInfo.github}</span>}
          </div>
        </div>
      );
    }

    // H. Tokyo Minimalist Header (Japanese architecture styling)
    if (templateId === "tokyo") {
      return (
        <div className="pb-5 mb-5 border-b border-stone-200 text-stone-900">
          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold tracking-widest uppercase">
                {personalInfo.fullName || "Your Full Name"}
              </h1>
              <p className="text-xs font-semibold tracking-[0.2em] text-red-600 uppercase mt-1">
                {personalInfo.jobTitle || "Professional Title"}
              </p>
            </div>
            <div className="text-[10px] space-y-0.5 text-stone-500 border-l border-red-600 pl-3">
              {personalInfo.email && <div>Email: {personalInfo.email}</div>}
              {personalInfo.phone && <div>Tel: {personalInfo.phone}</div>}
              {personalInfo.location && <div>Loc: {personalInfo.location}</div>}
              {personalInfo.website && <div>Web: {personalInfo.website}</div>}
              {personalInfo.linkedin && <div>LinkedIn: {personalInfo.linkedin}</div>}
              {personalInfo.github && <div>GitHub: {personalInfo.github}</div>}
            </div>
          </div>
        </div>
      );
    }

    // I. Minimal Standard Corporate Header
    return (
      <div className="text-center border-b pb-4 mb-4">
        {hasPhoto && (
          <img
            src={personalInfo.profilePhoto}
            alt={personalInfo.fullName}
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-full mx-auto object-cover border mb-3"
            style={{ borderColor: colorTheme }}
          />
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {personalInfo.fullName || "Your Full Name"}
        </h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
          {personalInfo.jobTitle || "Professional Title"}
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-[10px] text-slate-500 mt-3 font-medium">
          {personalInfo.email && <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" /> {personalInfo.email}</div>}
          {personalInfo.phone && <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> {personalInfo.phone}</div>}
          {personalInfo.location && <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {personalInfo.location}</div>}
          {personalInfo.website && <div className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-slate-400" /> {personalInfo.website}</div>}
          {personalInfo.linkedin && <div className="flex items-center gap-1"><Linkedin className="h-3.5 w-3.5 text-slate-400" /> {personalInfo.linkedin}</div>}
          {personalInfo.github && <div className="flex items-center gap-1"><Github className="h-3.5 w-3.5 text-slate-400" /> {personalInfo.github}</div>}
        </div>
      </div>
    );
  };

  const isSplitLayout = config.isSplit;

  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      className={`print-page w-full p-8 mx-auto ${fontStyle} ${getPaperBgStyles()}`}
    >
      {isSplitLayout ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -m-8 min-h-[inherit]">
          {/* Left Split Colored Sidebar */}
          <div className={`md:col-span-1 p-6 space-y-5 flex flex-col justify-between ${getSidebarBgClass()}`}>
            <div className="space-y-5">
              <div className="text-center md:text-left pb-4 border-b border-white/10">
                {personalInfo.profilePhoto ? (
                  <img
                    src={personalInfo.profilePhoto}
                    alt={personalInfo.fullName}
                    referrerPolicy="no-referrer"
                    className="h-20 w-20 rounded-xl object-cover mb-3 mx-auto md:mx-0 border-2 border-white/20"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-slate-100/10 flex items-center justify-center text-lg font-bold mb-3 mx-auto md:mx-0">
                    {personalInfo.fullName ? personalInfo.fullName.charAt(0) : "U"}
                  </div>
                )}
                <h1 className="text-lg font-black tracking-tight">{personalInfo.fullName || "Full Name"}</h1>
                <p className="text-xs font-semibold opacity-75 mt-0.5">{personalInfo.jobTitle || "Professional Title"}</p>
              </div>

              {/* Contacts info block */}
              <div className="space-y-2 text-[10px] opacity-90">
                <span className="text-[11px] font-bold uppercase tracking-wider block opacity-70">Contact</span>
                {personalInfo.email && <div className="truncate flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /> {personalInfo.email}</div>}
                {personalInfo.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" /> {personalInfo.phone}</div>}
                {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /> {personalInfo.location}</div>}
                {personalInfo.website && <div className="truncate flex items-center gap-1.5"><Globe className="h-3 w-3 shrink-0" /> {personalInfo.website}</div>}
                {personalInfo.linkedin && <div className="truncate flex items-center gap-1.5"><Linkedin className="h-3 w-3 shrink-0" /> {personalInfo.linkedin}</div>}
                {personalInfo.github && <div className="truncate flex items-center gap-1.5"><Github className="h-3 w-3 shrink-0" /> {personalInfo.github}</div>}
              </div>

              {/* Render skills in sidebar */}
              {skills && skills.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider block mb-2 opacity-70">Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[9px] font-semibold bg-white/10 border border-white/5 text-white">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Render languages in sidebar */}
              {languages && languages.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider block mb-1.5 opacity-70">Languages</span>
                  <div className="space-y-1 text-[10px]">
                    {languages.map((lang) => (
                      <div key={lang.id} className="flex justify-between border-b border-white/5 pb-1">
                        <span className="font-semibold">{lang.name}</span>
                        <span className="opacity-75">{lang.proficiency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Foot note */}
            <div className="text-[8px] opacity-40 font-mono text-center">
              Powered by CVCraft AI
            </div>
          </div>

          {/* Right Split Main Body Content */}
          <div className="md:col-span-2 p-6 space-y-5 bg-white text-slate-900 min-h-[297mm]">
            {sectionsOrder
              .filter((id) => id !== "skills" && id !== "languages") // Exclude sidebar components from main body
              .map((id) => renderSection(id))}
          </div>
        </div>
      ) : (
        // Standard full-width layout with spacers
        <div className={spacingClasses[spacing]}>
          {renderHeader()}
          <div className="space-y-5">
            {sectionsOrder.map((id) => renderSection(id))}
          </div>
        </div>
      )}
    </div>
  );
}
