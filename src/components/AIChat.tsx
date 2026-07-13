import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Sparkles, Bot, User, RefreshCw, ChevronRight, MessageSquare, 
  HelpCircle, Trash2, ArrowRight, Brain, Zap, CheckCircle2, Copy, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResumeData, UserSession } from "../types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface AIChatProps {
  user: UserSession;
  resumes: ResumeData[];
}

export default function AIChat({ user, resumes }: AIChatProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || "");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello ${user.displayName}! 👋 I am your **CVCraft AI Career Coach**.\n\nI can help you review your resume details, suggest high-impact industry keywords, draft custom experience bullet points, or prepare for mock interviews. Tell me about your career goals, or choose one of the recommended prompts below to get started!`,
      createdAt: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Optimize my target career summary",
    "Suggest top 5 skills to add",
    "List strong ATS action verbs",
    "Mock interview prep guidelines"
  ]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const activeResume = resumes.find(r => r.id === selectedResumeId);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Build context from selected resume
      let resumeContextText = "";
      if (activeResume) {
        const expText = (activeResume.experience || []).map(e => `${e.position} at ${e.company}: ${e.description}`).join("\n");
        const eduText = (activeResume.education || []).map(e => `${e.degree} in ${e.fieldOfStudy} from ${e.school}`).join("\n");
        const skillsText = (activeResume.skills || []).join(", ");
        resumeContextText = `Title: ${activeResume.title}\nJob Title: ${activeResume.personalInfo?.jobTitle || "Not specified"}\nSummary: ${activeResume.summary || "None"}\nSkills: ${skillsText}\nExperience:\n${expText}\nEducation:\n${eduText}`;
      }

      const conversationHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: conversationHistory,
          resumeContext: resumeContextText,
          jobTitleContext: activeResume?.personalInfo?.jobTitle || ""
        })
      });

      if (!response.ok) {
        throw new Error("Failed to receive response from AI Coach.");
      }

      const responseData = await response.json();
      
      const assistantMsg: Message = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: responseData.reply || "I encountered an issue preparing my response. Please try again.",
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (responseData.suggestions && Array.isArray(responseData.suggestions) && responseData.suggestions.length > 0) {
        setSuggestions(responseData.suggestions);
      }
    } catch (err) {
      console.error("AI Coach Chat error:", err);
      setMessages(prev => [...prev, {
        id: "err-" + Date.now(),
        role: "assistant",
        content: "⚠️ **Service Notice**: The AI Coach is currently receiving high traffic. Let me provide a quick optimization tip: ensure your bullet points lead with dynamic action verbs (like *Spearheaded*, *Optimized*, or *Developed*) and include quantifiable metrics where possible!",
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    if (confirm("Are you sure you want to clear your chat history with the AI Coach?")) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Chat history cleared. I am ready for new questions! What career or resume issue would you like to solve today?`,
          createdAt: new Date().toISOString()
        }
      ]);
      setSuggestions([
        "Optimize my target career summary",
        "Suggest top 5 skills to add",
        "List strong ATS action verbs",
        "Mock interview prep guidelines"
      ]);
    }
  };

  // Simple Markdown inline parser for display (supports Bold and Linebreaks)
  const formatMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Bold matching: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-white font-extrabold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      // Check for bullet points
      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
      const cleanLine = isBullet ? line.trim().replace(/^[•-]\s*/, "") : line;

      if (isBullet) {
        return (
          <li key={i} className="ml-4 list-disc text-slate-300 text-xs sm:text-sm leading-relaxed mb-1">
            {parts.length > 0 ? parts : cleanLine}
          </li>
        );
      }

      return (
        <p key={i} className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-2 break-words">
          {parts.length > 0 ? parts : line}
        </p>
      );
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header Panel with Cyberpunk glowing glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-slate-900/80 p-6 sm:p-8 shadow-2xl shadow-indigo-500/5">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20 shrink-0">
              <Brain className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-indigo-400 tracking-wider uppercase bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  AI CAREER CONSULTANT
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">ONLINE</span>
              </div>
              <h2 className="text-2xl font-black text-white font-display tracking-tight sm:text-3xl">
                CVCraft AI Coach
              </h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Ask anything about resume optimization, career advancement, ATS matching, skills targeting, or cover letter enhancement.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2 shrink-0">
              <FileText className="h-4 w-4 text-indigo-400" />
              <label className="text-[11px] text-slate-400 font-bold font-mono uppercase">Context Resume:</label>
            </div>
            {resumes.length > 0 ? (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 outline-none focus:border-indigo-500 transition min-w-[160px]"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.title || "Untitled Resume"}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-rose-400 font-semibold font-mono bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
                No Resumes Found
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Core */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Left Sidebar - Suggested Prompt Chips */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Zap className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">Quick Suggestions</h4>
            </div>
            
            <div className="flex flex-wrap lg:flex-col gap-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(sug)}
                  className="text-left text-xs bg-slate-950 hover:bg-slate-850 hover:border-indigo-500/50 text-slate-300 hover:text-white p-3 rounded-xl border border-slate-800 transition flex items-center justify-between gap-2 group w-full cursor-pointer"
                >
                  <span className="line-clamp-2 leading-snug">{sug}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition shrink-0" />
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 leading-relaxed pt-2">
              💡 Selecting a suggestion instantly queries the AI coach using your chosen resume data for smart tailored advice.
            </div>
          </div>

          <button
            onClick={clearChat}
            className="w-full py-3 bg-slate-950 hover:bg-rose-950/10 border border-slate-850 hover:border-rose-900/30 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" /> Clear Conversation
          </button>
        </div>

        {/* Right Section - Interactive Feed */}
        <div className="lg:col-span-3 flex flex-col h-[550px] bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          
          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const isAI = msg.role === "assistant";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3.5 ${isAI ? "" : "flex-row-reverse"}`}
                  >
                    {/* Avatar */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isAI 
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}>
                      {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>

                    {/* Speech Bubble */}
                    <div className="space-y-1 max-w-[82%]">
                      <div className={`rounded-2xl p-4 border shadow-md relative group/bubble ${
                        isAI 
                          ? "bg-slate-950/60 border-slate-850/80 text-slate-200 rounded-tl-none" 
                          : "bg-indigo-600 text-white border-indigo-500 rounded-tr-none"
                      }`}>
                        
                        {/* Message body */}
                        <div className="space-y-1.5">
                          {isAI ? formatMarkdown(msg.content) : <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                        </div>

                        {/* Copy Option for AI replies */}
                        {isAI && (
                          <button
                            onClick={() => handleCopyMessage(msg.content, index)}
                            className="absolute bottom-2 right-2 opacity-0 group-hover/bubble:opacity-100 transition p-1.5 bg-slate-900/80 text-slate-400 hover:text-white rounded-lg border border-slate-800 cursor-pointer"
                            title="Copy reply text"
                          >
                            {copiedIndex === index ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className={`text-[9px] text-slate-500 block font-mono ${isAI ? "text-left" : "text-right"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* AI thinking state */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3.5"
              >
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl shrink-0">
                  <Bot className="h-4 w-4 animate-pulse" />
                </div>
                <div className="bg-slate-950/60 border border-slate-850/80 rounded-2xl rounded-tl-none p-4 max-w-[80%] flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
                    AI Coach is processing...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="p-4 bg-slate-950 border-t border-slate-800/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={activeResume ? `Ask about "${activeResume.title}"...` : "Type your career question..."}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl transition shrink-0 flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-600/15"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
