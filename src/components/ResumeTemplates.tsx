import React from "react";
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from "lucide-react";
import { ResumeData } from "../types";

interface ResumeTemplatesProps {
  data: ResumeData;
  scale?: number;
}

export default function ResumeTemplates({ data, scale = 1 }: ResumeTemplatesProps) {
  const {
    personalInfo,
    summary,
    experience,
    education,
    projects,
    skills,
    languages,
    certifications,
    references,
    sectionsOrder = ["summary", "experience", "education", "projects", "skills", "languages", "certifications", "references"],
    templateId = "minimal",
    colorTheme = "#3b82f6", // Default blue
    fontFamily = "font-sans",
    spacing = "comfortable",
    layoutMode = "auto",
  } = data;

  // Spacing unit mapping
  const spacingClasses = {
    compact: "space-y-2 py-1 gap-2",
    comfortable: "space-y-4 py-2 gap-4",
    spacious: "space-y-6 py-4 gap-6",
  };

  const itemSpacingClasses = {
    compact: "space-y-1 mt-1",
    comfortable: "space-y-2 mt-2",
    spacious: "space-y-3 mt-3",
  };

  // Dynamic template configurations for all 50 templates
  const getTemplateConfig = () => {
    const splitLayouts = [
      "executive", "designer", "international", "tokyo", "swiss", "slate_pro", "san_fran", "mumbai", "shanghai"
    ];
    const serifLayouts = [
      "paris", "london", "elegant", "gold_luxe", "royal", "vintage", "milano", "chicago", "denver", "vienna", "geneva", "brussels"
    ];
    const monoLayouts = [
      "silicon", "berlin", "cyber", "munich", "oslo"
    ];
    const darkThemes = [
      "dark", "cyber", "slate_pro", "aurora", "premium_dark"
    ];
    const creamThemes = [
      "elegant", "gold_luxe", "royal", "vintage", "milano", "vienna", "paris"
    ];
    const greyThemes = [
      "nordic", "copenhagen", "austin", "miami"
    ];
    const brutalThemes = [
      "berlin"
    ];

    let isSplit = splitLayouts.includes(templateId);
    if (layoutMode === "single") {
      isSplit = false;
    } else if (layoutMode === "split") {
      isSplit = true;
    }
    
    let font = fontFamily;
    if (fontFamily === "auto" || !fontFamily) {
      if (serifLayouts.includes(templateId)) font = "font-serif";
      else if (monoLayouts.includes(templateId)) font = "font-mono";
      else font = "font-sans";
    }

    let theme = "light";
    if (darkThemes.includes(templateId)) theme = "dark";
    else if (creamThemes.includes(templateId)) theme = "cream";
    else if (greyThemes.includes(templateId)) theme = "grey";
    else if (brutalThemes.includes(templateId)) theme = "brutalist";

    let headerStyle: "classic" | "creative" | "modern" | "executive" = "classic";
    if (isSplit) headerStyle = "executive";
    else if (["creative", "sydney", "amsterdam", "vibrant", "austin", "miami", "sao_paulo"].includes(templateId)) headerStyle = "creative";
    else if (["modern", "silicon", "aurora", "teal_grid", "seattle"].includes(templateId)) headerStyle = "modern";

    return { isSplit, font, theme, headerStyle };
  };

  const templateConfig = getTemplateConfig();
  const fontStyle = templateConfig.font;

  // Standard Section Heading Component
  const SectionHeader = ({ title }: { title: string }) => {
    const isDarkTemplate = templateConfig.theme === "dark";
    const headerColor = isDarkTemplate ? "text-slate-100" : "text-slate-900";
    
    if (templateConfig.headerStyle === "classic" || templateConfig.theme === "cream") {
      return (
        <div className="border-b-2 pb-1.5 mb-3" style={{ borderColor: colorTheme }}>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: colorTheme }}>
            {title}
          </h3>
        </div>
      );
    }
    if (templateConfig.headerStyle === "creative" || templateConfig.headerStyle === "modern") {
      return (
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: colorTheme }}>
            {title}
          </h3>
          <div className="h-[1px] bg-slate-200 grow" />
        </div>
      );
    }
    if (templateConfig.headerStyle === "executive") {
      return (
        <div className="border-l-4 pl-3 py-0.5 mb-3" style={{ borderColor: colorTheme }}>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: isDarkTemplate ? "#f8fafc" : "#1e293b" }}>
            {title}
          </h3>
        </div>
      );
    }
    return (
      <div className="mb-2">
        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400">
          {title}
        </h3>
        <div className="h-[1px] bg-slate-200 mt-1" />
      </div>
    );
  };

  // Render individual sections dynamically based on ID
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "summary":
        if (!summary) return null;
        return (
          <div key="summary">
            <SectionHeader title="Professional Summary" />
            <p className="text-xs leading-relaxed text-slate-600 font-sans mt-1">
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
              {experience.map((exp) => (
                <div key={exp.id} className="text-xs group break-inside-avoid">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold text-slate-800">
                    <span>{exp.position}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span style={{ color: templateId !== 'dark' ? colorTheme : undefined }}>{exp.company}</span>
                    <span className="italic font-normal">{exp.location}</span>
                  </div>
                  {exp.description && (
                    <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-600">
                      {exp.description.split("\n").map((bullet, i) => (
                        <li key={i}>{bullet.replace(/^[•\-\*\s]+/, "")}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
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
                <div key={edu.id} className="text-xs break-inside-avoid">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold text-slate-800">
                    <span>{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {edu.startDate} – {edu.current ? "Present" : edu.endDate}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>{edu.school}</span>
                    <span className="italic font-normal">{edu.location} {edu.gpa && `| GPA: ${edu.gpa}`}</span>
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
                <div key={proj.id} className="text-xs break-inside-avoid">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{proj.name}</span>
                      {proj.role && <span className="text-[11px] font-normal text-slate-500">({proj.role})</span>}
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">{proj.startDate} – {proj.endDate}</span>
                  </div>
                  {proj.url && (
                    <a href={proj.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 underline block mb-1">
                      {proj.url}
                    </a>
                  )}
                  {proj.description && (
                    <p className="text-slate-600 mt-1 leading-relaxed">{proj.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "skills":
        if (!skills || skills.length === 0) return null;
        return (
          <div key="skills">
            <SectionHeader title="Core Skills" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200/60"
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
          <div key="languages">
            <SectionHeader title="Languages" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {languages.map((lang) => (
                <div key={lang.id} className="text-xs flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="font-semibold text-slate-800">{lang.name}</span>
                  <span className="text-[10px] text-slate-500">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "certifications":
        if (!certifications || certifications.length === 0) return null;
        return (
          <div key="certifications">
            <SectionHeader title="Certifications" />
            <div className="space-y-1.5 mt-2">
              {certifications.map((cert) => (
                <div key={cert.id} className="text-xs flex justify-between items-start break-inside-avoid">
                  <div>
                    <span className="font-bold text-slate-800">{cert.name}</span>
                    <span className="text-slate-500 text-[11px] block">{cert.issuer}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{cert.date}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "references":
        if (!references || references.length === 0) return null;
        return (
          <div key="references">
            <SectionHeader title="References" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {references.map((ref) => (
                <div key={ref.id} className="text-xs break-inside-avoid p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800 block">{ref.name}</span>
                  <span className="text-slate-500 text-[11px] block">{ref.title} at {ref.company}</span>
                  <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                    {ref.email && <div>Email: {ref.email}</div>}
                    {ref.phone && <div>Phone: {ref.phone}</div>}
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

  // Outer template styling container
  const getTemplateContainerStyles = () => {
    switch (templateConfig.theme) {
      case "dark":
        return "bg-slate-900 text-slate-100 border border-slate-800";
      case "cream":
        return "bg-[#faf6ee] text-slate-900 border-2 border-amber-900/10 shadow-xl rounded-sm";
      case "grey":
        return "bg-slate-50 text-slate-900 border border-slate-200 shadow-md";
      case "brutalist":
        return "bg-white text-slate-950 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
      default:
        return "bg-white text-slate-900 shadow-lg border border-slate-100";
    }
  };

  // Header layouts
  const renderHeader = () => {
    const hasPhoto = !!personalInfo.profilePhoto;

    // Creative template header
    if (templateConfig.headerStyle === "creative") {
      return (
        <div className="border-b pb-6 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            {hasPhoto && (
              <img
                src={personalInfo.profilePhoto}
                alt={personalInfo.fullName}
                referrerPolicy="no-referrer"
                className="h-20 w-20 rounded-2xl object-cover ring-4"
                style={{ ringColor: colorTheme }}
              />
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-black tracking-tight" style={{ color: colorTheme }}>
                {personalInfo.fullName || "Your Full Name"}
              </h1>
              <p className="text-sm font-mono uppercase tracking-widest text-slate-500 mt-1">
                {personalInfo.jobTitle || "Professional Title"}
              </p>
            </div>
          </div>
          {/* Right contacts block */}
          <div className="text-xs text-slate-500 space-y-1 border-l pl-4 border-slate-200 self-stretch flex flex-col justify-center">
            {personalInfo.email && <div className="flex items-center gap-1.5 justify-center md:justify-start"><Mail className="h-3.5 w-3.5" /> {personalInfo.email}</div>}
            {personalInfo.phone && <div className="flex items-center gap-1.5 justify-center md:justify-start"><Phone className="h-3.5 w-3.5" /> {personalInfo.phone}</div>}
            {personalInfo.location && <div className="flex items-center gap-1.5 justify-center md:justify-start"><MapPin className="h-3.5 w-3.5" /> {personalInfo.location}</div>}
          </div>
        </div>
      );
    }

    // Modern / Tech template layout
    if (templateConfig.headerStyle === "modern") {
      return (
        <div className="flex flex-col md:flex-row md:items-start justify-between border-b pb-6 gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
              {personalInfo.fullName || "Your Full Name"}
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest mt-1" style={{ color: colorTheme }}>
              {personalInfo.jobTitle || "Professional Title"}
            </p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-3 text-[10px] font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            {personalInfo.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {personalInfo.email}</div>}
            {personalInfo.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {personalInfo.phone}</div>}
            {personalInfo.location && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {personalInfo.location}</div>}
            {personalInfo.linkedin && <div className="flex items-center gap-1"><Linkedin className="h-3 w-3" /> {personalInfo.linkedin}</div>}
            {personalInfo.github && <div className="flex items-center gap-1"><Github className="h-3 w-3" /> {personalInfo.github}</div>}
          </div>
        </div>
      );
    }

    // Classic / Business / Minimal template standard header
    return (
      <div className="text-center border-b pb-4 mb-4">
        {hasPhoto && (
          <img
            src={personalInfo.profilePhoto}
            alt={personalInfo.fullName}
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-full mx-auto object-cover border-2 mb-3"
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
        </div>
      </div>
    );
  };

  // Left sidebar template styles for split layouts
  const isSplitLayout = templateConfig.isSplit;

  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      className={`print-page w-full p-8 mx-auto ${fontStyle} ${getTemplateContainerStyles()}`}
    >
      {isSplitLayout ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Split Sidebar */}
          <div className="md:col-span-1 space-y-4 border-r border-slate-100 pr-4">
            <div className="text-center md:text-left pb-4 border-b border-slate-100">
              {personalInfo.profilePhoto && (
                <img
                  src={personalInfo.profilePhoto}
                  alt={personalInfo.fullName}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-xl object-cover mb-3 mx-auto md:mx-0 border-2"
                  style={{ borderColor: colorTheme }}
                />
              )}
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{personalInfo.fullName || "Full Name"}</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{personalInfo.jobTitle || "Professional Title"}</p>
            </div>

            <div className="space-y-2 text-[10px] text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: colorTheme }}>Contact</span>
              {personalInfo.email && <div className="truncate"><Mail className="inline h-3 w-3 mr-1" /> {personalInfo.email}</div>}
              {personalInfo.phone && <div><Phone className="inline h-3 w-3 mr-1" /> {personalInfo.phone}</div>}
              {personalInfo.location && <div><MapPin className="inline h-3 w-3 mr-1" /> {personalInfo.location}</div>}
              {personalInfo.linkedin && <div className="truncate"><Linkedin className="inline h-3 w-3 mr-1" /> {personalInfo.linkedin}</div>}
            </div>

            {/* Render sub-sections like skills and languages in sidebar for clean layouts */}
            {skills && skills.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: colorTheme }}>Skills</span>
                <div className="flex flex-wrap gap-1">
                  {skills.map((skill, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-800 border border-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languages && languages.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: colorTheme }}>Languages</span>
                <div className="space-y-1 text-[10px]">
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex justify-between">
                      <span className="font-semibold">{lang.name}</span>
                      <span className="text-slate-400">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Split Body */}
          <div className="md:col-span-2 space-y-4">
            {sectionsOrder
              .filter((id) => id !== "skills" && id !== "languages") // Exclude sidebar components from main list
              .map((id) => renderSection(id))}
          </div>
        </div>
      ) : (
        // Standard full-width layout
        <div className={spacingClasses[spacing]}>
          {renderHeader()}
          {sectionsOrder.map((id) => renderSection(id))}
        </div>
      )}
    </div>
  );
}
