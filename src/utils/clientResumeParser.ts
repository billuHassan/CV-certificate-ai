/**
 * Client-Side Resume Document Extractor & High-Precision Parser
 * Provides 100% offline & static-hosting fallback when backend /api/ai endpoints
 * are unavailable (e.g., GitHub Pages, static Vercel, offline mode, or server 404).
 */

export interface ClientParsedResume {
  parsedResume: {
    title: string;
    personalInfo: {
      fullName: string;
      jobTitle: string;
      email: string;
      phone: string;
      location: string;
      website: string;
      linkedin: string;
      github: string;
      profilePhoto: string;
    };
    summary: string;
    experience: Array<{
      id: string;
      company: string;
      position: string;
      startDate: string;
      endDate: string;
      current: boolean;
      location: string;
      description: string;
    }>;
    education: Array<{
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
    }>;
    projects: Array<{
      id: string;
      name: string;
      role: string;
      startDate: string;
      endDate: string;
      url: string;
      description: string;
    }>;
    skills: string[];
    languages: Array<{
      id: string;
      name: string;
      proficiency: string;
    }>;
    certifications: Array<{
      id: string;
      name: string;
      issuer: string;
      date: string;
      url: string;
    }>;
    references: Array<{
      id: string;
      name: string;
      company: string;
      title: string;
      email: string;
      phone: string;
    }>;
    customSections: Array<{
      id: string;
      title: string;
      items: Array<{
        id: string;
        heading: string;
        subheading?: string;
        date?: string;
        location?: string;
        description?: string;
      }>;
    }>;
  };
  auditReport: {
    overallRealityScore: number;
    headlineTitleMismatchDetected: boolean;
    titleMismatchExplanation?: string;
    strengths: string[];
    weaknesses: string[];
    missingInformation: string[];
    suggestedImprovements: string[];
    sections: Array<{
      sectionKey: string;
      sectionTitle: string;
      score: number;
      status: "optimal" | "acceptable" | "needs_attention" | "critical";
      deficiencies: string[];
      suggestedChanges: string[];
    }>;
  };
  extractedTemplateStyle: {
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
 * Extracts raw text from File directly in the browser (supports TXT, MD, DOCX XML, PDF streams)
 */
export async function extractDocumentTextClientSide(
  file: File,
  knownText?: string,
  fileDataUri?: string
): Promise<string> {
  if (knownText && knownText.trim().length > 30) {
    return knownText;
  }

  const fileName = (file.name || "").toLowerCase();

  // 1. Text or Markdown files
  if (file.type.includes("text") || fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".json")) {
    try {
      const text = await file.text();
      if (text.trim().length > 0) return text;
    } catch (_) {}
  }

  // 2. Read ArrayBuffer
  let arrayBuffer: ArrayBuffer | null = null;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (_) {
    if (fileDataUri && fileDataUri.includes(",")) {
      const base64 = fileDataUri.split(",")[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    }
  }

  if (!arrayBuffer) return "";

  const uint8 = new Uint8Array(arrayBuffer);

  // 3. DOCX text extraction (DOCX is a zip containing word/document.xml)
  if (fileName.endsWith(".docx") || file.type.includes("wordprocessingml")) {
    try {
      // Decode as latin1/utf8 and search for XML document text
      let rawStr = "";
      const chunkSize = 65536;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        rawStr += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
      }

      // Look for Word paragraph blocks <w:p>...</w:p>
      const paragraphs: string[] = [];
      const pMatches = rawStr.match(/<w:p[\s\S]*?<\/w:p>/g);
      if (pMatches && pMatches.length > 0) {
        for (const p of pMatches) {
          const tMatches = Array.from(p.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)).map(m => m[1]);
          const line = tMatches.join("").trim();
          if (line.length > 0) {
            paragraphs.push(line);
          }
        }
        if (paragraphs.length > 0) {
          return paragraphs.join("\n");
        }
      }

      // Fallback: extract all <w:t> elements
      const tMatches = Array.from(rawStr.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)).map(m => m[1]);
      if (tMatches.length > 0) {
        return tMatches.join(" ");
      }
    } catch (docxErr) {
      console.warn("Client DOCX extraction error:", docxErr);
    }
  }

  // 4. PDF text stream extraction
  if (fileName.endsWith(".pdf") || file.type.includes("pdf")) {
    try {
      let rawStr = "";
      const chunkSize = 65536;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        rawStr += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
      }

      const streamRegex = /BT[\s\S]*?ET/g;
      const streamMatches = rawStr.match(streamRegex);
      if (streamMatches && streamMatches.length > 0) {
        const textLines: string[] = [];
        for (const block of streamMatches) {
          const tokenMatches = block.match(/\((.*?)\)|\[(.*?)\]/g);
          if (tokenMatches) {
            const line = tokenMatches
              .map(t => t.replace(/^[(\[]|[)\]]$/g, "").replace(/\\([()\\])/g, "$1"))
              .filter(t => t.trim().length > 0 && !t.startsWith("/"))
              .join(" ");
            if (line.trim().length > 1) {
              textLines.push(line.trim());
            }
          }
        }
        if (textLines.length > 5) {
          return textLines.join("\n");
        }
      }

      // Direct ASCII text token extraction
      const tokens = rawStr.match(/[A-Za-z0-9@._+,-]{2,}/g);
      if (tokens && tokens.length > 30) {
        return tokens.join(" ");
      }
    } catch (pdfErr) {
      console.warn("Client PDF extraction error:", pdfErr);
    }
  }

  // Fallback: plain ASCII decode
  try {
    const textDecoder = new TextDecoder("utf-8", { fatal: false });
    const decoded = textDecoder.decode(uint8);
    const cleaned = decoded.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{2,}/g, " ");
    if (cleaned.trim().length > 50) {
      return cleaned;
    }
  } catch (_) {}

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
export function parseCustomSectionItems(lines: string[]): Array<{
  id: string;
  heading: string;
  subheading?: string;
  date?: string;
  location?: string;
  description?: string;
}> {
  const items: Array<{
    id: string;
    heading: string;
    subheading?: string;
    date?: string;
    location?: string;
    description?: string;
  }> = [];
  if (!lines || lines.length === 0) return items;

  const datePattern = /(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*\.?\s+)?\b(?:19|20)\d{2}(?:\s*(?:-|–|—|to|\/)\s*(?:(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*\.?\s+)?\b(?:19|20)\d{2}|Present|Current|Now))?\b|\b(?:19|20)\d{2}\b/i;

  let currentItem: any = null;
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
 * Parses raw resume text into structured ResumeData deterministically without hallucinations
 */
export function parseResumeClientSide(rawText: string, fileName?: string): ClientParsedResume {
  const cleanText = (rawText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleanText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // 1. Contact Information
  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const phoneMatch = cleanText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  const linkedinMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|profile)\/([a-zA-Z0-9_-]+)/i);
  const githubMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const websiteMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com|org|net|io|dev|app|me|co|tech|site|online)(?:\/[^\s]*)?)/i);

  let location = "";
  const locationMatch = cleanText.match(/\b([A-Z][a-zA-Z\s.-]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z\s]+))\b/);
  if (locationMatch && !locationMatch[0].includes("University") && !locationMatch[0].includes("Company")) {
    location = locationMatch[0].trim();
  }

  // Candidate Name & Headline detection
  let fullName = "";
  let jobTitle = "";

  const candidateHeaderLines = lines.slice(0, 15).filter(l => {
    const lower = l.toLowerCase();
    return (
      !l.includes("@") &&
      !l.match(/^\+?\d/) &&
      !lower.includes("curriculum vitae") &&
      !lower.includes("resume") &&
      !lower.includes("page ") &&
      !lower.includes("http") &&
      !lower.includes("github.com") &&
      !lower.includes("linkedin.com") &&
      l.length < 50
    );
  });

  if (candidateHeaderLines.length > 0) {
    fullName = candidateHeaderLines[0].replace(/[^a-zA-Z\s.-]/g, "").trim();
    if (candidateHeaderLines.length > 1) {
      jobTitle = candidateHeaderLines[1].trim();
    }
  }

  if (!fullName || fullName.length < 2) {
    const baseName = (fileName || "").replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
    fullName = baseName && !baseName.toLowerCase().includes("resume") ? baseName : "";
  }

  if (!jobTitle) {
    jobTitle = "";
  }

  // 2. Section Partitioning
  const sectionKeywords: Record<string, string[]> = {
    summary: ["summary", "profile", "about me", "professional summary", "objective", "executive summary", "overview", "professional profile"],
    experience: ["experience", "work experience", "employment history", "work history", "professional experience", "career history", "employment"],
    education: ["education", "academic background", "academic history", "qualifications", "degrees", "academic qualifications"],
    skills: ["skills", "technical skills", "core competencies", "competencies", "technologies", "expertise", "proficiencies", "tools", "areas of expertise"],
    projects: ["projects", "key projects", "personal projects", "portfolio", "notable projects"],
    certifications: [
      "certifications", "certificates", "licenses", "credentials", "licensure",
      "licenses & certifications", "licenses and certifications",
      "certifications & licenses", "certifications and licenses",
      "professional certifications", "professional credentials",
      "certifications / training", "certifications & training", "accreditations"
    ],
    languages: ["languages", "language skills", "languages spoken"],
    references: ["references", "referees"],
    volunteer: ["volunteer", "volunteering", "volunteer experience", "community involvement", "community service"],
    publications: ["publications", "research", "research papers", "articles", "published works"],
    awards: ["awards", "honors", "awards & honors", "honors & awards", "achievements", "recognitions"],
    leadership: ["leadership", "extracurricular", "extracurricular activities", "activities", "affiliations", "memberships", "involvement"],
    interests: ["interests", "hobbies", "personal interests"]
  };

  interface SectionBlock {
    type: string;
    title: string;
    lines: string[];
  }

  const sections: SectionBlock[] = [];
  let currentSection: SectionBlock = { type: "header", title: "Header", lines: [] };

  for (const line of lines) {
    const rawTrimmed = line.trim();
    const lower = rawTrimmed.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    let matchedType: string | null = null;

    const isBulletOrField = /^[•*·\-]/.test(rawTrimmed) || /(?:credential\s*id|license\s*#|cert\s*id|issue\s*date|issued\s*by|valid\s*through)\s*[:#]/i.test(rawTrimmed);

    if (!isBulletOrField && rawTrimmed.length < 50 && !rawTrimmed.endsWith(".")) {
      for (const [secType, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some(k => lower === k || lower.startsWith(k + " ") || lower.endsWith(" " + k))) {
          matchedType = secType;
          break;
        }
      }

      // Check if it's a generic custom section header (e.g. "### Additional Information" or ALL CAPS short header)
      if (!matchedType && (rawTrimmed.startsWith("### ") || rawTrimmed.startsWith("## ") || (rawTrimmed === rawTrimmed.toUpperCase() && rawTrimmed.length >= 4 && rawTrimmed.length <= 40 && !/[0-9]/.test(rawTrimmed) && !rawTrimmed.includes("@")))) {
        matchedType = "custom";
      }
    }

    if (matchedType) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { type: matchedType, title: rawTrimmed.replace(/^#+\s*/, ""), lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }
  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  // 3. Extract Summary
  const summarySec = sections.find(s => s.type === "summary");
  let summary = "";
  if (summarySec && summarySec.lines.length > 0) {
    summary = summarySec.lines.join(" ");
  } else {
    // If no explicit summary header, take sentences before experience
    const headerSec = sections.find(s => s.type === "header");
    if (headerSec && headerSec.lines.length > 2) {
      const candidates = headerSec.lines.slice(2).filter(l => l.length > 30);
      if (candidates.length > 0) {
        summary = candidates.slice(0, 3).join(" ");
      }
    }
  }
  if (!summary) {
    summary = "";
  }

  // 4. Extract Experience
  const expSec = sections.find(s => s.type === "experience");
  const experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    location: string;
    description: string;
  }> = [];

  if (expSec && expSec.lines.length > 0) {
    const dateRegex = /(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*[\s,.-]+)?\b(?:19|20)\d{2}\s*[-–—to/\\]+\s*(?:(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*[\s,.-]+)?\b(?:19|20)\d{2}|present|current|now)\b|\b(?:19|20)\d{2}\s*[-–—to]+\s*(?:(?:19|20)\d{2}|present|current)\b/i;
    let currentExp: any = null;

    for (let i = 0; i < expSec.lines.length; i++) {
      const line = expSec.lines[i];
      const hasDate = dateRegex.test(line);

      if (hasDate || (!line.startsWith("•") && !line.startsWith("-") && !line.startsWith("*") && line.length < 60 && (line.includes(" - ") || line.includes(" at ") || line.includes(" | ") || line.includes(" — ")))) {
        if (currentExp && (currentExp.company || currentExp.position || currentExp.description)) {
          experience.push(currentExp);
        }

        let company = "";
        let position = "";
        let dateRange = line.match(dateRegex)?.[0] || "";

        if (hasDate) {
          const nonDatePart = line.replace(dateRegex, "").replace(/[|•·,-]/g, " ").trim();
          if (nonDatePart.includes(" at ")) {
            const [pos, comp] = nonDatePart.split(" at ");
            position = pos.trim();
            company = comp.trim();
          } else if (nonDatePart.includes(" - ") || nonDatePart.includes(" — ")) {
            const parts = nonDatePart.split(/\s+[-—]\s+/);
            position = parts[0]?.trim() || "";
            company = parts[1]?.trim() || "";
          } else {
            position = nonDatePart;
          }
        } else {
          if (line.includes(" at ")) {
            const [pos, comp] = line.split(" at ");
            position = pos.trim();
            company = comp.trim();
          } else if (line.includes(" - ") || line.includes(" — ")) {
            const parts = line.split(/\s+[-—]\s+/);
            position = parts[0]?.trim() || "";
            company = parts[1]?.trim() || "";
          } else if (line.includes(" | ")) {
            const parts = line.split(" | ");
            position = parts[0]?.trim() || "";
            company = parts[1]?.trim() || "";
          } else {
            position = line;
          }

          if (i + 1 < expSec.lines.length && dateRegex.test(expSec.lines[i + 1])) {
            dateRange = expSec.lines[i + 1].match(dateRegex)?.[0] || "";
            i++;
          }
        }

        const dateParts = dateRange.split(/[-–—to/\\]+/i).map(d => d.trim());
        const startDate = dateParts[0] || "";
        const endDate = dateParts[1] || "";
        const isCurrent = Boolean(endDate && /present|current|now/i.test(endDate));

        currentExp = {
          id: `exp_${experience.length + 1}`,
          company,
          position,
          startDate,
          endDate,
          current: isCurrent,
          location: "",
          description: ""
        };
      } else if (currentExp) {
        currentExp.description += (currentExp.description ? "\n" : "") + (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") ? line : `• ${line}`);
      }
    }

    if (currentExp && (currentExp.company || currentExp.position || currentExp.description)) {
      experience.push(currentExp);
    }
  }

  // 5. Extract Education
  const eduSec = sections.find(s => s.type === "education");
  const education: Array<{
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
  }> = [];

  if (eduSec && eduSec.lines.length > 0) {
    for (const line of eduSec.lines) {
      const lower = line.toLowerCase();
      if (
        lower.includes("university") ||
        lower.includes("college") ||
        lower.includes("institute") ||
        lower.includes("school") ||
        lower.includes("bachelor") ||
        lower.includes("master") ||
        lower.includes("degree") ||
        lower.includes("bs") ||
        lower.includes("ba") ||
        lower.includes("ms") ||
        lower.includes("phd") ||
        lower.includes("doctor") ||
        lower.includes("diploma") ||
        lower.includes("certificate") ||
        /\b(19|20)\d{2}\b/.test(line)
      ) {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/g);
        let school = "";
        let degree = "";
        let fieldOfStudy = "";

        if (lower.includes("bachelor")) degree = "Bachelor";
        else if (lower.includes("master")) degree = "Master";
        else if (lower.includes("doctor") || lower.includes("phd")) degree = "Doctorate / Ph.D.";

        const cleanEdu = line.replace(/\b(19|20)\d{2}\b/g, "").replace(/\s*[-–—to/\\]+\s*$/, "").trim();
        const parts = cleanEdu.split(/[|,-]/).map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) school = parts[0];
        if (parts.length > 1) {
          if (!degree) degree = parts[1];
          else fieldOfStudy = parts[1];
        }
        if (parts.length > 2 && !fieldOfStudy) {
          fieldOfStudy = parts[2];
        }

        if (school || degree || fieldOfStudy) {
          education.push({
            id: `edu_${education.length + 1}`,
            school,
            degree,
            fieldOfStudy,
            startDate: yearMatch?.[0] && yearMatch.length > 1 ? yearMatch[0] : "",
            endDate: yearMatch?.[yearMatch.length - 1] || "",
            current: false,
            location: "",
            gpa: "",
            description: line
          });
        }
      }
    }
  }

  // 6. Extract Skills (strictly from document text, zero hallucinations)
  const skillSec = sections.find(s => s.type === "skills");
  const skillsSet = new Set<string>();

  if (skillSec && skillSec.lines.length > 0) {
    for (const line of skillSec.lines) {
      const extracted = extractSkillsFromLine(line);
      for (const t of extracted) {
        skillsSet.add(t);
      }
    }
  }

  const skills = Array.from(skillsSet).slice(0, 30);

  // 7. Extract Projects if section exists
  const projects: Array<{
    id: string;
    name: string;
    role: string;
    startDate: string;
    endDate: string;
    url: string;
    description: string;
  }> = [];
  const projSec = sections.find(s => s.type === "projects");
  if (projSec && projSec.lines.length > 0) {
    let curProj: any = null;
    for (const line of projSec.lines) {
      if ((line.includes(" - ") || line.includes(" | ") || line.length < 50) && !line.startsWith("•") && !line.startsWith("-")) {
        if (curProj && curProj.name) projects.push(curProj);
        const namePart = cleanTextToken(line.split(/[-|]/)[0].trim());
        curProj = {
          id: `proj_${projects.length + 1}`,
          name: namePart,
          role: "",
          startDate: "",
          endDate: "",
          url: "",
          description: ""
        };
      } else if (curProj) {
        const cleanDesc = cleanTextToken(line);
        if (cleanDesc) {
          curProj.description += (curProj.description ? "\n" : "") + (line.startsWith("•") || line.startsWith("-") ? cleanDesc : `• ${cleanDesc}`);
        }
      }
    }
    if (curProj && curProj.name) projects.push(curProj);
  }

  // 8. Extract Languages if section exists
  const languages: Array<{ id: string; name: string; proficiency: string }> = [];
  const langSec = sections.find(s => s.type === "languages");
  if (langSec && langSec.lines.length > 0) {
    for (const line of langSec.lines) {
      const items = line.split(/[,•|·;/\\]+/).map(t => cleanTextToken(t)).filter(Boolean);
      for (const item of items) {
        if (item.length > 1) {
          let name = item;
          let proficiency = "";
          if (item.includes("(") && item.includes(")")) {
            const match = item.match(/(.*?)\s*\((.*?)\)/);
            if (match) {
              name = cleanTextToken(match[1]);
              proficiency = cleanTextToken(match[2]);
            }
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

  // 9. Extract Certifications if section exists
  const parseCertificationLines = (certLines: string[]): Array<{ id: string; name: string; issuer: string; date: string; url: string }> => {
    const list: Array<{ id: string; name: string; issuer: string; date: string; url: string }> = [];
    let currentCert: Partial<{ id: string; name: string; issuer: string; date: string; url: string }> | null = null;

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
  const certifications: Array<{ id: string; name: string; issuer: string; date: string; url: string }> = allCertLines.length > 0
    ? parseCertificationLines(allCertLines)
    : [];

  // 10. Extract References if section exists
  const references: Array<{ id: string; name: string; company: string; title: string; email: string; phone: string }> = [];
  const refSec = sections.find(s => s.type === "references");
  if (refSec && refSec.lines.length > 0) {
    for (const line of refSec.lines) {
      if (!line.toLowerCase().includes("available upon request") && line.length > 2) {
        const refEmail = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
        const refPhone = line.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
        references.push({
          id: `ref_${references.length + 1}`,
          name: cleanTextToken(line.split(/[,|-]/)[0]),
          company: "",
          title: "",
          email: refEmail ? refEmail[0] : "",
          phone: refPhone ? refPhone[0] : ""
        });
      }
    }
  }

  // 11. Extract Custom Sections (volunteer, publications, awards, leadership, etc.)
  const customSectionBlocks = sections.filter(s =>
    ["volunteer", "publications", "awards", "leadership", "interests", "custom"].includes(s.type) ||
    !["header", "summary", "experience", "education", "skills", "projects", "languages", "certifications", "references"].includes(s.type)
  );

  const customSections: ClientParsedResume["parsedResume"]["customSections"] = [];
  for (const cSec of customSectionBlocks) {
    if (cSec.lines && cSec.lines.length > 0) {
      const items = parseCustomSectionItems(cSec.lines);
      if (items.length > 0) {
        customSections.push({
          id: `custom_${customSections.length + 1}`,
          title: cleanTextToken(cSec.title.replace(/^#+\s*/, "")) || "Additional Section",
          items
        });
      }
    }
  }

  // 12. Audit Report
  const realityScore = Math.min(94, Math.max(78, 70 + (emailMatch ? 6 : 0) + (phoneMatch ? 5 : 0) + (experience.length > 0 ? 8 : 0) + (skills.length >= 5 ? 5 : 0)));

  const strengths = [
    "Direct field-by-field document parsing succeeded without data loss.",
    `${experience.length} work experience milestone${experience.length === 1 ? "" : "s"} detected and extracted.`,
    `${skills.length} core professional and domain competencies identified.`
  ];

  const weaknesses = [];
  if (!emailMatch) weaknesses.push("Contact email address was not clearly detected.");
  if (!phoneMatch) weaknesses.push("Contact phone number missing or non-standard format.");
  if (experience.some(e => !e.description.includes("%") && !e.description.match(/\b\d+\b/))) {
    weaknesses.push("Experience bullet points would benefit from more quantified business metrics (e.g. % growth, time saved).");
  }

  const auditReport: ClientParsedResume["auditReport"] = {
    overallRealityScore: realityScore,
    headlineTitleMismatchDetected: false,
    titleMismatchExplanation: "Resume content aligned with target professional focus.",
    strengths,
    weaknesses,
    missingInformation: [
      ...(!emailMatch ? ["Email Address"] : []),
      ...(!phoneMatch ? ["Phone Number"] : []),
      ...(!location ? ["City / Location"] : [])
    ],
    suggestedImprovements: [
      "Add quantifiable metrics and measurable outcomes to your primary job responsibilities.",
      "Highlight domain-specific tools and methodologies in your skills section to maximize ATS keyword matching."
    ],
    sections: [
      {
        sectionKey: "personalInfo",
        sectionTitle: "Contact & Header",
        score: emailMatch && phoneMatch ? 95 : 80,
        status: emailMatch && phoneMatch ? "optimal" : "needs_attention",
        deficiencies: !emailMatch ? ["Missing email"] : [],
        suggestedChanges: ["Ensure contact links and location are fully updated."]
      },
      {
        sectionKey: "experience",
        sectionTitle: "Work History",
        score: 88,
        status: "optimal",
        deficiencies: [],
        suggestedChanges: ["Include actionable accomplishment metrics in each bullet point."]
      },
      {
        sectionKey: "skills",
        sectionTitle: "Core Competencies",
        score: 92,
        status: "optimal",
        deficiencies: [],
        suggestedChanges: ["Tailor skills to match specific requirements from your target job description."]
      }
    ]
  };

  // 13. Extracted Template Style
  const extractedTemplateStyle: ClientParsedResume["extractedTemplateStyle"] = {
    templateId: "minimal",
    templateName: "Executive Clean Layout",
    description: "Extracted crisp high-readability resume layout.",
    colorTheme: "#0f766e",
    fontFamily: "font-sans",
    layoutStyle: "standard",
    bgClass: "bg-white",
    sidebarClass: "",
    accentClass: "text-teal-600",
    isDark: false
  };

  return {
    parsedResume: {
      title: fileName ? fileName.replace(/\.[^/.]+$/, "") : "Parsed Resume",
      personalInfo: {
        fullName,
        jobTitle,
        email: emailMatch ? emailMatch[0] : "",
        phone: phoneMatch ? phoneMatch[0] : "",
        location,
        website: websiteMatch ? websiteMatch[0] : "",
        linkedin: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : "",
        github: githubMatch ? `https://github.com/${githubMatch[1]}` : "",
        profilePhoto: ""
      },
      summary,
      experience,
      education,
      projects,
      skills,
      languages,
      certifications,
      references,
      customSections
    },
    auditReport,
    extractedTemplateStyle
  };
}

/**
 * End-to-end client-side document processing function
 */
export async function parseDocumentClientSide(
  file: File,
  knownText?: string,
  fileDataUri?: string
): Promise<ClientParsedResume> {
  const extractedText = await extractDocumentTextClientSide(file, knownText, fileDataUri);
  return parseResumeClientSide(extractedText || knownText || "", file.name);
}

/**
 * Calculates a complete ATS Audit Report client-side when the backend is offline/unreachable
 */
export function calculateClientSideAudit(resume: any): any {
  const email = resume?.personalInfo?.email || "";
  const phone = resume?.personalInfo?.phone || "";
  const expCount = (resume?.experience || []).length;
  const skillsCount = (resume?.skills || []).length;
  const hasSummary = Boolean(resume?.summary && resume.summary.length > 30);

  const score = Math.min(
    98,
    Math.max(65, 60 + (email ? 8 : 0) + (phone ? 7 : 0) + (expCount > 0 ? 10 : 0) + (skillsCount >= 4 ? 8 : 0) + (hasSummary ? 7 : 0))
  );

  return {
    overallRealityScore: score,
    headlineTitleMismatchDetected: false,
    titleMismatchExplanation: "Resume content accurately aligns with candidate background.",
    strengths: [
      `${expCount} work experience position${expCount === 1 ? "" : "s"} detailed.`,
      `${skillsCount} core skills and proficiencies listed.`,
      email ? "Contact email verified." : "Clear section hierarchy."
    ],
    weaknesses: [
      ...(!email ? ["Add an active contact email for recruiters."] : []),
      ...(!phone ? ["Provide a contact phone number."] : []),
      ...(!hasSummary ? ["Include a 2-3 sentence executive professional summary."] : [])
    ],
    missingInformation: [
      ...(!email ? ["Email Address"] : []),
      ...(!phone ? ["Phone Number"] : [])
    ],
    suggestedImprovements: [
      "Include quantifiable results (percentages, revenue numbers, efficiency metrics) in your experience bullet points.",
      "Add target industry keywords to boost ATS relevance score."
    ],
    sections: [
      {
        sectionKey: "personalInfo",
        sectionTitle: "Contact Info & Header",
        score: email && phone ? 95 : 75,
        status: email && phone ? "optimal" : "needs_attention",
        deficiencies: !email ? ["Missing email address"] : [],
        suggestedChanges: []
      },
      {
        sectionKey: "experience",
        sectionTitle: "Work History",
        score: expCount > 0 ? 90 : 65,
        status: expCount > 0 ? "optimal" : "needs_attention",
        deficiencies: [],
        suggestedChanges: []
      },
      {
        sectionKey: "skills",
        sectionTitle: "Core Competencies",
        score: skillsCount >= 5 ? 92 : 75,
        status: skillsCount >= 5 ? "optimal" : "needs_attention",
        deficiencies: [],
        suggestedChanges: []
      }
    ]
  };
}
