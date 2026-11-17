import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  MessageSquare, Star, Send, ShieldAlert, Sparkles, AlertCircle,
  ThumbsUp, CheckCircle, RefreshCw, Paperclip, Trash2, Image, Video, 
  Eye, X, Users, ArrowRight, HelpCircle, Search, ChevronDown, 
  ChevronUp, BookOpen, Brain, FileText, Zap, Shield, Sparkle,
  Sliders, Award, Laptop, CheckCheck, Lightbulb, ExternalLink, Bot
} from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, query, where, onSnapshot, setDoc, doc, updateDoc, getDocs
} from "firebase/firestore";
import { UserSession } from "../types";
import { safeMediaUrl } from "../utils/security";

interface SupportFeedbackProps {
  user: UserSession;
  onOpenDirectMessages?: () => void;
  onNavigateToView?: (view: string) => void;
}

interface ChatMessage {
  id: string;
  userId: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  message: string;
  createdAt: string;
  read?: boolean;
  mediaUrl?: string;
  mediaType?: string;
}

interface UserReview {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface FAQItem {
  id: string;
  category: "getting-started" | "ai-tools" | "messages" | "skill-arena" | "settings" | "troubleshooting";
  categoryLabel: string;
  question: string;
  answer: string;
  bullets?: string[];
  actionLabel?: string;
  actionView?: string;
  badge?: string;
}

const FAQ_DATABASE: FAQItem[] = [
  {
    id: "faq-resume-create",
    category: "getting-started",
    categoryLabel: "Resume & Cover Letter Studio",
    question: "How do I create and customize an ATS-friendly resume?",
    answer: "Creating a professional resume takes just seconds with our studio editor designed to pass Applicant Tracking Systems (ATS) with 95%+ score accuracy:",
    bullets: [
      "Navigate to 'Resume Builder' or click 'Create Resume' from your Dashboard.",
      "Choose from 10+ professional templates (Tokyo Modern, Berlin Executive, Zurich Minimal, Tech Minimalist, Nordic Bold, etc.).",
      "Fill in your Contact, Summary, Experience, Education, Skills, Projects, and Certifications sections.",
      "The layout dynamically ensures correct semantic headings, clean single-column structure, and high contrast for automated scanner readability."
    ],
    actionLabel: "Open Resume Studio",
    actionView: "resume-editor",
    badge: "Popular"
  },
  {
    id: "faq-resume-export",
    category: "getting-started",
    categoryLabel: "Resume & Cover Letter Studio",
    question: "How do I export my resume and cover letters to PDF?",
    answer: "You can download print-ready PDF files and structured JSON backups anytime:",
    bullets: [
      "In the Resume Builder or Cover Letter Studio, click the 'Export PDF' button in the top action bar.",
      "The system computes exact A4 / US Letter pagination without overflowing margins or clipped text.",
      "To download raw JSON backups for multi-device migration, visit 'Settings & Export' and use the 'Download Backup' utility."
    ],
    actionLabel: "Explore Export Options",
    actionView: "settings",
    badge: "Essential"
  },
  {
    id: "faq-cover-letters",
    category: "getting-started",
    categoryLabel: "Resume & Cover Letter Studio",
    question: "How do tailored cover letters work with job matching?",
    answer: "Cover Letters allow you to generate targeted, high-impact introductory letters tailored to specific hiring managers and job requisitions:",
    bullets: [
      "Open 'Cover Letters' from the sidebar.",
      "Enter the target company name, job role, and optional key job requirements.",
      "The system crafts a personalized narrative connecting your background experience directly with the employer's needs."
    ],
    actionLabel: "Create Cover Letter",
    actionView: "letter-editor"
  },
  {
    id: "faq-3d-analytics",
    category: "getting-started",
    categoryLabel: "Resume & Cover Letter Studio",
    question: "What is the 3D Resume Analytics Visualizer?",
    answer: "The 3D Analytics tool evaluates your active resume across 8 core hiring dimensions: ATS Keyword Density, Metric Quantification, Action Verb Impact, Brevity, Section Balance, Readability, Contact Completeness, and Leadership Signals in an interactive visualizer."
  },
  {
    id: "faq-ai-coach",
    category: "ai-tools",
    categoryLabel: "AI Career Intelligence",
    question: "How does the AI Resume Coach optimize my bullet points?",
    answer: "The AI Resume Coach provides real-time intelligent feedback to maximize your interview callback rate:",
    bullets: [
      "Identifies missing high-frequency industry keywords for your target profession.",
      "Suggests metric quantification improvements (e.g. converting 'Managed servers' into 'Maintained 99.98% uptime across 45+ production servers').",
      "Replaces passive phrases with high-impact power verbs.",
      "Calculates an overarching ATS Health & Readiness score."
    ],
    actionLabel: "Launch AI Coach",
    actionView: "resume-coach",
    badge: "AI Powered"
  },
  {
    id: "faq-interview-ai",
    category: "ai-tools",
    categoryLabel: "AI Career Intelligence",
    question: "How does the Interview AI Simulator work?",
    answer: "Interview AI simulates real-world hiring rounds tailored to your target position and seniority level:",
    bullets: [
      "Select your target job title (e.g. Senior Frontend Engineer, Product Manager, Financial Analyst).",
      "Practice answering behavioral (STAR method), technical, and scenario-based interview questions.",
      "Receive instant scorecards grading your clarity, conciseness, technical depth, and confidence."
    ],
    actionLabel: "Start Interview Sim",
    actionView: "interview-intelligence",
    badge: "AI Powered"
  },
  {
    id: "faq-job-intel",
    category: "ai-tools",
    categoryLabel: "AI Career Intelligence",
    question: "What is Job Intelligence & Alternative Career Paths?",
    answer: "Job Intelligence analyzes the skill portfolio in your active resume and uncovers 10+ matching career titles, adjacent industry roles, estimated compensation ranges, and skill gaps to help you expand your job search."
  },
  {
    id: "faq-ai-chat",
    category: "ai-tools",
    categoryLabel: "AI Career Intelligence",
    question: "What can I ask the AI Career Chat?",
    answer: "The AI Career Chat is your 24/7 personal career advisor. You can ask for salary negotiation strategies, promotion roadmaps, LinkedIn bio optimization, career transition plans, and advice on handling difficult workplace conversations.",
    actionLabel: "Ask Career Chat",
    actionView: "ai-chat"
  },
  {
    id: "faq-dm-search",
    category: "messages",
    categoryLabel: "Community & Direct Messages",
    question: "How do I search for registered users and send direct messages?",
    answer: "Connecting with peers and colleagues is fast and intuitive:",
    bullets: [
      "Click 'Direct Messages' under the Community & Arena section in the sidebar.",
      "Type any prefix into the search bar (e.g., typing 'm' or 'ma' dynamically surfaces all matching registered members).",
      "Select a user from the suggestive dropdown or user list to start chatting in real time.",
      "You can send rich text messages as well as media attachments (photos and short videos under 700 KB)."
    ],
    actionLabel: "Open Direct Messages",
    actionView: "direct-messages",
    badge: "Real-time"
  },
  {
    id: "faq-dm-encryption",
    category: "messages",
    categoryLabel: "Community & Direct Messages",
    question: "Are direct messages encrypted and private?",
    answer: "Yes! All user-to-user direct messages are protected by client-side End-to-End Encryption (E2EE). Messages are encrypted in your browser using a cryptographic key derived specifically from the two conversation participants before being stored in the database, ensuring no third parties can intercept or read your private chats.",
    badge: "Security"
  },
  {
    id: "faq-games-arena",
    category: "skill-arena",
    categoryLabel: "Daily Skill Arena",
    question: "What games are included in the Daily Skill Arena?",
    answer: "The Daily Skill Arena features 3 progressive mind challenges updated every 24 hours to hone your cognitive skills:",
    bullets: [
      "Daily Sudoku Master: 9x9 numerical logic grid with progressive hints, number pad controls, and mistake counters.",
      "Memory Matrix: Spatial working memory challenge that tests your ability to recall expanding illuminated tile patterns.",
      "Pattern Logic Sequence: Algorithmic mathematical and symbolic matrix problem-solving."
    ],
    actionLabel: "Play Daily Games",
    actionView: "skill-arena",
    badge: "Mind Games"
  },
  {
    id: "faq-games-streaks",
    category: "skill-arena",
    categoryLabel: "Daily Skill Arena",
    question: "How do Daily Streaks and the Global Leaderboard work?",
    answer: "Every day you complete at least one game puzzle, your continuous Daily Play Streak increments (marked by the streak flame badge). The Global Solver Dashboard ranks all participating players in real time based on fastest completion times and fewest errors."
  },
  {
    id: "faq-settings-isolation",
    category: "settings",
    categoryLabel: "Settings & Personalization",
    question: "Will my theme, font, and notification settings affect other users?",
    answer: "No. All customization settings (including visual theme palette, typography styles, notification toggles, language, and security preferences) are strictly isolated to your individual account and device. Changes you make apply exclusively to your profile without affecting any other registered user.",
    badge: "Per-User"
  },
  {
    id: "faq-settings-themes",
    category: "settings",
    categoryLabel: "Settings & Personalization",
    question: "How do I switch visual color themes and typography fonts?",
    answer: "You can customize the look and feel anytime by opening 'Settings & Export' or clicking the theme and font switcher cards in the sidebar. Choose from 6+ visual themes (Fire Obsidian, Cyber Neon, Emerald Mint, Slate Dark, Crimson Flame) and curated typeface pairings (Plus Jakarta Sans, Outfit, Playfair Display, Syne, Cinzel, Inter)."
  },
  {
    id: "faq-admin-support",
    category: "troubleshooting",
    categoryLabel: "Help & Technical Support",
    question: "How do I get direct 1-on-1 technical help from the administrator?",
    answer: "If you encounter any issues or have questions, switch to the 'Live Admin Support Chat' tab right on this page. You can chat directly with system administrator Bilal Hassan Mussa (bilalhassanmussa@gmail.com) and attach media screenshots under 700 KB for rapid resolution."
  }
];

export default function SupportFeedback({ user, onOpenDirectMessages, onNavigateToView }: SupportFeedbackProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    return () => unsub();
  }, []);

  // Navigation Tab State: "faq" | "ai-bot" | "chat" | "reviews"
  const [activeTab, setActiveTab] = useState<"faq" | "ai-bot" | "chat" | "reviews">("faq");

  // AI Help Chatbot States
  const [aiBotMessages, setAiBotMessages] = useState<Array<{ role: "user" | "assistant"; content: string; suggestions?: string[] }>>([
    {
      role: "assistant",
      content: `Hello ${user?.displayName || "there"}! 👋 I am your automated **CVCraft AI Help & Support Assistant** powered by Google Gemini.

I can guide you immediately on any question or tool:
- 📄 **Resume Studio & ATS**: How to create, customize templates, and achieve 95+ ATS reality scores.
- 📊 **3D Resume Analytics**: Understanding the 8 core hiring dimensions and employability breakdown.
- ✉️ **Cover Letter Automation**: Tailoring high-converting cover letters to job descriptions.
- 🎯 **Coach Intelligence & Interviews**: Using our AI Career Coach and STAR interview simulator.
- 💎 **Elite Membership & Direct Transfers**: PayPal checkout, Touch 'n Go eWallet, and receipt audits.

How can I help you today?`,
      suggestions: [
        "How does 3D Resume Analytics work?",
        "How do I achieve a 95+ ATS score?",
        "How do I export my resume to PDF?",
        "How do I use Cover Letter Automation?",
        "How do I upgrade with PayPal or Touch 'n Go?"
      ]
    }
  ]);
  const [aiBotInput, setAiBotInput] = useState("");
  const [aiBotLoading, setAiBotLoading] = useState(false);
  const aiBotMessagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendAiBotMessage = async (textToSend?: string) => {
    const text = (textToSend || aiBotInput).trim();
    if (!text || aiBotLoading) return;
    setAiBotInput("");
    const userMsg = { role: "user" as const, content: text };
    const updated = [...aiBotMessages, userMsg];
    setAiBotMessages(updated);
    setAiBotLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          resumeContext: "Platform Help & Knowledge Assistance for CVCraft / Rahmora users. The user is asking about resume building, ATS scoring, 3D analytics, cover letter generation, interview preparation, career coach, settings, payments, or troubleshooting. Provide concise, friendly, formatted answers with bullet points and clear instructions."
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiBotMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: data.reply || "I am ready to help you. What else would you like to know?",
            suggestions: data.suggestions || []
          }
        ]);
      } else {
        throw new Error("AI service error");
      }
    } catch {
      setAiBotMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "I'm here to help! You can check our Knowledge Base FAQ tab for detailed step-by-step guides on every feature, or chat directly with our Lead Administrator in the Live Admin Support Chat tab.",
          suggestions: ["Check Knowledge Base FAQ", "Open Live Admin Support Chat"]
        }
      ]);
    } finally {
      setAiBotLoading(false);
      setTimeout(() => aiBotMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // FAQ Search & Filter States
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-resume-create");

  // Admin Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Review States
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [myReviews, setMyReviews] = useState<UserReview[]>([]);
  const [communityReviews, setCommunityReviews] = useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Attached File State for Admin Chat
  const [adminAttachedFile, setAdminAttachedFile] = useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen Image Lightbox Preview
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filtered FAQ Items
  const filteredFaqs = useMemo(() => {
    return FAQ_DATABASE.filter((faq) => {
      const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
      const query = faqSearchQuery.toLowerCase().trim();
      const matchesQuery = 
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.categoryLabel.toLowerCase().includes(query) ||
        (faq.bullets && faq.bullets.some(b => b.toLowerCase().includes(query)));
      return matchesCategory && matchesQuery;
    });
  }, [faqSearchQuery, selectedCategory]);

  // File Upload helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 720 * 1024) {
      alert(`Attachment size too large (${(file.size / 1024).toFixed(0)} KB). Please select an image/video under 700 KB.`);
      if (e.target) e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAdminAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string
      });
    };
    reader.onerror = () => {
      alert("Failed to read media file. Please try another file.");
    };
    reader.readAsDataURL(file);
  };

  // 1. Listen to user-specific Admin chat messages in real time
  useEffect(() => {
    const targetUid = firebaseUser?.uid || user.uid || user.email;
    if (!targetUid) return;

    const pathStr = "admin_chats";
    const q = query(
      collection(db, pathStr),
      where("userId", "==", targetUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });

        msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(msgs);
        setChatLoading(false);
        setTimeout(scrollToBottom, 100);
      },
      (error) => {
        console.warn("Could not listen to real-time chat messages:", error);
        setChatLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, user.uid, user.email]);

  // 2. Fetch User's existing reviews and all community reviews
  useEffect(() => {
    const targetUid = firebaseUser?.uid || user.uid || user.email;

    const pathStr = "reviews";
    const unsubscribe = onSnapshot(
      collection(db, pathStr),
      (snapshot) => {
        const all: UserReview[] = [];
        const mine: UserReview[] = [];
        snapshot.forEach((doc) => {
          const rev = { id: doc.id, ...doc.data() } as UserReview;
          all.push(rev);
          if (targetUid && rev.userId === targetUid) {
            mine.push(rev);
          }
        });
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        mine.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCommunityReviews(all);
        setMyReviews(mine);
        setReviewsLoading(false);
      },
      (error) => {
        console.warn("Could not fetch reviews:", error);
        setReviewsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, user.uid, user.email]);

  // Handle Review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveUid = firebaseUser?.uid || user.uid || user.email;
    if (!effectiveUid) {
      setReviewStatus({ type: "error", message: "Please sign in to submit a review." });
      return;
    }
    if (!reviewComment.trim()) {
      setReviewStatus({ type: "error", message: "Please enter a comment for your review." });
      return;
    }

    setIsSubmittingReview(true);
    setReviewStatus(null);

    const reviewId = `review_${effectiveUid}_${Date.now()}`;
    const newReview: UserReview = {
      id: reviewId,
      userId: effectiveUid,
      userEmail: firebaseUser?.email || user.email || "user@cvcraft.app",
      userName: user.displayName || firebaseUser?.displayName || user.email?.split("@")[0] || "CVCraft User",
      rating,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "reviews", reviewId), newReview);
      setReviewStatus({ type: "success", message: "Thank you! Your feedback has been submitted successfully." });
      setReviewComment("");
      setRating(5);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      handleFirestoreError(error, OperationType.WRITE, "reviews");
      setReviewStatus({ type: "error", message: error?.message || "Failed to submit review. Please try again." });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle send message to Administrator
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !adminAttachedFile) || !firebaseUser) return;

    const msgContent = newMessage.trim();
    const mediaToSave = adminAttachedFile;

    setIsSendingMsg(true);
    setNewMessage("");
    setAdminAttachedFile(null);
    if (adminFileInputRef.current) adminFileInputRef.current.value = "";

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newMsg: ChatMessage = {
      id: msgId,
      userId: firebaseUser.uid,
      senderId: firebaseUser.uid,
      senderEmail: firebaseUser.email || user.email,
      senderName: user.displayName || firebaseUser.displayName || "User",
      message: msgContent || (mediaToSave?.type.startsWith("video/") ? "📹 Shared a video clip" : "📷 Shared a photo"),
      mediaUrl: mediaToSave?.dataUrl || "",
      mediaType: mediaToSave ? (mediaToSave.type.startsWith("video/") ? "video" : "image") : "none",
      createdAt: new Date().toISOString(),
      read: false
    };

    try {
      await setDoc(doc(db, "admin_chats", msgId), newMsg);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending support message:", error);
      alert("Failed to send message. Please check connection.");
    } finally {
      setIsSendingMsg(false);
    }
  };

  const categories = [
    { id: "all", label: "All Questions", icon: HelpCircle },
    { id: "getting-started", label: "Resume & Studio", icon: FileText },
    { id: "ai-tools", label: "AI Career Intelligence", icon: Sparkles },
    { id: "messages", label: "Direct Messages & Privacy", icon: Users },
    { id: "skill-arena", label: "Daily Skill Arena", icon: Brain },
    { id: "settings", label: "Settings & Themes", icon: Sliders },
    { id: "troubleshooting", label: "Support & Help", icon: ShieldAlert }
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 font-sans pb-16 no-print">
      
      {/* Lightbox Modal */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-800 rounded-full text-slate-400 hover:text-white"
            onClick={() => setLightboxImg(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img 
            src={lightboxImg} 
            alt="Expanded Attachment Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
          />
        </div>
      )}

      {/* Page Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display flex items-center gap-2">
                Help, FAQ & Support Center
              </h1>
              <p className="text-xs text-slate-400 max-w-xl">
                Explore instant answers on how every tool works, practice with guided walkthroughs, connect 1-on-1 with support, or leave your review.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenDirectMessages && (
              <button
                onClick={onOpenDirectMessages}
                className="text-xs px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 font-bold rounded-xl transition flex items-center gap-2"
              >
                <Users className="h-4 w-4 text-indigo-400" /> Direct Messages
              </button>
            )}
            <button
              onClick={() => setActiveTab("chat")}
              className="text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <MessageSquare className="h-4 w-4" /> Live Admin Chat
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("faq")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "faq"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Help & Knowledge Base FAQ
            <span className="text-[10px] px-1.5 py-0.2 bg-white/20 text-white rounded-full font-mono font-bold">
              {FAQ_DATABASE.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ai-bot")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "ai-bot"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Bot className="h-4 w-4 text-sky-400" />
            AI Help Assistant
            <span className="text-[10px] px-1.5 py-0.2 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full font-mono font-bold">
              Gemini
            </span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "chat"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Live Admin Support Chat
            {messages.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500 text-slate-950 rounded-full font-mono font-bold">
                Live
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "reviews"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Star className="h-4 w-4 text-amber-400" />
            Ratings & Feedback
            {myReviews.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded-full font-mono font-bold">
                {myReviews.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: HELP CENTER & FREQUENTLY ASKED QUESTIONS */}
      {activeTab === "faq" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Search and Category Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                placeholder="Search any question (e.g., ATS scoring, exporting PDF, encrypted messages, sudoku games, changing fonts)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition shadow-inner"
              />
              {faqSearchQuery && (
                <button
                  onClick={() => setFaqSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    <IconComponent className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-slate-500"}`} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Start Guide 4-Step Flow */}
          {!faqSearchQuery && selectedCategory === "all" && (
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Quick Start Guide — Master CVCraft in 4 Steps
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                  Beginner Friendly
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs font-mono">1</span>
                    <FileText className="h-4 w-4 text-teal-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Build Your Resume</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pick a template in Resume Studio, add your experience, and watch your ATS score rise.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">2</span>
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">AI Resume Coach</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Get keyword suggestions, quantify impact metrics, and simulate mock interviews.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs font-mono">3</span>
                    <Brain className="h-4 w-4 text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Daily Skill Arena</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Solve Daily Sudoku and Logic puzzles to build streaks and climb the global dashboard.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs font-mono">4</span>
                    <Users className="h-4 w-4 text-pink-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Connect & Network</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Search registered colleagues with suggestive search and send encrypted direct messages.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Accordion List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? "Result" : "Answers"}
              </span>
              {faqSearchQuery && (
                <button
                  onClick={() => { setFaqSearchQuery(""); setSelectedCategory("all"); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  Clear search filters
                </button>
              )}
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No matching answers found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try another keyword or chat with administrator Bilal Hassan Mussa in the Live Chat tab.
                </p>
                <button
                  onClick={() => setActiveTab("chat")}
                  className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Ask in Live Support Chat
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`bg-slate-900 border transition-all duration-200 rounded-2xl overflow-hidden shadow-lg ${
                      isExpanded ? "border-indigo-500/50 bg-slate-900/90" : "border-slate-800 hover:border-slate-700/80"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {faq.categoryLabel}
                          </span>
                          {faq.badge && (
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {faq.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white pt-0.5">
                          {faq.question}
                        </h3>
                      </div>
                      <div className={`p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 transition-transform shrink-0 mt-1 ${
                        isExpanded ? "rotate-180 text-indigo-400 border-indigo-500/40" : ""
                      }`}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-slate-300 space-y-3 border-t border-slate-800/80 leading-relaxed animate-fade-in">
                        <p>{faq.answer}</p>

                        {faq.bullets && (
                          <ul className="space-y-2 pl-4 list-disc text-slate-300/90 marker:text-indigo-400">
                            {faq.bullets.map((bullet, bIdx) => (
                              <li key={bIdx}>{bullet}</li>
                            ))}
                          </ul>
                        )}

                        {faq.actionLabel && faq.actionView && onNavigateToView && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => onNavigateToView(faq.actionView!)}
                              className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                            >
                              <span>{faq.actionLabel}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Need More Assistance Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-400" /> Still have questions or need technical support?
              </h4>
              <p className="text-xs text-slate-400">
                Our lead administrator Bilal Hassan Mussa is available to assist you in real time.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("chat")}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 shrink-0"
            >
              <MessageSquare className="h-4 w-4" /> Message Support Representative
            </button>
          </div>
        </div>
      )}

      {/* TAB: AUTOMATED AI HELP & KNOWLEDGE CHATBOT */}
      {activeTab === "ai-bot" && (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col h-[650px] relative overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  CVCraft Automated AI Help Assistant
                  <span className="text-[10px] px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full font-mono font-bold">
                    Powered by Google Gemini 3.8
                  </span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  Instant 24/7 automated answers for resume formatting, ATS scoring, 3D analytics, cover letters, and payments
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("chat")}
              className="text-[11px] px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition flex items-center gap-1.5 shrink-0 hidden sm:flex"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Contact Human Admin
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin">
            {aiBotMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} space-y-1`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 shadow-md ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-80 border-b border-white/10 pb-1 mb-1">
                    {msg.role === "user" ? (
                      <span className="font-bold">You</span>
                    ) : (
                      <span className="font-bold flex items-center gap-1 text-sky-400">
                        <Sparkles className="h-3 w-3" /> Rahmora AI Assistant
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                    {msg.content}
                  </div>

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleSendAiBotMessage(sug)}
                          disabled={aiBotLoading}
                          className="text-[11px] px-2.5 py-1 bg-slate-900/80 hover:bg-indigo-600/40 text-sky-300 hover:text-white border border-sky-500/30 rounded-lg transition text-left cursor-pointer disabled:opacity-50"
                        >
                          💡 {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {aiBotLoading && (
              <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-sky-400 w-fit">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Thinking and analyzing answer with Gemini 3.8 Flash...</span>
              </div>
            )}
            <div ref={aiBotMessagesEndRef} />
          </div>

          {/* Quick Starter Prompts Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 shrink-0">
            {[
              "How do I achieve a 95+ ATS score?",
              "What is 3D Resume Analytics?",
              "How do I export PDF without layout shift?",
              "How does Cover Letter Automation work?",
              "How to verify payments with PayPal / TNG?"
            ].map((quick, qIdx) => (
              <button
                key={qIdx}
                type="button"
                onClick={() => handleSendAiBotMessage(quick)}
                disabled={aiBotLoading}
                className="text-[10px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg whitespace-nowrap transition cursor-pointer shrink-0 disabled:opacity-40"
              >
                {quick}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAiBotMessage();
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-800 shrink-0"
          >
            <input
              type="text"
              value={aiBotInput}
              onChange={(e) => setAiBotInput(e.target.value)}
              placeholder="Ask any question about using CVCraft, ATS rules, templates, or features..."
              disabled={aiBotLoading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
            <button
              type="submit"
              disabled={aiBotLoading || !aiBotInput.trim()}
              className="px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shrink-0"
            >
              {aiBotLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: REVIEWS & COMMUNITY FEEDBACK */}
      {activeTab === "reviews" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Left Column: Review Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Star className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Review & Share Your Feedback</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                We highly appreciate your reviews. Rate your experience and send suggestions directly to our team.
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Star Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 hover:scale-110 transition cursor-pointer"
                      >
                        <Star 
                          className={`h-7 w-7 transition-all ${
                            star <= (hoverRating ?? rating)
                              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                              : "text-slate-600 hover:text-slate-400"
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-400 font-mono ml-2">
                      ({rating}/5)
                    </span>
                  </div>
                </div>

                {/* Review Text */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Your Comments & Suggestions</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="What do you love about the platform? Any templates, tools or features you'd like added?"
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition resize-none"
                  />
                </div>

                {reviewStatus && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    reviewStatus.type === "success" 
                      ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-300"
                      : "bg-rose-950/60 border border-rose-500/30 text-rose-300"
                  }`}>
                    {reviewStatus.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{reviewStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingReview || !reviewComment.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  {isSubmittingReview ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                  Submit Review
                </button>
              </form>
            </div>

            {/* User's Previous Reviews Roster */}
            {myReviews.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Your Past Reviews ({myReviews.length})</h4>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {myReviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`h-3 w-3 ${s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Community Reviews Showcase */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 max-h-[620px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <Star className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Community Reviews & Ratings</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {communityReviews.length} Verified user feedbacks
                  </span>
                </div>
              </div>
              {communityReviews.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-white font-mono">
                    {(communityReviews.reduce((sum, r) => sum + r.rating, 0) / communityReviews.length).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {reviewsLoading ? (
                <div className="py-16 text-center text-xs font-mono text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-400" /> Loading customer reviews...
                </div>
              ) : communityReviews.length === 0 ? (
                <div className="py-16 text-center text-xs font-mono text-slate-500">
                  Be the first to share your experience with CVCraft!
                </div>
              ) : (
                communityReviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{rev.userName || "Verified User"}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`h-3 w-3 ${s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-800"}`} 
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-300 italic font-mono leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-850/60 break-words">
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE ADMIN SUPPORT CHAT */}
      {activeTab === "chat" && (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col h-[600px] relative overflow-hidden animate-fade-in">
          {/* Support Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                <ShieldAlert className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  Admin Live Support
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Official Support Representative: bilalhassanmussa@gmail.com
                </span>
              </div>
            </div>
          </div>

          {/* Support Chat Messages Body */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
            {chatLoading ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500 gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" /> Connecting to Support Server...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-full text-indigo-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">How can we help you today?</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed mt-1">
                    Send a question, report an issue, or attach screenshots under 700 KB. Our administrator responds promptly.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, mIdx) => {
                const isAdmin = msg.senderEmail === "bilalhassanmussa@gmail.com";
                const isFromMe = msg.senderId === (firebaseUser?.uid || user.uid || user.email) && !isAdmin;
                const uniqueKey = msg.id ? `${msg.id}_${mIdx}` : `admin_msg_${mIdx}`;

                return (
                  <div 
                    key={uniqueKey} 
                    className={`flex flex-col ${isFromMe ? "items-end" : "items-start"} space-y-1`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 shadow-md ${
                      isFromMe 
                        ? "bg-indigo-600 text-white rounded-br-none" 
                        : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none"
                    }`}>
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 text-[10px] font-mono opacity-80">
                        <span className="font-bold flex items-center gap-1">
                          {isAdmin && <ShieldAlert className="h-3 w-3 text-amber-400" />}
                          {isAdmin ? "Admin (Bilal)" : msg.senderName}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Media preview */}
                      {(() => {
                        const validMediaUrl = safeMediaUrl(msg.mediaUrl);
                        if (!validMediaUrl) return null;
                        return (
                          <div className="space-y-1.5 pt-1">
                            {msg.mediaType === "video" ? (
                              <video 
                                src={validMediaUrl} 
                                controls 
                                className="max-h-48 w-full rounded-xl border border-slate-800 bg-black" 
                              />
                            ) : (
                              <div className="relative group cursor-pointer" onClick={() => setLightboxImg(validMediaUrl)}>
                                <img 
                                  src={validMediaUrl} 
                                  alt="Attachment" 
                                  className="max-h-48 w-full object-cover rounded-xl border border-slate-800 hover:opacity-90 transition" 
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl transition">
                                  <Eye className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {msg.message && (
                        <p className="break-words font-medium whitespace-pre-wrap">{msg.message}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Chip */}
          {adminAttachedFile && (
            <div className="mb-2 p-2 bg-slate-950 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 truncate">
                {adminAttachedFile.type.startsWith("video/") ? (
                  <Video className="h-4 w-4 text-indigo-400 shrink-0" />
                ) : (
                  <Image className="h-4 w-4 text-indigo-400 shrink-0" />
                )}
                <span className="text-slate-300 font-mono text-[11px] truncate">{adminAttachedFile.name}</span>
                <span className="text-[9px] text-slate-500 font-mono">({(adminAttachedFile.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button 
                type="button" 
                onClick={() => setAdminAttachedFile(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="mt-auto pt-3 border-t border-slate-800 shrink-0 flex items-center gap-2">
            <input 
              type="file"
              ref={adminFileInputRef}
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => adminFileInputRef.current?.click()}
              disabled={chatLoading || isSendingMsg}
              className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
              title="Attach Photo or Video (<700KB)"
            >
              <Paperclip className="h-4.5 w-4.5" />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={chatLoading || isSendingMsg}
              placeholder={adminAttachedFile ? "Add a caption, or send now..." : "Type your message to the administrator..."}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={(!newMessage.trim() && !adminAttachedFile) || chatLoading || isSendingMsg}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
