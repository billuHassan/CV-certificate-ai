import React, { useState, useEffect } from "react";
import {
  Sparkles, Mail, Lock, User, ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff,
  ArrowLeft, CheckCircle2, Cpu, FileText, Building2, Brain, Zap, Copy, Check, ExternalLink,
  ChevronLeft, ChevronRight, Play, Pause, Gamepad2, BarChart2
} from "lucide-react";
import RahmoraLogo, { RahmoraGlitterBadge } from "./RahmoraLogo";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInAnonymously,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface ShowcaseSlide {
  id: string;
  title: string;
  category: string;
  tag: string;
  badgeColor: string;
  description: string;
  image: string;
  features: string[];
  accentColor: string;
  borderGlow: string;
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: "resume-builder",
    title: "Executive ATS Resume Studio",
    category: "Resume Builder",
    tag: "ATS 98% Match",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description: "Design executive-ready CVs with 12+ recruiter-tested layouts, real-time PDF/Word export, live zoom, and instant metric quantification.",
    image: "/src/assets/images/service_resume_builder_1791877147177.jpg",
    features: ["12+ Pro Templates", "Live PDF & Word Export", "Real-Time ATS Parsing"],
    accentColor: "text-emerald-400",
    borderGlow: "border-emerald-500/40 shadow-emerald-500/10",
  },
  {
    id: "cover-letters",
    title: "AI Grounded Cover Letter Generator",
    category: "Cover Letters",
    tag: "Target Role Matched",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    description: "Auto-generate tailored, highly persuasive cover letters referencing target company facts, job requirements, and your accomplishments.",
    image: "/src/assets/images/service_cover_letter_1791877148445.jpg",
    features: ["Company-Grounded AI", "Tone & Narrative Adjuster", "Instant One-Click Export"],
    accentColor: "text-teal-400",
    borderGlow: "border-teal-500/40 shadow-teal-500/10",
  },
  {
    id: "career-coach",
    title: "AI Resume Coach & 3D Analytics",
    category: "Career Coach",
    tag: "8-Metric Live Audit",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    description: "Interactive multi-dimensional audit analyzing ATS keyword density, formatting hygiene, impact metrics, and recruiter callback probability.",
    image: "/src/assets/images/service_career_coach_1791877147945.jpg",
    features: ["Radar Skill Alignment", "Recruiter Pass Probability", "Actionable Gap Fixes"],
    accentColor: "text-pink-400",
    borderGlow: "border-pink-500/40 shadow-pink-500/10",
  },
  {
    id: "skill-arena",
    title: "Daily Skill Arena & Brain Games",
    category: "Career Games",
    tag: "Daily Quizzes & Wordle",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description: "Sharpen cognitive readiness with daily games: Coding Quizzes, Career Lexicon Wordle, Speed Typing tests, and logic puzzles with global leaderboards.",
    image: "/src/assets/images/service_skill_games_1791877150021.jpg",
    features: ["Coding Quiz & Trivia", "Daily Lexicon Wordle", "Global Competency XP"],
    accentColor: "text-amber-400",
    borderGlow: "border-amber-500/40 shadow-amber-500/10",
  },
  {
    id: "interview-ai",
    title: "Interview AI Intelligence Simulator",
    category: "Interview Simulator",
    tag: "Real-time AI Feedback",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    description: "Rehearse high-pressure behavioral and technical interviews with AI persona interviewers, voice speech capture, and instant STAR scorecards.",
    image: "/src/assets/images/service_interview_ai_1791877150027.jpg",
    features: ["Interactive AI Persona", "STAR Method Scorecard", "Real-time Strengths Analysis"],
    accentColor: "text-purple-400",
    borderGlow: "border-purple-500/40 shadow-purple-500/10",
  },
];

function ServiceShowcaseSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeSlide = SHOWCASE_SLIDES[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? SHOWCASE_SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
  };

  return (
    <div
      className="w-full max-w-4xl mx-auto space-y-3.5 pt-1"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Category Navigation Pills */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
        {SHOWCASE_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 border border-indigo-400/50"
                  : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <span className="truncate">{slide.category}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Slide Card Frame */}
      <div className={`card-3d rounded-2xl overflow-hidden border ${activeSlide.borderGlow} bg-slate-950 shadow-2xl transition-all duration-300 relative group`}>
        {/* Slideshow Top Header Bar */}
        <div className="px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-[11px] text-slate-300 font-bold truncate">
              Rahmora Live Suite &bull; {activeSlide.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${activeSlide.badgeColor}`}>
              {activeSlide.tag}
            </span>
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="text-[10px] text-slate-400 hover:text-slate-200 transition p-1 rounded hover:bg-slate-800 cursor-pointer"
              title={isPaused ? "Auto-play" : "Pause slideshow"}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Real Screenshot Preview Stage */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
          <img
            key={activeSlide.image}
            src={activeSlide.image}
            alt={activeSlide.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          />

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/80 backdrop-blur-md transition opacity-80 group-hover:opacity-100 hover:scale-110 cursor-pointer shadow-lg z-10"
            title="Previous service"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/80 backdrop-blur-md transition opacity-80 group-hover:opacity-100 hover:scale-110 cursor-pointer shadow-lg z-10"
            title="Next service"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Bottom Gradient Overlay with Detail Card */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-4 sm:p-5 pt-8 text-left pointer-events-none">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white font-display">
                    {activeSlide.title}
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${activeSlide.badgeColor}`}>
                    {activeSlide.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {activeSlide.description}
                </p>
              </div>

              {/* Feature Chips */}
              <div className="flex flex-wrap sm:flex-col gap-1.5 shrink-0 text-[10px] text-slate-300">
                {activeSlide.features.map((feat, fIdx) => (
                  <span key={fIdx} className="flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 px-2 py-0.5 rounded-lg text-slate-200">
                    <CheckCircle2 className={`w-3 h-3 ${activeSlide.accentColor}`} /> {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Slide Progress / Indicators Bar */}
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {SHOWCASE_SLIDES.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setCurrentIndex(dotIdx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  dotIdx === currentIndex
                    ? "w-8 bg-indigo-500 shadow-xs shadow-indigo-500/50"
                    : "w-2 bg-slate-700 hover:bg-slate-600"
                }`}
                title={`Go to slide ${dotIdx + 1}`}
                aria-label={`Slide ${dotIdx + 1}`}
              />
            ))}
          </div>

          <span className="font-mono text-[10px] text-slate-400">
            {currentIndex + 1} / {SHOWCASE_SLIDES.length} &bull; {activeSlide.category}
          </span>
        </div>
      </div>
    </div>
  );
}

interface AuthProps {
  onAuthSuccess: (user: { email: string; displayName: string }) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [showLanding, setShowLanding] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Check redirect result on mount (for mobile/redirect flows) & listen to live auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const displayName = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User";
        const userEmail = (firebaseUser.email || "").toLowerCase();
        const userSession = {
          uid: firebaseUser.uid,
          email: userEmail,
          displayName: displayName,
          isPremium: true,
          creationsCount: 0,
          adViews: 0,
          profilePhoto: firebaseUser.photoURL || ""
        };
        localStorage.setItem("cvcraft_local_user", JSON.stringify(userSession));
        localStorage.removeItem("cvcraft_offline_mode");
        onAuthSuccess({
          email: userEmail,
          displayName: displayName
        });
      }
    });

    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const firebaseUser = result.user;
          let displayName = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Google User";
          const userEmail = (firebaseUser.email || "").toLowerCase();

          const userSession = {
            uid: firebaseUser.uid,
            email: userEmail,
            displayName: displayName,
            isPremium: true,
            creationsCount: 0,
            adViews: 0,
            profilePhoto: firebaseUser.photoURL || ""
          };
          localStorage.setItem("cvcraft_local_user", JSON.stringify(userSession));
          localStorage.removeItem("cvcraft_offline_mode");

          onAuthSuccess({
            email: userEmail,
            displayName: displayName
          });
        }
      })
      .catch((rErr) => {
        console.warn("Redirect auth check:", rErr);
      });

    return () => {
      unsub();
    };
  }, [onAuthSuccess]);

  // Email verification flow states
  const [showVerification, setShowVerification] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [demoCodeNotice, setDemoCodeNotice] = useState<string | null>(null);

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState("");

  // Password recovery states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"request" | "verify" | "change">("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [forgotResetCode, setForgotResetCode] = useState("");
  const [forgotResetToken, setForgotResetToken] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotNewPasswordConfirm, setForgotNewPasswordConfirm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Strict Password requirement checks (for real-time display and validation)
  const isMinLength = password.length >= 8;
  const isUpper = /[A-Z]/.test(password);
  const isNumber = /[0-9]/.test(password);
  const isSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    // Validate email format regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address format (e.g., you@example.com).");
      return;
    }

    if (!isLogin && !name) {
      setError("Please provide your name.");
      return;
    }

    // Terms & Privacy Policy Check
    if (!isLogin && !acceptTerms) {
      setError("You must accept the Terms of Service and Privacy Policy to create an account.");
      return;
    }

    // Strict Password Validation Check during Registration
    if (!isLogin) {
      if (!isMinLength) {
        setError("Your password is too short. It must be at least 8 characters long.");
        return;
      }
      if (!isUpper) {
        setError("Your password must contain at least one uppercase letter (A-Z).");
        return;
      }
      if (!isNumber) {
        setError("Your password must contain at least one number (0-9).");
        return;
      }
      if (!isSymbol) {
        setError("Your password must contain at least one special character (e.g. !, @, #, $, %, etc.).");
        return;
      }
    }

    setLoading(true);
    
    try {
      // 1. Validate email syntax & domain reputation on the server
      const response = await fetch("/api/auth/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const valResult = await response.json();
        if (valResult && valResult.isValid === false) {
          setError(valResult.reason || "The provided email address is invalid or has been flagged.");
          setLoading(false);
          return;
        }
      }
    } catch (valErr) {
      console.warn("Email validation server check failed, continuing with email formatting checks:", valErr);
    }

    try {
      if (!isLogin) {
        // 2. REGISTRATION MODE: Request server to generate secure verification code
        const sendResponse = await fetch("/api/auth/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, action: "register" }),
        });
        const sendResult = await sendResponse.json();
        
        setLoading(false);
        if (sendResult.success) {
          setShowVerification(true);
          if (sendResult.demoCode) {
            setDemoCodeNotice(sendResult.demoCode);
            setEnteredCode(sendResult.demoCode);
          } else {
            setDemoCodeNotice(null);
          }
        } else {
          setError(sendResult.error || "Failed to trigger secure verification code. Please try again.");
        }
      } else {
        // 3. LOGIN MODE: Authenticate with Firebase Auth Email/Password strictly
        try {
          // Set persistence depending on whether Remember Me was checked
          try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            if (rememberMe) {
              localStorage.setItem("cvcraft_remember_me", "true");
            } else {
              localStorage.removeItem("cvcraft_remember_me");
            }
          } catch (pErr) {
            console.warn("Persistence set warning:", pErr);
          }

          localStorage.removeItem("cvcraft_offline_mode");
          const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          const fUser = userCredential.user;
          
          let displayName = fUser.displayName || email.split("@")[0];
          try {
            const uDocRef = doc(db, "users", fUser.uid);
            const uDoc = await getDoc(uDocRef);
            if (!uDoc.exists()) {
              await setDoc(uDocRef, {
                email: email.toLowerCase().trim(),
                displayName: displayName,
                isPremium: true,
                creationsCount: 0,
                adViews: 0,
                profilePhoto: ""
              });
            } else {
              displayName = uDoc.data().displayName || displayName;
            }
          } catch (docErr) {
            console.warn("Firestore profile sync warning:", docErr);
          }

          const userSession = {
            uid: fUser.uid,
            email: email.toLowerCase().trim(),
            displayName: displayName,
            isPremium: true,
            creationsCount: 0,
            adViews: 0,
            profilePhoto: ""
          };
          localStorage.setItem("cvcraft_local_user", JSON.stringify(userSession));

          setLoading(false);
          onAuthSuccess({
            email: email.trim(),
            displayName: displayName
          });
        } catch (authErr: any) {
          console.warn("Email password login attempt status:", authErr?.code, authErr?.message);
          setLoading(false);

          if (authErr?.code === "auth/operation-not-allowed") {
            setError("Email & Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Authentication -> Sign-in method.");
            return;
          }

          if (
            authErr?.code === "auth/invalid-credential" ||
            authErr?.code === "auth/user-not-found" ||
            authErr?.code === "auth/wrong-password"
          ) {
            setError("Incorrect email or password. Please verify your credentials or click 'Sign Up' if you don't have an account yet.");
            return;
          }

          if (authErr?.code === "auth/invalid-email") {
            setError("The email address format is invalid.");
            return;
          }

          if (authErr?.code === "auth/too-many-requests") {
            setError("Access to this account has been temporarily disabled due to too many failed login attempts. Please try again later or recover your password.");
            return;
          }

          setError(authErr?.message || "Invalid email or password. Please check your credentials.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected authentication server error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      setResendMsg("Sending new code...");
      const sendResponse = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "register" }),
      });
      const sendResult = await sendResponse.json();
      if (sendResult.success) {
        setResendMsg(sendResult.smtpConfigured ? "A fresh 6-digit code has been sent to your email!" : "Fresh verification code generated!");
        if (sendResult.demoCode) {
          setDemoCodeNotice(sendResult.demoCode);
          setEnteredCode(sendResult.demoCode);
        } else {
          setDemoCodeNotice(null);
        }
        setResendCooldown(30);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setResendMsg(sendResult.error || "Failed to resend code.");
      }
    } catch (err) {
      setResendMsg("Network error trying to resend code.");
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");
    
    if (enteredCode.trim().length !== 6) {
      setVerificationError("The verification code must be exactly 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: enteredCode.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        // Authenticate user via Firebase Auth
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const fUser = userCredential.user;
          await updateProfile(fUser, { displayName: name });
          
          // Store email and user data in Firestore
          await setDoc(doc(db, "users", fUser.uid), {
            email: email.toLowerCase().trim(),
            displayName: name || email.split("@")[0],
            isPremium: true,
            creationsCount: 0,
            adViews: 0,
            profilePhoto: ""
          });

          setLoading(false);
          setIsLogin(true);
          setShowVerification(false);
          setPassword(""); // Reset password field so they type it
          setSuccessMessage("Your account has been created and verified! Please sign in with your email and password.");
        } catch (regErr: any) {
          console.warn("Firebase email registration status:", regErr?.code, regErr?.message);
          setLoading(false);

          if (regErr?.code === "auth/operation-not-allowed") {
            setVerificationError("Email & Password registration is not enabled in Firebase Console. Please enable Email/Password under Authentication -> Sign-in method.");
            return;
          }

          let errMsg = "Registration failed. Please make sure your email is not already registered.";
          if (regErr?.code === "auth/email-already-in-use") {
            errMsg = "This email address is already registered in our system. Try signing in or recovering your password.";
          } else if (regErr?.code === "auth/weak-password") {
            errMsg = "The chosen password is too weak. Please use a stronger password format.";
          }
          setVerificationError(errMsg);
        }
      } else {
        setLoading(false);
        setVerificationError(data.reason || "Invalid verification code. Please check your code and try again.");
      }
    } catch (err) {
      console.error(err);
      setVerificationError("Server connection error during code verification.");
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    
    if (!resetEmail) {
      setResetError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(resetEmail)) {
      setResetError("Please enter a valid email address structure (e.g., you@example.com).");
      return;
    }

    setResetLoading(true);

    try {
      try {
        const response = await fetch("/api/auth/validate-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail }),
        });
        
        if (response.ok) {
          const valResult = await response.json();
          if (valResult && valResult.isValid === false) {
            setResetError(valResult.reason || "The provided email address is invalid.");
            setResetLoading(false);
            return;
          }
        }
      } catch (valErr) {
        console.warn("Email validation check notice:", valErr);
      }

      // Request server to dispatch 6-digit recovery code via email (No invalid email link!)
      const sendResponse = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, action: "reset" }),
      });
      const sendResult = await sendResponse.json();

      if (sendResponse.ok && sendResult.success) {
        setForgotPasswordStep("verify");
        if (sendResult.demoCode) {
          setDemoCodeNotice(sendResult.demoCode);
          setForgotResetCode(sendResult.demoCode);
          setResetSuccess(`Verification code generated for testing: ${sendResult.demoCode}. (Configure SMTP_HOST, SMTP_USER, SMTP_PASS in Environment Variables to send live emails).`);
        } else {
          setDemoCodeNotice(null);
          setResetSuccess(`A 6-digit verification code has been dispatched directly to ${resetEmail}. Please check your inbox or spam folder.`);
        }
      } else {
        setResetError(sendResult.error || "Failed to trigger recovery code. Verify if this email is registered.");
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      setResetError("Failed to request password recovery. Please try again later.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleForgotVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (forgotResetCode.trim().length !== 6) {
      setResetError("The verification code must be exactly 6 digits.");
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: forgotResetCode.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        if (data.resetToken) {
          setForgotResetToken(data.resetToken);
        }
        setForgotPasswordStep("change");
        setResetSuccess("Code verified successfully! You can now set your new password below.");
      } else {
        setResetError(data.reason || "Invalid verification code. Please check your spelling and try again.");
      }
    } catch (err) {
      console.error("Verification code check error:", err);
      setResetError("Failed to verify code. Please check your network connection.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleForgotResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!forgotNewPassword) {
      setResetError("Please enter a new password.");
      return;
    }

    // Secure password rules validation
    const isMinLength = forgotNewPassword.length >= 8;
    const isUpper = /[A-Z]/.test(forgotNewPassword);
    const isNumber = /[0-9]/.test(forgotNewPassword);
    const isSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(forgotNewPassword);

    if (!isMinLength || !isUpper || !isNumber || !isSymbol) {
      setResetError("Password does not meet the secure strength requirements. Please verify the checklist below.");
      return;
    }

    if (forgotNewPassword !== forgotNewPasswordConfirm) {
      setResetError("The passwords you entered do not match.");
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, password: forgotNewPassword, resetToken: forgotResetToken }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // Password updated in Firebase/Firestore! Switch to Sign In mode.
        setShowForgotPassword(false);
        setIsLogin(true);
        setPassword("");
        setEmail(resetEmail); // Prefill email
        setSuccessMessage("Your account password has been updated successfully! Please sign in with your new password.");
        
        // Reset recovery states
        setForgotPasswordStep("request");
        setResetEmail("");
        setResetSuccess("");
        setResetError("");
        setForgotResetCode("");
        setForgotResetToken("");
        setForgotNewPassword("");
        setForgotNewPasswordConfirm("");
      } else {
        setResetError(data.error || "Failed to update your password. Please try again.");
      }
    } catch (err) {
      console.error("Password change error:", err);
      setResetError("Failed to connect to the password update server. Try again later.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    try {
      setLoading(true);
      setError("");

      // Set persistence based on Remember Me option
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        if (rememberMe) {
          localStorage.setItem("cvcraft_remember_me", "true");
        } else {
          localStorage.removeItem("cvcraft_remember_me");
        }
      } catch (pErr) {
        console.warn("Persistence set warning for Google sign-in:", pErr);
      }

      // Standard Google Auth Provider flow
      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      provider.setCustomParameters({
        prompt: "select_account"
      });

      try {
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        
        if (firebaseUser) {
          let displayName = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Google User";
          const userEmail = firebaseUser.email || "";

          // Cache local user metadata
          const userSession = {
            uid: firebaseUser.uid,
            email: userEmail.toLowerCase(),
            displayName: displayName,
            isPremium: true,
            creationsCount: 0,
            adViews: 0,
            profilePhoto: firebaseUser.photoURL || ""
          };
          localStorage.setItem("cvcraft_local_user", JSON.stringify(userSession));

          // Trigger auth success immediately so user transitions to Dashboard without blocking on Firestore
          setLoading(false);
          onAuthSuccess({
            email: userEmail,
            displayName: displayName
          });

          // Non-blocking Firestore user profile initialization
          const uDocRef = doc(db, "users", firebaseUser.uid);
          getDoc(uDocRef)
            .then((uDoc) => {
              if (!uDoc.exists()) {
                return setDoc(uDocRef, {
                  email: userEmail.toLowerCase(),
                  displayName: displayName,
                  isPremium: true,
                  creationsCount: 0,
                  adViews: 0,
                  profilePhoto: firebaseUser.photoURL || ""
                });
              }
            })
            .catch((docErr) => {
              console.warn("Firestore user background sync status:", docErr);
            });
        }
      } catch (popupErr: any) {
        if (popupErr?.code === "auth/popup-closed-by-user" || popupErr?.code === "auth/cancelled-popup-request") {
          setLoading(false);
          setError("Google sign-in was closed before completion. Tap 'Continue with Google' to try again.");
          return;
        }

        if (popupErr?.code === "auth/unauthorized-domain") {
          setLoading(false);
          const currentDomain = window.location.hostname;
          setError(`Firebase Unauthorized Domain: "${currentDomain}" is not in the Authorized Domains list in Firebase Console. Go to Firebase Console -> Authentication -> Settings -> Authorized domains and add "${currentDomain}".`);
          return;
        }

        if (popupErr?.code === "auth/popup-blocked" || popupErr?.message?.includes("popup")) {
          // If popup is blocked on mobile, fallback to redirect
          await signInWithRedirect(auth, provider);
          return;
        }

        throw popupErr;
      }
    } catch (err: any) {
      console.warn("Google authentication error:", err?.code, err?.message);
      setLoading(false);
      if (err?.code === "auth/unauthorized-domain") {
        const currentDomain = window.location.hostname;
        setError(`Firebase Unauthorized Domain: "${currentDomain}" must be added in Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
      } else if (err?.code === "auth/operation-not-allowed") {
        setError("Google Sign-In is not enabled in Firebase Console. Enable 'Google' under Authentication -> Sign-in method.");
      } else {
        setError(err?.message || "Google sign-in failed. Please try again or use Guest mode.");
      }
    }
  };

  // --- STARTUP / HERO SPLASH LANDING FOR RAHMORA ---
  if (showLanding) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden font-sans">
        {/* Background Visual Effects */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/15 via-slate-950/80 to-slate-950 pointer-events-none" />

        {/* Top Header Navigation */}
        <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between py-5 border-b border-slate-800/80 px-4">
          <RahmoraLogo size="md" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsLogin(true);
                setShowLanding(false);
              }}
              className="text-xs font-bold text-slate-200 hover:text-white px-4 py-2 rounded-xl transition hover:bg-slate-900 border border-slate-800"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setShowLanding(false);
              }}
              className="text-xs font-bold text-white btn-3d-indigo px-5 py-2.5 rounded-xl transition flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Main Hero Showcase */}
        <main className="relative z-10 w-full max-w-4xl mx-auto my-auto text-center py-8 px-4 space-y-7">
          
          {/* Big Standout Rahmora Hero Emblem & Badge */}
          <div className="flex flex-col items-center justify-center gap-4 pt-1">
            <RahmoraLogo size="hero" />
            <RahmoraGlitterBadge className="mt-1" />
          </div>

          {/* Hero Headline */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-display tracking-tight leading-[1.15]">
              Build ATS-Optimized Resumes with <span className="brand-fancy-title bg-gradient-to-r from-teal-300 via-indigo-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(45,212,191,0.35)]">Rahmora</span>
            </h1>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
              Create executive resumes, generate tailored cover letters, and unlock personalized interview prep in minutes.
            </p>
          </div>

          {/* Live Interactive Real Example Pictures Slideshow */}
          <ServiceShowcaseSlideshow />

          {/* Primary Action Row with 3D Tactile Buttons */}
          <div className="pt-3 flex flex-col items-center justify-center gap-3">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  setIsLogin(false);
                  setShowLanding(false);
                }}
                className="w-full sm:w-auto px-8 py-3.5 btn-3d-indigo text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIsLogin(true);
                  setShowLanding(false);
                }}
                className="w-full sm:w-auto px-7 py-3.5 btn-3d-slate text-slate-100 font-bold text-xs rounded-xl transition flex items-center justify-center shadow-lg border border-slate-700 hover:border-slate-500"
              >
                <span>Sign In to Your Account</span>
              </button>
            </div>

            {/* High Contrast Prominent Guest Access Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  onAuthSuccess({
                    email: "guest@cvcraft.ai",
                    displayName: "Guest Explorer"
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-emerald-500/40 hover:border-emerald-400 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-all flex items-center gap-2 shadow-md hover:shadow-emerald-950/40"
              >
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Explore Free Editor as Guest (No Sign In Required)</span>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 w-full max-w-6xl mx-auto text-center py-4 border-t border-slate-800 text-xs text-slate-400 font-mono">
          &copy; {new Date().getFullYear()} RAHMORA. All rights reserved. Empowering global careers.
        </footer>
      </div>
    );
  }

  // --- REGISTRATION CODE VERIFICATION SCREEN ---
  if (showVerification) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Visual Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white font-display">Verify Your Email</h2>
            <p className="text-slate-400 text-xs mt-1.5 px-4">
              A 6-digit verification code has been dispatched to your email address:
            </p>
            <span className="text-indigo-400 font-mono font-semibold text-xs bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-1 rounded-lg mt-1.5">
              {email}
            </span>
          </div>

          {demoCodeNotice ? (
            <div className="mb-6 p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-2 text-left animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Verification Code Notice</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                SMTP credentials are not yet configured in Environment Variables. Your 6-digit code for testing is:{" "}
                <span className="font-mono font-black text-amber-300 text-sm bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/60">
                  {demoCodeNotice}
                </span>
              </p>
              <p className="text-[10px] text-amber-300/70 border-t border-amber-900/50 pt-1.5">
                💡 To send real live emails directly to user inboxes, add <code className="text-amber-200 font-mono">SMTP_HOST</code>, <code className="text-amber-200 font-mono">SMTP_USER</code>, and <code className="text-amber-200 font-mono">SMTP_PASS</code> in your project Secrets or environment variables.
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-indigo-950/30 border border-indigo-900/50 rounded-xl space-y-1 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Email Code Sent</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Please check your inbox or spam folder for the 6-digit code.
              </p>
            </div>
          )}

          {verificationError && (
            <div className="mb-5 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{verificationError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyCodeSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-lg font-mono font-black text-white placeholder-slate-800 focus:outline-none focus:border-indigo-500 tracking-widest transition"
                required
                autoFocus
              />
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className="text-indigo-400 hover:text-indigo-300 font-bold disabled:text-slate-600 transition"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Verification Code"}
                </button>
              </div>
              {resendMsg && (
                <p className="text-[11px] text-emerald-400 text-center font-medium animate-pulse">{resendMsg}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowVerification(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/10"
              >
                {loading ? "Verifying..." : "Verify & Register"}
                {!loading && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- FORGOT PASSWORD RECOVERY SCREEN ---
  if (showForgotPassword) {
    const isForgotMinLength = forgotNewPassword.length >= 8;
    const isForgotUpper = /[A-Z]/.test(forgotNewPassword);
    const isForgotNumber = /[0-9]/.test(forgotNewPassword);
    const isForgotSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(forgotNewPassword);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Visual Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/5">
              {forgotPasswordStep === "request" && <Mail className="h-6 w-6" />}
              {forgotPasswordStep === "verify" && <Lock className="h-6 w-6" />}
              {forgotPasswordStep === "change" && <ShieldCheck className="h-6 w-6" />}
            </div>
            <h2 className="text-xl font-bold text-white font-display">
              {forgotPasswordStep === "request" && "Recover Password"}
              {forgotPasswordStep === "verify" && "Enter Security Code"}
              {forgotPasswordStep === "change" && "Set New Password"}
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 px-4">
              {forgotPasswordStep === "request" && "Enter your registered email address below, and we will send you a 6-digit code to reset your account password."}
              {forgotPasswordStep === "verify" && "Enter the 6-digit verification code sent to your email address to confirm your account identity."}
              {forgotPasswordStep === "change" && "Choose a secure new password that meets the safety requirements below."}
            </p>
          </div>

          {resetSuccess && (
            <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200 animate-slide-up">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {resetError && (
            <div className="mb-5 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-200 animate-slide-up">
              <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{resetError}</span>
            </div>
          )}

          {/* STEP 1: REQUEST CODE */}
          {forgotPasswordStep === "request" && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSuccess("");
                    setResetError("");
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
                </button>
                
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/10"
                >
                  {resetLoading ? "Sending..." : "Send Code to Email"}
                  {!resetLoading && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY CODE */}
          {forgotPasswordStep === "verify" && (
            <form onSubmit={handleForgotVerifyCodeSubmit} className="space-y-5">
              {demoCodeNotice && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-1.5 text-left animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Recovery Code Generated</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Your 6-digit recovery code is:{" "}
                    <span className="font-mono font-black text-amber-300 text-sm bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/60">
                      {demoCodeNotice}
                    </span>
                  </p>
                  <p className="text-[10px] text-amber-300/70 border-t border-amber-900/50 pt-1">
                    💡 Configure <code className="text-amber-200 font-mono">SMTP_HOST</code>, <code className="text-amber-200 font-mono">SMTP_USER</code>, and <code className="text-amber-200 font-mono">SMTP_PASS</code> in project Secrets for live inbox delivery.
                  </p>
                </div>
              )}
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-semibold text-slate-300 block text-left mb-1">Enter 6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={forgotResetCode}
                  onChange={(e) => setForgotResetCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 text-center text-xl font-mono font-black text-white placeholder-slate-800 focus:outline-none focus:border-indigo-500 tracking-widest transition"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordStep("request");
                    setResetSuccess("");
                    setResetError("");
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Email
                </button>
                
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/10"
                >
                  {resetLoading ? "Verifying..." : "Verify Code"}
                  {!resetLoading && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CHANGE PASSWORD */}
          {forgotPasswordStep === "change" && (
            <form onSubmit={handleForgotResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Choose New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={forgotNewPasswordConfirm}
                    onChange={(e) => setForgotNewPasswordConfirm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Password Quality Checklist */}
              <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-[11px] animate-fade-in">
                <p className="font-semibold text-slate-400 mb-1">Required Password Format Check:</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isForgotMinLength ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                    <span className={isForgotMinLength ? "text-emerald-400 font-medium" : "text-slate-500"}>Min. 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isForgotUpper ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                    <span className={isForgotUpper ? "text-emerald-400 font-medium" : "text-slate-500"}>1 uppercase (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isForgotNumber ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                    <span className={isForgotNumber ? "text-emerald-400 font-medium" : "text-slate-500"}>1 number (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isForgotSymbol ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                    <span className={isForgotSymbol ? "text-emerald-400 font-medium" : "text-slate-500"}>1 symbol (!@#$..)</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/10"
                >
                  {resetLoading ? "Updating..." : "Save Password & Sign In"}
                  {!resetLoading && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  }

  // --- SIGN IN / SIGN UP FORM ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background visual effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Top Back to Landing button */}
        <button
          onClick={() => setShowLanding(true)}
          className="mb-4 text-xs text-slate-300 hover:text-white transition flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Rahmora Intro
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <RahmoraLogo size="lg" className="mb-2" />
          <h2 className="text-xl font-bold text-white font-display mt-1">
            {isLogin ? "Welcome to Rahmora" : "Create Rahmora Account"}
          </h2>
          <p className="text-slate-300 text-xs mt-1 text-center font-normal">
            {isLogin
              ? "Sign in to access your career intelligence suite & resume builder"
              : "Register to unlock executive CV crafting and regional career insights"}
          </p>
        </div>

        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (error.includes("Unauthorized Domain") || error.includes("unauthorized-domain")) ? (
          <div className="mb-5 p-4 bg-amber-950/40 border border-amber-500/50 rounded-2xl space-y-3.5 text-xs text-amber-100 shadow-xl shadow-amber-950/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-200 text-sm">
                  Firebase Authorized Domain Required
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Google OAuth blocks sign-ins from domains not registered in your Firebase project.
                </p>
              </div>
            </div>

            {/* Current Domain Box with One-Click Copy */}
            <div className="p-2.5 bg-slate-950/90 rounded-xl border border-amber-700/50 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-amber-300 truncate select-all">
                {window.location.hostname}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.hostname);
                  setCopiedDomain(true);
                  setTimeout(() => setCopiedDomain(false), 2500);
                }}
                className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded-lg text-[10px] font-bold border border-amber-700/60 flex items-center gap-1 shrink-0 transition cursor-pointer"
              >
                {copiedDomain ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedDomain ? "Copied!" : "Copy Domain"}</span>
              </button>
            </div>

            {/* 3-Step Walkthrough */}
            <div className="text-[11px] text-amber-300/90 space-y-1.5 bg-amber-950/30 p-3 rounded-xl border border-amber-900/40">
              <div className="font-semibold text-amber-200">How to authorize this domain (15 seconds):</div>
              <div className="space-y-1 text-slate-300 pl-1">
                <div>1. Open <strong className="text-white">Firebase Console</strong> &rarr; Project: <code className="text-amber-300 font-mono">rahmora-37199</code></div>
                <div>2. Go to <strong className="text-white">Authentication</strong> &rarr; <strong className="text-white">Settings</strong> tab &rarr; <strong className="text-white">Authorized domains</strong></div>
                <div>3. Click <strong className="text-white">Add domain</strong>, paste <code className="text-amber-300 font-mono">{window.location.hostname}</code>, and click <strong className="text-white">Save</strong>.</div>
              </div>
            </div>

            {/* Direct Console Link and Immediate Guest Bypass */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href="https://console.firebase.google.com/project/rahmora-37199/authentication/settings"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Firebase Settings</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  onAuthSuccess({
                    email: "guest@cvcraft.ai",
                    displayName: "Guest Explorer"
                  });
                }}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Enter as Guest (No Wait)</span>
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="mb-5 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2 text-xs text-rose-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {(error.includes("Google") || error.includes("popup") || error.includes("account")) && (
              <div className="pt-2 border-t border-rose-800/40">
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  className="w-full py-2 px-3 btn-3d-slate text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.4 13a5.53 5.53 0 0 1 5.59-5.514c2.273 0 4.187 1.258 5.178 3.097l3.712-2.885C20.627 4.17 17.51 2 13.99 2 7.92 2 3 6.92 3 13s4.92 11 10.99 11c6.23 0 11.01-4.383 11.01-11 0-.743-.06-1.458-.174-2.115H12.24Z"
                    />
                  </svg>
                  <span>Retry Google Sign-In</span>
                </button>
              </div>
            )}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgotPassword(true);
                    setForgotPasswordStep("request");
                    setResetSuccess("");
                    setResetError("");
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Validation Checklist (Active Indicators) */}
            {!isLogin && (
              <div className="mt-2 p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-[11px]">
                <p className="font-semibold text-slate-400 mb-1">Required Password Format:</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isMinLength ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                    <span className={isMinLength ? "text-emerald-400 font-medium" : "text-slate-500"}>Min. 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isUpper ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                    <span className={isUpper ? "text-emerald-400 font-medium" : "text-slate-500"}>1 uppercase (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isNumber ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                    <span className={isNumber ? "text-emerald-400 font-medium" : "text-slate-500"}>1 number (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isSymbol ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                    <span className={isSymbol ? "text-emerald-400 font-medium" : "text-slate-500"}>1 symbol (!@#$..)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isLogin ? (
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs text-slate-400">Remember me</span>
              </label>
            </div>
          ) : (
            <div className="flex items-start gap-2 py-1">
              <input
                type="checkbox"
                id="accept-terms-checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                required
              />
              <label htmlFor="accept-terms-checkbox" className="text-xs text-slate-400 select-none">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => alert("Terms of Service: RAHMORA protects your data with end-to-end encryption and respects user privacy.")}
                  className="text-indigo-400 underline font-medium"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => alert("Privacy Policy: We never sell or share your personal profile data with third parties.")}
                  className="text-indigo-400 underline font-medium"
                >
                  Privacy Policy
                </button>
                .
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl btn-3d-indigo disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2 mt-6"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register with Email Verification"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center justify-between gap-3 text-slate-600">
          <div className="h-[1px] bg-slate-800 w-full" />
          <span className="text-[10px] font-mono tracking-widest uppercase">OR</span>
          <div className="h-[1px] bg-slate-800 w-full" />
        </div>

        {/* Social Sign In Stack */}
        <div className="mb-6 space-y-2.5">
          {/* Google Sign In Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignInClick}
            className="w-full py-3 px-4 rounded-xl btn-3d-slate hover:border-slate-600 disabled:opacity-50 text-slate-100 text-sm font-bold transition flex items-center justify-center gap-3 shadow-md"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLogin ? "Continue with Google" : "Sign up with Google"}</span>
          </button>
        </div>

        {/* Auth Mode Toggle */}
        <p className="text-center text-xs text-slate-300 font-medium">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccessMessage("");
            }}
            className="text-indigo-400 hover:text-indigo-300 transition font-bold underline underline-offset-2 ml-1"
          >
            {isLogin ? "Create one free" : "Sign in here"}
          </button>
        </p>

        {/* Free Guest Mode Option with High Contrast & Clear Tactile Finish */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              onAuthSuccess({
                email: "guest@cvcraft.ai",
                displayName: "Guest Explorer"
              });
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-850 border border-emerald-500/50 hover:border-emerald-400 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-950/50 active:scale-[0.99]"
          >
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Continue as Guest (No Account Required)</span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          </button>
          <p className="text-[11px] text-slate-300 mt-2 font-normal">
            Instant access to create and export resumes without signing up.
          </p>
        </div>
      </div>
    </div>
  );
}
