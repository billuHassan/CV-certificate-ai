import React, { useState } from "react";
import { Download, Share2, PlusSquare, X, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallButtonProps {
  className?: string;
  variant?: "primary" | "outline" | "compact";
}

export default function PWAInstallButton({
  className = "",
  variant = "primary",
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running in standalone mode as installed PWA, suppress
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3000);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === "compact") {
      return (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 cursor-pointer shadow-xs ${className}`}
          title="Install CVCraft AI on desktop or home screen"
        >
          {installSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Installed!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </>
          )}
        </button>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:brightness-110 active:scale-95 transition cursor-pointer ${className}`}
      >
        {installSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Installed to Home Screen!</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Install Offline App</span>
          </>
        )}
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not fired by iOS WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-slate-900/80 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer ${className}`}
        >
          <Share2 className="w-3.5 h-3.5 text-teal-400" />
          <span>Add to iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-display">Install CVCraft AI on iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>Enjoy offline resume editing directly from your iPhone or iPad home screen:</p>
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded text-[11px]">1</span>
                    <span>Tap the <strong>Share</strong> icon (<Share2 className="w-3.5 h-3.5 inline text-sky-400" />) in the Safari bottom toolbar.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded text-[11px]">2</span>
                    <span>Scroll down and select <strong>Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded text-[11px]">3</span>
                    <span>Tap <strong>Add</strong> in the top right corner.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
