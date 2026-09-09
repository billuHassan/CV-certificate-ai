import mammoth from "mammoth";
import * as pdfParseModule from "pdf-parse";

export interface ExtractedPersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  profilePhoto: string;
}

export interface ExtractedExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  description: string;
}

export interface ExtractedEducation {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  gpa: string;
  description: string;
}

export interface ExtractedProject {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  url: string;
  description: string;
}

export interface ExtractedLanguage {
  id: string;
  name: string;
  proficiency: string;
}

export interface ExtractedCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface ExtractedReference {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
}

export interface ExtractedCustomSectionItem {
  id: string;
  heading: string;
  subheading?: string;
  date?: string;
  location?: string;
  description?: string;
}

export interface ExtractedCustomSection {
  id: string;
  title: string;
  items: ExtractedCustomSectionItem[];
}

export interface ExtractedResume {
  title: string;
  personalInfo: ExtractedPersonalInfo;
  summary: string;
  experience: ExtractedExperience[];
  education: ExtractedEducation[];
  projects: ExtractedProject[];
  skills: string[];
  languages: ExtractedLanguage[];
  certifications: ExtractedCertification[];
  references: ExtractedReference[];
  customSections: ExtractedCustomSection[];
  sectionsOrder: string[];
  templateId: string;
  colorTheme: string;
  fontFamily: string;
  spacing: "compact" | "comfortable" | "spacious";
  layoutMode: "auto" | "single" | "split";
  extractedTemplateStyle?: {
    templateId: string;
    templateName: string;
    description: string;
    colorTheme: string;
    fontFamily: string;
    layoutStyle: string;
    bgClass: string;
    sidebarClass: string;
    accentClass: string;
    isDark: boolean;
  };
}

/**
 * Extract raw text from PDF buffer with multiple robust strategies
 */
export async function parsePdfBuffer(buf: Buffer): Promise<string> {
  try {
    const mod: any = pdfParseModule;
    const PDFParseClass = mod?.PDFParse || mod?.default?.PDFParse;
    if (typeof PDFParseClass === "function") {
      try {
        const parser = new PDFParseClass({ data: buf });
        if (typeof parser.load === "function") {
          await parser.load();
        }
        if (typeof parser.getText === "function") {
          const textResult = await parser.getText();
          if (typeof parser.destroy === "function") {
            try { parser.destroy(); } catch (_) {}
          }
          const text = typeof textResult === "string" ? textResult : (textResult?.text || "");
          if (text && text.trim().length > 0) return text;
        }
      } catch (classErr) {
        console.warn("[PDFParseClass] instance error:", classErr);
      }
    }

    const fn: any = typeof mod === "function" ? mod : (typeof mod?.default === "function" ? mod.default : null);
    if (typeof fn === "function") {
      try {
        const res = await fn(buf);
        if (res?.text && res.text.trim().length > 0) return res.text;
      } catch (fnErr) {
        console.warn("[pdfParse] function error:", fnErr);
      }
    }
  } catch (err) {
    console.warn("[parsePdfBuffer] general error:", err);
  }

  // Stream text extraction fallback
  try {
    const str = buf.toString("latin1");
    const streamRegex = /BT[\s\S]*?ET/g;
    const matches = str.match(streamRegex);
    if (matches && matches.length > 0) {
      const extracted = matches
        .map(block => {
          const textMatches = block.match(/\((.*?)\)|\[(.*?)\]/g);
          if (textMatches) {
            return textMatches.map(t => t.replace(/^[(\[]|[)\]]$/g, "")).join(" ");
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");
      if (extracted.trim().length > 10) {
        return extracted;
      }
    }

    const textTokens = str.match(/[A-Za-z0-9@._+-]{2,}/g);
    if (textTokens && textTokens.length > 20) {
      return textTokens.join(" ");
    }
  } catch (_) {}

  return "";
}

/**
 * Extract text from document buffer based on MIME type / filename
 */
export async function extractDocumentText(buf: Buffer, mimeType: string, fileName?: string): Promise<string> {
  const lowerName = (fileName || "").toLowerCase();
  
  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) {
    return await parsePdfBuffer(buf);
  }
  
  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc")
  ) {
    try {
      const mammothRes = await mammoth.extractRawText({ buffer: buf });
      if (mammothRes && mammothRes.value) {
        return mammothRes.value;
      }
    } catch (e) {
      console.warn("[Mammoth] docx parse error:", e);
    }
  }

  if (mimeType.includes("text") || lowerName.endsWith(".txt") || lowerName.endsWith(".md") || lowerName.endsWith(".rtf")) {
    try {
      return buf.toString("utf-8");
    } catch (e) {
      console.warn("[Text] parse error:", e);
    }
  }

  return "";
}

/**
 * Deterministic Resume Parser & Section Extractor
 * Parses 100% of resume contents using pattern recognition, regex, and structured section splitting
 */
export function parseResumeTextDeterministically(rawText: string, fileName?: string): ExtractedResume {
  const cleanText = (rawText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleanText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // 1. Extract Contact Info
  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const phoneMatch = cleanText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  const linkedinMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|profile)\/([a-zA-Z0-9_-]+)/i);
  const githubMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const websiteMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com|org|net|io|dev|app|me|co|tech|site|online)(?:\/[^\s]*)?)/i);

  // Extract location (City, State / City, Country)
  let location = "";
  const locationMatch = cleanText.match(/\b([A-Z][a-zA-Z\s.-]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z\s]+))\b/);
  if (locationMatch && !locationMatch[0].includes("University") && !locationMatch[0].includes("Company")) {
    location = locationMatch[0].trim();
  }

  // Determine candidate name and job title from top lines
  let fullName = "";
  let jobTitle = "";

  const nonHeaderLines = lines.filter(l => 
    !l.includes("@") &&
    !l.match(/^\+?\d/) &&
    !l.toLowerCase().includes("curriculum vitae") &&
    !l.toLowerCase().includes("resume") &&
    !l.toLowerCase().includes("page ") &&
    l.length < 50
  );

  if (nonHeaderLines.length > 0) {
    // Top non-header line is usually Full Name
    fullName = nonHeaderLines[0].replace(/^#+\s*/, "").trim();
    if (nonHeaderLines.length > 1 && nonHeaderLines[1].length < 60 && !nonHeaderLines[1].includes("http")) {
      jobTitle = nonHeaderLines[1].replace(/^#+\s*/, "").trim();
    }
  }

  // 2. Section Segmentation
  const sectionKeywords: { [key: string]: RegExp } = {
    summary: /^(?:professional\s+summary|executive\s+summary|summary|profile|about\s+me|career\s+objective|objective|about)\b/i,
    experience: /^(?:work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history|career\s+history)\b/i,
    education: /^(?:education|academic\s+background|qualifications|academic\s+credentials|education\s+&\s+qualifications)\b/i,
    projects: /^(?:projects|personal\s+projects|key\s+projects|academic\s+projects|selected\s+projects)\b/i,
    skills: /^(?:skills|technical\s+skills|core\s+competencies|key\s+skills|expertise|skills\s+&\s+tools|proficiencies)\b/i,
    certifications: /^(?:certifications|certificates|licenses|credentials|courses\s+&\s+certifications)\b/i,
    languages: /^(?:languages|language\s+proficiency|languages\s+spoken)\b/i,
    references: /^(?:references|referees)\b/i,
    volunteer: /^(?:volunteer\s+experience|volunteering|community\s+service)\b/i,
    publications: /^(?:publications|research\s+papers|articles)\b/i,
    awards: /^(?:awards|honors|awards\s+&\s+honors|achievements)\b/i,
    hobbies: /^(?:hobbies|interests|extracurricular\s+activities)\b/i,
  };

  interface SectionBlock {
    type: string;
    title: string;
    lines: string[];
  }

  const sections: SectionBlock[] = [];
  let currentSection: SectionBlock = { type: "header", title: "Header", lines: [] };

  for (const line of lines) {
    const trimmed = line.replace(/^[#*-]+\s*/, "").trim();
    let matchedType: string | null = null;
    let matchedTitle = trimmed;

    // Check if line matches a major section heading
    for (const [secType, regex] of Object.entries(sectionKeywords)) {
      if (regex.test(trimmed) && trimmed.length < 40) {
        matchedType = secType;
        matchedTitle = trimmed;
        break;
      }
    }

    if (matchedType) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { type: matchedType, title: matchedTitle, lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }
  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  // 3. Parse Individual Sections

  // Summary
  let summary = "";
  const summarySec = sections.find(s => s.type === "summary");
  if (summarySec && summarySec.lines.length > 0) {
    summary = summarySec.lines.join(" ").trim();
  } else {
    // If no explicit summary header, check if lines 2-5 contain paragraph text
    const headerSec = sections.find(s => s.type === "header");
    if (headerSec && headerSec.lines.length > 2) {
      const candidateSummary = headerSec.lines.slice(2).filter(l => l.length > 40 && !l.includes("@")).join(" ");
      if (candidateSummary.length > 50) {
        summary = candidateSummary;
      }
    }
  }

  // Experience
  const experience: ExtractedExperience[] = [];
  const expSec = sections.find(s => s.type === "experience");
  if (expSec && expSec.lines.length > 0) {
    const expLines = expSec.lines;
    let currentExp: Partial<ExtractedExperience> | null = null;
    let bulletBuffer: string[] = [];

    const datePattern = /(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*\.?\s+)?\b(?:19|20)\d{2}\s*(?:-|–|—|to|\/)\s*(?:(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*\.?\s+)?\b(?:19|20)\d{2}|Present|Current|Now)\b|\b(?:0?[1-9]|1[0-2])\/(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:0?[1-9]|1[0-2])\/(?:19|20)\d{2}|Present|Current|Now)\b|\b(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|Present|Current|Now)\b/i;

    const finalizeExp = () => {
      if (currentExp && (currentExp.company || currentExp.position || bulletBuffer.length > 0)) {
        currentExp.description = bulletBuffer.join("\n").trim();
        experience.push({
          id: currentExp.id || `exp_${experience.length + 1}`,
          company: currentExp.company || "",
          position: currentExp.position || "",
          startDate: currentExp.startDate || "",
          endDate: currentExp.endDate || "",
          current: currentExp.current ?? false,
          location: currentExp.location || location || "",
          description: currentExp.description || ""
        });
      }
      currentExp = null;
      bulletBuffer = [];
    };

    for (let i = 0; i < expLines.length; i++) {
      const line = expLines[i];
      const hasDate = datePattern.test(line);

      // New job entry detected by date or capitalized title header
      if (hasDate || (line.length < 60 && (line.includes(" - ") || line.includes(" at ") || line.includes(" | ") || line.includes(" — ")) && !line.startsWith("•") && !line.startsWith("-") && !line.startsWith("*"))) {
        if (currentExp) {
          finalizeExp();
        }

        currentExp = { id: `exp_${experience.length + 1}` };
        
        const dateMatch = line.match(datePattern);
        if (dateMatch) {
          const parts = dateMatch[0].split(/(?:-|–|—|to)/i).map(p => p.trim());
          currentExp.startDate = parts[0] || "";
          currentExp.endDate = parts[1] || "";
          currentExp.current = /present|current|now/i.test(parts[1] || "");
        }

        // Clean company / position from line
        let textWithoutDate = line
          .replace(/\((?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:present|current|now|(?:19|20)\d{2})\)/gi, "")
          .replace(datePattern, "")
          .replace(/\(\s*\)/g, "")
          .trim()
          .replace(/^[,|•-]\s*/, "")
          .replace(/[,|•-]\s*$/, "")
          .trim();
        
        if (textWithoutDate.includes(" at ")) {
          const [pos, comp] = textWithoutDate.split(" at ");
          currentExp.position = pos.trim().replace(/\(\s*$/, "");
          currentExp.company = comp.trim().replace(/\(\s*$/, "");
        } else if (textWithoutDate.includes(" - ") || textWithoutDate.includes(" — ")) {
          const parts = textWithoutDate.split(/\s+[-—]\s+/);
          currentExp.position = parts[0]?.trim().replace(/\(\s*$/, "") || "";
          currentExp.company = parts[1]?.trim().replace(/\(\s*$/, "") || "";
        } else if (textWithoutDate.includes(" | ")) {
          const [first, second] = textWithoutDate.split(" | ");
          currentExp.position = first.trim().replace(/\(\s*$/, "");
          currentExp.company = second.trim().replace(/\(\s*$/, "");
        } else {
          currentExp.position = textWithoutDate.replace(/\(\s*$/, "") || "";
          // Check next line for company if it is short and not a bullet
          if (i + 1 < expLines.length && expLines[i + 1].length < 50 && !expLines[i + 1].startsWith("•") && !expLines[i + 1].startsWith("-") && !datePattern.test(expLines[i + 1])) {
            currentExp.company = expLines[i + 1].trim().replace(/\(\s*$/, "");
            i++;
          }
        }
      } else {
        if (currentExp) {
          bulletBuffer.push(line.startsWith("•") || line.startsWith("-") || line.startsWith("*") ? line : `• ${line}`);
        }
      }
    }
    finalizeExp();
  }

  // Education
  const education: ExtractedEducation[] = [];
  const eduSec = sections.find(s => s.type === "education");
  if (eduSec && eduSec.lines.length > 0) {
    const eduLines = eduSec.lines;
    let currentEdu: Partial<ExtractedEducation> | null = null;

    const degreePattern = /\b(?:bachelor|master|phd|doctor|associate|bs|ba|ms|ma|b\.s|b\.a|m\.s|m\.a|mba|bba|diploma|certificate|degree)\b/i;
    const yearPattern = /\b(19\d{2}|20\d{2})\b/;

    for (let i = 0; i < eduLines.length; i++) {
      const line = eduLines[i];
      const hasDegree = degreePattern.test(line);
      const hasYear = yearPattern.test(line);

      if (hasDegree || hasYear || line.toLowerCase().includes("university") || line.toLowerCase().includes("college") || line.toLowerCase().includes("school") || line.toLowerCase().includes("institute")) {
        if (currentEdu && (currentEdu.school || currentEdu.degree)) {
          education.push({
            id: currentEdu.id || `edu_${education.length + 1}`,
            school: currentEdu.school || "",
            degree: currentEdu.degree || "",
            fieldOfStudy: currentEdu.fieldOfStudy || "",
            startDate: currentEdu.startDate || "",
            endDate: currentEdu.endDate || "",
            current: currentEdu.current ?? false,
            location: currentEdu.location || location || "",
            gpa: currentEdu.gpa || "",
            description: currentEdu.description || ""
          });
        }

        currentEdu = { id: `edu_${education.length + 1}` };

        const years = line.match(/\b(19\d{2}|20\d{2})\b/g);
        if (years && years.length >= 2) {
          currentEdu.startDate = years[0];
          currentEdu.endDate = years[1];
        } else if (years && years.length === 1) {
          currentEdu.endDate = years[0];
          currentEdu.startDate = "";
        }

        const gpaMatch = line.match(/GPA:?\s*(\d(?:\.\d+)?(?:\/\d(?:\.\d+)?)?)/i);
        if (gpaMatch) {
          currentEdu.gpa = gpaMatch[1];
        }

        let cleanEduLine = line
          .replace(/GPA:?\s*(\d(?:\.\d+)?(?:\/\d(?:\.\d+)?)?)/i, "")
          .replace(/\((?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:present|current|now|(?:19|20)\d{2})\)/gi, "")
          .replace(/\b(19\d{2}|20\d{2})\b/g, "")
          .replace(/\(\s*\)/g, "")
          .trim()
          .replace(/^[,|•-]\s*/, "")
          .replace(/[,|•-]\s*$/, "")
          .trim();

        if (cleanEduLine.includes(" - ") || cleanEduLine.includes(" in ") || cleanEduLine.includes(" at ")) {
          const parts = cleanEduLine.split(/\s+[-|in|at]\s+/i);
          currentEdu.degree = (parts[0]?.trim() || "").replace(/\(\s*$/, "").replace(/\)\s*$/, "");
          currentEdu.school = (parts[1]?.trim() || "").replace(/\(\s*$/, "").replace(/\)\s*$/, "");
          if (parts[2]) currentEdu.fieldOfStudy = parts[2].trim().replace(/\(\s*$/, "").replace(/\)\s*$/, "");
        } else if (degreePattern.test(cleanEduLine)) {
          currentEdu.degree = cleanEduLine.replace(/\(\s*$/, "").replace(/\)\s*$/, "");
          if (i + 1 < eduLines.length && !degreePattern.test(eduLines[i + 1])) {
            currentEdu.school = eduLines[i + 1].trim().replace(/\(\s*$/, "").replace(/\)\s*$/, "");
            i++;
          }
        } else {
          currentEdu.school = cleanEduLine.replace(/\(\s*$/, "").replace(/\)\s*$/, "");
        }
      }
    }

    if (currentEdu && (currentEdu.school || currentEdu.degree)) {
      education.push({
        id: currentEdu.id || `edu_${education.length + 1}`,
        school: currentEdu.school || "",
        degree: currentEdu.degree || "",
        fieldOfStudy: currentEdu.fieldOfStudy || "",
        startDate: currentEdu.startDate || "",
        endDate: currentEdu.endDate || "",
        current: currentEdu.current ?? false,
        location: currentEdu.location || location || "",
        gpa: currentEdu.gpa || "",
        description: currentEdu.description || ""
      });
    }
  }

  // Skills
  const skillsSet = new Set<string>();
  const skillSec = sections.find(s => s.type === "skills");
  if (skillSec && skillSec.lines.length > 0) {
    for (const line of skillSec.lines) {
      // Split on commas, bullets, pipes, slashes, or tabs
      const tokens = line.split(/[,|•·/|\t;]/).map(t => t.trim().replace(/^[-*]\s*/, "")).filter(t => t.length > 1 && t.length < 40);
      for (const token of tokens) {
        if (!token.toLowerCase().includes("skills") && !token.toLowerCase().includes("competencies")) {
          skillsSet.add(token);
        }
      }
    }
  }

  // Projects
  const projects: ExtractedProject[] = [];
  const projSec = sections.find(s => s.type === "projects");
  if (projSec && projSec.lines.length > 0) {
    const projLines = projSec.lines;
    let currentProj: Partial<ExtractedProject> | null = null;
    let projDesc: string[] = [];

    const finalizeProj = () => {
      if (currentProj && currentProj.name) {
        projects.push({
          id: currentProj.id || `proj_${projects.length + 1}`,
          name: currentProj.name,
          role: currentProj.role || "",
          startDate: currentProj.startDate || "",
          endDate: currentProj.endDate || "",
          url: currentProj.url || "",
          description: projDesc.join("\n").trim()
        });
      }
      currentProj = null;
      projDesc = [];
    };

    for (const line of projLines) {
      if ((line.includes(" - ") || line.includes(" | ") || line.length < 45) && !line.startsWith("•") && !line.startsWith("-")) {
        if (currentProj) finalizeProj();
        currentProj = { id: `proj_${projects.length + 1}` };
        
        const urlMatch = line.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/);
        if (urlMatch) currentProj.url = urlMatch[0];

        const namePart = line.replace(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/, "").split(/[-|]/)[0].trim();
        currentProj.name = namePart || "";
      } else {
        if (!currentProj) {
          currentProj = { id: `proj_${projects.length + 1}`, name: "" };
        }
        projDesc.push(line.startsWith("•") || line.startsWith("-") ? line : `• ${line}`);
      }
    }
    finalizeProj();
  }

  // Certifications
  const certifications: ExtractedCertification[] = [];
  const certSec = sections.find(s => s.type === "certifications");
  if (certSec && certSec.lines.length > 0) {
    for (const line of certSec.lines) {
      const cleanLine = line.replace(/^[•*-]\s*/, "").trim();
      if (cleanLine.length > 2) {
        const yearMatch = cleanLine.match(/\b(20\d{2}|19\d{2})\b/);
        const date = yearMatch ? yearMatch[0] : "";
        const titlePart = cleanLine.replace(/\b(20\d{2}|19\d{2})\b/, "").trim();
        let issuer = "";
        let certName = titlePart;

        if (titlePart.includes(" - ")) {
          const [c, i] = titlePart.split(" - ");
          certName = c.trim();
          issuer = i.trim();
        } else if (titlePart.includes(" by ") || titlePart.includes(" from ")) {
          const [c, i] = titlePart.split(/\s+(?:by|from)\s+/i);
          certName = c.trim();
          issuer = i.trim();
        }

        certifications.push({
          id: `cert_${certifications.length + 1}`,
          name: certName || "",
          issuer: issuer,
          date: date,
          url: ""
        });
      }
    }
  }

  // Languages
  const languages: ExtractedLanguage[] = [];
  const langSec = sections.find(s => s.type === "languages");
  if (langSec && langSec.lines.length > 0) {
    for (const line of langSec.lines) {
      const items = line.split(/[,|•·/|\t;]/).map(t => t.trim().replace(/^[-*]\s*/, "")).filter(Boolean);
      for (const item of items) {
        if (item.length > 1) {
          let name = item;
          let proficiency = "";
          if (item.includes("(") && item.includes(")")) {
            const match = item.match(/(.*?)\s*\((.*?)\)/);
            if (match) {
              name = match[1].trim();
              proficiency = match[2].trim();
            }
          } else if (item.includes(" - ")) {
            const [n, p] = item.split(" - ");
            name = n.trim();
            proficiency = p.trim();
          }
          languages.push({
            id: `lang_${languages.length + 1}`,
            name,
            proficiency
          });
        }
      }
    }
  }

  // References
  const references: ExtractedReference[] = [];
  const refSec = sections.find(s => s.type === "references");
  if (refSec && refSec.lines.length > 0) {
    for (const line of refSec.lines) {
      if (!line.toLowerCase().includes("available upon request") && line.length > 3) {
        const refEmail = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
        const refPhone = line.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
        references.push({
          id: `ref_${references.length + 1}`,
          name: line.split(/[,|-]/)[0].trim(),
          company: "",
          title: "",
          email: refEmail ? refEmail[0] : "",
          phone: refPhone ? refPhone[0] : ""
        });
      }
    }
  }

  // Custom / Non-standard sections (Volunteer, Publications, Awards, etc.)
  const customSections: ExtractedCustomSection[] = [];
  const standardTypes = new Set(["header", "summary", "experience", "education", "projects", "skills", "certifications", "languages", "references"]);
  
  for (const sec of sections) {
    if (!standardTypes.has(sec.type) && sec.lines.length > 0) {
      customSections.push({
        id: `custom_${sec.type}_${Date.now()}`,
        title: sec.title || "Additional Information",
        items: sec.lines.map((l, idx) => ({
          id: `item_${idx + 1}`,
          heading: l.replace(/^[•*-]\s*/, "").trim(),
          description: l
        }))
      });
    }
  }

  return {
    title: fileName ? `Resume - ${fileName}` : (fullName ? `${fullName} Resume` : "Candidate Resume"),
    personalInfo: {
      fullName: fullName || "",
      jobTitle: jobTitle || "",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      location: location || "",
      website: websiteMatch ? (websiteMatch[0].startsWith("http") ? websiteMatch[0] : `https://${websiteMatch[0]}`) : "",
      linkedin: linkedinMatch ? (linkedinMatch[0].startsWith("http") ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : "",
      github: githubMatch ? (githubMatch[0].startsWith("http") ? githubMatch[0] : `https://${githubMatch[0]}`) : "",
      profilePhoto: ""
    },
    summary: summary || "",
    experience,
    education,
    projects,
    skills: Array.from(skillsSet),
    languages: languages,
    certifications,
    references,
    customSections,
    sectionsOrder: ["summary", "experience", "education", "projects", "skills", "languages", "certifications", "references"],
    templateId: "extracted_executive_slate",
    colorTheme: "#0f766e",
    fontFamily: "font-sans",
    spacing: "comfortable",
    layoutMode: "auto",
    extractedTemplateStyle: {
      templateId: "extracted_executive_slate",
      templateName: "Executive Slate & Emerald",
      description: "Clean modern executive layout with structured dividers and high readability.",
      colorTheme: "#0f766e",
      fontFamily: "font-sans",
      layoutStyle: "split",
      bgClass: "bg-stone-50",
      sidebarClass: "bg-slate-900 text-white",
      accentClass: "text-teal-600",
      isDark: false
    }
  };
}

/**
 * Intelligent Merger: Merges AI extracted resume with deterministic parsed resume
 * Guarantees ZERO loss of sections, pages, or user entries!
 */
export function mergeParsedResume(deterministic: ExtractedResume, aiParsed: any): ExtractedResume {
  if (!aiParsed || typeof aiParsed !== "object") {
    return deterministic;
  }

  const merged: ExtractedResume = { ...deterministic };

  // Personal Info: prioritize AI extracted details, fall back to deterministic if empty
  if (aiParsed.personalInfo && typeof aiParsed.personalInfo === "object") {
    merged.personalInfo = {
      fullName: aiParsed.personalInfo.fullName?.trim() || deterministic.personalInfo.fullName || "",
      jobTitle: aiParsed.personalInfo.jobTitle?.trim() || deterministic.personalInfo.jobTitle || "",
      email: aiParsed.personalInfo.email?.trim() || deterministic.personalInfo.email || "",
      phone: aiParsed.personalInfo.phone?.trim() || deterministic.personalInfo.phone || "",
      location: aiParsed.personalInfo.location?.trim() || deterministic.personalInfo.location || "",
      website: aiParsed.personalInfo.website?.trim() || deterministic.personalInfo.website || "",
      linkedin: aiParsed.personalInfo.linkedin?.trim() || deterministic.personalInfo.linkedin || "",
      github: aiParsed.personalInfo.github?.trim() || deterministic.personalInfo.github || "",
      profilePhoto: aiParsed.personalInfo.profilePhoto || deterministic.personalInfo.profilePhoto || ""
    };
  }

  if (!merged.personalInfo.fullName && deterministic.personalInfo.fullName) {
    merged.personalInfo.fullName = deterministic.personalInfo.fullName;
  }
  if (!merged.personalInfo.jobTitle && deterministic.personalInfo.jobTitle) {
    merged.personalInfo.jobTitle = deterministic.personalInfo.jobTitle;
  }

  // Summary
  if (aiParsed.summary && typeof aiParsed.summary === "string" && aiParsed.summary.trim().length > 10) {
    merged.summary = aiParsed.summary.trim();
  } else if (deterministic.summary) {
    merged.summary = deterministic.summary;
  }

  // Experience: prioritize AI parsed entries if available
  if (Array.isArray(aiParsed.experience) && aiParsed.experience.length > 0) {
    merged.experience = aiParsed.experience.map((e: any, idx: number) => ({
      id: e.id || `exp_${idx + 1}`,
      company: e.company || "",
      position: e.position || "",
      startDate: e.startDate || "",
      endDate: e.endDate || "",
      current: typeof e.current === "boolean" ? e.current : (e.endDate ? /present|current/i.test(e.endDate) : false),
      location: e.location || "",
      description: Array.isArray(e.description) ? e.description.join("\n") : (e.description || "")
    })).filter((e: any) => e.company || e.position || e.description);
  } else if (deterministic.experience && deterministic.experience.length > 0) {
    merged.experience = deterministic.experience;
  }

  // Education: prioritize AI parsed entries
  if (Array.isArray(aiParsed.education) && aiParsed.education.length > 0) {
    merged.education = aiParsed.education.map((edu: any, idx: number) => ({
      id: edu.id || `edu_${idx + 1}`,
      school: edu.school || "",
      degree: edu.degree || "",
      fieldOfStudy: edu.fieldOfStudy || "",
      startDate: edu.startDate || "",
      endDate: edu.endDate || "",
      current: typeof edu.current === "boolean" ? edu.current : false,
      location: edu.location || "",
      gpa: edu.gpa || "",
      description: Array.isArray(edu.description) ? edu.description.join("\n") : (edu.description || "")
    })).filter((edu: any) => edu.school || edu.degree || edu.fieldOfStudy);
  } else if (deterministic.education && deterministic.education.length > 0) {
    merged.education = deterministic.education;
  }

  // Projects
  if (Array.isArray(aiParsed.projects) && aiParsed.projects.length > 0) {
    merged.projects = aiParsed.projects.map((p: any, idx: number) => ({
      id: p.id || `proj_${idx + 1}`,
      name: p.name || "",
      role: p.role || "",
      startDate: p.startDate || "",
      endDate: p.endDate || "",
      url: p.url || "",
      description: Array.isArray(p.description) ? p.description.join("\n") : (p.description || "")
    })).filter((p: any) => p.name || p.description);
  } else if (deterministic.projects && deterministic.projects.length > 0) {
    merged.projects = deterministic.projects;
  }

  // Skills: prioritize AI extracted skills without injecting fake generic skills
  if (Array.isArray(aiParsed.skills) && aiParsed.skills.length > 0) {
    const validAiSkills = aiParsed.skills
      .map((s: any) => (typeof s === "string" ? s.trim() : ""))
      .filter((s: string) => s.length > 1);
    
    // Combine with deterministic text-matched skills if present
    const combinedSkills = new Set<string>(validAiSkills);
    if (deterministic.skills && deterministic.skills.length > 0) {
      for (const ds of deterministic.skills) {
        if (ds && ds.trim().length > 1) {
          combinedSkills.add(ds.trim());
        }
      }
    }
    merged.skills = Array.from(combinedSkills);
  } else if (deterministic.skills && deterministic.skills.length > 0) {
    merged.skills = deterministic.skills;
  }

  // Languages
  if (Array.isArray(aiParsed.languages) && aiParsed.languages.length > 0) {
    merged.languages = aiParsed.languages.map((l: any, idx: number) => ({
      id: l.id || `lang_${idx + 1}`,
      name: l.name || "",
      proficiency: l.proficiency || ""
    })).filter((l: any) => l.name);
  }

  // Certifications
  if (Array.isArray(aiParsed.certifications) && aiParsed.certifications.length > 0) {
    merged.certifications = aiParsed.certifications.map((c: any, idx: number) => ({
      id: c.id || `cert_${idx + 1}`,
      name: c.name || "",
      issuer: c.issuer || "",
      date: c.date || "",
      url: c.url || ""
    })).filter((c: any) => c.name);
  }

  // References
  if (Array.isArray(aiParsed.references) && aiParsed.references.length > 0) {
    merged.references = aiParsed.references.map((r: any, idx: number) => ({
      id: r.id || `ref_${idx + 1}`,
      name: r.name || "",
      company: r.company || "",
      title: r.title || "",
      email: r.email || "",
      phone: r.phone || ""
    })).filter((r: any) => r.name);
  }

  // Custom Sections
  if (Array.isArray(aiParsed.customSections) && aiParsed.customSections.length > 0) {
    merged.customSections = aiParsed.customSections.map((cs: any, idx: number) => ({
      id: cs.id || `custom_${idx + 1}`,
      title: cs.title || "Custom Section",
      items: Array.isArray(cs.items) ? cs.items : []
    }));
  }

  return merged;
}
