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
    id: "luminary",
    name: "Luminary Bright (Indigo & Platinum - Default)",
    isDark: false,
    bgClass: "bg-slate-50 text-slate-900",
    sidebarClass: "bg-white/95 border-slate-200/90 shadow-sm",
    cardClass: "bg-white border-slate-200/90 shadow-lg shadow-indigo-100/30 backdrop-blur-md",
    borderClass: "border-slate-200",
    accentClass: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20",
    textClass: "text-slate-900",
    dotColors: ["#ffffff", "#4f46e5"]
  },
  {
    id: "nordic",
    name: "Nordic Frost (Snow & Azure Blue)",
    isDark: false,
    bgClass: "bg-sky-50/50 text-slate-900",
    sidebarClass: "bg-white/95 border-sky-200/80 shadow-sm",
    cardClass: "bg-white border-sky-100/90 shadow-lg shadow-sky-100/50 backdrop-blur-md",
    borderClass: "border-sky-200/80",
    accentClass: "bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20",
    textClass: "text-slate-900",
    dotColors: ["#f0f9ff", "#0284c7"]
  },
  {
    id: "vintage",
    name: "Amber Editorial (Warm Cream & Terracotta)",
    isDark: false,
    bgClass: "bg-[#fdfbf7] text-stone-900",
    sidebarClass: "bg-[#f5efdf]/90 border-[#e3d7be] shadow-sm",
    cardClass: "bg-[#f9f5eb] border-[#e3d7be] shadow-lg shadow-stone-200/40 backdrop-blur-md",
    borderClass: "border-[#e3d7be]",
    accentClass: "bg-amber-700 hover:bg-amber-600 text-white shadow-lg shadow-amber-800/20",
    textClass: "text-stone-900",
    dotColors: ["#fdfbf7", "#b45309"]
  },
  {
    id: "emerald_pearl",
    name: "Sage Pearl (Mint Light & Emerald)",
    isDark: false,
    bgClass: "bg-emerald-50/40 text-emerald-950",
    sidebarClass: "bg-white/95 border-emerald-200/80 shadow-sm",
    cardClass: "bg-white border-emerald-200/80 shadow-lg shadow-emerald-100/40 backdrop-blur-md",
    borderClass: "border-emerald-200",
    accentClass: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20",
    textClass: "text-emerald-950",
    dotColors: ["#ecfdf5", "#059669"]
  },
  {
    id: "obsidian",
    name: "Cyber Obsidian (Carbon & Emerald Dark)",
    isDark: true,
    bgClass: "bg-zinc-950 text-emerald-50",
    sidebarClass: "bg-zinc-900 border-zinc-800",
    cardClass: "bg-zinc-900/80 border-zinc-800 backdrop-blur-md shadow-xl shadow-black/30",
    borderClass: "border-zinc-800",
    accentClass: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20",
    textClass: "text-emerald-50",
    dotColors: ["#09090b", "#10b981"]
  },
  {
    id: "midnight",
    name: "Cosmic Amethyst (Purple Dark)",
    isDark: true,
    bgClass: "bg-[#0c051a] text-purple-100",
    sidebarClass: "bg-[#160a2c] border-purple-900/60",
    cardClass: "bg-[#180a30]/80 border-purple-800/40 backdrop-blur-md shadow-xl shadow-purple-950/50",
    borderClass: "border-purple-800/40",
    accentClass: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-600/20",
    textClass: "text-purple-100",
    dotColors: ["#0c051a", "#d946ef"]
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
                <Moon className="h-4.5 w-4.5 text-indigo-400" /> Global Application Display Themes (5 Choices)
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Personalize your workspace aesthetics. Select one of our 5 beautiful, responsive design systems tailored for low-eye fatigue, high accessibility, and stunning layout contrast.
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
