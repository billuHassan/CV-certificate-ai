import React, { useState } from "react";
import { Sparkles, Mail, Lock, User, ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!isLogin && !name) {
      setError("Please provide your name.");
      return;
    }

    if (!isLogin) {
      const hasMinLength = password.length >= 8;
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!hasMinLength || !hasUpper || !hasNumber || !hasSymbol) {
        setError("Password does not meet all the security requirements.");
        return;
      }
    } else {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    
    try {
      // Validate email syntax & domain validity on the server using AI Reputation Engine
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

      // Simulate authentication completion
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess({
          email: email,
          displayName: isLogin ? email.split("@")[0] : name,
        });
      }, 1200);
    } catch (err: any) {
      console.error(err);
      // Fail-safe graceful fallback if endpoint fails
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess({
          email: email,
          displayName: isLogin ? email.split("@")[0] : name,
        });
      }, 1000);
    }
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess({
        email: "demo.user@gmail.com",
        displayName: "Google User",
      });
    }, 1000);
  };

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
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => alert("Password reset link simulated to your email.")}
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {!isLogin && (
              <div className="mt-2 p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5 text-[11px]">
                <p className="font-semibold text-slate-400 mb-1">Password requirements:</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${password.length >= 8 ? "bg-emerald-400" : "bg-slate-600"}`} />
                    <span className={password.length >= 8 ? "text-slate-300" : "text-slate-500"}>Min. 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${/[A-Z]/.test(password) ? "bg-emerald-400" : "bg-slate-600"}`} />
                    <span className={/[A-Z]/.test(password) ? "text-slate-300" : "text-slate-500"}>1 uppercase (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${/[0-9]/.test(password) ? "bg-emerald-400" : "bg-slate-600"}`} />
                    <span className={/[0-9]/.test(password) ? "text-slate-300" : "text-slate-500"}>1 number (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-emerald-400" : "bg-slate-600"}`} />
                    <span className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-slate-300" : "text-slate-500"}>1 special symbol</span>
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
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register Now"}
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
          onClick={handleGoogleSignIn}
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
    </div>
  );
}
