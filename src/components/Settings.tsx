import React, { useState } from "react";
import {
  Settings as SettingsIcon, Shield, Database, Download, Upload, HelpCircle,
  CheckCircle, Globe, Bell, Moon, Mail, User, ShieldAlert, Camera, CreditCard, Check, Trash2, Landmark, RefreshCw
} from "lucide-react";
import { UserSession, ResumeData, CoverLetterData } from "../types";
import { compressImage } from "../lib/imageUtils";
import { setLanguageCookie } from "../lib/languageUtils";

export interface ThemeDefinition {
  id: string;
  name: string;
  isDark: boolean;
  bgClass: string;
  sidebarClass: string;
  cardClass: string;
  borderClass: string;
  accentClass: string;
  textClass: string;
  dotColors: string[]; // for theme color preview dots
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "obsidian",
    name: "Obsidian Dark",
    isDark: true,
    bgClass: "bg-slate-950 text-slate-100",
    sidebarClass: "bg-slate-900 border-slate-800",
    cardClass: "bg-slate-900/60 border-slate-800/80",
    borderClass: "border-slate-800",
    accentClass: "bg-indigo-600 hover:bg-indigo-500",
    textClass: "text-slate-100",
    dotColors: ["#090d16", "#4f46e5"]
  },
  {
    id: "midnight",
    name: "Midnight Ocean",
    isDark: true,
    bgClass: "bg-gray-950 text-slate-100",
    sidebarClass: "bg-slate-900 border-slate-800/80",
    cardClass: "bg-slate-900/50 border-slate-800/80",
    borderClass: "border-slate-800",
    accentClass: "bg-blue-600 hover:bg-blue-500",
    textClass: "text-slate-100",
    dotColors: ["#030712", "#2563eb"]
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    isDark: true,
    bgClass: "bg-[#022c22] text-emerald-50",
    sidebarClass: "bg-[#043e31] border-emerald-900/50",
    cardClass: "bg-[#043e31]/40 border-emerald-900/40",
    borderClass: "border-emerald-900/30",
    accentClass: "bg-emerald-600 hover:bg-emerald-500",
    textClass: "text-emerald-50",
    dotColors: ["#022c22", "#059669"]
  },
  {
    id: "cosmic",
    name: "Cosmic Violet",
    isDark: true,
    bgClass: "bg-[#0d0118] text-purple-100",
    sidebarClass: "bg-[#160228] border-purple-950/80",
    cardClass: "bg-[#160228]/40 border-purple-950/60",
    borderClass: "border-purple-950/40",
    accentClass: "bg-purple-600 hover:bg-purple-500",
    textClass: "text-purple-100",
    dotColors: ["#0d0118", "#9333ea"]
  },
  {
    id: "crimson",
    name: "Crimson Sunset",
    isDark: true,
    bgClass: "bg-[#1a050d] text-rose-100",
    sidebarClass: "bg-[#280a18] border-rose-950/80",
    cardClass: "bg-[#280a18]/40 border-rose-950/60",
    borderClass: "border-rose-950/40",
    accentClass: "bg-rose-600 hover:bg-rose-500",
    textClass: "text-rose-100",
    dotColors: ["#1a050d", "#e11d48"]
  },
  {
    id: "amber",
    name: "Amber Gold",
    isDark: true,
    bgClass: "bg-[#1c1917] text-amber-50",
    sidebarClass: "bg-[#292524] border-stone-800",
    cardClass: "bg-[#292524]/50 border-stone-800/80",
    borderClass: "border-stone-800",
    accentClass: "bg-amber-600 hover:bg-amber-500 text-slate-950",
    textClass: "text-amber-50",
    dotColors: ["#1c1917", "#d97706"]
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    isDark: true,
    bgClass: "bg-black text-zinc-100",
    sidebarClass: "bg-zinc-950 border-pink-500/30",
    cardClass: "bg-zinc-900/40 border-pink-500/20",
    borderClass: "border-pink-500/20",
    accentClass: "bg-pink-600 hover:bg-pink-500 text-white",
    textClass: "text-zinc-100",
    dotColors: ["#000000", "#db2777"]
  },
  {
    id: "minimal",
    name: "Minimal Slate",
    isDark: true,
    bgClass: "bg-zinc-900 text-zinc-100",
    sidebarClass: "bg-zinc-950 border-zinc-800",
    cardClass: "bg-zinc-950/40 border-zinc-800/60",
    borderClass: "border-zinc-800",
    accentClass: "bg-zinc-700 hover:bg-zinc-600 text-white",
    textClass: "text-zinc-100",
    dotColors: ["#18181b", "#4b5563"]
  },
  {
    id: "vintage",
    name: "Vintage Sepia",
    isDark: false,
    bgClass: "bg-[#fdf6e3] text-stone-900",
    sidebarClass: "bg-[#eee8d5] border-stone-300",
    cardClass: "bg-[#eee8d5]/40 border-stone-300/80",
    borderClass: "border-stone-300",
    accentClass: "bg-amber-800 hover:bg-amber-700 text-white",
    textClass: "text-stone-900",
    dotColors: ["#fdf6e3", "#9a3412"]
  },
  {
    id: "nordic",
    name: "Nordic Frost",
    isDark: false,
    bgClass: "bg-slate-50 text-slate-900",
    sidebarClass: "bg-white border-slate-200 shadow-sm",
    cardClass: "bg-white border-slate-200 shadow-sm",
    borderClass: "border-slate-200",
    accentClass: "bg-sky-600 hover:bg-sky-500 text-white",
    textClass: "text-slate-900",
    dotColors: ["#f8fafc", "#0284c7"]
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

interface SettingsProps {
  user: UserSession;
  resumes: ResumeData[];
  letters: CoverLetterData[];
  onUpgrade: () => void;
  onImportBackup: (data: { resumes: ResumeData[]; letters: CoverLetterData[] }) => void;
  onUpdateUser: (updatedUser: UserSession) => void;
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export default function Settings({
  user,
  resumes,
  letters,
  onUpgrade,
  onImportBackup,
  onUpdateUser,
  currentTheme,
  onThemeChange
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "language" | "notifications" | "display" | "backup">("profile");

  // Profile Edit fields
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  // Language saving
  const handleSaveLanguage = () => {
    if (user) {
      localStorage.setItem(`cvcraft_${user.uid}_lang`, lang);
      localStorage.setItem(`cvcraft_${user.uid}_region`, region);
      localStorage.setItem(`cvcraft_${user.uid}_currency`, currency);
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
            onClick={() => setActiveTab("notifications")}
            className={`w-full text-left p-3 rounded-xl font-semibold text-xs transition flex items-center gap-2.5 ${
              activeTab === "notifications" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-900/40"
            }`}
          >
            <Bell className="h-4 w-4" /> Notifications Settings
          </button>

          <button
            onClick={() => setActiveTab("display")}
            className={`w-full text-left p-3 rounded-xl font-semibold text-xs transition flex items-center gap-2.5 ${
              activeTab === "display" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-900/40"
            }`}
          >
            <Moon className="h-4 w-4" /> Display Themes (10)
          </button>

          <button
            onClick={() => setActiveTab("backup")}
            className={`w-full text-left p-3 rounded-xl font-semibold text-xs transition flex items-center gap-2.5 ${
              activeTab === "backup" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-900/40"
            }`}
          >
            <Database className="h-4 w-4" /> Data & Local Backups
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

          {/* TAB 3: Notifications */}
          {activeTab === "notifications" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-850">
                <Bell className="h-4.5 w-4.5 text-indigo-400" /> Push Notifications
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Select your preferred channels and alert frequency for candidate updates, system logs, and cover letter analysis outputs.
              </p>

              <div className="space-y-4 pt-2">
                
                {/* Switch 1: Email job matching */}
                <div className="flex items-center justify-between py-3 border-b border-slate-850">
                  <div className="max-w-[80%]">
                    <span className="text-xs font-bold text-slate-200 block">Job Matches Alert</span>
                    <span className="text-slate-500 text-[10px] mt-1 block leading-normal">
                      Receive tailored emails when new postings matching your resume summary go live on major job boards.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifsEmailAlerts}
                      onChange={(e) => setNotifsEmailAlerts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* Switch 2: ATS Scores */}
                <div className="flex items-center justify-between py-3 border-b border-slate-850">
                  <div className="max-w-[80%]">
                    <span className="text-xs font-bold text-slate-200 block">Email copy of ATS Scan metrics</span>
                    <span className="text-slate-500 text-[10px] mt-1 block leading-normal">
                      Automatically dispatch a detailed PDF/JSON copy of ATS compatibility reports to your mailbox post-audit.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifsAtsResults}
                      onChange={(e) => setNotifsAtsResults(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* Switch 3: recruiter views */}
                <div className="flex items-center justify-between py-3 border-b border-slate-850">
                  <div className="max-w-[80%]">
                    <span className="text-xs font-bold text-slate-200 block">Candidate Tracking telemetry views</span>
                    <span className="text-slate-500 text-[10px] mt-1 block leading-normal">
                      Get real-time browser alerts when a recruiter previews or opens your shared resume link.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifsViews}
                      onChange={(e) => setNotifsViews(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* Switch 4: Product newsletter */}
                <div className="flex items-center justify-between py-3">
                  <div className="max-w-[80%]">
                    <span className="text-xs font-bold text-slate-200 block">System updates and feature releases</span>
                    <span className="text-slate-500 text-[10px] mt-1 block leading-normal">
                      Stay informed about monthly premium upgrades, platform status notifications, and tips from recruiters.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifsUpdates}
                      onChange={(e) => setNotifsUpdates(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Save Alerts Layout
                </button>

                {notifSuccess && (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                    <CheckCircle className="h-3.5 w-3.5" /> Notification priorities saved!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Display & Theme */}
          {activeTab === "display" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-850">
                <Moon className="h-4.5 w-4.5 text-indigo-400" /> Global Application Display Themes (10 Choices)
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Personalize your workspace aesthetics. Select one of our 10 beautiful, responsive design systems tailored for low-eye fatigue, high accessibility, and stunning layout contrast.
              </p>

              {/* Theme Selector Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {THEMES.map((theme) => {
                  const isActive = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => onThemeChange(theme.id)}
                      className={`relative p-3.5 rounded-xl border text-left transition ${
                        isActive
                          ? "bg-slate-950 border-indigo-500 shadow-md ring-1 ring-indigo-500/20"
                          : "bg-slate-950/40 border-slate-850 hover:bg-slate-950/80 hover:border-slate-850"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span className="text-[11px] font-bold text-slate-200 block truncate">{theme.name}</span>
                        {isActive && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                      </div>

                      <div className="flex items-center gap-1.5 mt-2">
                        {/* Dot representing the main color */}
                        <div
                          className="h-3.5 w-3.5 rounded-full border border-slate-800 shrink-0"
                          style={{ backgroundColor: theme.dotColors[0] }}
                        />
                        {/* Dot representing the accent color */}
                        <div
                          className="h-3.5 w-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: theme.dotColors[1] }}
                        />
                        <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider pl-1 font-semibold">
                          {theme.isDark ? "Dark" : "Light"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-start gap-2.5">
                <SettingsIcon className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5 animate-spin-slow" />
                <span className="text-[10px] text-slate-400 leading-normal">
                  Changing the theme instantly adjusts your outer workspace wrapper, navigation headers, side elements, and background parameters.
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: Backup */}
          {activeTab === "backup" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-200 font-display flex items-center gap-2 pb-3 border-b border-slate-850">
                <Database className="h-4.5 w-4.5 text-indigo-400" /> Data Redundancy & JSON Sync
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Maintain absolute sovereign ownership of your data package. Export all currently stored resumes, cover letter templates, and scanner reports, or import an existing backup bundle seamlessly.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4 text-indigo-400" /> Export All Data (JSON)
                </button>

                <div className="flex-1 relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackupFile}
                    className="hidden"
                    id="import-backup-picker-enhanced"
                  />
                  <label
                    htmlFor="import-backup-picker-enhanced"
                    className="w-full py-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 text-emerald-400" /> Import Backup Bundle
                  </label>
                </div>
              </div>

              {importSuccess && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-800/60 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" /> {importSuccess}
                </div>
              )}
              {importError && (
                <div className="p-3 bg-rose-950/20 border border-rose-800/60 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" /> {importError}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
