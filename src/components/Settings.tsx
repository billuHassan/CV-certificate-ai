import React, { useState } from "react";
import {
  Settings as SettingsIcon, Shield, Database, Download, Upload, HelpCircle,
  CheckCircle, Globe, Bell, Moon, Mail, User, ShieldAlert, ShieldCheck, Camera, CreditCard, Check, Trash2, Landmark, RefreshCw
} from "lucide-react";
import { UserSession, ResumeData, CoverLetterData } from "../types";
import { compressImage } from "../lib/imageUtils";
import { setLanguageCookie } from "../lib/languageUtils";

export interface ThemeDefinition {
  id: string;
  name: string;
  elementName: string;
  icon: string;
  description: string;
  isDark: boolean;
  bgClass: string;
  sidebarClass: string;
  cardClass: string;
  subCardClass: string;
  borderClass: string;
  accentClass: string;
  textClass: string;
  textPrimary: string;
  textMuted: string;
  textHeading: string;
  textAccent: string;
  badgeBg: string;
  navActiveBg: string;
  dotColors: string[]; // for theme color preview dots
  glowClass: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "fire",
    name: "Fire (Fiery Lava & Ember)",
    elementName: "Fire Element",
    icon: "🔥",
    description: "Volcanic crimson dark canvas with glowing ember orange, lava red accents & warm obsidian borders.",
    isDark: true,
    bgClass: "bg-[#180806] text-amber-50",
    sidebarClass: "bg-[#250d08] border-orange-900/60 shadow-lg shadow-orange-950/40",
    cardClass: "bg-[#2a0e0a]/90 border-orange-800/40 shadow-xl shadow-orange-950/50 backdrop-blur-md",
    subCardClass: "bg-[#1f0a07]/80 border-orange-900/40 text-amber-100",
    borderClass: "border-orange-900/50",
    accentClass: "bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-600/30",
    textClass: "text-amber-50",
    textPrimary: "text-amber-100",
    textMuted: "text-amber-300/70",
    textHeading: "text-amber-50",
    textAccent: "text-orange-400",
    badgeBg: "bg-orange-950/70 border-orange-800/60 text-orange-300",
    navActiveBg: "bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white shadow-lg shadow-orange-600/30",
    dotColors: ["#180806", "#f97316", "#ef4444"],
    glowClass: "ambient-glow-fire"
  },
  {
    id: "water",
    name: "Water (Ocean Abyss & Azure Tide)",
    elementName: "Water Element",
    icon: "🌊",
    description: "Deep oceanic abyssal navy canvas with aquatic cyan tide & glowing underwater blue highlights.",
    isDark: true,
    bgClass: "bg-[#041424] text-cyan-50",
    sidebarClass: "bg-[#09223c] border-cyan-800/60 shadow-lg shadow-cyan-950/40",
    cardClass: "bg-[#0d2a4a]/85 border-cyan-700/40 shadow-xl shadow-cyan-950/50 backdrop-blur-md",
    subCardClass: "bg-[#06192d]/80 border-cyan-800/40 text-cyan-100",
    borderClass: "border-cyan-800/50",
    accentClass: "bg-gradient-to-r from-cyan-500 via-blue-600 to-teal-500 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30",
    textClass: "text-cyan-50",
    textPrimary: "text-cyan-100",
    textMuted: "text-cyan-300/70",
    textHeading: "text-cyan-50",
    textAccent: "text-sky-400",
    badgeBg: "bg-cyan-950/70 border-cyan-800/60 text-cyan-300",
    navActiveBg: "bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 text-white shadow-lg shadow-cyan-600/30",
    dotColors: ["#041424", "#06b6d4", "#3b82f6"],
    glowClass: "ambient-glow-water"
  },
  {
    id: "air",
    name: "Air (Atmospheric Breeze & Sky)",
    elementName: "Air Element",
    icon: "🌬️",
    description: "Ethereal cloud white & sky blue canvas with soft atmospheric indigo glow & crisp light contrast.",
    isDark: false,
    bgClass: "bg-[#edf6ff] text-slate-900",
    sidebarClass: "bg-white/95 border-sky-200 shadow-md shadow-sky-100/50",
    cardClass: "bg-white/90 border-sky-200 shadow-xl shadow-sky-200/50 backdrop-blur-md",
    subCardClass: "bg-sky-50/80 border-sky-200 text-slate-800",
    borderClass: "border-sky-200",
    accentClass: "bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30",
    textClass: "text-slate-900",
    textPrimary: "text-slate-900",
    textMuted: "text-slate-600",
    textHeading: "text-slate-900",
    textAccent: "text-indigo-600",
    badgeBg: "bg-sky-100 border-sky-300 text-sky-800",
    navActiveBg: "bg-gradient-to-r from-indigo-600 via-sky-600 to-blue-600 text-white shadow-lg shadow-indigo-600/25",
    dotColors: ["#edf6ff", "#38bdf8", "#6366f1"],
    glowClass: "ambient-glow-air"
  },
  {
    id: "forest",
    name: "Forest (Deep Emerald Grove & Sylvan)",
    elementName: "Forest Element",
    icon: "🌲",
    description: "Lush dark evergreen forest canvas with vibrant emerald, jade green & leaf-gold highlights.",
    isDark: true,
    bgClass: "bg-[#051b11] text-emerald-50",
    sidebarClass: "bg-[#0b2b1d] border-emerald-800/60 shadow-lg shadow-emerald-950/40",
    cardClass: "bg-[#0f3826]/90 border-emerald-700/40 shadow-xl shadow-emerald-950/50 backdrop-blur-md",
    subCardClass: "bg-[#072115]/80 border-emerald-800/40 text-emerald-100",
    borderClass: "border-emerald-800/50",
    accentClass: "bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-lg shadow-emerald-500/30",
    textClass: "text-emerald-50",
    textPrimary: "text-emerald-100",
    textMuted: "text-emerald-300/70",
    textHeading: "text-emerald-50",
    textAccent: "text-emerald-400",
    badgeBg: "bg-emerald-950/70 border-emerald-800/60 text-emerald-300",
    navActiveBg: "bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow-lg shadow-emerald-600/30",
    dotColors: ["#051b11", "#10b981", "#84cc16"],
    glowClass: "ambient-glow-forest"
  },
  {
    id: "rock",
    name: "Rock (Volcanic Basalt & Obsidian Granite)",
    elementName: "Rock Element",
    icon: "🪨",
    description: "Heavy charcoal basalt stone canvas with metallic slate & sharp neon golden ore accents.",
    isDark: true,
    bgClass: "bg-[#121417] text-stone-100",
    sidebarClass: "bg-[#1a1d24] border-stone-800 shadow-lg shadow-black/50",
    cardClass: "bg-[#21252d]/90 border-stone-700/60 shadow-xl shadow-black/40 backdrop-blur-md",
    subCardClass: "bg-[#171a20]/80 border-stone-800 text-stone-100",
    borderClass: "border-stone-800",
    accentClass: "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 font-extrabold shadow-lg shadow-amber-500/25",
    textClass: "text-stone-100",
    textPrimary: "text-stone-100",
    textMuted: "text-stone-400",
    textHeading: "text-stone-50",
    textAccent: "text-amber-400",
    badgeBg: "bg-stone-900 border-stone-700 text-amber-300",
    navActiveBg: "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-stone-950 font-bold shadow-lg shadow-amber-500/30",
    dotColors: ["#121417", "#78716c", "#f59e0b"],
    glowClass: "ambient-glow-rock"
  }
];

export const WORLD_LANGUAGES = [
  { name: "English (US)", code: "en" },
  { name: "English (UK)", code: "en" },
  { name: "Español (Spanish)", code: "es" },
  { name: "Français (French)", code: "fr" },
  { name: "Deutsch (German)", code: "de" },
  { name: "Italiano (Italian)", code: "it" },
  { name: "Português (Portuguese)", code: "pt" },
  { name: "Русский (Russian)", code: "ru" },
  { name: "日本語 (Japanese)", code: "ja" },
  { name: "简体中文 (Simplified Chinese)", code: "zh-CN" },
  { name: "繁體中文 (Traditional Chinese)", code: "zh-TW" },
  { name: "한국어 (Korean)", code: "ko" },
  { name: "العربية (Arabic)", code: "ar" },
  { name: "हिन्दी (Hindi)", code: "hi" },
  { name: "Türkçe (Turkish)", code: "tr" },
  { name: "Nederlands (Dutch)", code: "nl" },
  { name: "Polski (Polish)", code: "pl" },
  { name: "Svenska (Swedish)", code: "sv" },
  { name: "Norsk (Norwegian)", code: "no" },
  { name: "Dansk (Danish)", code: "da" },
  { name: "Suomi (Finnish)", code: "fi" },
  { name: "Čeština (Czech)", code: "cs" },
  { name: "Ελληνικά (Greek)", code: "el" },
  { name: "Magyar (Hungarian)", code: "hu" },
  { name: "Română (Romanian)", code: "ro" },
  { name: "Tiếng Việt (Vietnamese)", code: "vi" },
  { name: "Bahasa Indonesia (Indonesian)", code: "id" },
  { name: "Bahasa Melayu (Malay)", code: "ms" },
  { name: "ไทย (Thai)", code: "th" },
  { name: "Filipino (Tagalog)", code: "tl" },
  { name: "Українська (Ukrainian)", code: "uk" },
  { name: "עברית (Hebrew)", code: "he" },
  { name: "فارسی (Persian)", code: "fa" },
  { name: "اردو (Urdu)", code: "ur" },
  { name: "Swahili (Kiswahili)", code: "sw" },
  { name: "Amharic (Amharic)", code: "am" },
  { name: "Tamil (Tamil)", code: "ta" },
  { name: "Telugu (Telugu)", code: "te" },
  { name: "Marathi (Marathi)", code: "mr" },
  { name: "Gujarati (Gujarati)", code: "gu" },
  { name: "Kannada (Kannada)", code: "kn" },
  { name: "Malayalam (Malayalam)", code: "ml" }
];

export interface FontDefinition {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  sampleText: string;
  className: string;
}

export const FONT_OPTIONS: FontDefinition[] = [
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    subtitle: "Modern Executive Sans",
    category: "Sans-Serif (Default)",
    sampleText: "RAHMORA Executive Intelligence & Career Architect",
    className: "font-theme-jakarta"
  },
  {
    id: "outfit",
    name: "Outfit",
    subtitle: "Sleek Geometric Tech",
    category: "Geometric Sans",
    sampleText: "RAHMORA Executive Intelligence & Career Architect",
    className: "font-theme-outfit"
  },
  {
    id: "playfair",
    name: "Playfair Display",
    subtitle: "Luxury High-End Serif",
    category: "Editorial Serif",
    sampleText: "RAHMORA Executive Intelligence & Career Architect",
    className: "font-theme-playfair"
  },
  {
    id: "syne",
    name: "Syne",
    subtitle: "Bold Creative Display",
    category: "Avant-Garde Display",
    sampleText: "RAHMORA Executive Intelligence & Career Architect",
    className: "font-theme-syne"
  },
  {
    id: "grotesk",
    name: "Space Grotesk",
    subtitle: "Technical Grotesk",
    category: "Monospace Hybrid",
    sampleText: "RAHMORA Executive Intelligence & Career Architect",
    className: "font-theme-grotesk"
  },
  {
    id: "cinzel",
    name: "Cinzel",
    subtitle: "Classic Leadership Roman",
    category: "Executive Serif",
    sampleText: "RAHMORA Executive Intelligence & Career Architect",
    className: "font-theme-cinzel"
  },
  {
    id: "inter",
    name: "Inter",
    subtitle: "Ultra Clean Minimalist",
    category: "Neutral Sans",
    sampleText: "RAHMORA Executive Intelligence & Career Architect",
    className: "font-theme-inter"
  }
];

interface SettingsProps {
  user: UserSession;
  resumes: ResumeData[];
  letters: CoverLetterData[];
  onUpgrade: () => void;
  onImportBackup: (data: { resumes: ResumeData[]; letters: CoverLetterData[] }) => void;
  onUpdateUser: (updatedUser: UserSession) => void;
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  appFont?: string;
  onFontChange?: (fontId: string) => void;
}

export default function Settings({
  user,
  resumes,
  letters,
  onUpgrade,
  onImportBackup,
  onUpdateUser,
  currentTheme,
  onThemeChange,
  appFont = "jakarta",
  onFontChange
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "language" | "display" | "notifications">("profile");

  // Profile Edit fields
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security & Password Change fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Language & Regional fields
  const [lang, setLang] = useState(() => {
    const userKey = user ? `cvcraft_${user.uid}_lang` : "cvcraft_lang";
    return localStorage.getItem(userKey) || localStorage.getItem("cvcraft_lang") || "English (US)";
  });
  const [region, setRegion] = useState(() => {
    const userKey = user ? `cvcraft_${user.uid}_region` : "cvcraft_region";
    return localStorage.getItem(userKey) || localStorage.getItem("cvcraft_region") || "United States (EST/PST)";
  });
  const [currency, setCurrency] = useState(() => {
    const userKey = user ? `cvcraft_${user.uid}_currency` : "cvcraft_currency";
    return localStorage.getItem(userKey) || localStorage.getItem("cvcraft_currency") || "USD ($)";
  });
  const [langSuccess, setLangSuccess] = useState(false);

  // Detailed Notification switches
  const [notifsEmailAlerts, setNotifsEmailAlerts] = useState(() => {
    const userKey = user ? `cvcraft_${user.uid}_notif_email` : "cvcraft_notif_email";
    return localStorage.getItem(userKey) !== "false";
  });
  const [notifsAtsResults, setNotifsAtsResults] = useState(() => {
    const userKey = user ? `cvcraft_${user.uid}_notif_ats` : "cvcraft_notif_ats";
    return localStorage.getItem(userKey) !== "false";
  });
  const [notifsViews, setNotifsViews] = useState(() => {
    const userKey = user ? `cvcraft_${user.uid}_notif_views` : "cvcraft_notif_views";
    return localStorage.getItem(userKey) !== "false";
  });
  const [notifsUpdates, setNotifsUpdates] = useState(() => {
    const userKey = user ? `cvcraft_${user.uid}_notif_updates` : "cvcraft_notif_updates";
    return localStorage.getItem(userKey) !== "false";
  });
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Backup file upload states
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Profile Picture uploading
  const handlePhotoUpload = async (file: File) => {
    try {
      const base64String = await compressImage(file, 160, 160, 0.75);
      onUpdateUser({
        ...user,
        profilePhoto: base64String
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Image processing error:", err);
      alert("Failed to process image. Please try another file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleRemovePhoto = () => {
    onUpdateUser({
      ...user,
      profilePhoto: undefined
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Profile fields saving
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim()) {
      alert("Name and email are required.");
      return;
    }
    onUpdateUser({
      ...user,
      displayName,
      email
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Password Security Change
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMsg("");

    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setPasswordError("Password must include an uppercase letter, a number, and a special symbol.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setIsChangingPass(true);
    setTimeout(() => {
      setIsChangingPass(false);
      setPasswordMsg("Your password has been successfully updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
  };

  // Personal Profile Data Download (Data Export)
  const handleDownloadPersonalData = () => {
    const exportData = {
      userProfile: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        isPremium: user.isPremium,
        exportedAt: new Date().toISOString()
      },
      resumesCount: resumes.length,
      lettersCount: letters.length,
      resumes,
      letters
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Personal_Account_Data_${user.displayName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Language saving
  const handleSaveLanguage = () => {
    if (user) {
      localStorage.setItem(`cvcraft_${user.uid}_lang`, lang);
      localStorage.setItem(`cvcraft_${user.uid}_region`, region);
      localStorage.setItem(`cvcraft_${user.uid}_currency`, currency);
      onUpdateUser({
        ...user,
        settings: {
          ...user.settings,
          lang,
          region,
          currency
        }
      });
    }
    localStorage.setItem("cvcraft_lang", lang);
    localStorage.setItem("cvcraft_region", region);
    localStorage.setItem("cvcraft_currency", currency);
    
    // Find the language code
    const selectedLang = WORLD_LANGUAGES.find(l => l.name === lang || l.name.startsWith(lang)) || WORLD_LANGUAGES[0];
    const langCode = selectedLang.code;

    // Use clean cookie setter
    setLanguageCookie(langCode);

    setLangSuccess(true);
    setTimeout(() => {
      setLangSuccess(false);
      window.location.reload();
    }, 1200);
  };

  // Notifications saving
  const handleSaveNotifications = () => {
    if (user) {
      localStorage.setItem(`cvcraft_${user.uid}_notif_email`, String(notifsEmailAlerts));
      localStorage.setItem(`cvcraft_${user.uid}_notif_ats`, String(notifsAtsResults));
      localStorage.setItem(`cvcraft_${user.uid}_notif_views`, String(notifsViews));
      localStorage.setItem(`cvcraft_${user.uid}_notif_updates`, String(notifsUpdates));
      onUpdateUser({
        ...user,
        settings: {
          ...user.settings,
          notifs: {
            email: notifsEmailAlerts,
            ats: notifsAtsResults,
            views: notifsViews,
            updates: notifsUpdates
          }
        }
      });
    }
    localStorage.setItem("cvcraft_notif_email", String(notifsEmailAlerts));
    localStorage.setItem("cvcraft_notif_ats", String(notifsAtsResults));
    localStorage.setItem("cvcraft_notif_views", String(notifsViews));
    localStorage.setItem("cvcraft_notif_updates", String(notifsUpdates));
    setNotifSuccess(true);
    setTimeout(() => setNotifSuccess(false), 3000);
  };

  // Backup operations
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ resumes, letters, version: "1.0" })
    );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CVCraft_AI_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    setImportSuccess("");
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed.resumes) && Array.isArray(parsed.letters)) {
            onImportBackup({ resumes: parsed.resumes, letters: parsed.letters });
            setImportSuccess("Backup imported successfully! All records loaded.");
          } else {
            setImportError("Invalid backup format. Ensure file contains resumes and letters arrays.");
          }
        } catch (err) {
          setImportError("Unable to parse JSON file. Ensure file is structured properly.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6 no-print">
      
      {/* Title */}
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
        <SettingsIcon className="h-6 w-6 text-indigo-400 animate-spin-slow" />
        <div>
          <h2 className="text-xl font-bold text-white font-display">System Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure global preferences, system theme display, languages and secure payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Column Option tabs */}
        <div className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left p-3 rounded-xl font-semibold text-xs transition flex items-center gap-2.5 ${
              activeTab === "profile" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-900/40"
            }`}
          >
            <User className="h-4 w-4" /> Account & Profile
          </button>
          
          <button
            onClick={() => setActiveTab("language")}
            className={`w-full text-left p-3 rounded-xl font-semibold text-xs transition flex items-center gap-2.5 ${
              activeTab === "language" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-900/40"
            }`}
          >
            <Globe className="h-4 w-4" /> Language & Regional
          </button>

          <button
            onClick={() => setActiveTab("display")}
            className={`w-full text-left p-3 rounded-xl font-semibold text-xs transition flex items-center gap-2.5 ${
              activeTab === "display" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-900/40"
            }`}
          >
            <Moon className="h-4 w-4" /> Display Themes (5)
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full text-left p-3 rounded-xl font-semibold text-xs transition flex items-center gap-2.5 ${
              activeTab === "notifications" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-900/40"
            }`}
          >
            <Bell className="h-4 w-4" /> Notification Alerts
          </button>
        </div>

        {/* Right column content */}
        <div className="md:col-span-3 space-y-6">
          
          {/* TAB 1: Profile & Account */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
                <h3 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-850">
                  <User className="h-4.5 w-4.5 text-indigo-400" /> Account Information
                </h3>

                {/* Profile Photo Upload Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Profile Photo (Drag or Click)</label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Drag and Drop Zone Container */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative h-20 w-20 rounded-full flex items-center justify-center overflow-hidden border-2 transition shrink-0 ${
                        isDragOver ? "border-indigo-500 bg-indigo-950/20" : "border-slate-800 bg-slate-950"
                      }`}
                    >
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <span className="text-xl font-extrabold text-indigo-400 uppercase">{user.displayName.charAt(0)}</span>
                        </div>
                      )}
                      
                      {/* Photo overlay */}
                      <label htmlFor="photo-upload-input" className="absolute inset-0 bg-black/60 hover:opacity-100 opacity-0 flex flex-col items-center justify-center cursor-pointer transition text-white">
                        <Camera className="h-4 w-4 mb-0.5" />
                        <span className="text-[8px] font-bold">CHANGE</span>
                      </label>
                      <input
                        id="photo-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    <div className="space-y-1.5 text-center sm:text-left flex-1">
                      <p className="text-xs text-slate-300 font-medium">Add a professional headshot to your system profile.</p>
                      <p className="text-[10px] text-slate-500 leading-normal">Supports Drag & Drop, PNG, JPG, or WEBP. Automatically tokenized locally.</p>
                      
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => document.getElementById("photo-upload-input")?.click()}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-[10px] text-indigo-400 font-bold transition flex items-center gap-1"
                        >
                          <Upload className="h-3 w-3" /> Select Local File
                        </button>
                        {user.profilePhoto && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-lg text-[10px] text-rose-400 font-bold transition flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-bold">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-bold">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <Check className="h-4 w-4" /> Save Profile Details
                  </button>

                  {saveSuccess && (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                      <CheckCircle className="h-3.5 w-3.5" /> Synchronized successfully!
                    </span>
                  )}
                </div>
              </form>

              {/* Password & Security Management */}
              <form onSubmit={handleChangePasswordSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-850">
                  <Shield className="h-4.5 w-4.5 text-indigo-400" /> Password & Security Policy
                </h3>

                {passwordMsg && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{passwordMsg}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-bold">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-bold">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-bold">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {newPassword && (
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-[11px] space-y-1">
                    <p className="font-semibold text-slate-400">Password Requirements Status:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <span className={newPassword.length >= 8 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        ✓ 8+ Chars
                      </span>
                      <span className={/[A-Z]/.test(newPassword) ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        ✓ Uppercase
                      </span>
                      <span className={/[0-9]/.test(newPassword) ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        ✓ Number
                      </span>
                      <span className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        ✓ Symbol
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    {isChangingPass ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>

              {/* Linked Authentication Providers */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-850">
                  <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" /> Linked Authentication Providers
                </h3>

                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Email & Password</span>
                        <span className="text-[10px] text-slate-500 block">{user.email} (Verified)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded">
                      ACTIVE
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.4 13a5.53 5.53 0 0 1 5.59-5.514c2.273 0 4.187 1.258 5.178 3.097l3.712-2.885C20.627 4.17 17.51 2 13.99 2 7.92 2 3 6.92 3 13s4.92 11 10.99 11c6.23 0 11.01-4.383 11.01-11 0-.743-.06-1.458-.174-2.115H12.24Z"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Google Identity Services</span>
                        <span className="text-[10px] text-slate-500 block">Auto-linked OAuth credential</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded">
                      LINKED
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Profile Data Export & Account Deletion */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-850">
                  <Database className="h-4.5 w-4.5 text-indigo-400" /> Account Data & Privacy Management
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Export your personal profile data, resume records, cover letter files, and system preferences in standard JSON format, or manage account deletion options below.
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadPersonalData}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs text-indigo-300 font-bold transition flex items-center gap-2 shadow"
                  >
                    <Download className="h-4 w-4 text-indigo-400" /> Download Personal Profile Data (JSON)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to request account deletion? This action will purge your profile, saved resumes, and cover letters.")) {
                        alert("Account deletion request logged. Signing out session.");
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2.5 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/40 rounded-xl text-xs text-rose-400 font-bold transition flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Account
                  </button>
                </div>
              </div>

              {/* Secure Premium Account Gateway Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 blur-3xl rounded-full" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-850">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-0.5 rounded">
                      CVCraft Premium Account
                    </span>
                    <h3 className="text-base font-extrabold text-white font-display mt-2">Active Membership Tier</h3>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950 text-indigo-300 font-mono font-bold text-xs rounded-xl border border-indigo-500/20">
                      <Shield className="h-4 w-4 text-indigo-400" /> PREMIUM USER (LIFETIME ACCESS)
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Your account has been fully upgraded to the <strong>Premium Tier</strong>. Enjoy unlimited advanced AI diagnostics, ad-free cover letter builders, priority PDF/doc template exports, and continuous resume scanning permanently.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">AI GENERATION</span>
                      <span className="text-xs font-semibold text-slate-200">Unlimited Cover Letters</span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">ATS METRICS</span>
                      <span className="text-xs font-semibold text-slate-200">Deep Resume Audits</span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">PRO FILES</span>
                      <span className="text-xs font-semibold text-slate-200">100% Ad-Free Canvas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Language & Regional */}
          {activeTab === "language" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-850">
                <Globe className="h-4.5 w-4.5 text-indigo-400" /> Language & Regional Settings
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure your display language and locale parameters. Choosing a country region updates formatting rules for job recommendations and ATS calculations globally.
              </p>

              <div className="space-y-4 pt-2">
                
                {/* Interface Language */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 py-2 border-b border-slate-850">
                  <div className="sm:col-span-1">
                    <span className="text-xs font-bold text-slate-200 block">Interface Language</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">System text and template output language</span>
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={lang}
                      onChange={(e) => setLang(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 max-h-40"
                    >
                      {WORLD_LANGUAGES.map((l) => (
                        <option key={l.name} value={l.name}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Country Region */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 py-2 border-b border-slate-850">
                  <div className="sm:col-span-1">
                    <span className="text-xs font-bold text-slate-200 block">Target Job Market Region</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">Customizes layout compliance defaults</span>
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="United States (EST/PST)">United States (EST/PST)</option>
                      <option value="United Kingdom (GMT/BST)">United Kingdom (GMT/BST)</option>
                      <option value="European Union (CET/EET)">European Union (CET/EET)</option>
                      <option value="Canada (EST/CST)">Canada (EST/CST)</option>
                      <option value="Australia (AEST/AWST)">Australia (AEST/AWST)</option>
                      <option value="Southeast Asia (SGT/MYT)">Southeast Asia (SGT/MYT)</option>
                      <option value="East Asia (JST/KST/CST)">East Asia (JST/KST/CST)</option>
                      <option value="Middle East (GST/AST)">Middle East (GST/AST)</option>
                      <option value="South America (BRT/ART)">South America (BRT/ART)</option>
                      <option value="Africa (WAT/EAT/SAST)">Africa (WAT/EAT/SAST)</option>
                    </select>
                  </div>
                </div>

                {/* Local Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 py-2">
                  <div className="sm:col-span-1">
                    <span className="text-xs font-bold text-slate-200 block">Preferred Currency</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">Displays membership bills in your currency</span>
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="USD ($)">USD ($) - United States Dollar</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                      <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                      <option value="AUD ($)">AUD ($) - Australian Dollar</option>
                      <option value="JPY (¥)">JPY (¥) - Japanese Yen</option>
                      <option value="SGD ($)">SGD ($) - Singapore Dollar</option>
                      <option value="SAR (SR)">SAR (SR) - Saudi Riyal</option>
                      <option value="ZAR (R)">ZAR (R) - South African Rand</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={handleSaveLanguage}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Save Regional Settings
                </button>

                {langSuccess && (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                    <CheckCircle className="h-3.5 w-3.5" /> Regional sync active!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Display & Theme */}
          {activeTab === "display" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-850">
                <Moon className="h-4.5 w-4.5 text-amber-400" /> The 5 Elemental Display Themes
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Transform your entire application experience by choosing one of the 5 primal elements: <strong className="text-orange-400">Fire</strong>, <strong className="text-cyan-400">Water</strong>, <strong className="text-sky-400">Air</strong>, <strong className="text-emerald-400">Forest</strong>, or <strong className="text-amber-400">Rock</strong>. Each theme dramatically alters the background canvas, sidebar contrast, card surfaces, borders, glow, and accent highlights!
              </p>

              {/* Theme Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {THEMES.map((theme) => {
                  const isActive = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => onThemeChange(theme.id)}
                      className={`relative p-4 rounded-2xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                        isActive
                          ? "bg-slate-950 border-amber-500/80 shadow-lg ring-2 ring-amber-500/30 scale-[1.02]"
                          : "bg-slate-950/60 border-slate-800 hover:bg-slate-950 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl shrink-0">{theme.icon}</span>
                            <div>
                              <span className="text-xs font-bold text-slate-100 block">{theme.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{theme.elementName}</span>
                            </div>
                          </div>
                          {isActive ? (
                            <span className="h-5 w-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow">
                              <Check className="h-3.5 w-3.5 font-bold" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-mono uppercase border border-slate-800 px-2 py-0.5 rounded-full">
                              Select
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 leading-snug mt-2 line-clamp-2">
                          {theme.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-850/80">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-4 w-4 rounded-full border border-white/20 shadow-sm shrink-0"
                            style={{ backgroundColor: theme.dotColors[0] }}
                          />
                          <div
                            className="h-4 w-4 rounded-full border border-white/20 shadow-sm shrink-0"
                            style={{ backgroundColor: theme.dotColors[1] }}
                          />
                          {theme.dotColors[2] && (
                            <div
                              className="h-4 w-4 rounded-full border border-white/20 shadow-sm shrink-0"
                              style={{ backgroundColor: theme.dotColors[2] }}
                            />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                          {theme.isDark ? "🌙 Dark Canvas" : "☀️ Light Canvas"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-2.5">
                <SettingsIcon className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-400 leading-relaxed">
                  Selecting an elemental theme instantly updates all page layouts, top navigation headers, card surfaces, and control buttons across RAHMORA.
                </span>
              </div>

              {/* SECTION 2: Application Typography Font Family */}
              <div className="pt-6 border-t border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
                      <span className="text-teal-400 text-lg">Aa</span> Global Application Typography Suite
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Customize the typography font family across the entire RAHMORA platform for optimal legibility and aesthetic elegance.
                    </p>
                  </div>
                  <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-300 font-mono px-2.5 py-1 rounded-md font-bold uppercase">
                    Live Dynamic Font Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FONT_OPTIONS.map((font) => {
                    const isSelected = appFont === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => onFontChange?.(font.id)}
                        className={`p-4 rounded-xl border text-left transition duration-200 group relative ${
                          isSelected
                            ? "bg-slate-950 border-teal-500 shadow-lg shadow-teal-500/10 ring-2 ring-teal-500/30"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-white block">{font.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{font.subtitle}</span>
                          </div>
                          {isSelected ? (
                            <span className="h-5 w-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shrink-0 shadow">
                              <Check className="h-3.5 w-3.5 font-bold" />
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-600 font-mono uppercase border border-slate-800 px-2 py-0.5 rounded">
                              Apply
                            </span>
                          )}
                        </div>

                        {/* Font Live Sample Preview Box */}
                        <div className={`mt-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 ${font.className}`}>
                          <p className="text-xs font-bold text-teal-300 truncate">
                            {font.sampleText}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            ABCDEFGHIJKLM 1234567890
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Notifications */}
          {activeTab === "notifications" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-850">
                <Bell className="h-4.5 w-4.5 text-indigo-400" /> Notification Preferences
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure when and how you receive alerts from CVCraft AI regarding your applications, ATS scores, and recruiter interactions.
              </p>

              <div className="space-y-4 pt-2">
                {/* Email Alerts */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Email Alerts</h4>
                    <p className="text-[10px] text-slate-500">Receive weekly summaries, profile optimization tips, and platform updates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifsEmailAlerts(!notifsEmailAlerts)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifsEmailAlerts ? "bg-emerald-600" : "bg-slate-800"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifsEmailAlerts ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* ATS Results */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">ATS Optimization Alerts</h4>
                    <p className="text-[10px] text-slate-500">Instant feedback when your resume completes scanning and ATS calculation scoring.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifsAtsResults(!notifsAtsResults)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifsAtsResults ? "bg-emerald-600" : "bg-slate-800"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifsAtsResults ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Views */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Recruiter Profile Views</h4>
                    <p className="text-[10px] text-slate-500">Get notified when employers view or download your shared live resume portfolios.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifsViews(!notifsViews)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifsViews ? "bg-emerald-600" : "bg-slate-800"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifsViews ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Updates */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">AI Model & Feature Updates</h4>
                    <p className="text-[10px] text-slate-500">Stay informed about new AI features, model enhancements, and design layouts.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifsUpdates(!notifsUpdates)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifsUpdates ? "bg-emerald-600" : "bg-slate-800"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifsUpdates ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-850">
                {notifSuccess ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Notification preferences updated successfully!
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Changes apply instantly to your browser container state.</span>
                )}
                
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-indigo-600/15 transition flex items-center gap-1.5"
                >
                  Save Alerts
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
