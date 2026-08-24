import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, FileText, Activity, Settings as SettingsIcon, LogOut, LayoutDashboard,
  Award, RefreshCw, BarChart2, Bell, Shield, Mail, Phone, MapPin, User, ChevronRight, Menu, X, Compass, MessageSquare,
  Brain, FileSearch, Building2, Users, HelpCircle
} from "lucide-react";
import { UserSession, ResumeData, CoverLetterData, ScoreReport } from "./types";
import Onboarding from "./components/Onboarding";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import ResumeBuilder from "./components/ResumeBuilder";
import CoverLetterBuilder from "./components/CoverLetterBuilder";
import ScoreAnalyzer from "./components/ScoreAnalyzer";
import CareerRecommender from "./components/CareerRecommender";
import ResumeCoach from "./components/ResumeCoach";
import JobIntelligence from "./components/JobIntelligence";
import InterviewIntelligence from "./components/InterviewIntelligence";
import ResumeAnalytics from "./components/ResumeAnalytics";
import Settings, { THEMES, WORLD_LANGUAGES } from "./components/Settings";
import { setLanguageCookie, clearLanguageCookie } from "./lib/languageUtils";
import { BannerAd, PremiumModal } from "./components/AdSystem";
import AdminPanel from "./components/AdminPanel";
import SupportFeedback from "./components/SupportFeedback";
import DirectMessages from "./components/DirectMessages";
import AIChat from "./components/AIChat";
import SkillArena from "./components/SkillArena";
import UploadResumeModal from "./components/UploadResumeModal";
import RahmoraLogo from "./components/RahmoraLogo";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, getRedirectResult } from "firebase/auth";
import { doc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, getDoc, query, where } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

// Mock Sample Resume Data for Seeding
const SAMPLE_RESUME: ResumeData = {
  id: "sample-resume-id",
  title: "Professional Developer Resume",
  templateId: "minimal",
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
  sectionsOrder: ["summary", "experience", "education", "projects", "skills", "languages", "certifications", "references"],
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
  const [currentView, setCurrentView] = useState<"dashboard" | "resume-editor" | "letter-editor" | "score" | "settings" | "admin" | "career" | "support" | "ai-chat" | "resume-coach" | "job-intelligence" | "interview-intelligence" | "resume-analytics" | "skill-arena" | "direct-messages">("dashboard");
  const [userUnreadCount, setUserUnreadCount] = useState<number>(0);
  const [directUnreadCount, setDirectUnreadCount] = useState<number>(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState<number>(0);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; body: string; view: "support" | "admin" | "direct-messages" } | null>(null);

  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem("cvcraft_offline_mode") === "true";
  });

  const seenMessagesRef = useRef<Set<string>>(new Set());
  const isUserChatsFirstLoad = useRef(true);
  const isDirectMsgFirstLoad = useRef(true);
  const isAdminChatsFirstLoad = useRef(true);

  // Auto-hide toast after 4.5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Keep view states synced to sessionStorage so they survive page reloads (like language change save)
  useEffect(() => {
    if (user) {
      if (selectedResumeId) {
        sessionStorage.setItem(`cvcraft_${user.uid}_selectedResumeId`, selectedResumeId);
      } else {
        sessionStorage.removeItem(`cvcraft_${user.uid}_selectedResumeId`);
      }
    }
  }, [selectedResumeId, user]);

  useEffect(() => {
    if (user) {
      if (selectedLetterId) {
        sessionStorage.setItem(`cvcraft_${user.uid}_selectedLetterId`, selectedLetterId);
      } else {
        sessionStorage.removeItem(`cvcraft_${user.uid}_selectedLetterId`);
      }
    }
  }, [selectedLetterId, user]);

  useEffect(() => {
    if (user) {
      if (scoreReport) {
        sessionStorage.setItem(`cvcraft_${user.uid}_scoreReport`, JSON.stringify(scoreReport));
      } else {
        sessionStorage.removeItem(`cvcraft_${user.uid}_scoreReport`);
      }
    }
  }, [scoreReport, user]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(`cvcraft_${user.uid}_currentView`, currentView);
    }
  }, [currentView, user]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    const saved = localStorage.getItem("cvcraft_theme");
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
    return "fire";
  });
  const [appFont, setAppFont] = useState<string>(() => {
    return localStorage.getItem("rahmora_app_font") || "jakarta";
  });

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    if (user?.uid) {
      localStorage.setItem(`cvcraft_${user.uid}_theme`, themeId);
      if (!isOfflineMode && auth.currentUser) {
        updateDoc(doc(db, "users", user.uid), { "settings.theme": themeId }).catch(console.warn);
      }
    } else {
      localStorage.setItem("cvcraft_theme", themeId);
    }
  };

  const handleFontChange = (fontId: string) => {
    setAppFont(fontId);
    if (user?.uid) {
      localStorage.setItem(`cvcraft_${user.uid}_font`, fontId);
      if (!isOfflineMode && auth.currentUser) {
        updateDoc(doc(db, "users", user.uid), { "settings.font": fontId }).catch(console.warn);
      }
    } else {
      localStorage.setItem("rahmora_app_font", fontId);
    }
  };
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
          setLanguageCookie(langCode);
        }
      }
    }

    const savedOnboard = localStorage.getItem("cvcraft_onboarded");
    if (savedOnboard) setIsOnboarded(true);

    if (isOfflineMode) {
      const savedUser = localStorage.getItem("cvcraft_local_user");
      let localUser: UserSession | null = null;
      if (savedUser) {
        try {
          localUser = JSON.parse(savedUser);
        } catch {
          // ignore
        }
      }
      if (!localUser) {
        localUser = {
          uid: "local-user-session",
          email: "demo@cvcraft.ai",
          displayName: "Guest User",
          isPremium: true,
          creationsCount: 0,
          adViews: 0,
          profilePhoto: ""
        };
      }
      setUser(localUser);
      setIsAuthLoading(false);
      
      // Load local resumes
      const localResumes = localStorage.getItem(`cvcraft_local_resumes_${localUser.email}`);
      if (localResumes) {
        try {
          setResumes(JSON.parse(localResumes));
        } catch {
          setResumes([]);
        }
      } else {
        setResumes([]);
      }
      
      // Load local letters
      const localLetters = localStorage.getItem(`cvcraft_local_letters_${localUser.email}`);
      if (localLetters) {
        try {
          setLetters(JSON.parse(localLetters));
        } catch {
          setLetters([]);
        }
      } else {
        setLetters([]);
      }
      return;
    }

    let unsubUserDoc: (() => void) | null = null;
    let unsubResumes: (() => void) | null = null;
    let unsubLetters: (() => void) | null = null;

    // Check for redirect result from Google OAuth if page was redirected
    getRedirectResult(auth)
      .then((redirectResult) => {
        if (redirectResult?.user) {
          const rUser = redirectResult.user;
          const userSession = {
            uid: rUser.uid,
            email: (rUser.email || "").toLowerCase(),
            displayName: rUser.displayName || rUser.email?.split("@")[0] || "Google User",
            isPremium: true,
            creationsCount: 0,
            adViews: 0,
            profilePhoto: rUser.photoURL || ""
          };
          localStorage.setItem("cvcraft_local_user", JSON.stringify(userSession));
        }
      })
      .catch((err) => {
        console.warn("OAuth redirect validation status:", err?.message || err);
      });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous user doc listener if it exists
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (firebaseUser) {
        // Ensure online mode and clear any legacy offline overrides on active login
        setIsOfflineMode(false);
        localStorage.removeItem("cvcraft_offline_mode");

        // Guarantee that authenticated users ALWAYS start at the Home / Dashboard page
        setSelectedResumeId(null);
        setSelectedLetterId(null);
        setScoreReport(null);
        setCurrentView("dashboard");

        // Sync user-specific language choice instantly on login
        const savedUserLang = localStorage.getItem(`cvcraft_${firebaseUser.uid}_lang`);
        if (savedUserLang) {
          const selectedLang = WORLD_LANGUAGES.find(l => l.name === savedUserLang || l.name.startsWith(savedUserLang));
          if (selectedLang) {
            setLanguageCookie(selectedLang.code);
          }
        }

        // Recover cached email/name if Firebase Auth provider (e.g. anonymous fallback) returned blank email
        let cachedEmail = "";
        let cachedDisplayName = "";
        try {
          const savedUserStr = localStorage.getItem("cvcraft_local_user");
          if (savedUserStr) {
            const parsed = JSON.parse(savedUserStr);
            cachedEmail = parsed.email || "";
            cachedDisplayName = parsed.displayName || "";
          }
        } catch {}

        const resolvedEmail = firebaseUser.email || cachedEmail || "";
        const resolvedDisplayName = firebaseUser.displayName || cachedDisplayName || (resolvedEmail ? resolvedEmail.split("@")[0] : "User");

        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          
          // Set up real-time listener for the user profile document itself
          unsubUserDoc = onSnapshot(userDocRef, (docSnap) => {
            let profileData: any = {
              email: resolvedEmail,
              displayName: resolvedDisplayName,
              isPremium: true,
              creationsCount: 0,
              adViews: 0,
              profilePhoto: firebaseUser.photoURL || "",
              settings: {}
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

              // Ensure email and display name are never wiped by legacy empty documents
              if (!profileData.email && resolvedEmail) {
                profileData.email = resolvedEmail;
              }
              if ((!profileData.displayName || profileData.displayName === "User") && resolvedDisplayName) {
                profileData.displayName = resolvedDisplayName;
              }

              // Restore per-user theme and typography settings strictly for this user
              if (data?.settings?.theme && THEMES.some(t => t.id === data.settings.theme)) {
                setCurrentTheme(data.settings.theme);
                localStorage.setItem(`cvcraft_${firebaseUser.uid}_theme`, data.settings.theme);
              } else {
                const localUserTheme = localStorage.getItem(`cvcraft_${firebaseUser.uid}_theme`);
                if (localUserTheme && THEMES.some(t => t.id === localUserTheme)) {
                  setCurrentTheme(localUserTheme);
                }
              }

              if (data?.settings?.font) {
                setAppFont(data.settings.font);
                localStorage.setItem(`cvcraft_${firebaseUser.uid}_font`, data.settings.font);
              } else {
                const localUserFont = localStorage.getItem(`cvcraft_${firebaseUser.uid}_font`);
                if (localUserFont) {
                  setAppFont(localUserFont);
                }
              }
            }

            setUser({
              uid: firebaseUser.uid,
              email: profileData.email,
              displayName: profileData.displayName,
              isPremium: true,
              creationsCount: profileData.creationsCount,
              adViews: profileData.adViews,
              profilePhoto: profileData.profilePhoto,
              settings: profileData.settings
            });
          }, (err) => {
            console.warn("User document real-time listener info:", err);
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
                setResumes([]);
              } else {
                setResumes(loadedResumes);
              }
            },
            (err) => {
              console.warn("Firestore resumes listener info:", err);
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
                setLetters([]);
              } else {
                setLetters(loadedLetters);
              }
            },
            (err) => {
              console.warn("Firestore letters listener info:", err);
            }
          );

        } catch (error) {
          console.warn("Error setting up Firestore real-time listeners:", error);
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        if (unsubResumes) { unsubResumes(); unsubResumes = null; }
        if (unsubLetters) { unsubLetters(); unsubLetters = null; }
        setUser(null);
        setResumes([]);
        setLetters([]);
        setSelectedResumeId(null);
        setSelectedLetterId(null);
        setScoreReport(null);
        setCurrentView("dashboard");
        
        // Reset translation cookies back to English on signout so next login starts fresh
        clearLanguageCookie();
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubResumes) unsubResumes();
      if (unsubLetters) unsubLetters();
    };
  }, [isOfflineMode]);

  const handleOnboardingComplete = () => {
    setIsOnboarded(true);
    localStorage.setItem("cvcraft_onboarded", "true");
  };

  // Listen to unread messages for normal users and admin
  useEffect(() => {
    if (!user || isOfflineMode) {
      setUserUnreadCount(0);
      setDirectUnreadCount(0);
      return;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    // 1. Listen to user-specific Admin chat messages in real time to count unread admin replies
    const q1 = query(collection(db, "admin_chats"), where("userId", "==", firebaseUser.uid));
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as any);
      const adminUnread = docs.filter(m => m.senderId !== firebaseUser.uid && !m.read).length;
      
      if (!isUserChatsFirstLoad.current) {
        docs.forEach(m => {
          if (m.senderId !== firebaseUser.uid && !m.read && !seenMessagesRef.current.has(m.id)) {
            setActiveToast({
              id: m.id,
              title: `Support Reply from ${m.senderName || "Admin"}`,
              body: m.message || "Sent an attachment",
              view: "support"
            });
          }
        });
      }
      
      docs.forEach(m => seenMessagesRef.current.add(m.id));
      isUserChatsFirstLoad.current = false;
      setUserUnreadCount(adminUnread);
    }, (err) => console.error("Error user admin_chats listener:", err));

    // 2. Listen to direct_messages sent to this user
    const q2 = query(collection(db, "direct_messages"), where("recipientId", "==", firebaseUser.uid));
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as any);
      const directUnread = docs.filter(m => !m.read).length;
      
      if (!isDirectMsgFirstLoad.current) {
        docs.forEach(m => {
          if (!m.read && !seenMessagesRef.current.has(m.id)) {
            setActiveToast({
              id: m.id,
              title: `Direct Message from ${m.senderName || "Member"}`,
              body: m.message || "Sent an attachment",
              view: "direct-messages"
            });
          }
        });
      }
      
      docs.forEach(m => seenMessagesRef.current.add(m.id));
      isDirectMsgFirstLoad.current = false;
      setDirectUnreadCount(directUnread);
    }, (err) => console.error("Error user direct_messages listener:", err));

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user]);

  useEffect(() => {
    if (!user || isOfflineMode || user.email !== "bilalhassanmussa@gmail.com") {
      setAdminUnreadCount(0);
      return;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    // Listen to all admin_chats to count unread user messages for the admin
    const q = collection(db, "admin_chats");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as any);
      const unreadCount = docs.filter(m => m.senderId !== firebaseUser.uid && !m.read).length;
      
      if (!isAdminChatsFirstLoad.current) {
        docs.forEach(m => {
          if (m.senderId !== firebaseUser.uid && !m.read && !seenMessagesRef.current.has(m.id)) {
            setActiveToast({
              id: m.id,
              title: `Support Request from ${m.senderName || "User"}`,
              body: m.message || "Sent an attachment",
              view: "admin"
            });
          }
        });
      }
      
      docs.forEach(m => seenMessagesRef.current.add(m.id));
      isAdminChatsFirstLoad.current = false;
      setAdminUnreadCount(unreadCount);
    }, (err) => console.error("Error admin admin_chats listener:", err));

    return () => {
      unsubscribe();
    };
  }, [user]);

  const activeThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  useEffect(() => {
    if (activeThemeObj.isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [activeThemeObj.isDark]);

  const handleAuthSuccess = (u: { email: string; displayName: string }) => {
    // Session is handled automatically by onAuthStateChanged subscription for real Firebase users.
    // If Firebase Auth is not signed in but we succeeded via fallback, let's configure local session.
    if (!auth.currentUser) {
      setIsOfflineMode(true);
      localStorage.setItem("cvcraft_offline_mode", "true");
      
      const localUser: UserSession = {
        uid: "local-user-session",
        email: u.email,
        displayName: u.displayName,
        isPremium: true,
        creationsCount: 0,
        adViews: 0,
        profilePhoto: ""
      };
      setUser(localUser);
      localStorage.setItem("cvcraft_local_user", JSON.stringify(localUser));
    }
  };

  const handleSignOut = async () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem("cvcraft_offline_mode");
      localStorage.removeItem("cvcraft_local_user");
      localStorage.removeItem("cvcraft_remember_me");
      setIsOfflineMode(false);
      setSelectedResumeId(null);
      setSelectedLetterId(null);
      setScoreReport(null);
      setCurrentView("dashboard");
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        // Ignore errors if already signed out
      }
      setUser(null);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleUpgradeElite = () => {
    setIsPremiumModalOpen(true);
  };

  const handleUpdateUser = async (updatedUser: UserSession) => {
    if (!user) return;
    if (isOfflineMode) {
      setUser(updatedUser);
      localStorage.setItem("cvcraft_local_user", JSON.stringify(updatedUser));
      return;
    }
    if (!auth.currentUser) return;
    try {
      const updateData: Record<string, any> = {
        displayName: updatedUser.displayName,
        profilePhoto: updatedUser.profilePhoto || "",
        adViews: updatedUser.adViews || 0,
        creationsCount: updatedUser.creationsCount || 0
      };
      if (updatedUser.settings) {
        updateData.settings = updatedUser.settings;
      }
      await updateDoc(doc(db, "users", auth.currentUser.uid), updateData);
      setUser(updatedUser);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const handleCreateResume = async (title: string, templateId: string) => {
    if (!user) return;
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
      sectionsOrder: ["summary", "experience", "education", "projects", "skills", "languages", "certifications", "references"],
    };

    if (isOfflineMode) {
      const updatedResumes = [newResume, ...resumes];
      setResumes(updatedResumes);
      localStorage.setItem(`cvcraft_local_resumes_${user.email}`, JSON.stringify(updatedResumes));
      
      const newCount = (user.creationsCount || 0) + 1;
      const updatedUser = { ...user, creationsCount: newCount };
      setUser(updatedUser);
      localStorage.setItem("cvcraft_local_user", JSON.stringify(updatedUser));
      
      setSelectedResumeId(newId);
      setCurrentView("resume-editor");
      return;
    }

    if (!auth.currentUser) return;
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
    if (!user) return;
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

    if (isOfflineMode) {
      const updatedLetters = [newLetter, ...letters];
      setLetters(updatedLetters);
      localStorage.setItem(`cvcraft_local_letters_${user.email}`, JSON.stringify(updatedLetters));

      const newCount = (user.creationsCount || 0) + 1;
      const updatedUser = { ...user, creationsCount: newCount };
      setUser(updatedUser);
      localStorage.setItem("cvcraft_local_user", JSON.stringify(updatedUser));

      setSelectedLetterId(newId);
      setCurrentView("letter-editor");
      return;
    }

    if (!auth.currentUser) return;
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
    if (!user) return;
    const newId = crypto.randomUUID();
    const dup: ResumeData = {
      ...target,
      id: newId,
      title: `${target.title} Copy`,
      updatedAt: new Date().toISOString(),
    };

    if (isOfflineMode) {
      const updatedResumes = [dup, ...resumes];
      setResumes(updatedResumes);
      localStorage.setItem(`cvcraft_local_resumes_${user.email}`, JSON.stringify(updatedResumes));
      return;
    }

    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "resumes", newId), dup);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/resumes/${newId}`);
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!user) return;
    setResumes(prev => {
      const updated = prev.filter(r => r.id !== id);
      if (isOfflineMode) {
        localStorage.setItem(`cvcraft_local_resumes_${user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
    if (selectedResumeId === id) setSelectedResumeId(null);

    if (!isOfflineMode && auth.currentUser) {
      try {
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "resumes", id));
      } catch (err) {
        console.error("Delete resume error:", err);
      }
    }
  };

  const handleDeleteLetter = async (id: string) => {
    if (!user) return;
    setLetters(prev => {
      const updated = prev.filter(l => l.id !== id);
      if (isOfflineMode) {
        localStorage.setItem(`cvcraft_local_letters_${user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
    if (selectedLetterId === id) setSelectedLetterId(null);

    if (!isOfflineMode && auth.currentUser) {
      try {
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "letters", id));
      } catch (err) {
        console.error("Delete letter error:", err);
      }
    }
  };

  const handleImportScannedResume = async (scannedResume: ResumeData) => {
    if (!user) return;
    if (isOfflineMode) {
      const updated = [scannedResume, ...resumes];
      setResumes(updated);
      localStorage.setItem(`cvcraft_local_resumes_${user.email}`, JSON.stringify(updated));
    } else if (auth.currentUser) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid, "resumes", scannedResume.id), scannedResume);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/resumes/${scannedResume.id}`);
      }
    }
    setSelectedResumeId(scannedResume.id);
    setCurrentView("resume-editor");
  };

  const handleSaveActiveResume = async (updated: ResumeData) => {
    if (!user) return;
    const updatedWithTime = { ...updated, updatedAt: new Date().toISOString() };

    if (isOfflineMode) {
      const updatedResumes = resumes.map(r => r.id === updated.id ? updatedWithTime : r);
      setResumes(updatedResumes);
      localStorage.setItem(`cvcraft_local_resumes_${user.email}`, JSON.stringify(updatedResumes));
      return;
    }

    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "resumes", updated.id), updatedWithTime);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/resumes/${updated.id}`);
    }
  };

  const handleSaveActiveLetter = async (updated: CoverLetterData) => {
    if (!user) return;
    const updatedWithTime = { ...updated, updatedAt: new Date().toISOString() };

    if (isOfflineMode) {
      const updatedLetters = letters.map(l => l.id === updated.id ? updatedWithTime : l);
      setLetters(updatedLetters);
      localStorage.setItem(`cvcraft_local_letters_${user.email}`, JSON.stringify(updatedLetters));
      return;
    }

    if (!auth.currentUser) return;
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
    if (!user) return;
    if (isOfflineMode) {
      const mergedResumes = [...backupData.resumes, ...resumes.filter(r => !backupData.resumes.some(br => br.id === r.id))];
      const mergedLetters = [...backupData.letters, ...letters.filter(l => !backupData.letters.some(bl => bl.id === l.id))];
      setResumes(mergedResumes);
      setLetters(mergedLetters);
      localStorage.setItem(`cvcraft_local_resumes_${user.email}`, JSON.stringify(mergedResumes));
      localStorage.setItem(`cvcraft_local_letters_${user.email}`, JSON.stringify(mergedLetters));
      return;
    }
    if (!auth.currentUser) return;
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
            <div className="h-12 w-12 rounded-full border-2 border-slate-800 border-t-indigo-500 animate-spin" />
          </div>
          <span className="text-slate-400 text-xs tracking-wide">Loading your workspace...</span>
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
    const fallbackLetter: CoverLetterData = {
      id: crypto.randomUUID(),
      title: activeResume ? `Cover Letter - ${activeResume.title}` : "Cover Letter - Draft",
      recipientName: "Hiring Manager",
      recipientCompany: "Target Employer",
      jobTitle: activeResume?.personalInfo?.jobTitle || "Target Role",
      content: "",
      date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
      senderInfo: {
        name: user?.displayName || activeResume?.personalInfo?.fullName || "Applicant",
        email: user?.email || activeResume?.personalInfo?.email || "",
        phone: activeResume?.personalInfo?.phone || "",
        location: activeResume?.personalInfo?.location || "",
      },
    };
    const effectiveLetter = activeLetter || fallbackLetter;

  const gridClass = activeThemeObj.isDark ? "subtle-grid" : "subtle-grid-light";
  const glowClass = activeThemeObj.glowClass || (activeThemeObj.isDark ? "ambient-glow" : "ambient-glow-light");

  return (
    <div data-theme={activeThemeObj.id} className={`min-h-screen ${activeThemeObj.bgClass} flex flex-col md:flex-row font-theme-${appFont} transition-colors duration-300 relative overflow-x-hidden ${activeThemeObj.textClass}`}>
      {/* Decorative Grid and Glow Backdrops */}
      <div className={`absolute inset-0 ${gridClass} pointer-events-none opacity-80 z-0`} />
      <div className={`absolute inset-0 ${glowClass} pointer-events-none z-0`} />
      
      {/* Mobile Top Header Bar (< md) */}
      <header className={`md:hidden sticky top-0 z-30 w-full ${activeThemeObj.sidebarClass} border-b ${activeThemeObj.borderClass} px-4 py-3 flex items-center justify-between no-print backdrop-blur-md`}>
        <div className="flex items-center gap-2">
          <RahmoraLogo size="sm" lightTheme={!activeThemeObj.isDark} />
          {isOfflineMode && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[8px] font-bold">
              Offline
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick theme cycle */}
          <button
            type="button"
            onClick={() => {
              const currentIndex = THEMES.findIndex((t) => t.id === currentTheme);
              const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
              setCurrentTheme(nextTheme.id);
              localStorage.setItem("cvcraft_theme", nextTheme.id);
            }}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
              activeThemeObj.isDark
                ? "bg-slate-900/90 border border-slate-700/60 text-slate-200"
                : "bg-slate-100 border border-slate-300 text-slate-800"
            }`}
            title="Switch theme color"
          >
            <span>{activeThemeObj.icon}</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-200 transition relative"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            {(userUnreadCount > 0 || adminUnreadCount > 0) && !mobileMenuOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer Backdrop & Sheet (< md) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          />

          {/* Slide-over Drawer Panel */}
          <aside
            className={`relative z-50 w-4/5 max-w-xs h-full ${activeThemeObj.sidebarClass} border-r ${activeThemeObj.borderClass} p-5 flex flex-col justify-between overflow-y-auto ${activeThemeObj.textClass} shadow-2xl animate-in slide-in-from-left duration-200`}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-750">
                <RahmoraLogo size="sm" lightTheme={!activeThemeObj.isDark} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Theme Mode & Font Mode Quick Switcher Widget */}
              <div className={`p-3 rounded-2xl ${activeThemeObj.cardClass} border ${activeThemeObj.borderClass} space-y-2.5 shadow-lg`}>
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase opacity-80">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Theme & Font Mode
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 font-mono font-semibold">
                    {activeThemeObj.icon} {activeThemeObj.elementName.split(" ")[0]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = THEMES.findIndex((t) => t.id === currentTheme);
                      const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
                      setCurrentTheme(nextTheme.id);
                      localStorage.setItem("cvcraft_theme", nextTheme.id);
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      activeThemeObj.isDark
                        ? "bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-200"
                        : "bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span className="text-sm">{activeThemeObj.icon}</span>
                      <span className="truncate font-bold text-[10px]">{activeThemeObj.name.split(" ")[0]}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const fonts = ["jakarta", "outfit", "playfair", "syne", "cinzel", "inter", "grotesk"];
                      const currentIdx = fonts.indexOf(appFont);
                      const nextFont = fonts[(currentIdx + 1) % fonts.length];
                      handleFontChange(nextFont);
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      activeThemeObj.isDark
                        ? "bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-200"
                        : "bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800"
                    }`}
                  >
                    <span className="text-[10px] font-bold capitalize truncate">Aa {appFont}</span>
                    <RefreshCw className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Navigation Items Organized by Section */}
              <nav className="space-y-4">
                {/* SECTION 1: CORE WORKSPACE */}
                <div className="space-y-1">
                  <div className="px-3 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400/80 mb-1">
                    Core Workspace
                  </div>

                  {/* Dashboard */}
                  <button
                    onClick={() => {
                      setCurrentView("dashboard");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "dashboard"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                      currentView === "dashboard"
                        ? "bg-white/20 text-white shadow-inner"
                        : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                    }`}>
                      <LayoutDashboard className="h-4 w-4" />
                    </div>
                    <span className="font-bold">Dashboard</span>
                  </button>

                  {/* Resume Builder */}
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "resume-editor"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                        currentView === "resume-editor"
                          ? "bg-white/20 text-white shadow-inner"
                          : "bg-teal-500/15 border border-teal-500/30 text-teal-400"
                      }`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-bold">Resume Builder</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                      currentView === "resume-editor" ? "bg-white/20 text-white border-white/30" : "bg-teal-500/15 text-teal-300 border-teal-500/30"
                    }`}>
                      Studio
                    </span>
                  </button>

                  {/* Cover Letters */}
                  <button
                    onClick={() => {
                      const firstLet = letters[0];
                      if (firstLet) {
                        setSelectedLetterId(firstLet.id);
                        setCurrentView("letter-editor");
                      } else {
                        handleCreateLetter(
                          activeResume ? `Cover Letter - ${activeResume.title}` : "Cover Letter - Draft",
                          "Target Company",
                          activeResume?.personalInfo?.jobTitle || "Target Role"
                        );
                      }
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "letter-editor"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                      currentView === "letter-editor"
                        ? "bg-white/20 text-white shadow-inner"
                        : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                    }`}>
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="font-bold">Cover Letters</span>
                  </button>

                  {/* 3D Resume Analytics */}
                  <button
                    onClick={() => {
                      if (resumes.length > 0) {
                        if (!selectedResumeId) setSelectedResumeId(resumes[0].id);
                        setCurrentView("resume-analytics");
                      } else {
                        alert("Please create or scan a resume first to view 3D analytics!");
                      }
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "resume-analytics"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                        currentView === "resume-analytics"
                          ? "bg-white/20 text-white shadow-inner"
                          : "bg-pink-500/15 border border-pink-500/30 text-pink-400"
                      }`}>
                        <BarChart2 className="h-4 w-4" />
                      </div>
                      <span className="font-bold">3D Analytics</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                      currentView === "resume-analytics" ? "bg-white/20 text-white border-white/30" : "bg-pink-500/15 text-pink-300 border-pink-500/30"
                    }`}>
                      8-Metric
                    </span>
                  </button>
                </div>

                {/* SECTION 2: AI CAREER INTELLIGENCE */}
                <div className="space-y-1 pt-1">
                  <div className="px-3 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400/80 mb-1">
                    AI Career Intelligence
                  </div>

                  {/* AI Resume Coach */}
                  <button
                    onClick={() => {
                      if (resumes.length > 0) {
                        if (!selectedResumeId) setSelectedResumeId(resumes[0].id);
                        setCurrentView("resume-coach");
                      } else {
                        alert("Please create or scan a resume first from the dashboard!");
                      }
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "resume-coach"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                        currentView === "resume-coach"
                          ? "bg-white/20 text-white shadow-inner"
                          : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      }`}>
                        <Sparkles className="h-4 w-4 animate-pulse" />
                      </div>
                      <span className="font-bold">AI Resume Coach</span>
                    </div>
                  </button>

                  {/* Interview Intelligence */}
                  <button
                    onClick={() => {
                      setCurrentView("interview-intelligence");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "interview-intelligence"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                        currentView === "interview-intelligence"
                          ? "bg-white/20 text-white shadow-inner"
                          : "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                      }`}>
                        <Brain className="h-4 w-4" />
                      </div>
                      <span className="font-bold">Interview AI</span>
                    </div>
                  </button>

                  {/* Job Intelligence */}
                  <button
                    onClick={() => {
                      setCurrentView("job-intelligence");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "job-intelligence"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                        currentView === "job-intelligence"
                          ? "bg-white/20 text-white shadow-inner"
                          : "bg-sky-500/15 border border-sky-500/30 text-sky-400"
                      }`}>
                        <FileSearch className="h-4 w-4" />
                      </div>
                      <span className="font-bold">Job Intelligence</span>
                    </div>
                  </button>

                  {/* AI Career Chat */}
                  <button
                    onClick={() => {
                      setCurrentView("ai-chat");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "ai-chat"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                        currentView === "ai-chat"
                          ? "bg-white/20 text-white shadow-inner"
                          : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                      }`}>
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <span className="font-bold">AI Career Chat</span>
                    </div>
                  </button>
                </div>

                {/* SECTION 3: COMMUNITY & ARENA */}
                <div className="space-y-1 pt-1">
                  <div className="px-3 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400/80 mb-1">
                    Community & Arena
                  </div>

                  {/* Direct Messages */}
                  <button
                    onClick={() => {
                      setCurrentView("direct-messages");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "direct-messages"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                        currentView === "direct-messages"
                          ? "bg-white/20 text-white shadow-inner"
                          : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                      }`}>
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="font-bold">Direct Messages</span>
                    </div>
                    {directUnreadCount > 0 && (
                      <span className="bg-indigo-500 text-white font-mono font-bold text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center min-w-[18px] animate-bounce">
                        {directUnreadCount}
                      </span>
                    )}
                  </button>

                  {/* Daily Skill Arena */}
                  <button
                    onClick={() => {
                      setCurrentView("skill-arena");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "skill-arena"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                        currentView === "skill-arena"
                          ? "bg-white/20 text-white shadow-inner"
                          : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                      }`}>
                        <Brain className="h-4 w-4" />
                      </div>
                      <span className="font-bold">Daily Skill Arena</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase bg-indigo-500/15 text-indigo-300 border-indigo-500/30">
                      Games
                    </span>
                  </button>
                </div>

                {/* SECTION 4: SYSTEM & PREFERENCES */}
                <div className="space-y-1 pt-1">
                  <div className="px-3 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400/80 mb-1">
                    System & Support
                  </div>

                  {/* Settings */}
                  <button
                    onClick={() => {
                      setCurrentView("settings");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "settings"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                      currentView === "settings"
                        ? "bg-white/20 text-white shadow-inner"
                        : "bg-slate-500/15 border border-slate-500/30 text-slate-400"
                    }`}>
                      <SettingsIcon className="h-4 w-4" />
                    </div>
                    <span className="font-bold">Settings & Export</span>
                  </button>

                  {/* Support & Reviews */}
                  <button
                    onClick={() => {
                      setCurrentView("support");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group ${
                      currentView === "support"
                        ? activeThemeObj.navActiveBg
                        : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                        currentView === "support"
                          ? "bg-white/20 text-white shadow-inner"
                          : "bg-blue-500/15 border border-blue-500/30 text-blue-400"
                      }`}>
                        <HelpCircle className="h-4 w-4" />
                      </div>
                      <span className="font-bold">Help, FAQ & Support</span>
                    </div>
                    {userUnreadCount > 0 && (
                      <span className="bg-indigo-500 text-white font-mono font-bold text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center min-w-[18px]">
                        {userUnreadCount}
                      </span>
                    )}
                  </button>

                  {/* Admin Panel */}
                  {user.email === "bilalhassanmussa@gmail.com" && (
                    <button
                      onClick={() => {
                        setCurrentView("admin");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide border transition group ${
                        currentView === "admin" 
                          ? "bg-rose-950 text-rose-200 border-rose-500/40 shadow-lg" 
                          : "bg-rose-950/20 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border-rose-900/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400">
                          <Shield className="h-4 w-4" />
                        </div>
                        <span className="font-bold">Admin Panel</span>
                      </div>
                      {adminUnreadCount > 0 && (
                        <span className="bg-rose-500 text-white font-mono font-bold text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center min-w-[18px]">
                          {adminUnreadCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </nav>
            </div>

            {/* Bottom User status details */}
            <div className="mt-6 pt-4 border-t border-slate-700/50 space-y-3">
              <div className="flex items-center gap-3">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-slate-700 shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 text-xs shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="truncate flex-1">
                  <span className={`text-xs font-bold block truncate ${activeThemeObj.textHeading}`}>{user.displayName}</span>
                  <span className={`text-[10px] block truncate ${activeThemeObj.textMuted}`}>{user.email}</span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-2 bg-slate-900/80 hover:bg-slate-800 rounded-xl text-xs font-semibold text-rose-400 border border-rose-900/30 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop / Large Tablet Docked Sidebar Navigation (md:) */}
      <aside className={`hidden md:flex w-64 lg:w-72 ${activeThemeObj.sidebarClass} border-r p-5 flex-col justify-between shrink-0 no-print transition-colors duration-300 relative z-10 sticky top-0 h-screen overflow-y-auto ${activeThemeObj.textClass}`}>
        {/* Top Brand & Mode Color Selector */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <RahmoraLogo size="md" lightTheme={!activeThemeObj.isDark} />
              {isOfflineMode && (
                <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[9px] font-semibold w-fit">
                  <Activity className="h-2.5 w-2.5 animate-pulse text-amber-500" />
                  Offline (Local Sync)
                </div>
              )}
            </div>
          </div>

          {/* Theme Mode & Font Mode Quick Switcher Widget */}
          <div className={`p-3 rounded-2xl ${activeThemeObj.cardClass} border ${activeThemeObj.borderClass} space-y-2.5 shadow-lg`}>
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase opacity-80">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Theme & Font Mode
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 font-mono font-semibold">
                {activeThemeObj.icon} {activeThemeObj.elementName.split(" ")[0]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Theme Cycle Selector Button */}
              <button
                type="button"
                onClick={() => {
                  const currentIndex = THEMES.findIndex((t) => t.id === currentTheme);
                  const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
                  setCurrentTheme(nextTheme.id);
                  localStorage.setItem("cvcraft_theme", nextTheme.id);
                }}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  activeThemeObj.isDark
                    ? "bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-200"
                    : "bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800"
                }`}
                title="Click to cycle theme color element"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm">{activeThemeObj.icon}</span>
                  <span className="truncate font-bold text-[11px]">{activeThemeObj.name.split(" ")[0]}</span>
                </div>
                <div className="flex items-center -space-x-1 shrink-0">
                  {activeThemeObj.dotColors.map((color, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>

              {/* Font Mode Selector Button */}
              <button
                type="button"
                onClick={() => {
                  const fonts = ["jakarta", "outfit", "playfair", "syne", "cinzel", "inter", "grotesk"];
                  const currentIdx = fonts.indexOf(appFont);
                  const nextFont = fonts[(currentIdx + 1) % fonts.length];
                  handleFontChange(nextFont);
                }}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  activeThemeObj.isDark
                    ? "bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-200"
                    : "bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800"
                }`}
                title="Click to switch app font style"
              >
                <span className="text-[11px] font-bold capitalize truncate">Aa {appFont}</span>
                <RefreshCw className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Navigation Items Organized by Section */}
          <nav className="space-y-4">
            {/* SECTION 1: CORE WORKSPACE */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400/80 mb-1">
                Core Workspace
              </div>

              {/* Dashboard */}
              <button
                onClick={() => {
                  setCurrentView("dashboard");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "dashboard"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                  currentView === "dashboard"
                    ? "bg-white/20 text-white shadow-inner"
                    : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                }`}>
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <span className="font-bold">Dashboard</span>
              </button>

              {/* Resume Builder */}
              <button
                onClick={() => {
                  const firstRes = resumes[0];
                  if (firstRes) {
                    setSelectedResumeId(firstRes.id);
                    setCurrentView("resume-editor");
                  } else {
                    alert("Please create a resume first from the dashboard!");
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "resume-editor"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                    currentView === "resume-editor"
                      ? "bg-white/20 text-white shadow-inner"
                      : "bg-teal-500/15 border border-teal-500/30 text-teal-400"
                  }`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Resume Builder</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                  currentView === "resume-editor" ? "bg-white/20 text-white border-white/30" : "bg-teal-500/15 text-teal-300 border-teal-500/30"
                }`}>
                  Studio
                </span>
              </button>

              {/* Cover Letters */}
              <button
                onClick={() => {
                  const firstLet = letters[0];
                  if (firstLet) {
                    setSelectedLetterId(firstLet.id);
                    setCurrentView("letter-editor");
                  } else {
                    handleCreateLetter(
                      activeResume ? `Cover Letter - ${activeResume.title}` : "Cover Letter - Draft",
                      "Target Company",
                      activeResume?.personalInfo?.jobTitle || "Target Role"
                    );
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "letter-editor"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                  currentView === "letter-editor"
                    ? "bg-white/20 text-white shadow-inner"
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                }`}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-bold">Cover Letters</span>
              </button>

              {/* 3D Resume Analytics */}
              <button
                onClick={() => {
                  if (resumes.length > 0) {
                    if (!selectedResumeId) setSelectedResumeId(resumes[0].id);
                    setCurrentView("resume-analytics");
                  } else {
                    alert("Please create or scan a resume first to view 3D analytics!");
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "resume-analytics"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                    currentView === "resume-analytics"
                      ? "bg-white/20 text-white shadow-inner"
                      : "bg-pink-500/15 border border-pink-500/30 text-pink-400"
                  }`}>
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <span className="font-bold">3D Analytics</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                  currentView === "resume-analytics" ? "bg-white/20 text-white border-white/30" : "bg-pink-500/15 text-pink-300 border-pink-500/30"
                }`}>
                  8-Metric
                </span>
              </button>
            </div>

            {/* SECTION 2: AI CAREER INTELLIGENCE */}
            <div className="space-y-1 pt-1">
              <div className="px-3 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400/80 mb-1">
                AI Career Intelligence
              </div>

              {/* AI Resume Coach */}
              <button
                onClick={() => {
                  if (resumes.length > 0) {
                    if (!selectedResumeId) setSelectedResumeId(resumes[0].id);
                    setCurrentView("resume-coach");
                  } else {
                    alert("Please create or scan a resume first from the dashboard!");
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "resume-coach"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                    currentView === "resume-coach"
                      ? "bg-white/20 text-white shadow-inner"
                      : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                  }`}>
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                  <span className="font-bold">AI Resume Coach</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                  currentView === "resume-coach" ? "bg-white/20 text-white border-white/30" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                }`}>
                  Live
                </span>
              </button>

              {/* Interview Intelligence */}
              <button
                onClick={() => {
                  setCurrentView("interview-intelligence");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "interview-intelligence"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                    currentView === "interview-intelligence"
                      ? "bg-white/20 text-white shadow-inner"
                      : "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                  }`}>
                    <Brain className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Interview AI</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                  currentView === "interview-intelligence" ? "bg-white/20 text-white border-white/30" : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                }`}>
                  Sim
                </span>
              </button>

              {/* Job Intelligence */}
              <button
                onClick={() => {
                  setCurrentView("job-intelligence");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "job-intelligence"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                    currentView === "job-intelligence"
                      ? "bg-white/20 text-white shadow-inner"
                      : "bg-sky-500/15 border border-sky-500/30 text-sky-400"
                  }`}>
                    <FileSearch className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Job Intelligence</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                  currentView === "job-intelligence" ? "bg-white/20 text-white border-white/30" : "bg-sky-500/15 text-sky-300 border-sky-500/30"
                }`}>
                  10 Alts
                </span>
              </button>

              {/* AI Career Chat */}
              <button
                onClick={() => {
                  setCurrentView("ai-chat");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "ai-chat"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                    currentView === "ai-chat"
                      ? "bg-white/20 text-white shadow-inner"
                      : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                  }`}>
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="font-bold">AI Career Chat</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                  currentView === "ai-chat" ? "bg-white/20 text-white border-white/30" : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}>
                  Ask AI
                </span>
              </button>
            </div>

            {/* SECTION 3: COMMUNITY & ARENA */}
            <div className="space-y-1 pt-1">
              <div className="px-3 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400/80 mb-1">
                Community & Arena
              </div>

              {/* Direct Messages */}
              <button
                onClick={() => {
                  setCurrentView("direct-messages");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "direct-messages"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                    currentView === "direct-messages"
                      ? "bg-white/20 text-white shadow-inner"
                      : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                  }`}>
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Direct Messages</span>
                </div>
                {directUnreadCount > 0 && (
                  <span className="bg-indigo-500 text-white font-mono font-bold text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center min-w-[18px] animate-bounce">
                    {directUnreadCount}
                  </span>
                )}
              </button>

              {/* Daily Skill Arena */}
              <button
                onClick={() => {
                  setCurrentView("skill-arena");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "skill-arena"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                    currentView === "skill-arena"
                      ? "bg-white/20 text-white shadow-inner"
                      : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                  }`}>
                    <Brain className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Daily Skill Arena</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                  currentView === "skill-arena" ? "bg-white/20 text-white border-white/30" : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                }`}>
                  Games
                </span>
              </button>
            </div>

            {/* SECTION 4: SYSTEM & PREFERENCES */}
            <div className="space-y-1 pt-1">
              <div className="px-3 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400/80 mb-1">
                System & Support
              </div>

              {/* Settings */}
              <button
                onClick={() => {
                  setCurrentView("settings");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "settings"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                  currentView === "settings"
                    ? "bg-white/20 text-white shadow-inner"
                    : "bg-slate-500/15 border border-slate-500/30 text-slate-400"
                }`}>
                  <SettingsIcon className="h-4 w-4" />
                </div>
                <span className="font-bold">Settings & Export</span>
              </button>

              {/* Support & Reviews */}
              <button
                onClick={() => {
                  setCurrentView("support");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition group ${
                  currentView === "support"
                    ? activeThemeObj.navActiveBg
                    : `${activeThemeObj.isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${
                    currentView === "support"
                      ? "bg-white/20 text-white shadow-inner"
                      : "bg-blue-500/15 border border-blue-500/30 text-blue-400"
                  }`}>
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Help, FAQ & Support</span>
                </div>
                {userUnreadCount > 0 && (
                  <span className="bg-indigo-500 text-white font-mono font-bold text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center min-w-[18px] animate-bounce shadow-md">
                    {userUnreadCount}
                  </span>
                )}
              </button>

              {/* Admin Panel */}
              {user.email === "bilalhassanmussa@gmail.com" && (
                <button
                  onClick={() => {
                    setCurrentView("admin");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide border transition group ${
                    currentView === "admin" 
                      ? "bg-rose-950 text-rose-200 border-rose-500/40 shadow-lg" 
                      : "bg-rose-950/20 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border-rose-900/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="font-bold">Admin Panel</span>
                  </div>
                  {adminUnreadCount > 0 && (
                    <span className="bg-rose-500 text-white font-mono font-bold text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center min-w-[18px]">
                      {adminUnreadCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom User status details */}
        <div className="mt-6 pt-5 border-t border-slate-700/50 space-y-3.5">
          <div className="flex items-center gap-3">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" className="h-8.5 w-8.5 rounded-full object-cover border border-slate-700 shrink-0 shadow-md" />
            ) : (
              <div className="h-8.5 w-8.5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 text-xs shrink-0 shadow-md">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="truncate flex-1">
              <span className={`text-xs font-bold block truncate ${activeThemeObj.textHeading}`}>{user.displayName}</span>
              <span className={`text-[10px] block truncate ${activeThemeObj.textMuted}`}>{user.email}</span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-2 bg-slate-900/80 hover:bg-slate-800 rounded-xl text-xs font-semibold text-rose-400 border border-rose-900/30 transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {currentView === "dashboard" && (
          <Dashboard
            user={user}
            resumes={resumes}
            letters={letters}
            theme={activeThemeObj}
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
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
        )}

        {currentView === "resume-editor" && activeResume && (
          <ResumeBuilder
            initialResume={activeResume}
            user={user}
            onSave={handleSaveActiveResume}
            onBackToDashboard={() => setCurrentView("dashboard")}
            isPremium={user.isPremium}
            onUpgrade={handleUpgradeElite}
          />
        )}

        {currentView === "letter-editor" && effectiveLetter && (
          <CoverLetterBuilder
            initialLetter={effectiveLetter}
            resumes={resumes}
            onSave={handleSaveActiveLetter}
            onBackToDashboard={() => setCurrentView("dashboard")}
            isPremium={user.isPremium}
            onUpgrade={handleUpgradeElite}
          />
        )}

        {currentView === "resume-coach" && activeResume && (
          <ResumeCoach
            resume={activeResume}
            onUpdateResume={handleSaveActiveResume}
            isPremium={user.isPremium}
            onUpgrade={handleUpgradeElite}
            onBackToDashboard={() => setCurrentView("dashboard")}
          />
        )}

        {currentView === "job-intelligence" && (
          <JobIntelligence
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onSelectResume={(id) => setSelectedResumeId(id)}
            onCreateCoverLetterFromJob={(jobTitle, companyName, jobDesc) => {
              handleCreateLetter(
                `Cover Letter - ${jobTitle} (${companyName})`,
                companyName,
                jobTitle
              );
              setCurrentView("letter-editor");
            }}
          />
        )}

        {currentView === "interview-intelligence" && activeResume && (
          <InterviewIntelligence
            resume={activeResume}
            onBackToDashboard={() => setCurrentView("dashboard")}
            isPremium={user.isPremium}
            onUpgrade={handleUpgradeElite}
          />
        )}

        {currentView === "resume-analytics" && activeResume && (
          <ResumeAnalytics
            resume={activeResume}
            onUpdateResume={handleSaveActiveResume}
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

        {currentView === "career" && user && (
          <div className="p-4 sm:p-8">
            <CareerRecommender user={user} resumes={resumes} />
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
            onThemeChange={handleThemeChange}
            appFont={appFont}
            onFontChange={handleFontChange}
          />
        )}

        {currentView === "admin" && (
          <AdminPanel
            user={user}
            onClose={() => setCurrentView("dashboard")}
          />
        )}

        {currentView === "support" && (
          <SupportFeedback 
            user={user} 
            onOpenDirectMessages={() => setCurrentView("direct-messages")} 
            onNavigateToView={(view) => setCurrentView(view as any)}
          />
        )}

        {currentView === "direct-messages" && user && (
          <DirectMessages
            user={user}
            theme={activeThemeObj}
            onBackToDashboard={() => setCurrentView("dashboard")}
          />
        )}

        {currentView === "ai-chat" && user && (
          <AIChat
            user={user}
            resumes={resumes}
            isDark={activeThemeObj.isDark}
            onImportScannedResume={handleImportScannedResume}
          />
        )}

        {currentView === "skill-arena" && user && (
          <SkillArena
            user={user}
            theme={activeThemeObj}
            onBackToDashboard={() => setCurrentView("dashboard")}
            onUpgrade={handleUpgradeElite}
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

      <UploadResumeModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportToBuilder={(scannedResume) => {
          handleImportScannedResume(scannedResume);
          setIsUploadModalOpen(false);
        }}
      />

      {/* Real-time Toast Notification */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => {
              setCurrentView(activeToast.view);
              setActiveToast(null);
            }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-2xl shadow-indigo-500/10 cursor-pointer flex items-start gap-3 hover:border-indigo-500 transition"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0 mt-0.5 animate-pulse">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-0.5 text-left">
              <span className="text-[10px] font-mono tracking-wider text-indigo-400 block font-bold uppercase">
                {activeToast.title}
              </span>
              <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                {activeToast.body}
              </p>
              <span className="text-[9px] text-slate-500 block font-mono pt-1">
                Click here to view messages instantly
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-lg shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
