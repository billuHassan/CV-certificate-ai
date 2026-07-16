import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, FileText, Activity, Settings as SettingsIcon, LogOut, LayoutDashboard,
  Award, RefreshCw, BarChart2, Bell, Shield, Mail, Phone, MapPin, User, ChevronRight, Menu, X, Compass, MessageSquare,
  Brain
} from "lucide-react";
import { UserSession, ResumeData, CoverLetterData, ScoreReport } from "./types";
import Onboarding from "./components/Onboarding";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import ResumeBuilder from "./components/ResumeBuilder";
import CoverLetterBuilder from "./components/CoverLetterBuilder";
import ScoreAnalyzer from "./components/ScoreAnalyzer";
import CareerRecommender from "./components/CareerRecommender";
import Settings, { THEMES, WORLD_LANGUAGES } from "./components/Settings";
import { setLanguageCookie, clearLanguageCookie } from "./lib/languageUtils";
import { BannerAd, PremiumModal } from "./components/AdSystem";
import AdminPanel from "./components/AdminPanel";
import SupportFeedback from "./components/SupportFeedback";
// import AIChat from "./components/AIChat";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
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
  const [currentView, setCurrentView] = useState<"dashboard" | "resume-editor" | "letter-editor" | "score" | "settings" | "admin" | "career" | "support" | "ai-chat">("dashboard");
  const [userUnreadCount, setUserUnreadCount] = useState<number>(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState<number>(0);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; body: string; view: "support" | "admin" } | null>(null);

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

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous user doc listener if it exists
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (firebaseUser) {
        // Load user-specific active states on login
        const savedResumeId = sessionStorage.getItem(`cvcraft_${firebaseUser.uid}_selectedResumeId`);
        const savedLetterId = sessionStorage.getItem(`cvcraft_${firebaseUser.uid}_selectedLetterId`);
        const savedScoreReport = sessionStorage.getItem(`cvcraft_${firebaseUser.uid}_scoreReport`);
        const savedView = sessionStorage.getItem(`cvcraft_${firebaseUser.uid}_currentView`);

        setSelectedResumeId(savedResumeId);
        setSelectedLetterId(savedLetterId);
        if (savedScoreReport) {
          try {
            setScoreReport(JSON.parse(savedScoreReport));
          } catch {
            setScoreReport(null);
          }
        } else {
          setScoreReport(null);
        }
        setCurrentView((savedView as any) || "dashboard");

        // Sync user-specific language choice instantly on login
        const savedUserLang = localStorage.getItem(`cvcraft_${firebaseUser.uid}_lang`);
        if (savedUserLang) {
          const selectedLang = WORLD_LANGUAGES.find(l => l.name === savedUserLang || l.name.startsWith(savedUserLang));
          if (selectedLang) {
            setLanguageCookie(selectedLang.code);
          }
        }

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
              isPremium: true,
              creationsCount: profileData.creationsCount,
              adViews: profileData.adViews,
              profilePhoto: profileData.profilePhoto
            });
          }, (err) => {
            console.error("User document real-time listener error, falling back to offline mode:", err);
            setIsOfflineMode(true);
            localStorage.setItem("cvcraft_offline_mode", "true");
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
              console.error("Firestore resumes listener error, falling back to offline mode:", err);
              setIsOfflineMode(true);
              localStorage.setItem("cvcraft_offline_mode", "true");
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
              console.error("Firestore letters listener error, falling back to offline mode:", err);
              setIsOfflineMode(true);
              localStorage.setItem("cvcraft_offline_mode", "true");
            }
          );

        } catch (error) {
          console.error("Error setting up Firestore real-time listeners, falling back to offline mode:", error);
          setIsOfflineMode(true);
          localStorage.setItem("cvcraft_offline_mode", "true");
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
      return;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    let adminUnread = 0;
    let directUnread = 0;

    // 1. Listen to user-specific Admin chat messages in real time to count unread admin replies
    const q1 = query(collection(db, "admin_chats"), where("userId", "==", firebaseUser.uid));
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as any);
      adminUnread = docs.filter(m => m.senderId !== firebaseUser.uid && !m.read).length;
      
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
      setUserUnreadCount(adminUnread + directUnread);
    }, (err) => console.error("Error user admin_chats listener:", err));

    // 2. Listen to direct_messages sent to this user
    const q2 = query(collection(db, "direct_messages"), where("recipientId", "==", firebaseUser.uid));
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as any);
      directUnread = docs.filter(m => !m.read).length;
      
      if (!isDirectMsgFirstLoad.current) {
        docs.forEach(m => {
          if (!m.read && !seenMessagesRef.current.has(m.id)) {
            setActiveToast({
              id: m.id,
              title: `New Direct Message from ${m.senderName || "User"}`,
              body: m.message || "Sent an attachment",
              view: "support"
            });
          }
        });
      }
      
      docs.forEach(m => seenMessagesRef.current.add(m.id));
      isDirectMsgFirstLoad.current = false;
      setUserUnreadCount(adminUnread + directUnread);
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
      setIsOfflineMode(false);
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
    if (isOfflineMode) {
      const updatedResumes = resumes.filter(r => r.id !== id);
      setResumes(updatedResumes);
      localStorage.setItem(`cvcraft_local_resumes_${user.email}`, JSON.stringify(updatedResumes));
      if (selectedResumeId === id) setSelectedResumeId(null);
      return;
    }

    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "resumes", id));
      if (selectedResumeId === id) setSelectedResumeId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/resumes/${id}`);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    if (!user) return;
    if (isOfflineMode) {
      const updatedLetters = letters.filter(l => l.id !== id);
      setLetters(updatedLetters);
      localStorage.setItem(`cvcraft_local_letters_${user.email}`, JSON.stringify(updatedLetters));
      if (selectedLetterId === id) setSelectedLetterId(null);
      return;
    }

    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "letters", id));
      if (selectedLetterId === id) setSelectedLetterId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/letters/${id}`);
    }
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

  const activeThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];
  const gridClass = activeThemeObj.isDark ? "subtle-grid" : "subtle-grid-light";
  const glowClass = activeThemeObj.isDark ? "ambient-glow" : "ambient-glow-light";

  return (
    <div className={`min-h-screen ${activeThemeObj.bgClass} flex flex-col md:flex-row font-sans transition-colors duration-300 relative overflow-x-hidden`}>
      {/* Decorative Grid and Glow Backdrops */}
      <div className={`absolute inset-0 ${gridClass} pointer-events-none opacity-80 z-0`} />
      <div className={`absolute inset-0 ${glowClass} pointer-events-none z-0`} />
      
      {/* Sidebar Navigation */}
      <aside className={`w-full md:w-64 ${activeThemeObj.sidebarClass} border-b md:border-b-0 md:border-r p-5 flex flex-col justify-between shrink-0 no-print transition-colors duration-300 relative z-10`}>
        
        {/* Top brand */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-400" />
                <span className="font-extrabold tracking-tight text-white font-display text-lg">CVCraft AI</span>
              </div>
              {isOfflineMode && (
                <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-semibold w-fit">
                  <Activity className="h-2.5 w-2.5 animate-pulse text-amber-500" />
                  Offline (Local Sync)
                </div>
              )}
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

            {/* Hidden ATS Score Audit and Career Recommender for future continuation
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
                setCurrentView("career");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                currentView === "career" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Compass className="h-4.5 w-4.5" /> Career Recommender
            </button>
            */}

            {/* Commented out AI Career Coach as requested to optimize token limits */}
            {/* <button
              onClick={() => {
                setCurrentView("ai-chat");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                currentView === "ai-chat" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Brain className="h-4.5 w-4.5" /> AI Career Coach
            </button> */}

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

            <button
              onClick={() => {
                setCurrentView("support");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                currentView === "support" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4.5 w-4.5" />
                <span>Support & Reviews</span>
              </div>
              {userUnreadCount > 0 && (
                <span className="bg-indigo-500 text-white font-mono font-bold text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center min-w-[18px] animate-bounce">
                  {userUnreadCount}
                </span>
              )}
            </button>

            {user.email === "bilalhassanmussa@gmail.com" && (
              <button
                onClick={() => {
                  setCurrentView("admin");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide border border-dashed transition ${
                  currentView === "admin" 
                    ? "bg-rose-950 text-rose-200 border-rose-500/40 shadow-lg" 
                    : "text-rose-400 hover:text-rose-350 hover:bg-rose-950/20 border-rose-900/30"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4.5 w-4.5 text-rose-500" />
                  <span>Admin Panel</span>
                </div>
                {adminUnreadCount > 0 && (
                  <span className="bg-rose-500 text-white font-mono font-bold text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center min-w-[18px]">
                    {adminUnreadCount}
                  </span>
                )}
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
      <main className="flex-1 overflow-y-auto relative z-10">
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
            user={user}
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

        {currentView === "support" && (
          <SupportFeedback user={user} />
        )}

        {/* {currentView === "ai-chat" && user && (
          <AIChat user={user} resumes={resumes} isDark={activeThemeObj.isDark} />
        )} */}
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
