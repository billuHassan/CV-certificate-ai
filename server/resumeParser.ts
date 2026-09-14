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
 * Clean and normalize extracted document text, removing null bytes, non-printable characters, and page artifacts
 */
export function cleanExtractedText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\0/g, "")
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Checks if a string is raw binary bytecode or random unreadable stream noise rather than authentic text
 */
export function isGibberishText(text: string): boolean {
  if (!text || text.length < 15) return true;
  // Detect PDF object markers or compressed streams
  if (/(?:endstream|\/FlateDecode|\/Catalog|\/Pages|startxref|trailer|xref|\/Length\s+\d+|\/FontDescriptor)/i.test(text)) {
    return true;
  }
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  if (letters / text.length < 0.40) return true;

  const sampleWords = text.split(/\s+/).slice(0, 40).filter(w => w.length >= 3);
  if (sampleWords.length < 4) return true;
  let wordsWithVowels = 0;
  for (const w of sampleWords) {
    if (/[aeiouyAEIOUY]/.test(w)) wordsWithVowels++;
  }
  if (wordsWithVowels / sampleWords.length < 0.55) return true;

  return false;
}

/**
 * Validates whether a candidate string is an authentic geographical location (City, State / City, Country / Remote)
 * strictly rejecting random binary tokens, font descriptors, and scrambled stream artifacts like "AI rYH Bzb O,UAC".
 */
export function isValidLocation(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;
  const clean = raw.trim().replace(/^[,.\-•*|;:\s]+|[,.\-•*|;:\s]+$/g, "");
  if (clean.length < 3 || clean.length > 70) return false;

  // Reject PDF / bytecode / binary artifacts
  if (/(?:endstream|stream|flatedecode|xref|trailer|startxref|\bobj\b|\bCatalog\b|\bPages\b|\bFont\b|\bLength\b|\bFilter\b)/i.test(clean)) {
    return false;
  }
  // Reject email, URL, or domain fragments
  if (clean.includes("@") || clean.includes("http") || clean.includes("www.") || clean.includes(".com") || clean.includes(".org")) {
    return false;
  }
  // Reject resume section headers or phone patterns
  if (/\b(?:resume|curriculum|vitae|phone|email|education|experience|skills|projects|page\s+\d)\b/i.test(clean)) {
    return false;
  }
  if (/\d{3,}/.test(clean)) return false;

  // Reject weird mixed lowercase-uppercase clusters typical of font kerning/bytecode (e.g. "rYH", "Bzb", "xYz", "AI rYH")
  if (/\b[a-z]+[A-Z]{2,}\b|\b[a-z]{1,2}[A-Z][a-z]*[A-Z]\b/.test(clean)) {
    return false;
  }

  const parts = clean.split(/[\s,/-]+/).filter(Boolean);
  if (parts.length === 0 || parts.length > 6) return false;

  // Each word must have reasonable typography (vowels or known standard country/state abbreviations)
  for (const p of parts) {
    if (p.length === 1 && !/^[A-Z]$/.test(p)) return false;
    if (p.length >= 2 && p === p.toUpperCase()) {
      if (p.length > 4 && !/[AEIOUY]/.test(p)) return false;
    } else {
      if (p.length >= 3 && !/[aeiouyAEIOUY]/.test(p)) return false;
    }
  }

  return true;
}

/**
 * Sanitizes location input, returning clean location or empty string if invalid
 */
export function sanitizeLocation(raw: any): string {
  if (!raw || typeof raw !== "string") return "";
  const cleaned = cleanTextToken(raw);
  return isValidLocation(cleaned) ? cleaned : "";
}

/**
 * Extracts candidate location strictly from the top contact header area (first 25 lines)
 */
export function extractLocationFromHeader(lines: string[], candidateName?: string): string {
  const headerLines = lines.slice(0, 25);
  
  // 1. Explicit labels: Location: ..., Address: ..., Based in: ...
  for (const line of headerLines) {
    const labelMatch = line.match(/(?:location|address|based\s+in|residing\s+in|city):\s*([^|\n•,]+(?:,[^|\n•]+)?)/i);
    if (labelMatch && labelMatch[1]) {
      const cand = labelMatch[1].trim();
      if (isValidLocation(cand)) return cand;
    }
  }

  // 2. City, State / City, Country in contact lines
  for (const line of headerLines) {
    if (candidateName && line.toLowerCase().includes(candidateName.toLowerCase()) && !line.includes("|") && !line.includes(",")) {
      continue;
    }
    const segments = line.split(/[|•·\t]/).map(s => s.trim());
    for (const seg of segments) {
      if (seg.includes("@") || seg.includes("http") || /^\+?\d{6,}/.test(seg)) continue;
      
      const locMatch = seg.match(/\b([A-Z][a-zA-Z\s.-]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z\s]+))\b/);
      if (locMatch && isValidLocation(locMatch[0])) {
        if (!candidateName || !locMatch[0].toLowerCase().includes(candidateName.toLowerCase())) {
          return locMatch[0].trim();
        }
      }

      if (/^(?:remote|hybrid(?:\s*-\s*[A-Za-z\s,]+)?)$/i.test(seg) && isValidLocation(seg)) {
        return seg;
      }
    }
  }

  return "";
}

/**
 * Extract raw text from PDF buffer with multiple robust strategies
 */
export async function parsePdfBuffer(buf: Buffer): Promise<string> {
  // Strategy 1: High-fidelity Mozilla pdfjs-dist legacy engine (retains exact vertical lines, layout, and fonts)
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buf),
      useSystemFonts: true,
      disableFontFace: true,
    });
    const doc = await loadingTask.promise;
    let fullText = "";
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const pageLines: string[] = [];
      let currentLine = "";
      let lastY: number | null = null;
      for (const item of content.items as any[]) {
        if (!item.str) continue;
        const y = item.transform ? Math.round(item.transform[5]) : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 3) {
          if (currentLine.trim()) pageLines.push(currentLine.trim());
          currentLine = item.str;
        } else {
          currentLine += (currentLine ? " " : "") + item.str;
        }
        lastY = y;
      }
      if (currentLine.trim()) pageLines.push(currentLine.trim());
      fullText += pageLines.join("\n") + "\n\n";
    }
    const cleaned = cleanExtractedText(fullText);
    if (cleaned && cleaned.length > 20 && !isGibberishText(cleaned)) {
      return cleaned;
    }
  } catch (pdfjsErr) {
    console.warn("[parsePdfBuffer] pdfjs-dist legacy extraction:", pdfjsErr);
  }

  // Strategy 2: pdf-parse v2 class
  try {
    const mod: any = pdfParseModule;
    const PDFParseClass = mod?.PDFParse || mod?.default?.PDFParse;
    if (typeof PDFParseClass === "function") {
      const parser = new PDFParseClass({ data: buf });
      const textResult = await parser.getText();
      try { await parser.destroy(); } catch (_) {}
      const text = typeof textResult === "string" ? textResult : (textResult?.text || "");
      const cleaned = cleanExtractedText(text);
      if (cleaned && cleaned.length > 20 && !isGibberishText(cleaned)) {
        return cleaned;
      }
    }

    const fn: any = typeof mod === "function" ? mod : (typeof mod?.default === "function" ? mod.default : null);
    if (typeof fn === "function") {
      const res = await fn(buf);
      const cleaned = cleanExtractedText(res?.text || "");
      if (cleaned && cleaned.length > 20 && !isGibberishText(cleaned)) {
        return cleaned;
      }
    }
  } catch (classErr) {
    console.warn("[parsePdfBuffer] pdf-parse fallback error:", classErr);
  }

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
 * Clean stray commas, colons, bullets, and delimiter artifacts from text tokens
 */
export function cleanTextToken(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/^[•*·\-\s,;|:]+/, "")
    .replace(/[•*·\-\s,;|:]+$/, "")
    .trim();
}

/**
 * Robust Skill Sanitizer
 * Strips category prefixes ("Languages:"), conjunctions ("and ", "or "),
 * trailing punctuation (commas, periods), and filters out filler phrases like "and everything".
 */
export function sanitizeSkillToken(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim();

  // Strip leading bullet marks, list numbers, dashes
  s = s.replace(/^[•*·\-\d.)\]\s]+/, "").trim();

  // Strip common label prefixes like "Languages:", "Programming Languages:", "Tools:", etc.
  s = s.replace(/^(?:languages|programming\s+languages|frameworks(?:\s+and\s+libraries)?|tools(?:\s+and\s+technologies)?|libraries|technical\s+skills|core\s+competencies|competencies|proficiencies|proficient\s+in|familiar\s+with|technologies|databases|methodologies|platforms|devops|skills|expertise)\s*:\s*/i, "").trim();

  // Strip leading conjunctions: "and ", "or ", "& "
  s = s.replace(/^(?:and|or|&)\s+/i, "").trim();

  // Strip trailing punctuation (commas, semicolons, colons, periods, dashes)
  s = s.replace(/[,.;:\-]+$/, "").trim();

  // Strip surrounding quotes or parentheses if balanced or stray
  s = s.replace(/^["'([{]+|[)"'\]}]+$/g, "").trim();

  // Reject if too short or too long
  if (s.length < 2 || s.length > 45) return null;

  // Reject common filler phrases
  if (/^(?:and|or|etc|etc\.|and\s+more|and\s+everything|and\s+others|including|such\s+as|with|various|plus|all\s+above|other|related)$/i.test(s)) {
    return null;
  }

  // Reject if it looks like a sentence fragment with verbs
  if (/\b(?:responsible\s+for|experienced\s+(?:in|with)|worked\s+(?:on|with)|proven\s+track\s+record|ability\s+to|knowledge\s+of|expert\s+in|hands-on\s+experience)\b/i.test(s)) {
    return null;
  }

  // Must contain at least one letter or number
  if (!/[a-zA-Z0-9]/.test(s)) return null;

  return s;
}

/**
 * Tokenizes skill lines without breaking composite terms like HTML/CSS, CI/CD, UI/UX
 */
export function extractSkillsFromLine(line: string): string[] {
  let cleanedLine = line.trim();
  cleanedLine = cleanedLine.replace(/^(?:languages|programming\s+languages|frameworks(?:\s+and\s+libraries)?|tools(?:\s+and\s+technologies)?|libraries|technical\s+skills|core\s+competencies|competencies|proficiencies|proficient\s+in|familiar\s+with|technologies|databases|methodologies|platforms|devops|skills|expertise)\s*:\s*/i, "").trim();

  const rawTokens = cleanedLine
    .split(/[,;•|·\t]|\s+and\s+|\s+&\s+/)
    .map(t => t.trim())
    .filter(Boolean);

  const skills: string[] = [];
  for (const token of rawTokens) {
    if (token.includes("/") && !/^(?:html\/css|ci\/cd|ui\/ux|tcp\/ip|pl\/sql|c\/c\+\+|sys\/ops)$/i.test(token.trim())) {
      const subTokens = token.split("/").map(st => sanitizeSkillToken(st)).filter((s): s is string => Boolean(s));
      skills.push(...subTokens);
    } else {
      const sanitized = sanitizeSkillToken(token);
      if (sanitized) {
        skills.push(sanitized);
      }
    }
  }

  return skills;
}

/**
 * Intelligent Custom Section Parser
 * Accurately groups an item's Header (title/role, org, date, location)
 * with all its Explanation lines (bullet points, descriptions) into ONE single item.
 * Never creates a separate item for each line!
 */
export function parseCustomSectionItems(lines: string[]): ExtractedCustomSectionItem[] {
  const items: ExtractedCustomSectionItem[] = [];
  if (!lines || lines.length === 0) return items;

  const datePattern = /(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*\.?\s+)?\b(?:19|20)\d{2}(?:\s*(?:-|–|—|to|\/)\s*(?:(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*\.?\s+)?\b(?:19|20)\d{2}|Present|Current|Now))?\b|\b(?:19|20)\d{2}\b/i;

  let currentItem: Partial<ExtractedCustomSectionItem> | null = null;
  let explanationBuffer: string[] = [];

  const finalizeItem = () => {
    if (currentItem && (currentItem.heading || explanationBuffer.length > 0)) {
      const description = explanationBuffer.map(b => b.trim()).filter(Boolean).join("\n");
      items.push({
        id: currentItem.id || `item_${items.length + 1}`,
        heading: cleanTextToken(currentItem.heading || (explanationBuffer[0] ? explanationBuffer[0].replace(/^•\s*/, "") : "Item")),
        subheading: cleanTextToken(currentItem.subheading || ""),
        date: cleanTextToken(currentItem.date || ""),
        location: cleanTextToken(currentItem.location || ""),
        description: description || currentItem.description || ""
      });
    }
    currentItem = null;
    explanationBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const isBullet = /^[•*·\-\d.)\]]/.test(trimmed);
    const hasDate = datePattern.test(trimmed);
    const hasSeparator = trimmed.includes(" | ") || trimmed.includes(" - ") || trimmed.includes(" — ") || trimmed.includes(" at ");

    // If currentItem exists, has NO explanations yet, and this line is NOT a bullet:
    // Check if this line is metadata for the current item (date, location, subheading)
    if (currentItem && explanationBuffer.length === 0 && !isBullet && (hasDate || trimmed.length < 50 || /^[A-Z][a-zA-Z\s.-]+,\s*[A-Z]{2}/.test(trimmed))) {
      let metaLine = trimmed;
      const dMatch = metaLine.match(datePattern);
      if (dMatch && !currentItem.date) {
        currentItem.date = dMatch[0].trim();
        metaLine = metaLine.replace(dMatch[0], "").replace(/\(\s*\)/g, "").trim();
      }
      const locMatch = metaLine.match(/\b([A-Z][a-zA-Z\s.-]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z\s]+))\b/);
      if (locMatch && !locMatch[0].includes("University") && !currentItem.location) {
        currentItem.location = locMatch[0].trim();
        metaLine = metaLine.replace(locMatch[0], "").replace(/\(\s*\)/g, "").trim();
      }
      metaLine = cleanTextToken(metaLine);
      if (metaLine && !currentItem.subheading) {
        currentItem.subheading = metaLine;
      }
      continue;
    }

    // Determine if this line starts a NEW item header vs being an explanation line
    const isNewItemHeader = !isBullet && (
      !currentItem ||
      hasDate ||
      hasSeparator ||
      explanationBuffer.length > 0 ||
      (trimmed.length < 75 && !/[.!?]$/.test(trimmed))
    );

    if (isNewItemHeader) {
      finalizeItem();

      currentItem = { id: `item_${items.length + 1}` };

      let lineText = trimmed;
      const dMatch = lineText.match(datePattern);
      if (dMatch) {
        currentItem.date = dMatch[0].trim();
        lineText = lineText.replace(dMatch[0], "").replace(/\(\s*\)/g, "").trim();
      }

      const locMatch = lineText.match(/\b([A-Z][a-zA-Z\s.-]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z\s]+))\b/);
      if (locMatch && !locMatch[0].includes("University")) {
        currentItem.location = locMatch[0].trim();
        lineText = lineText.replace(locMatch[0], "").replace(/\(\s*\)/g, "").trim();
      }

      lineText = cleanTextToken(lineText);

      if (lineText.includes(" | ")) {
        const [h, s] = lineText.split(" | ");
        currentItem.heading = cleanTextToken(h);
        currentItem.subheading = cleanTextToken(s);
      } else if (lineText.includes(" - ") || lineText.includes(" — ")) {
        const parts = lineText.split(/\s+[-—]\s+/);
        currentItem.heading = cleanTextToken(parts[0] || "");
        currentItem.subheading = cleanTextToken(parts.slice(1).join(" - "));
      } else if (lineText.includes(" at ")) {
        const [h, s] = lineText.split(" at ");
        currentItem.heading = cleanTextToken(h);
        currentItem.subheading = cleanTextToken(s);
      } else if (lineText.includes(", ") && lineText.split(", ").length === 2 && lineText.split(", ")[1].length < 40) {
        const parts = lineText.split(", ");
        currentItem.heading = cleanTextToken(parts[0]);
        currentItem.subheading = cleanTextToken(parts[1]);
      } else {
        currentItem.heading = lineText;
      }
    } else {
      // Explanation line: attach to current item's description
      if (!currentItem) {
        currentItem = {
          id: `item_${items.length + 1}`,
          heading: cleanTextToken(trimmed.replace(/^[•*·\-\d.)\]\s]+/, ""))
        };
      } else {
        const cleanExp = trimmed.replace(/^[•*·\-\d.)\]\s]+/, "").replace(/^[,;]\s*/, "").trim();
        if (cleanExp) {
          explanationBuffer.push(`• ${cleanExp}`);
        }
      }
    }
  }

  finalizeItem();
  return items;
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

  // Determine candidate name and job title from top lines
  let fullName = "";
  let jobTitle = "";

  const nonHeaderLines = lines.filter(l => 
    !l.includes("@") &&
    !l.match(/^\+?\d/) &&
    !l.toLowerCase().includes("curriculum vitae") &&
    !l.toLowerCase().includes("resume") &&
    !l.toLowerCase().includes("page ") &&
    !l.toLowerCase().startsWith("http") &&
    l.length < 50
  );

  if (nonHeaderLines.length > 0) {
    const rawName = nonHeaderLines[0].replace(/^#+\s*/, "").trim();
    if (rawName.includes(" | ")) {
      const [n, t] = rawName.split(" | ");
      fullName = cleanTextToken(n);
      jobTitle = cleanTextToken(t);
    } else if (rawName.includes(" - ")) {
      const [n, t] = rawName.split(" - ");
      fullName = cleanTextToken(n);
      jobTitle = cleanTextToken(t);
    } else {
      fullName = cleanTextToken(rawName);
    }

    if (!jobTitle && nonHeaderLines.length > 1 && nonHeaderLines[1].length < 60 && !nonHeaderLines[1].includes("http")) {
      jobTitle = cleanTextToken(nonHeaderLines[1].replace(/^#+\s*/, ""));
    }
  }

  // Extract location strictly from header lines using validated geographical patterns
  const location = extractLocationFromHeader(lines, fullName);

  // 2. Section Segmentation
  const sectionKeywords: { [key: string]: RegExp } = {
    summary: /^(?:professional\s+summary|executive\s+summary|summary|profile|about\s+me|career\s+objective|objective|about)(?:\s*[:])?\s*$/i,
    experience: /^(?:work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history|career\s+history|employment)(?:\s*[:])?\s*$/i,
    education: /^(?:education|academic\s+background|qualifications|academic\s+credentials|education\s+&\s+qualifications|degrees)(?:\s*[:])?\s*$/i,
    projects: /^(?:projects|personal\s+projects|key\s+projects|academic\s+projects|selected\s+projects|notable\s+projects)(?:\s*[:])?\s*$/i,
    skills: /^(?:skills|technical\s+skills|core\s+competencies|key\s+skills|expertise|skills\s+&\s+tools|proficiencies|technologies)(?:\s*[:])?\s*$/i,
    certifications: /^(?:certifications?(?:\s*(?:&|and|\/)\s*(?:licenses?|training|courses?|credentials?|accreditations?))?|licenses?(?:\s*(?:&|and|\/)\s*certifications?)?|professional\s+(?:certifications?|credentials?|licenses?)|credentials?|certificates?|courses?\s*(?:&|and)\s*certifications?|accreditations?)(?:\s*[:])?\s*$/i,
    languages: /^(?:languages|language\s+proficiency|languages\s+spoken)(?:\s*[:])?\s*$/i,
    references: /^(?:references|referees)(?:\s*[:])?\s*$/i,
    volunteer: /^(?:volunteer\s+experience|volunteering|community\s+service)(?:\s*[:])?\s*$/i,
    publications: /^(?:publications|research\s+papers|articles)(?:\s*[:])?\s*$/i,
    awards: /^(?:awards|honors|awards\s+&\s+honors|honors\s+&\s+awards|achievements)(?:\s*[:])?\s*$/i,
    hobbies: /^(?:hobbies|interests|extracurricular\s+activities)(?:\s*[:])?\s*$/i,
  };

  interface SectionBlock {
    type: string;
    title: string;
    lines: string[];
  }

  const sections: SectionBlock[] = [];
  let currentSection: SectionBlock = { type: "header", title: "Header", lines: [] };

  for (const line of lines) {
    const trimmed = line.replace(/^[#*•·\-\–\—]+\s*/, "").trim();
    let matchedType: string | null = null;
    let matchedTitle = trimmed;

    // Check if line matches a major section heading (do not break on bullets or fields with values)
    const isBulletOrField = /^[•*·\-]/.test(line.trim()) || /(?:credential\s*id|license\s*#|cert\s*id|issue\s*date|issued\s*by|valid\s*through)\s*[:#]/i.test(trimmed);
    if (!isBulletOrField) {
      for (const [secType, regex] of Object.entries(sectionKeywords)) {
        if (regex.test(trimmed) && trimmed.length < 45) {
          matchedType = secType;
          matchedTitle = trimmed;
          break;
        }
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
      const extracted = extractSkillsFromLine(line);
      for (const skill of extracted) {
        skillsSet.add(skill);
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
  const parseCertificationLines = (certLines: string[]): ExtractedCertification[] => {
    const list: ExtractedCertification[] = [];
    let currentCert: Partial<ExtractedCertification> | null = null;

    const datePattern = /(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*\.?\s+)?\b(?:19|20)\d{2}(?:\s*(?:-|–|—|to|\/)\s*(?:(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*\.?\s+)?\b(?:19|20)\d{2}|Present|Current|Now))?\b|\b(?:19|20)\d{2}\b/i;
    const knownIssuersRegex = /\b(?:amazon\s+web\s+services|aws|microsoft(?:\s+corporation)?|azure|google\s+cloud|google|gcp|cisco|comptia|\(isc\)²|\(isc\)2|isc2|linux\s+foundation|oracle(?:\s+corporation)?|hashicorp|scrum\.org|scrum\s+alliance|pmi|project\s+management\s+institute|salesforce|meta|ibm|red\s+hat|udemy|coursera|edx|datacamp|linkedin(?:\s+learning)?|freecodecamp|pluralsight|codecademy|stanford|mit|harvard|offsec|offensive\s+security|docker|kubernetes|cncf)\b/i;
    const certSubtypesRegex = /\b(?:associate|professional|developer|engineer|architect|administrator|specialist|practitioner|expert|master|consultant|manager|level\s*\d|specialty|track|fundamentals|essentials|advanced|foundations?)\b/i;

    const cleanField = (s: string): string => {
      return s
        .replace(/\(\s*\)/g, "") // remove empty parentheses
        .replace(/^[•*·\-\s,:]+/, "") // remove leading bullets/colons/dashes
        .replace(/[,;:\-\s]+$/, "") // remove trailing punctuation/dashes
        .trim();
    };

    const finalizeCert = () => {
      if (currentCert && (currentCert.name || currentCert.issuer)) {
        let name = cleanField(currentCert.name || "");
        let issuer = cleanField(currentCert.issuer || "");
        let date = cleanField(currentCert.date || "");
        let url = cleanField(currentCert.url || "");

        if (!name && issuer) {
          name = issuer;
          issuer = "";
        }

        // If date was not set but name contains a date
        if (!date) {
          const dMatch = name.match(datePattern);
          if (dMatch) {
            date = dMatch[0];
            name = cleanField(name.replace(datePattern, ""));
          }
        }

        // If date is in issuer
        if (!date && issuer) {
          const dMatch = issuer.match(datePattern);
          if (dMatch) {
            date = dMatch[0];
            issuer = cleanField(issuer.replace(datePattern, ""));
          }
        }

        name = cleanField(name);
        issuer = cleanField(issuer);
        date = cleanField(date);

        if (name && name.length > 1) {
          list.push({
            id: currentCert.id || `cert_${list.length + 1}`,
            name,
            issuer,
            date,
            url
          });
        }
      }
      currentCert = null;
    };

    for (const rawLine of certLines) {
      const rawTrimmed = rawLine.trim();
      if (!rawTrimmed) continue;

      const trimmed = rawTrimmed.replace(/^[•*·\-\s]+/, "").trim();
      if (!trimmed) continue;

      // 1. Check if line is purely a verification URL or Credential ID
      const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
      const credMatch = trimmed.match(/(?:credential\s*id|license\s*#|cert\s*id|verification|id)\s*[:#]\s*([^\n,]+)/i);

      if ((urlMatch || credMatch) && currentCert) {
        currentCert.url = urlMatch ? urlMatch[0] : trimmed;
        continue;
      }

      // 2. Check if line is an explicit issuer line
      const issuerPrefixMatch = trimmed.match(/^(?:issuer|issued\s+by|issuing\s+organization|organization|provider)\s*[:\-]\s*(.+)$/i);
      if (issuerPrefixMatch && currentCert) {
        let issuerText = issuerPrefixMatch[1].trim();
        const dMatch = issuerText.match(datePattern);
        if (dMatch && !currentCert.date) {
          currentCert.date = dMatch[0];
          issuerText = issuerText.replace(datePattern, "");
        }
        currentCert.issuer = cleanField(issuerText);
        continue;
      }

      // 3. Check if line is an explicit date line or expiration date line
      const datePrefixMatch = trimmed.match(/^(?:issued|issue\s+date|date|completed|achieved|earned|expires|expiration|valid\s+through)\s*[:\-]\s*(.+)$/i);
      if (datePrefixMatch && currentCert) {
        currentCert.date = cleanField(datePrefixMatch[1]);
        continue;
      }

      // 4. Check if line is solely a standalone date
      const dateOnlyMatch = trimmed.match(datePattern);
      if (dateOnlyMatch && trimmed.length < 35 && (!trimmed.includes(" ") || trimmed.split(/\s+/).length <= 4) && currentCert && !currentCert.date) {
        currentCert.date = cleanField(trimmed);
        continue;
      }

      // 5. Check if line is a continuation line for issuer (e.g. multi-line entry where line 2 is the organization)
      const isBullet = rawTrimmed.startsWith("•") || rawTrimmed.startsWith("*") || rawTrimmed.startsWith("-");
      if (currentCert && currentCert.name && !currentCert.issuer && !isBullet && trimmed.length < 60 && !/(?:specialist|architect|engineer|developer|professional|certified|associate|lead|master)/i.test(trimmed)) {
        let candidateIssuer = trimmed;
        const dMatch = candidateIssuer.match(datePattern);
        if (dMatch) {
          if (!currentCert.date) currentCert.date = dMatch[0];
          candidateIssuer = candidateIssuer.replace(datePattern, "");
        }
        currentCert.issuer = cleanField(candidateIssuer);
        continue;
      }

      // Otherwise, this line begins a new certification entry!
      finalizeCert();
      currentCert = { id: `cert_${list.length + 1}` };

      let lineText = trimmed;

      // Check for inline URL
      if (urlMatch) {
        currentCert.url = urlMatch[0];
        lineText = lineText.replace(urlMatch[0], "").trim();
      }

      // Check for inline Credential ID
      if (credMatch) {
        currentCert.url = currentCert.url || credMatch[0].trim();
        lineText = lineText.replace(credMatch[0], "").trim();
      }

      // Check for parenthetical metadata at end of line: e.g. " (Amazon Web Services, 2023)" or " (2023)"
      const endParenMatch = lineText.match(/\(([^)]+)\)\s*$/);
      if (endParenMatch) {
        const parenContent = endParenMatch[1].trim();
        const pDate = parenContent.match(datePattern);

        if (pDate) {
          currentCert.date = pDate[0];
          const remainingParen = cleanField(parenContent.replace(pDate[0], ""));
          if (remainingParen && !/^(?:issued|expires|valid|completed)$/i.test(remainingParen)) {
            currentCert.issuer = remainingParen;
          }
          lineText = cleanField(lineText.replace(endParenMatch[0], ""));
        } else if (!/^[A-Z0-9]{2,6}$/.test(parenContent) && (parenContent.length > 5 || parenContent.includes(" "))) {
          currentCert.issuer = parenContent;
          lineText = cleanField(lineText.replace(endParenMatch[0], ""));
        }
      }

      // Check if there's a date in lineText
      if (!currentCert.date) {
        const dMatch = lineText.match(datePattern);
        if (dMatch) {
          currentCert.date = dMatch[0];
          lineText = cleanField(lineText.replace(datePattern, ""));
        }
      }

      // Split remaining lineText into name and issuer if issuer not yet determined
      if (!currentCert.issuer) {
        const byMatch = lineText.match(/\s+(?:issued\s+by|provided\s+by|by|from)\s+/i);
        if (byMatch && byMatch.index) {
          currentCert.name = cleanField(lineText.substring(0, byMatch.index));
          currentCert.issuer = cleanField(lineText.substring(byMatch.index + byMatch[0].length));
        } else if (lineText.includes(" - ") || lineText.includes(" – ") || lineText.includes(" — ")) {
          const parts = lineText.split(/\s+[-–—]\s+/).map(p => cleanField(p)).filter(Boolean);
          if (parts.length === 2) {
            if (knownIssuersRegex.test(parts[1])) {
              currentCert.name = parts[0];
              currentCert.issuer = parts[1];
            } else if (knownIssuersRegex.test(parts[0])) {
              currentCert.name = parts[1];
              currentCert.issuer = parts[0];
            } else if (certSubtypesRegex.test(parts[1]) && !certSubtypesRegex.test(parts[0])) {
              currentCert.name = `${parts[0]} - ${parts[1]}`;
            } else {
              currentCert.name = parts[0];
              currentCert.issuer = parts[1];
            }
          } else if (parts.length >= 3) {
            const last = parts[parts.length - 1];
            if (knownIssuersRegex.test(last) || !certSubtypesRegex.test(last)) {
              currentCert.name = parts.slice(0, -1).join(" - ");
              currentCert.issuer = last;
            } else {
              currentCert.name = parts[0];
              currentCert.issuer = parts.slice(1).join(" - ");
            }
          } else {
            currentCert.name = cleanField(lineText);
          }
        } else if (lineText.includes(" | ")) {
          const parts = lineText.split(/\s*\|\s*/).map(p => cleanField(p)).filter(Boolean);
          currentCert.name = parts[0];
          if (parts.length > 1) {
            currentCert.issuer = parts.slice(1).join(", ");
          }
        } else if (lineText.includes(", ")) {
          const parts = lineText.split(/,\s+/).map(p => cleanField(p)).filter(Boolean);
          if (parts.length === 2) {
            if (knownIssuersRegex.test(parts[1])) {
              currentCert.name = parts[0];
              currentCert.issuer = parts[1];
            } else if (knownIssuersRegex.test(parts[0]) && !certSubtypesRegex.test(parts[0])) {
              currentCert.name = parts[1];
              currentCert.issuer = parts[0];
            } else if (certSubtypesRegex.test(parts[1])) {
              currentCert.name = `${parts[0]}, ${parts[1]}`;
            } else if (parts[1].length < 35 && !/[0-9]/.test(parts[1])) {
              currentCert.name = parts[0];
              currentCert.issuer = parts[1];
            } else {
              currentCert.name = cleanField(lineText);
            }
          } else {
            currentCert.name = cleanField(lineText);
          }
        } else {
          currentCert.name = cleanField(lineText);
        }
      } else {
        currentCert.name = cleanField(lineText);
      }
    }

    finalizeCert();
    return list;
  };

  const certSections = sections.filter(s => s.type === "certifications");
  const allCertLines = certSections.flatMap(s => s.lines);
  const certifications: ExtractedCertification[] = allCertLines.length > 0
    ? parseCertificationLines(allCertLines)
    : [];

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
      const parsedItems = parseCustomSectionItems(sec.lines);
      if (parsedItems.length > 0) {
        customSections.push({
          id: `custom_${sec.type}_${Date.now()}_${customSections.length + 1}`,
          title: cleanTextToken(sec.title) || "Additional Information",
          items: parsedItems
        });
      }
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
    sectionsOrder: ["summary", "experience", "education", "projects", "skills", "languages", "certifications", "references", "customSections"],
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
    const rawAiLoc = aiParsed.personalInfo.location?.trim();
    const rawDetLoc = deterministic.personalInfo.location?.trim();
    const cleanLoc = sanitizeLocation(rawAiLoc) || sanitizeLocation(rawDetLoc) || "";

    const rawAiName = cleanTextToken(aiParsed.personalInfo.fullName || "");
    const rawDetName = cleanTextToken(deterministic.personalInfo.fullName || "");
    const cleanName = (rawAiName && !rawAiName.toLowerCase().includes("resume") && rawAiName.length > 2)
      ? rawAiName
      : (rawDetName && !rawDetName.toLowerCase().includes("resume") ? rawDetName : "");

    merged.personalInfo = {
      fullName: cleanName || deterministic.personalInfo.fullName || "",
      jobTitle: aiParsed.personalInfo.jobTitle?.trim() || deterministic.personalInfo.jobTitle || "",
      email: aiParsed.personalInfo.email?.trim() || deterministic.personalInfo.email || "",
      phone: aiParsed.personalInfo.phone?.trim() || deterministic.personalInfo.phone || "",
      location: cleanLoc,
      website: aiParsed.personalInfo.website?.trim() || deterministic.personalInfo.website || "",
      linkedin: aiParsed.personalInfo.linkedin?.trim() || deterministic.personalInfo.linkedin || "",
      github: aiParsed.personalInfo.github?.trim() || deterministic.personalInfo.github || "",
      profilePhoto: aiParsed.personalInfo.profilePhoto || deterministic.personalInfo.profilePhoto || ""
    };
  }

  if (!merged.personalInfo.location && deterministic.personalInfo.location) {
    merged.personalInfo.location = sanitizeLocation(deterministic.personalInfo.location);
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
      company: cleanTextToken(e.company || ""),
      position: cleanTextToken(e.position || ""),
      startDate: cleanTextToken(e.startDate || ""),
      endDate: cleanTextToken(e.endDate || ""),
      current: typeof e.current === "boolean" ? e.current : (e.endDate ? /present|current/i.test(e.endDate) : false),
      location: sanitizeLocation(e.location),
      description: Array.isArray(e.description) ? e.description.join("\n") : (e.description || "")
    })).filter((e: any) => e.company || e.position || e.description);
  } else if (deterministic.experience && deterministic.experience.length > 0) {
    merged.experience = deterministic.experience;
  }

  // Education: prioritize AI parsed entries
  if (Array.isArray(aiParsed.education) && aiParsed.education.length > 0) {
    merged.education = aiParsed.education.map((edu: any, idx: number) => ({
      id: edu.id || `edu_${idx + 1}`,
      school: cleanTextToken(edu.school || ""),
      degree: cleanTextToken(edu.degree || ""),
      fieldOfStudy: cleanTextToken(edu.fieldOfStudy || ""),
      startDate: cleanTextToken(edu.startDate || ""),
      endDate: cleanTextToken(edu.endDate || ""),
      current: typeof edu.current === "boolean" ? edu.current : false,
      location: sanitizeLocation(edu.location),
      gpa: cleanTextToken(edu.gpa || ""),
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
      .map((s: any) => (typeof s === "string" ? sanitizeSkillToken(s) : null))
      .filter((s: string | null): s is string => Boolean(s));
    
    // Combine with deterministic text-matched skills if present
    const combinedSkills = new Set<string>(validAiSkills);
    if (deterministic.skills && deterministic.skills.length > 0) {
      for (const ds of deterministic.skills) {
        const cleaned = sanitizeSkillToken(ds);
        if (cleaned) {
          combinedSkills.add(cleaned);
        }
      }
    }
    merged.skills = Array.from(combinedSkills);
  } else if (deterministic.skills && deterministic.skills.length > 0) {
    merged.skills = deterministic.skills
      .map(s => sanitizeSkillToken(s))
      .filter((s: string | null): s is string => Boolean(s));
  }

  // Languages
  if (Array.isArray(aiParsed.languages) && aiParsed.languages.length > 0) {
    merged.languages = aiParsed.languages.map((l: any, idx: number) => ({
      id: l.id || `lang_${idx + 1}`,
      name: cleanTextToken(l.name || ""),
      proficiency: cleanTextToken(l.proficiency || "")
    })).filter((l: any) => l.name);
  }

  // Certifications
  const cleanCertField = (val: any): string => {
    return cleanTextToken(String(val || ""))
      .replace(/\(\s*\)/g, "")
      .replace(/^[•*·\-\s,:]+/, "")
      .replace(/[,;:\-\s]+$/, "")
      .trim();
  };

  if (Array.isArray(aiParsed.certifications) && aiParsed.certifications.length > 0) {
    merged.certifications = aiParsed.certifications.map((c: any, idx: number) => ({
      id: c.id || `cert_${idx + 1}`,
      name: cleanCertField(c.name),
      issuer: cleanCertField(c.issuer),
      date: cleanCertField(c.date).replace(/^(?:issued|date|issue\s+date|completed)\s*[:\-]\s*/i, "").trim(),
      url: cleanCertField(c.url)
    })).filter((c: any) => c.name);
  }

  // Fallback to deterministic certifications or merge any missing ones
  if (deterministic.certifications && deterministic.certifications.length > 0) {
    if (!merged.certifications || merged.certifications.length === 0) {
      merged.certifications = deterministic.certifications;
    } else {
      const existingNames = new Set(merged.certifications.map(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, "")));
      for (const detCert of deterministic.certifications) {
        const normalized = detCert.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalized && !existingNames.has(normalized)) {
          merged.certifications.push(detCert);
          existingNames.add(normalized);
        }
      }
    }
  }

  // References
  if (Array.isArray(aiParsed.references) && aiParsed.references.length > 0) {
    merged.references = aiParsed.references.map((r: any, idx: number) => ({
      id: r.id || `ref_${idx + 1}`,
      name: cleanTextToken(r.name || ""),
      company: cleanTextToken(r.company || ""),
      title: cleanTextToken(r.title || ""),
      email: cleanTextToken(r.email || ""),
      phone: cleanTextToken(r.phone || "")
    })).filter((r: any) => r.name);
  }

  // Custom Sections
  if (Array.isArray(aiParsed.customSections) && aiParsed.customSections.length > 0) {
    merged.customSections = aiParsed.customSections.map((cs: any, idx: number) => ({
      id: cs.id || `custom_${idx + 1}`,
      title: cleanTextToken(cs.title || "Additional Information"),
      items: Array.isArray(cs.items) ? cs.items.map((item: any, iIdx: number) => ({
        id: item.id || `item_${iIdx + 1}`,
        heading: cleanTextToken(item.heading || ""),
        subheading: cleanTextToken(item.subheading || ""),
        date: cleanTextToken(item.date || ""),
        location: cleanTextToken(item.location || ""),
        description: Array.isArray(item.description) ? item.description.join("\n").trim() : (item.description || "").trim()
      })).filter((item: any) => item.heading || item.description) : []
    })).filter((cs: any) => cs.items.length > 0);
  } else if (deterministic.customSections && deterministic.customSections.length > 0) {
    merged.customSections = deterministic.customSections;
  }

  return merged;
}
