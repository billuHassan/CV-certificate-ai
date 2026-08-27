import React, { useState, useEffect } from "react";
import { X, Award, Shield, Sparkles, AlertCircle, RefreshCw, Star, CreditCard, Wallet, Landmark, Lock, Check } from "lucide-react";

interface AdSystemProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

// Global hook/state manager for Interstitials and Rewarded Ads
let triggerInterstitialGlobal: ((onClose?: () => void) => void) | null = null;
let triggerRewardedGlobal: ((onRewardSuccess: () => void) => void) | null = null;

export const triggerInterstitial = (onClose?: () => void) => {
  if (triggerInterstitialGlobal) {
    triggerInterstitialGlobal(onClose);
  } else {
    onClose?.();
  }
};

export const triggerRewarded = (onRewardSuccess: () => void) => {
  if (triggerRewardedGlobal) {
    triggerRewardedGlobal(onRewardSuccess);
  } else {
    // If ad system is not mounted yet, just grant reward
    onRewardSuccess();
  }
};

export function AdProvider({ children, isPremium, onUpgrade }: { children: React.ReactNode; isPremium: boolean; onUpgrade: () => void }) {
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showRewarded, setShowRewarded] = useState(false);
  const [interstitialTimer, setInterstitialTimer] = useState(5);
  const [rewardedTimer, setRewardedTimer] = useState(8);
  const [activeAd, setActiveAd] = useState<{ title: string; brand: string; description: string; cta: string } | null>(null);
  
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | null>(null);
  const [onRewardCallback, setOnRewardCallback] = useState<(() => void) | null>(null);

  const adCampaigns = [
    { brand: "HostGator", title: "Launch Your Portfolio Today", description: "Get 60% off high-speed cloud hosting with free SSL & domain registration.", cta: "Claim Offer" },
    { brand: "Figma Pro", title: "Collaborate in Real-Time", description: "Design, prototype, and gather client feedback with professional design tools.", cta: "Start Free Trial" },
    { brand: "Coursera", title: "Get Certified by Google", description: "Learn data science, digital marketing, or project management from world-class industry experts.", cta: "Enroll Now" },
    { brand: "NordVPN", title: "Encrypt Your Internet Flow", description: "Secure your online identity and browse safely from public Wi-Fi networks.", cta: "Protect My Connection" },
  ];

  useEffect(() => {
    triggerInterstitialGlobal = (onClose?: () => void) => {
      if (isPremium) {
        onClose?.();
        return;
      }
      const randomAd = adCampaigns[Math.floor(Math.random() * adCampaigns.length)];
      setActiveAd(randomAd);
      setOnCloseCallback(() => onClose || null);
      setInterstitialTimer(5);
      setShowInterstitial(true);
    };

    triggerRewardedGlobal = (onRewardSuccess: () => void) => {
      // Execute the AI action immediately so user features are fast and responsive
      onRewardSuccess();
    };

    return () => {
      triggerInterstitialGlobal = null;
      triggerRewardedGlobal = null;
    };
  }, [isPremium]);

  // Interstitial Countdown
  useEffect(() => {
    let interval: any;
    if (showInterstitial && interstitialTimer > 0) {
      interval = setInterval(() => {
        setInterstitialTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showInterstitial, interstitialTimer]);

  // Rewarded Countdown
  useEffect(() => {
    let interval: any;
    if (showRewarded && rewardedTimer > 0) {
      interval = setInterval(() => {
        setRewardedTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showRewarded, rewardedTimer]);

  const closeInterstitial = () => {
    setShowInterstitial(false);
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  const closeRewarded = () => {
    if (rewardedTimer > 0) {
      // User is trying to close before reward time is reached
      if (!confirm("Are you sure you want to close? You will lose your premium unlock reward!")) {
        return;
      }
      setShowRewarded(false);
    } else {
      setShowRewarded(false);
      if (onRewardCallback) {
        onRewardCallback();
      }
    }
  };

  return (
    <div className="relative min-h-screen">
      {children}

      {/* --- INTERSTITIAL AD MODAL --- */}
      {showInterstitial && activeAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md no-print">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-mono tracking-widest text-emerald-400 bg-emerald-950 px-2 py-1 rounded">
                SPONSORED ADVERTISEMENT
              </span>
              {interstitialTimer > 0 ? (
                <span className="text-xs font-mono text-slate-400">
                  Close in {interstitialTimer}s
                </span>
              ) : (
                <button
                  onClick={closeInterstitial}
                  className="rounded-full bg-slate-800 p-1 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Ad Content */}
            <div className="my-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-4">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white mb-2 font-display">
                {activeAd.title}
              </h3>
              <p className="text-sm font-mono text-emerald-400 mb-4 uppercase tracking-wide">
                by {activeAd.brand}
              </p>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
                {activeAd.description}
              </p>

              <div className="flex flex-col gap-3">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Redirecting you to ${activeAd.brand}...`);
                  }}
                  className="inline-flex w-full justify-center items-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/15"
                >
                  {activeAd.cta}
                </a>
                <button
                  onClick={onUpgrade}
                  className="text-xs text-slate-400 hover:text-white transition underline"
                >
                  Go Premium to permanently remove advertisements
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- REWARDED AD MODAL --- */}
      {showRewarded && activeAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md no-print">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tracking-widest text-amber-400 bg-amber-950 px-2 py-1 rounded">
                  WATCH AD TO UNLOCK
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {rewardedTimer > 0 ? (
                  `Reward unlocking in ${rewardedTimer}s`
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold">
                    <Star className="h-4 w-4 fill-amber-400" /> Reward Ready!
                  </span>
                )}
              </span>
            </div>

            {/* Video Simulator Container */}
            <div className="my-6 rounded-xl border border-slate-800 bg-slate-950/80 p-6 text-center">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/30">
                <RefreshCw className="h-10 w-10 animate-spin" />
                <span className="absolute text-xs font-bold font-mono">{rewardedTimer > 0 ? rewardedTimer : "✔"}</span>
              </div>
              <div className="space-y-1 mb-4">
                <h4 className="text-lg font-bold text-white font-display">{activeAd.brand} Presents</h4>
                <p className="text-sm text-slate-300 font-medium">{activeAd.title}</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">{activeAd.description}</p>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => alert("Visiting sponsor site...")}
                  className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  Visit Sponsor
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={closeRewarded}
                disabled={rewardedTimer > 0}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  rewardedTimer > 0
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10"
                }`}
              >
                {rewardedTimer > 0 ? `Unlocks in ${rewardedTimer}s...` : "Claim My Unlock Reward"}
              </button>
              <button
                onClick={() => {
                  setShowRewarded(false);
                  onUpgrade();
                }}
                className="text-xs text-slate-400 hover:text-white transition underline"
              >
                Upgrade to Premium for immediate access without Ads
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- BANNER AD COMPONENT ---
export function BannerAd({ onUpgrade }: { onUpgrade: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [showAdSenseSetup, setShowAdSenseSetup] = useState(false);
  
  // Dynamic AdSense Publisher ID from localStorage
  const [adsensePubId, setAdsensePubId] = useState(() => {
    return localStorage.getItem("cvcraft_adsense_pub_id") || "ca-pub-1642294829104829";
  });

  const [scriptInjected, setScriptInjected] = useState(() => {
    return !!document.querySelector('script[src*="pagead2.googlesyndication.com"]');
  });

  useEffect(() => {
    // Check if script is already present in document
    const checkScript = () => {
      setScriptInjected(!!document.querySelector('script[src*="pagead2.googlesyndication.com"]'));
    };
    checkScript();
    const interval = setInterval(checkScript, 2000);
    return () => clearInterval(interval);
  }, []);

  // Dynamically initialize the adsbygoogle array push for the rendered slot
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn("AdSense push skipped or blocked (expected in dev sandbox/adblockers):", e);
    }
  }, [adsensePubId]);

  const handleSaveAndInject = () => {
    if (!adsensePubId.trim().startsWith("ca-pub-")) {
      alert("Please enter a valid Google AdSense Publisher ID starting with 'ca-pub-'.");
      return;
    }

    // Save to local storage (syncs with AdminPanel config)
    localStorage.setItem("cvcraft_adsense_pub_id", adsensePubId.trim());

    // Remove any previous AdSense script tags to avoid duplication
    const oldScripts = document.querySelectorAll('script[src*="pagead2.googlesyndication.com"]');
    oldScripts.forEach((el) => el.remove());

    // Inject live script tag into document head
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePubId.trim()}`;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    setScriptInjected(true);
    alert(`Google AdSense Config Saved & Injected!\n\n• Publisher ID: ${adsensePubId.trim()}\n• Status: SCRIPT INJECTED LIVE\n\nAdSense has been dynamically loaded into CVCraft's global context!`);
  };

  if (hidden) return null;

  return (
    <div className="w-full space-y-3 no-print">
      {/* Live Google AdSense Responsive Unit */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-md overflow-hidden">
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-wider bg-emerald-950 border border-emerald-800 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-semibold">
              Live Sponsor Ad
            </span>
            <span className="text-[11px] text-slate-400 font-mono">AdSense Client ID: {adsensePubId}</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setShowAdSenseSetup(true)}
              className="px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-amber-500 text-amber-400 text-[10px] rounded transition flex items-center gap-1"
            >
              🪙 Change Pub ID
            </button>
            <button
              onClick={onUpgrade}
              className="text-slate-400 hover:text-amber-400 text-[10px] flex items-center gap-1 font-medium transition"
            >
              <Award className="h-3 w-3" /> Go Premium (Remove Ads)
            </button>
            <button
              onClick={() => setHidden(true)}
              className="text-slate-500 hover:text-slate-300 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Real AdSense HTML Component with fallback styling */}
        <div className="w-full min-h-[90px] bg-slate-950/60 rounded-lg flex items-center justify-center overflow-hidden border border-slate-850 relative">
          <ins className="adsbygoogle"
               style={{ display: "block", width: "100%", height: "90px" }}
               data-ad-client={adsensePubId}
               data-ad-slot="9842104829"
               data-ad-format="horizontal"
               data-full-width-responsive="true"></ins>
          
          {/* Backup dynamic sponsorship content if ad blockers block Google domain */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-3 bg-slate-950/40 z-[-1]">
            <Sparkles className="h-4 w-4 text-emerald-500 mb-1" />
            <span className="text-[11px] font-bold text-slate-200">HostGator High-Speed Cloud Hosting</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Build your portfolio website with free domains & fast SSDs. Starting at $1.99/mo!</span>
          </div>
        </div>
      </div>

      {/* Interactive Google Ads Setup Modal Overlay */}
      {showAdSenseSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪙</span>
                <h3 className="text-lg font-bold font-display text-white">Google AdSense Integration Center</h3>
              </div>
              <button
                onClick={() => setShowAdSenseSetup(false)}
                className="rounded-full bg-slate-900 p-1.5 text-slate-400 hover:text-white transition border border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Instruction Body */}
            <div className="my-5 space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 block uppercase">
                  ⚙️ Configure Your Google Publisher Account
                </span>
                
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enter your Google AdSense Publisher ID below. We will dynamically compile the appropriate scripts and update your client template in real time.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-medium">Your Publisher ID (ca-pub-xxxxxxxxxxxxxxxx)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={adsensePubId}
                      onChange={(e) => setAdsensePubId(e.target.value)}
                      placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveAndInject}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1 shrink-0 shadow"
                    >
                      <Check className="h-3.5 w-3.5" /> Save & Inject
                    </button>
                  </div>
                </div>

                {/* Injection status badge */}
                <div className="flex items-center justify-between text-[10px] bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-850">
                  <span className="text-slate-400">Client Injection Status:</span>
                  {scriptInjected ? (
                    <span className="text-emerald-400 font-bold font-mono flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> SCRIPT INJECTED (ACTIVE)
                    </span>
                  ) : (
                    <span className="text-amber-500 font-bold font-mono flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> NOT INJECTED YET
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Dynamic AdSense Script Code
                </h4>
                <p>
                  This is the script tag that is now dynamically injected into the head of your document for this session:
                </p>
                <pre className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-[10px] text-amber-300 font-mono overflow-x-auto whitespace-pre">
{`<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePubId}"
  crossorigin="anonymous"
></script>`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> React Responsive Ad Unit Code
                </h4>
                <p>
                  Copy this exact template to place ads inside headers, dashboards, or download panels:
                </p>
                <pre className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-[10px] text-amber-300 font-mono overflow-x-auto whitespace-pre">
{`<ins className="adsbygoogle"
     style={{ display: "block" }}
     data-ad-client="${adsensePubId}"
     data-ad-slot="YOUR_SLOT_ID"
     data-ad-format="auto"
     data-full-width-responsive="true" />
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Step 3: Configure ads.txt & Payout Methods
                </h4>
                <p>
                  To complete configuration of your Google Publisher Account:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-400">
                  <li>Place an <code>ads.txt</code> in the public/ folder with the text: <code className="bg-slate-900 text-amber-400 px-1 py-0.5 rounded font-mono">google.com, pub-xxxxxxxxxxxxxxxx, DIRECT, f08c47fec0942fa0</code> (replacing pub-X with your publisher numbers).</li>
                  <li>In your Google AdSense Account, go to <strong>Payments &gt; Payments info</strong> and set your Touch 'n Go, Direct Bank, or PayPal wire details to receive direct deposits once your earnings clear!</li>
                </ul>
              </div>
            </div>

            {/* Footer Close */}
            <div className="border-t border-slate-800 pt-4 flex justify-end">
              <button
                onClick={() => setShowAdSenseSetup(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PREMIUM UPGRADE MODAL ---
export function PremiumModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [paymentTab, setPaymentTab] = useState<"paypal" | "tng" | "bank">("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  
  // Dynamic Owner credentials from localStorage (filled via Admin portal)
  const ownerBankName = localStorage.getItem("cvcraft_direct_bank_name") || "Maybank";
  const ownerBankAccountHolder = localStorage.getItem("cvcraft_direct_bank_acc_name") || "Bilal Hassan Mussa";
  const ownerBankAccountNumber = localStorage.getItem("cvcraft_direct_bank_acc_num") || "164229482910";
  const ownerTngPhone = localStorage.getItem("cvcraft_direct_tng_num") || "+60 11-3965 2948";
  const ownerTngName = localStorage.getItem("cvcraft_direct_tng_name") || "Bilal Hassan Mussa";

  // Customer Input Fields (Bank)
  const [customerBankName, setCustomerBankName] = useState("");
  const [customerAccountHolder, setCustomerAccountHolder] = useState("");
  const [bankTxRef, setBankTxRef] = useState("");
  const [bankReceiptName, setBankReceiptName] = useState("");
  const [bankReceiptBase64, setBankReceiptBase64] = useState<string | null>(null);
  const [bankReceiptDragActive, setBankReceiptDragActive] = useState(false);

  // Customer Input Fields (TNG)
  const [tngTxRef, setTngTxRef] = useState("");
  const [tngReceiptName, setTngReceiptName] = useState("");
  const [tngReceiptBase64, setTngReceiptBase64] = useState<string | null>(null);
  const [tngReceiptDragActive, setTngReceiptDragActive] = useState(false);

  // Convert files to base64 for server-side AI processing
  const handleFileChange = (file: File, type: "tng" | "bank") => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size allowed is 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === "tng") {
        setTngReceiptName(file.name);
        setTngReceiptBase64(base64String);
      } else {
        setBankReceiptName(file.name);
        setBankReceiptBase64(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // PayPal Redirection and Tracking
  const [paypalStep, setPaypalStep] = useState<"init" | "redirected">("init");
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [paypalApproveUrl, setPaypalApproveUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);

    try {
      if (paymentTab === "paypal") {
        if (paypalStep === "init") {
          // Step 1: Create PayPal order on the server
          const createRes = await fetch("/api/payments/create-paypal-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: "1.99", currency: "USD" })
          });

          const createData = await createRes.json();
          if (createData.error) {
            throw new Error(createData.error);
          }

          setPaypalOrderId(createData.orderId);
          setPaypalApproveUrl(createData.approveUrl);
          setPaypalStep("redirected");

          // Open PayPal authorization link in a new window/tab
          if (createData.approveUrl) {
            const newWindow = window.open(createData.approveUrl, "_blank");
            if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
              alert("Popup Blocked! We created your secure gateway link. Please click the 'Launch PayPal Gateway' button that just appeared in the form to pay.");
            }
          }
        } else {
          // Step 2: Capture PayPal order on the server
          if (!paypalOrderId) return;
          const captureRes = await fetch("/api/payments/capture-paypal-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: paypalOrderId })
          });

          const captureData = await captureRes.json();
          if (captureData.error) {
            throw new Error(captureData.error);
          }

          alert(`PayPal Authorized Successfully!\nOrder ID: ${captureData.orderId}\nStatus: COMPLETED\nYour CVCraft AI Elite Premium access is activated.`);
          onSuccess();
          onClose();
        }
      } else if (paymentTab === "bank") {
        if (!customerBankName || !customerAccountHolder || !bankTxRef) {
          alert("Please fill in your Bank Name, Account Holder Name, and Transaction Reference ID so we can verify your direct transfer.");
          setLoading(false);
          return;
        }
        if (!bankReceiptBase64) {
          alert("Please upload your bank transfer receipt (screenshot or image) so our AI agent can verify your payment.");
          setLoading(false);
          return;
        }

        // Send to real server-side receipt AI verify endpoint
        const verifyRes = await fetch("/api/payments/verify-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiptBase64: bankReceiptBase64,
            receiptName: bankReceiptName,
            paymentType: "bank",
            txRef: bankTxRef,
            details: { customerBankName, customerAccountHolder }
          })
        });

        const verifyData = await verifyRes.json();
        if (verifyData.error) {
          throw new Error(verifyData.error);
        }

        if (verifyData.status === "APPROVED") {
          alert(`AI Payment Verification Successful!\n\n${verifyData.analysisMessage}\n\n• Detected Amount: ${verifyData.detectedAmount}\n• Reference ID: ${verifyData.detectedReferenceId}\n• Confidence: ${verifyData.confidenceScore}%\n\nYour Elite Premium Account has been activated!`);
          onSuccess();
          onClose();
        } else {
          alert(`AI Audit Rejected Your Submission!\n\nReason: ${verifyData.analysisMessage || "Invalid receipt image or incorrect amount."}\n\nConfidence: ${verifyData.confidenceScore}%\n\nPlease make sure you uploaded the correct completed transfer slip or updated your reference number to match.`);
        }

      } else if (paymentTab === "tng") {
        if (!tngTxRef) {
          alert("Please enter the Touch 'n Go eWallet Transaction Reference ID or Reference Number from your receipt.");
          setLoading(false);
          return;
        }
        if (!tngReceiptBase64) {
          alert("Please upload your Touch 'n Go receipt (screenshot or image) so our AI agent can verify your payment.");
          setLoading(false);
          return;
        }

        // Send to real server-side receipt AI verify endpoint
        const verifyRes = await fetch("/api/payments/verify-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiptBase64: tngReceiptBase64,
            receiptName: tngReceiptName,
            paymentType: "tng",
            txRef: tngTxRef
          })
        });

        const verifyData = await verifyRes.json();
        if (verifyData.error) {
          throw new Error(verifyData.error);
        }

        if (verifyData.status === "APPROVED") {
          alert(`AI Touch 'n Go Verification Successful!\n\n${verifyData.analysisMessage}\n\n• Detected Amount: ${verifyData.detectedAmount}\n• Reference ID: ${verifyData.detectedReferenceId}\n• Confidence: ${verifyData.confidenceScore}%\n\nYour Elite Premium Account has been activated!`);
          onSuccess();
          onClose();
        } else {
          alert(`AI Audit Rejected Your Submission!\n\nReason: ${verifyData.analysisMessage || "Invalid receipt image or incorrect amount."}\n\nConfidence: ${verifyData.confidenceScore}%\n\nPlease make sure you uploaded the correct completed transfer slip or updated your reference number to match.`);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(`Secure Payment Error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-2xl my-8 overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-52 w-52 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-400" />
            <h3 className="text-xl md:text-2xl font-bold font-display text-white">Upgrade to Elite Pass</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-900 p-1.5 text-slate-400 hover:text-white transition border border-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Benefits details */}
        <div className="my-4 space-y-4 relative">
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Unlock the full creative power of CVCraft AI. Build high-quality resumes that guarantee callbacks and leverage deep industry analysis.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">100% Ad-Free Experience</h4>
                <p className="text-[10px] text-slate-400 mt-1">Complete focus. Zero distraction banners or interruption countdowns.</p>
              </div>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Unlimited Gemini AI</h4>
                <p className="text-[10px] text-slate-400 mt-1">Detailed summaries, high-impact bullets, and cover letters instantly.</p>
              </div>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-start gap-3">
              <Award className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">40 Premium Templates</h4>
                <p className="text-[10px] text-slate-400 mt-1">Unlock 40 additional high-quality, professional layouts (50 total).</p>
              </div>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-start gap-3">
              <Star className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Deep ATS Analysis</h4>
                <p className="text-[10px] text-slate-400 mt-1">Instant, thorough evaluation with keyword suggestions and scoring.</p>
              </div>
            </div>
          </div>

          {/* Secure Payment System & Interactive Setup */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-3">
              <Lock className="h-3.5 w-3.5 text-emerald-400" /> Authorized Direct & Multi-Channel Payment Channels
            </h4>

            {/* Selector Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 p-1 bg-slate-950 border border-slate-850 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setPaymentTab("paypal")}
                className={`py-2 text-[10px] sm:text-xs font-bold rounded-md transition flex items-center justify-center gap-1 sm:gap-2 ${
                  paymentTab === "paypal" ? "bg-amber-500 text-slate-950 font-black shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="font-sans italic font-extrabold text-[12px] sm:text-[13px] tracking-tight">Pay<span className="text-blue-700">Pal</span></span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab("tng")}
                className={`py-2 text-[10px] sm:text-xs font-bold rounded-md transition flex items-center justify-center gap-1 sm:gap-2 ${
                  paymentTab === "tng" ? "bg-sky-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                <Wallet className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Touch 'n Go Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab("bank")}
                className={`py-2 text-[10px] sm:text-xs font-bold rounded-md transition flex items-center justify-center gap-1 sm:gap-2 ${
                  paymentTab === "bank" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                <Landmark className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Direct Bank Transfer</span>
              </button>
            </div>

            {/* Tab forms simulation */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-900/80 min-h-[170px] flex flex-col justify-center">
              {paymentTab === "paypal" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[10px] text-amber-400 bg-amber-950/20 border border-amber-500/20 rounded px-2.5 py-1">
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure Server-Side PayPal Gateway</span>
                    <span className="font-mono text-[9px] uppercase">{paypalStep === "init" ? "READY" : "AWAITING APPROVAL"}</span>
                  </div>
                  
                  {paypalStep === "init" ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-300 leading-normal">
                        Click the yellow <strong>PayPal Checkout</strong> button below. You will be redirected to the secure gateway to log in and authorize your transaction.
                      </p>
                      
                      <div className="p-3 bg-slate-900 rounded-xl space-y-2 max-w-sm mx-auto">
                        <button 
                          type="button"
                          onClick={handleCheckout}
                          disabled={loading}
                          className="w-full py-2 bg-[#ffc439] hover:bg-[#f4b31a] active:scale-95 text-slate-950 rounded-full font-bold text-xs font-sans flex items-center justify-center gap-1.5 transition shadow"
                        >
                          {loading ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-950" />
                          ) : (
                            <>
                              <span className="font-semibold italic">Pay with</span>
                              <span className="font-extrabold italic text-blue-900">PayPal</span>
                            </>
                          )}
                        </button>
                        
                        <div className="text-center text-[9px] text-slate-500">
                          Funds processed securely. Instant access activation.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center py-2">
                      <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200">Awaiting PayPal Gateway Approval...</p>
                        <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                          We opened the secure approval link in a new tab. If it did not open automatically, tap below:
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 max-w-xs mx-auto">
                        {paypalApproveUrl && (
                          <a
                            href={paypalApproveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-xs text-amber-400 bg-amber-950/30 border border-amber-500/30 hover:bg-amber-950/50 py-1.5 px-3 rounded-lg transition"
                          >
                            <span>Open PayPal Gateway Link</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={handleCheckout}
                          disabled={loading}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-black text-xs transition shadow flex items-center justify-center gap-1.5"
                        >
                          {loading ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-950" />
                          ) : (
                            "Verify & Complete Payment"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaypalStep("init");
                            setPaypalOrderId(null);
                            setPaypalApproveUrl(null);
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-350 underline"
                        >
                          Cancel / Reset Transaction
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {paymentTab === "tng" && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[10px] text-sky-400 bg-sky-950/20 border border-sky-900/30 rounded px-2.5 py-1">
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-sky-400" /> Direct eWallet Transfer</span>
                    <span className="font-mono text-[9px] uppercase">Direct to Owner</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Please transfer exactly <strong>RM 8.50 ($1.99 USD)</strong> directly using your Touch 'n Go app to the owner's eWallet number below, then submit your receipt.
                  </p>

                  {/* Owner TNG details card */}
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 max-w-md mx-auto">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Recipient Mobile No.</span>
                      <span className="text-white font-mono font-bold select-all bg-slate-950 px-2 py-0.5 rounded">{ownerTngPhone}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Registered Name</span>
                      <span className="text-white font-bold">{ownerTngName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {/* Tx Ref ID */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-300 block">Transaction Reference ID (Ref No.)</label>
                      <input
                        type="text"
                        placeholder="e.g. TNG20260630xxxxxxxx"
                        value={tngTxRef}
                        onChange={(e) => setTngTxRef(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    {/* Interactive File Uploader */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-300 block">Upload Transfer Receipt (Screenshot)</label>
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setTngReceiptDragActive(true); }}
                        onDragLeave={() => setTngReceiptDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setTngReceiptDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            setTngReceiptName(e.dataTransfer.files[0].name);
                          }
                        }}
                        onClick={() => {
                          const fileInput = document.getElementById("tng-file-input");
                          if (fileInput) fileInput.click();
                        }}
                        className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition ${
                          tngReceiptDragActive ? "border-sky-400 bg-sky-950/20" : "border-slate-800 bg-slate-900/40 hover:border-sky-500/50"
                        }`}
                      >
                        <input 
                          type="file" 
                          id="tng-file-input" 
                          className="hidden" 
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setTngReceiptName(e.target.files[0].name);
                            }
                          }}
                        />
                        {tngReceiptName ? (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <Check className="h-4 w-4" />
                            <span className="truncate max-w-[200px]">{tngReceiptName}</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[11px] text-slate-300 font-medium">Drag & drop your receipt or <span className="text-sky-400 hover:underline">browse files</span></p>
                            <p className="text-[9px] text-slate-500">Supports PNG, JPG, or PDF (Max 5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentTab === "bank" && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 rounded px-2.5 py-1">
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Direct Bank Transfer</span>
                    <span className="font-mono text-[9px] uppercase">Manual Verification</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Please transfer <strong>$1.99 USD</strong> directly from your bank app (via DuitNow, instant transfer, or wire) to the owner's bank details below, then submit proof.
                  </p>

                  {/* Owner bank details card */}
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 max-w-md mx-auto">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Recipient Bank</span>
                      <span className="text-white font-bold">{ownerBankName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Account Number</span>
                      <span className="text-white font-mono font-bold select-all bg-slate-950 px-2 py-0.5 rounded">{ownerBankAccountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Account Holder</span>
                      <span className="text-white font-bold">{ownerBankAccountHolder}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-medium">Your Sending Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. CIMB, Maybank, HSBC"
                        value={customerBankName}
                        onChange={(e) => setCustomerBankName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-medium">Your Bank Account Name</label>
                      <input
                        type="text"
                        placeholder="Your full registered name"
                        value={customerAccountHolder}
                        onChange={(e) => setCustomerAccountHolder(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {/* Tx Ref ID */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-300 block">Transaction Reference ID / Ref No.</label>
                      <input
                        type="text"
                        placeholder="e.g. 194829482948"
                        value={bankTxRef}
                        onChange={(e) => setBankTxRef(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {/* Interactive File Uploader for bank */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-300 block">Upload Transfer Receipt (Screenshot)</label>
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setBankReceiptDragActive(true); }}
                        onDragLeave={() => setBankReceiptDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setBankReceiptDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            setBankReceiptName(e.dataTransfer.files[0].name);
                          }
                        }}
                        onClick={() => {
                          const fileInput = document.getElementById("bank-file-input");
                          if (fileInput) fileInput.click();
                        }}
                        className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition ${
                          bankReceiptDragActive ? "border-emerald-400 bg-emerald-950/20" : "border-slate-800 bg-slate-900/40 hover:border-emerald-500/50"
                        }`}
                      >
                        <input 
                          type="file" 
                          id="bank-file-input" 
                          className="hidden" 
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setBankReceiptName(e.target.files[0].name);
                            }
                          }}
                        />
                        {bankReceiptName ? (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <Check className="h-4 w-4" />
                            <span className="truncate max-w-[200px]">{bankReceiptName}</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[11px] text-slate-300 font-medium">Drag & drop your receipt or <span className="text-emerald-400 hover:underline">browse files</span></p>
                            <p className="text-[9px] text-slate-500">Supports PNG, JPG, or PDF (Max 5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Anti-Hack Educational Blueprint */}
            <div className="mt-4 border-t border-slate-900 pt-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                🛡️ Direct Account Payout Synchronization Instructions
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Money paid by your premium customers goes <strong>directly</strong> into your private accounts. Here is what happens and what you need to do:
              </p>
              
              <div className="space-y-2 text-[10.5px] text-slate-350 bg-slate-950 p-3 rounded-xl border border-slate-900 leading-relaxed font-sans">
                <p><strong>1. Touch 'n Go & Bank Transfers:</strong> Since you do not need an official corporate merchant account, customers send payments directly using DuitNow/Instant transfer to your personal mobile number or bank account. Once they upload their receipt, you can manually verify it from your mobile app and cross-reference the Transaction Reference ID.</p>
                <p><strong>2. Custom Payment Config:</strong> As the administrator, you can update your Bank Name, Account Number, Registered Name, and TNG mobile phone number at any time. Simply head to the <strong>Admin Command Portal</strong> of CVCraft, modify the fields, and they will immediately update across all customer screens in real time!</p>
                <p><strong>3. PayPal (Automated):</strong> Keep your PayPal credentials configured in the environment settings to support fully automated global credit card/PayPal transactions directly linked to your bank card.</p>
              </div>
            </div>
          </div>

          {/* Price Selector */}
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950 border border-amber-900/60 px-2 py-0.5 rounded font-bold">
                Monthly Subscription
              </span>
              <h5 className="text-sm font-bold text-white mt-1.5 font-display">CVCraft AI Elite Pass</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">All premium features, tools, and styles bundled.</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-xs line-through">$9.99</span>
              <div className="text-xl font-black text-amber-400 font-display mt-0.5">$1.99<span className="text-xs font-normal text-slate-400">/mo</span></div>
              <span className="text-[9px] text-emerald-400 font-mono">80% Monthly Promo Deal</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="relative mt-6 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-800 pt-5">
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-slate-500" />
            Secure checkout simulation. No real money will be charged.
          </span>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" /> Verifying...
              </>
            ) : (
              "Upgrade Instantly"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
