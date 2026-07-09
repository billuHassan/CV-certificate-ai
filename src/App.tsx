import React, { useState, useEffect } from "react";
import {
  Sparkles, FileText, Activity, Settings as SettingsIcon, LogOut, LayoutDashboard,
  Award, RefreshCw, BarChart2, Bell, Shield, Mail, Phone, MapPin, User, ChevronRight, Menu, X
} from "lucide-react";
import { UserSession, ResumeData, CoverLetterData, ScoreReport } from "./types";
import Onboarding from "./components/Onboarding";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import ResumeBuilder from "./components/ResumeBuilder";
import CoverLetterBuilder from "./components/CoverLetterBuilder";
import ScoreAnalyzer from "./components/ScoreAnalyzer";
import Settings, { THEMES, WORLD_LANGUAGES } from "./components/Settings";
import { BannerAd, PremiumModal } from "./components/AdSystem";
import AdminPanel from "./components/AdminPanel";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, getDoc } from "firebase/firestore";

// Mock Sample Resume Data for Seeding
const SAMPLE_RESUME: ResumeData = {
  id: "sample-resume-id",
  title: "Professional Developer Resume",
  templateId: "professional",
  colorTheme: "#4f46e5",
  fontFamily: "font-sans",
  spacing: "comfortable",
  updatedAt: new Date().toISOString(),
  personalInfo: {
    fullName: "Alex Rivera",
    jobTitle: "Senior Full-Stack Engineer",
    email: "alex.rivera@techcorp.com",
    phone: "+1 (555) 0144",
    location: "Austin, TX",
    website: "https://riveratech.io",
    linkedin: "linkedin.com/in/alex-rivera-tech",
    github: "github.com/alexrivera",
    profilePhoto: "",
  },
  summary: "Results-driven senior software engineer with 6+ years of expertise designing secure, scalable full-stack web applications. Proven track record of boosting system performance by 40% and leading high-performing technical squads.",
  experience: [
    {
      id: "exp-1",
      company: "TechCorp Systems",
      position: "Lead Full-Stack Developer",
      startDate: "Jan 2021",
      endDate: "Present",
      current: true,
      location: "Austin, TX",
      description: "• Directed the migration of legacy monolith platforms to modern serverless architectures, improving request latency by 45%.\n• Spearheaded daily synchronization across 5 microservice engineering syncs, improving feature deployment cycles.\n• Integrated automated unit and integration suites, boosting test coverage to 92%."
    }
  ],
  education: [
    {
      id: "edu-1",
      school: "University of Texas",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      startDate: "Sep 2014",
      endDate: "May 2018",
      current: false,
      location: "Austin, TX",
      gpa: "3.85",
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "CVCraft AI Portal",
      role: "Architect",
      startDate: "Jun 2023",
      endDate: "Oct 2023",
      url: "https://cvcraft.ai",
      description: "Created a modern real-time PDF compiler leveraging React, Node, and Tailwind with automated micro-caching rules."
    }
  ],
  skills: ["React", "TypeScript", "Node.js", "Express", "Docker", "PostgreSQL", "AWS Suite", "System Architecture"],
  languages: [
    { id: "lang-1", name: "English", proficiency: "Native" },
    { id: "lang-2", name: "Spanish", proficiency: "Conversational" }
  ],
  certifications: [
    { id: "cert-1", name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", date: "2022" }
  ],
  references: [],
  sectionsOrder: ["summary", "experience", "education", "projects", "skills", "languages", "certifications"],
};

const SAMPLE_LETTER: CoverLetterData = {
  id: "sample-letter-id",
  title: "Google Software Engineer Application",
  recipientName: "Google Recruitment Coordinator",
  recipientCompany: "Google LLC",
  recipientAddress: "1600 Amphitheatre Pkwy, Mountain View, CA",
  jobTitle: "Senior Software Engineer",
  jobDescription: "Seeking a passionate developer with strong experience in React, TypeScript, scalable backends, and cloud infrastructures.",
  content: `Dear Hiring Committee,

I am writing to express my strong interest in the Senior Software Engineer position at Google LLC. With over six years of industry experience designing robust, scalable React and TypeScript applications, I am eager to contribute my technical competencies to Google's world-class cloud platforms.

In my previous tenure as Lead Developer at TechCorp Systems, I successfully orchestrated serverless migrations that accelerated platform performance by 45%. I align heavily with Google's core mission to deliver elegant solutions to complex real-world challenges, and believe my experience in high-throughput cloud architectures makes me an optimal candidate.

Thank you for your consideration. I look forward to discussing how my experience can empower Google's engineering deliverables.

Sincerely,
Alex Rivera`,
  date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
  senderInfo: {
    name: "Alex Rivera",
    email: "alex.rivera@techcorp.com",
    phone: "+1 (555) 0144",
    location: "Austin, TX",
  },
};

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [letters, setLetters] = useState<CoverLetterData[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [scoreReport, setScoreReport] = useState<ScoreReport | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "resume-editor" | "letter-editor" | "score" | "settings" | "admin">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>(() => localStorage.getItem("cvcraft_theme") || "obsidian");
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Load persistence states and Firebase Auth listener
  useEffect(() => {
    // Sync language selection with Google Translate cookie
    const savedLang = localStorage.getItem("cvcraft_lang");
    if (savedLang) {
      const selectedLang = WORLD_LANGUAGES.find(l => l.name === savedLang || l.name.startsWith(savedLang));
      if (selectedLang) {
        const langCode = selectedLang.code;
        const cookieValue = `/en/${langCode}`;
        
        if (!document.cookie.includes(`googtrans=${cookieValue}`)) {
          document.cookie = `googtrans=${cookieValue}; path=/;`;
          document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname};`;
          const hostParts = window.location.hostname.split('.');
          if (hostParts.length > 2) {
            const mainDomain = hostParts.slice(-2).join('.');
            document.cookie = `googtrans=${cookieValue}; path=/; domain=.${mainDomain};`;
          }
        }
      }
    }

    const savedOnboard = localStorage.getItem("cvcraft_onboarded");
    if (savedOnboard) setIsOnboarded(true);

    let unsubUserDoc: (() => void) | null = null;
    let unsubResumes: (() => void) | null = null;
    let unsubLetters: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous user doc listener if it exists
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          
          // Set up real-time listener for the user profile document itself
          unsubUserDoc = onSnapshot(userDocRef, (docSnap) => {
            let profileData = {
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              isPremium: true,
              creationsCount: 0,
              adViews: 0,
              profilePhoto: firebaseUser.photoURL || ""
            };

            if (!docSnap.exists()) {
              // Write the initial document asynchronously
              setDoc(userDocRef, profileData).catch(console.error);
            } else {
              const data = docSnap.data();
              profileData = {
                ...profileData,
                ...data
              };
            }

            setUser({
              uid: firebaseUser.uid,
              email: profileData.email,
              displayName: profileData.displayName,
              isPremium: profileData.isPremium,
              creationsCount: profileData.creationsCount,
              adViews: profileData.adViews,
              profilePhoto: profileData.profilePhoto
            });
          }, (err) => {
            console.error("User document real-time listener error:", err);
          });

          // Set up real-time listener for resumes sub-collection
          unsubResumes = onSnapshot(
            collection(db, "users", firebaseUser.uid, "resumes"),
            (snapshot) => {
              const loadedResumes: ResumeData[] = [];
              snapshot.forEach((doc) => {
                loadedResumes.push(doc.data() as ResumeData);
              });
              loadedResumes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
              
              if (loadedResumes.length === 0) {
                const seedResume = { ...SAMPLE_RESUME, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
                setDoc(doc(db, "users", firebaseUser.uid, "resumes", seedResume.id), seedResume).catch(console.error);
              } else {
                setResumes(loadedResumes);
              }
            },
            (err) => {
              handleFirestoreError(err, OperationType.LIST, `users/${firebaseUser.uid}/resumes`);
            }
          );

          // Set up real-time listener for letters sub-collection
          unsubLetters = onSnapshot(
            collection(db, "users", firebaseUser.uid, "letters"),
            (snapshot) => {
              const loadedLetters: CoverLetterData[] = [];
              snapshot.forEach((doc) => {
                loadedLetters.push(doc.data() as CoverLetterData);
              });
              loadedLetters.sort((a, b) => (b.updatedAt || b.date).localeCompare(a.updatedAt || a.date));
              
              if (loadedLetters.length === 0) {
                const seedLetter = { ...SAMPLE_LETTER, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
                setDoc(doc(db, "users", firebaseUser.uid, "letters", seedLetter.id), seedLetter).catch(console.error);
              } else {
                setLetters(loadedLetters);
              }
            },
            (err) => {
              handleFirestoreError(err, OperationType.LIST, `users/${firebaseUser.uid}/letters`);
            }
          );

        } catch (error) {
          console.error("Error setting up Firestore real-time listeners:", error);
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        if (unsubResumes) { unsubResumes(); unsubResumes = null; }
        if (unsubLetters) { unsubLetters(); unsubLetters = null; }
        setUser(null);
        setResumes([]);
        setLetters([]);
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubResumes) unsubResumes();
      if (unsubLetters) unsubLetters();
    };
  }, []);

  const handleOnboardingComplete = () => {
    setIsOnboarded(true);
    localStorage.setItem("cvcraft_onboarded", "true");
  };

  const handleAuthSuccess = (u: { email: string; displayName: string }) => {
    // Session is handled automatically by onAuthStateChanged subscription
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleUpgradeElite = () => {
    setIsPremiumModalOpen(true);
  };

  const handleUpdateUser = async (updatedUser: UserSession) => {
    if (!user || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        displayName: updatedUser.displayName,
        profilePhoto: updatedUser.profilePhoto || "",
        adViews: updatedUser.adViews || 0,
        creationsCount: updatedUser.creationsCount || 0
      });
      setUser(updatedUser);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const handleCreateResume = async (title: string, templateId: string) => {
    if (!user || !auth.currentUser) return;
    const newId = crypto.randomUUID();
    const newResume: ResumeData = {
      id: newId,
      title,
      templateId,
      colorTheme: "#4f46e5",
      fontFamily: "font-sans",
      spacing: "comfortable",
      updatedAt: new Date().toISOString(),
      personalInfo: {
        fullName: user.displayName || "",
        jobTitle: "",
        email: user.email || "",
        phone: "",
        location: "",
        website: "",
        linkedin: "",
        github: "",
        profilePhoto: user.profilePhoto || "",
      },
      summary: "",
      experience: [],
      education: [],
      projects: [],
      skills: [],
      languages: [],
      certifications: [],
      references: [],
      sectionsOrder: ["summary", "experience", "education", "projects", "skills", "languages", "certifications"],
    };
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "resumes", newId), newResume);
      const newCount = (user.creationsCount || 0) + 1;
      await updateDoc(doc(db, "users", auth.currentUser.uid), { creationsCount: newCount });
      setUser(prev => prev ? { ...prev, creationsCount: newCount } : null);
      
      setSelectedResumeId(newId);
      setCurrentView("resume-editor");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/resumes/${newId}`);
    }
  };

  const handleCreateLetter = async (title: string, company: string, role: string) => {
    if (!user || !auth.currentUser) return;
    const newId = crypto.randomUUID();
    const newLetter: CoverLetterData = {
      id: newId,
      title,
      recipientName: "Hiring Manager",
      recipientCompany: company,
      jobTitle: role,
      content: "",
      date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
      senderInfo: {
        name: user.displayName || "",
        email: user.email || "",
        phone: "",
        location: "",
      },
    };
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "letters", newId), newLetter);
      const newCount = (user.creationsCount || 0) + 1;
      await updateDoc(doc(db, "users", auth.currentUser.uid), { creationsCount: newCount });
      setUser(prev => prev ? { ...prev, creationsCount: newCount } : null);

      setSelectedLetterId(newId);
      setCurrentView("letter-editor");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/letters/${newId}`);
    }
  };

  const handleDuplicateResume = async (target: ResumeData) => {
    if (!user || !auth.currentUser) return;
    const newId = crypto.randomUUID();
    const dup: ResumeData = {
      ...target,
      id: newId,
      title: `${target.title} Copy`,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "resumes", newId), dup);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/resumes/${newId}`);
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!user || !auth.currentUser) return;
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "resumes", id));
      if (selectedResumeId === id) setSelectedResumeId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/resumes/${id}`);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    if (!user || !auth.currentUser) return;
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "letters", id));
      if (selectedLetterId === id) setSelectedLetterId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/letters/${id}`);
    }
  };

  const handleSaveActiveResume = async (updated: ResumeData) => {
    if (!user || !auth.currentUser) return;
    const updatedWithTime = { ...updated, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "resumes", updated.id), updatedWithTime);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/resumes/${updated.id}`);
    }
  };

  const handleSaveActiveLetter = async (updated: CoverLetterData) => {
    if (!user || !auth.currentUser) return;
    const updatedWithTime = { ...updated, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "letters", updated.id), updatedWithTime);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/letters/${updated.id}`);
    }
  };

  const handleRunATSAnalysis = async () => {
    const activeResume = resumes.find((r) => r.id === selectedResumeId) || resumes[0];
    if (!activeResume) return;

    try {
      const response = await fetch("/api/ai/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: activeResume }),
      });
      const data = await response.json();
      if (data.report) {
        setScoreReport(data.report);
      } else if (data.overallScore !== undefined) {
        setScoreReport(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportBackup = async (backupData: { resumes: ResumeData[]; letters: CoverLetterData[] }) => {
    if (!user || !auth.currentUser) return;
    try {
      for (const res of backupData.resumes) {
        await setDoc(doc(db, "users", auth.currentUser.uid, "resumes", res.id), res);
      }
      for (const letData of backupData.letters) {
        await setDoc(doc(db, "users", auth.currentUser.uid, "letters", letData.id), letData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Firebase auth initialization screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <Sparkles className="h-6 w-6 text-indigo-400 absolute animate-pulse" />
          </div>
          <span className="text-slate-400 font-mono text-xs tracking-widest uppercase animate-pulse">Initializing Secure Session...</span>
        </div>
      </div>
    );
  }

  // Auth wall
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Pre-onboarding screen (shown after login if not completed)
  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const activeResume = resumes.find((r) => r.id === selectedResumeId) || resumes[0];
  const activeLetter = letters.find((l) => l.id === selectedLetterId) || letters[0];

  const activeThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <div className={`min-h-screen ${activeThemeObj.bgClass} flex flex-col md:flex-row font-sans transition-colors duration-300`}>
      
      {/* Sidebar Navigation */}
      <aside className={`w-full md:w-64 ${activeThemeObj.sidebarClass} border-b md:border-b-0 md:border-r p-5 flex flex-col justify-between shrink-0 no-print transition-colors duration-300`}>
        
        {/* Top brand */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-400" />
              <span className="font-extrabold tracking-tight text-white font-display text-lg">CVCraft AI</span>
            </div>
            {/* Mobile burger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-400 hover:text-white transition"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className={`space-y-1.5 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
            <button
              onClick={() => {
                setCurrentView("dashboard");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                currentView === "dashboard" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" /> Dashboard
            </button>

            <button
              onClick={() => {
                const firstRes = resumes[0];
                if (firstRes) {
                  setSelectedResumeId(firstRes.id);
                  setCurrentView("resume-editor");
                } else {
                  alert("Please create a resume first from the dashboard!");
                }
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                currentView === "resume-editor" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <FileText className="h-4.5 w-4.5" /> Resume Builder
            </button>

            <button
              onClick={() => {
                const firstLet = letters[0];
                if (firstLet) {
                  setSelectedLetterId(firstLet.id);
                  setCurrentView("letter-editor");
                } else {
                  alert("Please create a cover letter first from the dashboard!");
                }
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                currentView === "letter-editor" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Sparkles className="h-4.5 w-4.5" /> Cover Letters
            </button>

            <button
              onClick={() => {
                if (resumes.length > 0) {
                  setSelectedResumeId(resumes[0].id);
                  setCurrentView("score");
                } else {
                  alert("Create a resume first to scan its ATS compatibility.");
                }
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                currentView === "score" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <BarChart2 className="h-4.5 w-4.5" /> ATS Score Audit
            </button>

            <button
              onClick={() => {
                setCurrentView("settings");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                currentView === "settings" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <SettingsIcon className="h-4.5 w-4.5" /> Settings
            </button>

            {user.email === "bilalhassanmussa@gmail.com" && (
              <button
                onClick={() => {
                  setCurrentView("admin");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide border border-dashed transition ${
                  currentView === "admin" 
                    ? "bg-rose-950 text-rose-200 border-rose-500/40 shadow-lg" 
                    : "text-rose-400 hover:text-rose-350 hover:bg-rose-950/20 border-rose-900/30"
                }`}
              >
                <Shield className="h-4.5 w-4.5 text-rose-500 animate-pulse" /> Admin Panel
              </button>
            )}
          </nav>
        </div>

        {/* Bottom User status details */}
        <div className={`mt-6 pt-6 border-t border-slate-800 space-y-4 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
          <div className="flex items-center gap-3">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-slate-700 shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20 text-xs shrink-0">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="truncate flex-1">
              <span className="text-xs font-bold text-slate-200 block truncate">{user.displayName}</span>
              <span className="text-[10px] text-slate-500 block truncate">{user.email}</span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-2 bg-slate-950 hover:bg-slate-900 rounded-xl text-xs font-semibold text-rose-400 border border-slate-850 transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto">
        {currentView === "dashboard" && (
          <Dashboard
            user={user}
            resumes={resumes}
            letters={letters}
            onSelectResume={(id) => {
              setSelectedResumeId(id);
              setCurrentView("resume-editor");
            }}
            onSelectLetter={(id) => {
              setSelectedLetterId(id);
              setCurrentView("letter-editor");
            }}
            onCreateResume={handleCreateResume}
            onCreateLetter={handleCreateLetter}
            onDuplicateResume={handleDuplicateResume}
            onDeleteResume={handleDeleteResume}
            onDeleteLetter={handleDeleteLetter}
            onSelectView={setCurrentView}
            onUpgrade={handleUpgradeElite}
          />
        )}

        {currentView === "resume-editor" && activeResume && (
          <ResumeBuilder
            initialResume={activeResume}
            onSave={handleSaveActiveResume}
            onBackToDashboard={() => setCurrentView("dashboard")}
            isPremium={user.isPremium}
            onUpgrade={handleUpgradeElite}
          />
        )}

        {currentView === "letter-editor" && activeLetter && (
          <CoverLetterBuilder
            initialLetter={activeLetter}
            resumes={resumes}
            onSave={handleSaveActiveLetter}
            onBackToDashboard={() => setCurrentView("dashboard")}
            isPremium={user.isPremium}
            onUpgrade={handleUpgradeElite}
          />
        )}

        {currentView === "score" && (
          <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white font-display">Resume ATS Compatibility</h2>
            
            {resumes.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <label className="text-xs text-slate-400 font-semibold shrink-0">Audit Target Resume:</label>
                <select
                  value={selectedResumeId || resumes[0].id}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.title || "Untitled Resume"}</option>
                  ))}
                </select>
              </div>
            )}

            <ScoreAnalyzer
              resume={activeResume}
              scoreReport={scoreReport}
              onRunAnalysis={handleRunATSAnalysis}
              isPremium={user.isPremium}
              onUpgrade={handleUpgradeElite}
              onUpdateResume={handleSaveActiveResume}
            />
          </div>
        )}

        {currentView === "settings" && (
          <Settings
            user={user}
            resumes={resumes}
            letters={letters}
            onUpgrade={handleUpgradeElite}
            onImportBackup={handleImportBackup}
            onUpdateUser={handleUpdateUser}
            currentTheme={currentTheme}
            onThemeChange={(themeId) => {
              setCurrentTheme(themeId);
              localStorage.setItem("cvcraft_theme", themeId);
            }}
          />
        )}

        {currentView === "admin" && (
          <AdminPanel
            user={user}
            onClose={() => setCurrentView("dashboard")}
          />
        )}
      </main>

      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onSuccess={() => {
          if (user) {
            const updated = { ...user, isPremium: true };
            setUser(updated);
            localStorage.setItem("cvcraft_user", JSON.stringify(updated));
            alert("Congratulations! You have successfully upgraded to CVCraft AI Elite Premium! Enjoy unlimited features.");
          }
        }}
      />
    </div>
  );
}
