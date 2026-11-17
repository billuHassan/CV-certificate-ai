import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import {
  Sparkles, Send, Upload, Image as ImageIcon, Search, ExternalLink, Bot, User,
  FileText, Briefcase, CheckCircle2, ArrowRight, Loader2, Globe, FileUp, Zap, HelpCircle
} from "lucide-react";
import { ResumeData, UserSession } from "../types";
import { safeExternalUrl, safeMediaUrl } from "../utils/security";

interface GroundingSource {
  title: string;
  uri: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: string[];
  groundingSources?: GroundingSource[];
  mediaUrl?: string;
  mediaType?: "image";
}

interface AIChatProps {
  user?: UserSession;
  resumes: ResumeData[];
  isDark?: boolean;
  onImportScannedResume?: (scannedResume: ResumeData) => void;
}

export default function AIChat({ user, resumes, isDark = true, onImportScannedResume }: AIChatProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || "");
  const selectedResume = resumes.find((r) => r.id === selectedResumeId) || resumes[0];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello ${user?.displayName || "there"}! 👋 I am your **CVCraft AI Career Assistant**.

I am actively reading your resume context: **${selectedResume ? selectedResume.title || "Selected Resume" : "No resume selected"}** (${selectedResume?.personalInfo?.jobTitle || "Job Title"}).

Ask me anything tailored specifically to your profile:
- 🎓 **Role Guidance**: "Which internship or full-time role should I apply for based on my resume?"
- ✍️ **Bullet Polish**: "Improve my work experience bullet points for higher ATS score."
- 💡 **Interview Prep**: "Explain this interview question and give me a winning STAR response."
- 💰 **Salary Negotiation**: "How do I negotiate salary for my role and experience level?"
- ⚡ **Elevator Pitch**: "Write a compelling 30-second elevator pitch for top recruiters."`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        "Which internship or role should I apply for?",
        "Improve this work experience bullet point",
        "Explain how to answer this interview question",
        "How do I negotiate salary for my role?",
        "Write a 30-second elevator pitch"
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchGroundingEnabled, setSearchGroundingEnabled] = useState(true);

  // Image Upload / Multimodal state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<"resume" | "job_poster">("resume");
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [scannedResult, setScannedResult] = useState<any | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isScanningImage]);

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputMessage).trim();
    if (!queryText && !imagePreview) return;

    // If an image is attached, route to image analysis first
    if (imagePreview) {
      await handleAnalyzeImage(queryText);
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const resumeContext = selectedResume 
        ? `Candidate Name: ${selectedResume.personalInfo?.fullName || "Candidate"}
Target Job Title: ${selectedResume.personalInfo?.jobTitle || "Not specified"}
Resume Title: ${selectedResume.title}
Summary: ${selectedResume.summary || "None provided"}
Skills (${selectedResume.skills?.length || 0}): ${(selectedResume.skills || []).join(", ")}
Work Experience (${selectedResume.experience?.length || 0}): ${JSON.stringify((selectedResume.experience || []).map(e => ({ role: e.position, company: e.company, period: `${e.startDate}-${e.endDate}`, details: e.description })))}
Education (${selectedResume.education?.length || 0}): ${JSON.stringify((selectedResume.education || []).map(ed => ({ degree: ed.degree, school: ed.school, field: ed.fieldOfStudy })))}
Projects (${selectedResume.projects?.length || 0}): ${JSON.stringify((selectedResume.projects || []).map(p => ({ name: p.name, role: p.role, details: p.description })))}`
        : "No active resume selected.";

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          resumeContext,
          jobTitleContext: selectedResume?.personalInfo?.jobTitle || "",
          searchGrounding: searchGroundingEnabled
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI coach.");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "I am analyzing your request. Please try asking again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: data.suggestions || [],
        groundingSources: data.groundingSources || []
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ Sorry, I encountered an issue: ${err?.message || "Unable to reach Gemini AI service."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: ["Try asking again", "Scan paper resume photo"]
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (PNG, JPG, WEBP).");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async (customPromptStr?: string) => {
    if (!imagePreview) return;

    setIsScanningImage(true);
    setScannedResult(null);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: customPromptStr || (scanMode === "resume" ? "Scan and extract text from this paper resume photo." : "Analyze this job poster screenshot and extract key requirements."),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaUrl: imagePreview,
      mediaType: "image"
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentPreview = imagePreview;
    setImageFile(null);
    setImagePreview(null);
    setInputMessage("");

    try {
      const response = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: currentPreview,
          mode: scanMode,
          customPrompt: customPromptStr
        })
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image.");
      }

      const data = await response.json();
      setScannedResult(data);

      let replyMarkdown = "";
      if (scanMode === "resume" && data.extractedResume) {
        const ext = data.extractedResume;
        replyMarkdown = `### 📄 Paper Resume Scanned & Extracted (Gemini 3.1 Pro Vision)

**Summary Overview:** ${data.summary || "Extracted structured text from paper resume image."}

**Candidate Name:** ${ext.personalInfo?.fullName || "Scanned Candidate"}
**Target Job Title:** ${ext.personalInfo?.jobTitle || "Not listed"}
**Extracted Summary:**
> ${ext.summary || "None"}

**Extracted Skills (${ext.skills?.length || 0}):**
${(ext.skills || []).map((s: string) => `- \`${s}\``).join("\n")}

**Work Experience (${ext.experience?.length || 0}):**
${(ext.experience || []).map((e: any) => `\n- **${e.position || "Role"}** at **${e.company || "Company"}** (${e.startDate || ""} - ${e.endDate || ""})\n  ${e.description || ""}`).join("")}

---
💡 **ATS Layout Advice:** ${data.feedback || "Ensure clear section headings and standard bullet points."}`;
      } else if (scanMode === "job_poster") {
        replyMarkdown = `### 🖼️ Job Poster Analysis (Gemini 3.1 Pro Vision)

**Job Title:** ${data.jobTitle || "Not specified"}
**Company:** ${data.company || "Not specified"}
**Estimated Compensation:** ${data.salaryEstimate || "N/A"}
**Location / Mode:** ${data.location || "N/A"}

**Key Requirements:**
${(data.keyRequirements || []).map((r: string) => `- ${r}`).join("\n")}

**Required Skills to Highlight:**
${(data.requiredSkills || []).map((s: string) => `- \`${s}\``).join("\n")}

**Core Responsibilities:**
${(data.responsibilities || []).map((resp: string) => `- ${resp}`).join("\n")}

---
💡 **Tailoring Strategy:** ${data.tailoringAdvice || "Incorporate these required skills directly into your resume summary and work bullets."}`;
      } else {
        replyMarkdown = `### Image Analysis Completed\n\n${data.summary || "Processed attached image successfully."}`;
      }

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: replyMarkdown,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: scanMode === "resume" 
          ? ["Import data into active resume", "Scan another document", "Optimize my summary"]
          : ["Draft cover letter for this job", "Scan another document", "Mock interview prep"]
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Image analysis error:", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ Image analysis error: ${err?.message || "Failed to analyze photo with Gemini Vision."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsScanningImage(false);
      setIsLoading(false);
    }
  };

  const handleImportExtractedData = () => {
    if (!scannedResult?.extractedResume) {
      alert("No extracted resume data available to import.");
      return;
    }

    const ext = scannedResult.extractedResume;
    const newResumeData: ResumeData = {
      id: crypto.randomUUID(),
      title: ext.title || "Imported Scanned Resume",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInfo: {
        fullName: ext.personalInfo?.fullName || user?.displayName || "",
        email: ext.personalInfo?.email || user?.email || "",
        phone: ext.personalInfo?.phone || "",
        location: ext.personalInfo?.location || "",
        jobTitle: ext.personalInfo?.jobTitle || "Professional",
        website: ext.personalInfo?.website || "",
        linkedin: ext.personalInfo?.linkedin || "",
        github: ext.personalInfo?.github || "",
        profilePhoto: ""
      },
      summary: ext.summary || "",
      experience: (ext.experience || []).map((e: any) => ({
        id: crypto.randomUUID(),
        company: e.company || "",
        position: e.position || "",
        location: e.location || "",
        startDate: e.startDate || "",
        endDate: e.endDate || "",
        current: Boolean(e.current),
        description: e.description || ""
      })),
      education: (ext.education || []).map((e: any) => ({
        id: crypto.randomUUID(),
        school: e.school || "",
        degree: e.degree || "",
        fieldOfStudy: e.fieldOfStudy || "",
        startDate: e.startDate || "",
        endDate: e.endDate || "",
        current: Boolean(e.current),
        location: e.location || "",
        gpa: e.gpa || ""
      })),
      skills: ext.skills || [],
      projects: [],
      languages: [],
      certifications: [],
      references: [],
      sectionsOrder: ['summary', 'experience', 'education', 'skills'],
      templateId: "minimal",
      colorTheme: "#4f46e5",
      fontFamily: "Inter",
      spacing: "comfortable"
    };

    if (onImportScannedResume) {
      onImportScannedResume(newResumeData);
      alert("🎉 Successfully imported scanned paper resume data! Navigating to Resume Editor.");
    } else {
      // Fallback save to localStorage
      const savedResumes = JSON.parse(localStorage.getItem("cvcraft_resumes") || "[]");
      savedResumes.unshift(newResumeData);
      localStorage.setItem("cvcraft_resumes", JSON.stringify(savedResumes));
      alert("🎉 Successfully created new resume document from paper scan!");
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto flex flex-col h-[85vh] rounded-2xl border shadow-2xl overflow-hidden transition-all ${
      isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
    }`}>

      {/* Header bar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
        isDark ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg leading-tight">CVCraft AI Career Coach</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Gemini 3.5 & 3.1 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multimodal Vision & Live Web Search Grounding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active resume selector */}
          {resumes.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline font-semibold">Active Resume Context:</span>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                }`}
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.personalInfo?.jobTitle || "Untitled"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Grounding toggle */}
          <button
            onClick={() => setSearchGroundingEnabled(!searchGroundingEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              searchGroundingEnabled
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
            title="Toggle Google Search Grounding for live web data"
          >
            <Globe className={`h-3.5 w-3.5 ${searchGroundingEnabled ? "text-emerald-400 animate-pulse" : ""}`} />
            <span className="hidden sm:inline">Grounding:</span>
            <span>{searchGroundingEnabled ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* QUICK CAREER PROMPT CHIPS */}
      <div className={`px-6 py-2.5 border-b flex items-center gap-2 overflow-x-auto text-xs ${
        isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-100 border-slate-200"
      }`}>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 shrink-0 mr-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-indigo-400" /> Career Prompts:
        </span>
        {[
          "Which internship / role should I apply for based on my resume?",
          "Improve this bullet point for maximum impact",
          "Explain how to answer this interview question",
          "How do I negotiate salary for my role & level?",
          "Generate a 30-second elevator pitch"
        ].map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(promptText)}
            disabled={isLoading || isScanningImage}
            className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition border ${
              isDark 
                ? "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800 hover:border-indigo-500/50" 
                : "bg-white text-slate-700 hover:bg-indigo-50 border-slate-300 hover:border-indigo-300"
            }`}
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md ${
              msg.role === "user"
                ? "bg-indigo-600 shadow-indigo-600/20"
                : "bg-gradient-to-tr from-purple-600 to-pink-600 shadow-purple-600/20"
            }`}>
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Content box */}
            <div className={`max-w-[82%] space-y-3`}>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                msg.role === "user"
                  ? isDark
                    ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-100 rounded-tr-none"
                    : "bg-indigo-50 border-indigo-200 text-indigo-950 rounded-tr-none"
                  : isDark
                    ? "bg-slate-800/90 border-slate-700/80 text-slate-100 rounded-tl-none shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
              }`}>
                {/* Optional attached media thumbnail */}
                {safeMediaUrl(msg.mediaUrl) && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-indigo-500/30 max-w-xs bg-black/40">
                    <img src={safeMediaUrl(msg.mediaUrl)} alt="Attached input" className="max-h-48 w-full object-contain" />
                  </div>
                )}

                <div className="space-y-2 font-sans text-sm leading-relaxed antialiased [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:font-bold [&_strong]:text-indigo-300 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-bold [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:bg-black/30 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
                  <Markdown>{msg.content}</Markdown>
                </div>

                {/* Grounding Sources section */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                      <Globe className="h-3.5 w-3.5" />
                      <span>Google Search Grounding Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.groundingSources.map((source, idx) => {
                        const safeHref = safeExternalUrl(source.uri);
                        if (!safeHref) return null;
                        return (
                          <a
                            key={idx}
                            href={safeHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                          >
                            <span className="truncate max-w-[200px]">{source.title}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {msg.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sug)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                        isDark
                          ? "bg-slate-800/80 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/20 hover:border-indigo-400"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                      }`}
                    >
                      <span>{sug}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-slate-500 font-mono px-1">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicators */}
        {(isLoading || isScanningImage) && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className={`px-4 py-3 rounded-2xl text-xs font-medium border flex items-center gap-2 ${
              isDark ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
            }`}>
              <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span>
                {isScanningImage 
                  ? "Gemini 3.1 Pro Vision is scanning document photo & extracting structured data..." 
                  : "CVCraft Gemini AI is researching and drafting response..."}
              </span>
            </div>
          </div>
        )}

        {/* Scanned Result Banner & Import Button */}
        {scannedResult?.extractedResume && (
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}>
            <div className="flex items-center gap-2 text-xs font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>Extracted paper resume scan is ready for import into the CVCraft builder!</span>
            </div>
            <button
              onClick={handleImportExtractedData}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <FileUp className="h-4 w-4" />
              <span>Import into Resume Editor</span>
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Image Preview drawer if image is attached */}
      {imagePreview && (
        <div className={`p-3 border-t flex items-center justify-between gap-4 ${
          isDark ? "bg-slate-800/90 border-slate-700" : "bg-indigo-50 border-indigo-200"
        }`}>
          <div className="flex items-center gap-3">
            <img src={imagePreview} alt="Upload preview" className="h-12 w-12 object-cover rounded-lg border border-indigo-500/40" />
            <div className="text-xs">
              <div className="font-semibold text-slate-200">{imageFile?.name || "Attached Photo"}</div>
              <div className="flex items-center gap-3 mt-1">
                <label className="flex items-center gap-1 cursor-pointer text-indigo-400 hover:underline">
                  <input
                    type="radio"
                    name="scanMode"
                    checked={scanMode === "resume"}
                    onChange={() => setScanMode("resume")}
                    className="text-indigo-600"
                  />
                  <span>Scan Paper Resume</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-indigo-400 hover:underline">
                  <input
                    type="radio"
                    name="scanMode"
                    checked={scanMode === "job_poster"}
                    onChange={() => setScanMode("job_poster")}
                    className="text-indigo-600"
                  />
                  <span>Analyze Job Poster</span>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setImageFile(null);
              setImagePreview(null);
            }}
            className="text-xs font-medium text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
          >
            Remove Photo
          </button>
        </div>
      )}

      {/* Input area */}
      <div className={`p-4 border-t ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* File input button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 rounded-xl border text-slate-400 hover:text-white transition-all ${
              imagePreview
                ? "bg-indigo-600 text-white border-indigo-500"
                : isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-750" : "bg-slate-100 border-slate-200 hover:bg-slate-200"
            }`}
            title="Upload photo of paper resume or screenshot of job poster for Gemini Vision analysis"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              imagePreview 
                ? "Add optional instructions for this image (or press Send)..." 
                : "Ask AI Coach, e.g. 'What are average salaries for a Senior React Engineer?'"
            }
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-300 text-slate-900"
            }`}
            disabled={isLoading || isScanningImage}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={(!inputMessage.trim() && !imagePreview) || isLoading || isScanningImage}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
          >
            <span>Send</span>
            <Send className="h-4 w-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
          <span>💡 Upload photos of paper resumes or job postings to extract structured data automatically.</span>
          <span className="font-mono">Google GenAI SDK</span>
        </div>
      </div>
    </div>
  );
}
