import React, { useState } from "react";
import { Sparkles, Mail, Lock, User, ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";

interface AuthProps {
  onAuthSuccess: (user: { email: string; displayName: string }) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Email verification flow states
  const [showVerification, setShowVerification] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [simulatedCode, setSimulatedCode] = useState("");
  const [verificationError, setVerificationError] = useState("");

  // Google Sign-In simulation states
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [showGoogleCustomInput, setShowGoogleCustomInput] = useState(false);

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

    // Strict Password Validation Check during Registration
    if (!isLogin) {
      if (!isMinLength) {
        setError("Your password is too short. It must obtain a proper length of at least 8 characters.");
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
      
      const valResult = await response.json();
      if (valResult && valResult.isValid === false) {
        setError(valResult.reason || "The provided email address is invalid or has been flagged.");
        setLoading(false);
        return;
      }

      if (!isLogin) {
        // 2. REGISTRATION MODE: Request server to generate secure verification code
        const sendResponse = await fetch("/api/auth/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const sendResult = await sendResponse.json();
        
        setLoading(false);
        if (sendResult.success) {
          setSimulatedCode(sendResult.code || "");
          setShowVerification(true);
        } else {
          setError(sendResult.error || "Failed to trigger secure verification code. Please try again.");
        }
      } else {
        // 3. LOGIN MODE: Complete authentication immediately
        setTimeout(() => {
          setLoading(false);
          onAuthSuccess({
            email: email,
            displayName: email.split("@")[0],
          });
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected authentication server error occurred. Please try again.");
      setLoading(false);
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
      setLoading(false);

      if (data.success) {
        onAuthSuccess({
          email,
          displayName: name || email.split("@")[0],
        });
      } else {
        setVerificationError(data.reason || "Invalid verification code. Please check your code and try again.");
      }
    } catch (err) {
      console.error(err);
      setVerificationError("Server connection error during code verification.");
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    setShowGoogleChooser(true);
  };

  const handleSelectGoogleAccount = (gmail: string, displayName: string) => {
    setLoading(true);
    setShowGoogleChooser(false);
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess({
        email: gmail,
        displayName: displayName,
      });
    }, 1000);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.includes("@gmail.com")) {
      alert("Please enter a valid Google Mail account (must end with @gmail.com).");
      return;
    }
    const derivedName = customGoogleName.trim() || customGoogleEmail.split("@")[0];
    handleSelectGoogleAccount(customGoogleEmail.trim(), derivedName);
  };

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
              We have securely generated a 6-digit verification code for your email address:
            </p>
            <span className="text-indigo-400 font-mono font-semibold text-xs bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-1 rounded-lg mt-1.5">
              {email}
            </span>
          </div>

          {/* Copyable code simulation box for sandbox env */}
          {simulatedCode && (
            <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-500" />
                DEVELOPMENT SANDBOX SIMULATOR
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In this container environment, external SMTP mail servers are disabled by default. We have generated and captured your verification code:
              </p>
              <div className="flex items-center justify-between bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-800 mt-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Your Code:</span>
                <span className="text-amber-400 font-mono font-black text-sm tracking-wider select-all cursor-pointer">
                  {simulatedCode}
                </span>
              </div>
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background visual effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/5">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white font-display">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-slate-400 text-xs mt-1 text-center">
            {isLogin
              ? "Sign in to resume building your professional CVs"
              : "Register to craft high-impact resumes with Google Gemini"}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

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
                  onClick={() => alert("Password reset code simulated to your email. Check server terminal logs if offline.")}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
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

          {isLogin && (
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
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 mt-6"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register with Verification"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center justify-between gap-3 text-slate-600">
          <div className="h-[1px] bg-slate-800 w-full" />
          <span className="text-[10px] font-mono tracking-widest uppercase">OR</span>
          <div className="h-[1px] bg-slate-800 w-full" />
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignInClick}
          className="w-full py-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-200 text-sm font-semibold transition flex items-center justify-center gap-2.5 mb-6"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.4 13a5.53 5.53 0 0 1 5.59-5.514c2.273 0 4.187 1.258 5.178 3.097l3.712-2.885C20.627 4.17 17.51 2 13.99 2 7.92 2 3 6.92 3 13s4.92 11 10.99 11c6.23 0 11.01-4.383 11.01-11 0-.743-.06-1.458-.174-2.115H12.24Z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Auth Mode Toggle */}
        <p className="text-center text-xs text-slate-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 hover:text-indigo-300 transition font-bold"
          >
            {isLogin ? "Create one free" : "Sign in here"}
          </button>
        </p>
      </div>

      {/* --- GOOGLE ACCOUNT CHOOSER DIALOG --- */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            
            {/* Top Close Button */}
            <button
              onClick={() => {
                setShowGoogleChooser(false);
                setShowGoogleCustomInput(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition text-xs font-semibold"
            >
              Cancel
            </button>

            {/* Google Logo Header */}
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <svg className="h-8 w-8 mb-2.5" viewBox="0 0 24 24">
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
              <h3 className="text-sm font-bold text-slate-100 font-display">Sign in with Google</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">to continue securely to CVCraft AI</p>
            </div>

            {!showGoogleCustomInput ? (
              <div className="space-y-2.5">
                {/* Account list */}
                <button
                  onClick={() => handleSelectGoogleAccount("bilalhassanmussa@gmail.com", "Bilal Hassan Mussa")}
                  className="w-full p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl text-left flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[11px] border border-amber-500/20 flex items-center justify-center shrink-0">
                      B
                    </div>
                    <div className="truncate text-xs">
                      <span className="font-bold text-slate-200 block truncate">Bilal Hassan Mussa</span>
                      <span className="text-slate-500 block truncate text-[10px]">bilalhassanmussa@gmail.com</span>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                </button>

                <button
                  onClick={() => handleSelectGoogleAccount("demo.user@gmail.com", "Demo User")}
                  className="w-full p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl text-left flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-[11px] border border-indigo-500/20 flex items-center justify-center shrink-0">
                      D
                    </div>
                    <div className="truncate text-xs">
                      <span className="font-bold text-slate-200 block truncate">Demo User</span>
                      <span className="text-slate-500 block truncate text-[10px]">demo.user@gmail.com</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowGoogleCustomInput(true)}
                  className="w-full py-2.5 hover:bg-slate-950/40 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl text-center text-xs text-indigo-400 font-semibold transition mt-2 block"
                >
                  + Use Another Google Account
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Google Email</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Display Name</label>
                  <input
                    type="text"
                    placeholder="Google User"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2.5">
                  <button
                    type="button"
                    onClick={() => setShowGoogleCustomInput(false)}
                    className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                  >
                    Authenticate
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
