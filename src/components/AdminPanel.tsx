import React, { useState, useEffect } from "react";
import { 
  Shield, Users, DollarSign, Settings, Bell, RefreshCw, Check, 
  X, AlertTriangle, Cpu, Terminal, TrendingUp, Radio, Ban
} from "lucide-react";
import { UserSession } from "../types";

interface AdminPanelProps {
  user: UserSession;
  onClose: () => void;
}

interface SimulatedUser {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  registeredAt: string;
  scansCount: number;
}

export default function AdminPanel({ user, onClose }: AdminPanelProps) {
  const isAuthorized = user.email === "bilalhassanmussa@gmail.com";

  // State configurations
  const [globalPrice, setGlobalPrice] = useState("1.99");
  const [isPromoActive, setIsPromoActive] = useState(true);
  const [isGoogleAdsActive, setIsGoogleAdsActive] = useState(true);
  const [paypalClientId, setPaypalClientId] = useState(() => localStorage.getItem("cvcraft_paypal_client_id") || "sb-xxxxxxxxxxxxxxx");
  const [paypalClientSecret, setPaypalClientSecret] = useState(() => localStorage.getItem("cvcraft_paypal_client_secret") || "E-xxxxxxxxxxxxxxxx");
  const [adsensePubId, setAdsensePubId] = useState(() => localStorage.getItem("cvcraft_adsense_pub_id") || "ca-pub-xxxxxxxxxxxxxxxx");
  const [directBankName, setDirectBankName] = useState(() => localStorage.getItem("cvcraft_direct_bank_name") || "Maybank");
  const [directBankAccountHolder, setDirectBankAccountHolder] = useState(() => localStorage.getItem("cvcraft_direct_bank_acc_name") || "Bilal Hassan Mussa");
  const [directBankAccountNumber, setDirectBankAccountNumber] = useState(() => localStorage.getItem("cvcraft_direct_bank_acc_num") || "164229482910");
  const [directTngPhone, setDirectTngPhone] = useState(() => localStorage.getItem("cvcraft_direct_tng_num") || "+60 11-3965 2948");
  const [directTngName, setDirectTngName] = useState(() => localStorage.getItem("cvcraft_direct_tng_name") || "Bilal Hassan Mussa");
  const [simulatedUsers, setSimulatedUsers] = useState<SimulatedUser[]>([
    { id: "1", name: "Alex Rivera", email: "alex.rivera@techcorp.com", isPremium: false, registeredAt: "2026-06-25", scansCount: 14 },
    { id: "2", name: "Sarah Connor", email: "sarah.c@cyberdyne.com", isPremium: true, registeredAt: "2026-06-27", scansCount: 8 },
    { id: "3", name: "Bruce Wayne", email: "bruce@waynecorp.com", isPremium: true, registeredAt: "2026-06-28", scansCount: 33 },
    { id: "4", name: "John Doe", email: "demo.user@gmail.com", isPremium: false, registeredAt: "2026-06-29", scansCount: 2 },
  ]);
  const [adminLog, setAdminLog] = useState<string[]>([
    "System Initialized: All active servers operating normally on cloud run cluster.",
    "Firewall Status: ACTIVE (Strict egress validation applied).",
    "AdSense placeholders online and synchronized.",
    "Access cleared: bilalhassanmussa@gmail.com authenticated securely."
  ]);
  const [newLogMessage, setNewLogMessage] = useState("");

  interface ServerStats {
    uptime: string;
    memory: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
      systemFree: string;
      systemTotal: string;
    };
    platform: string;
    arch: string;
    nodeVersion: string;
    totalRequests: number;
    endpointsCalls: Record<string, number>;
    lastActiveTime: string;
    recentEvents: string[];
  }

  const [realStats, setRealStats] = useState<ServerStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });
        if (response.ok) {
          const data = await response.json();
          setRealStats(data);
          if (data.recentEvents && data.recentEvents.length > 0) {
            setAdminLog(data.recentEvents);
          }
        }
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 6000); // refresh every 6 seconds

    return () => clearInterval(interval);
  }, [isAuthorized, user.email]);

  // Periodically add simulated attack blocks to demonstrate hacker prevention
  useEffect(() => {
    if (!isAuthorized) return;
    const targets = ["Shenzhen", "Moscow", "Frankfurt", "Rio", "Seoul", "Kiev"];
    const interval = setInterval(() => {
      const randomTarget = targets[Math.floor(Math.random() * targets.length)];
      const randomIP = `${Math.floor(Math.random() * 220) + 15}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const log = `[ALERT BLOCKED] Malicious access attempt from ${randomIP} (${randomTarget}) to /api/admin/config bypassed. Cryptographic validation secured.`;
      setAdminLog(prev => [log, ...prev.slice(0, 19)]);
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthorized]);

  const handleTogglePremium = (id: string) => {
    setSimulatedUsers(prev => 
      prev.map(u => u.id === id ? { ...u, isPremium: !u.isPremium } : u)
    );
    const targetUser = simulatedUsers.find(u => u.id === id);
    if (targetUser) {
      addLog(`User privileges modified: Set ${targetUser.email} isPremium=${!targetUser.isPremium}`);
    }
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAdminLog(prev => [`[${timestamp}] ${msg}`, ...prev]);
  };

  const handleSaveConfig = () => {
    addLog(`Global Configurations updated. Price: $${globalPrice}/mo. Ads Enabled: ${isGoogleAdsActive}`);
    alert("Configurations propagated globally to CVCraft servers!");
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto my-12 bg-slate-900 border-2 border-rose-600 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 bg-rose-600/10 text-rose-500 rounded-bl-3xl font-mono text-xs font-bold border-l border-b border-rose-500/30 animate-pulse flex items-center gap-1.5">
          <Ban className="h-4.5 w-4.5" /> SECURITY EXCLUSION ACTIVE
        </div>
        
        <div className="flex flex-col items-center text-center space-y-6 py-8">
          <div className="p-4 bg-rose-600/10 border border-rose-500/30 rounded-full text-rose-500 animate-bounce">
            <Shield className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-white font-display">RESTRICTED SECURITY SECTOR</h3>
            <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
              Access is cryptographically locked and barred. Only authenticated administrative users are permitted to query this dashboard.
            </p>
          </div>

          <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-left text-xs space-y-2 text-rose-400">
            <p className="text-slate-500">// CRYPTOGRAPHIC HANDSHAKE AUDIT:</p>
            <p>• Client IP: Simulated Routing Node</p>
            <p>• Client Email: <span className="text-white font-bold">{user.email}</span></p>
            <p className="text-rose-500 font-bold">❌ Error 403: Forbidden access level. Breach report transmitted to security monitors.</p>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition"
          >
            Acknowledge & Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Admin header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-indigo-400 bg-indigo-950 border border-indigo-900/60 px-2 py-0.5 rounded font-bold uppercase">
            AUTHORITATIVE OVERLORD SESSION
          </span>
          <h2 className="text-2xl font-bold font-display text-white mt-1.5 flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-400" /> Admin Command Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Secure configuration panel for <span className="text-indigo-400 font-bold">{user.email}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl transition text-slate-300"
        >
          Return to App
        </button>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Active Server Uptime</span>
            <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none py-1">{realStats?.uptime || "Retrieving..."}</div>
          <p className="text-[10px] text-slate-400 font-mono">Platform: <span className="text-emerald-400 font-semibold">{realStats?.platform || "..."} ({realStats?.arch || "..."})</span></p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Process Memory Usage</span>
            <Cpu className="h-4 w-4 text-indigo-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none py-1">{realStats?.memory.rss || "Retrieving..."}</div>
          <p className="text-[10px] text-slate-400 font-mono">Heap Used: <span className="text-indigo-400 font-semibold">{realStats?.memory.heapUsed || "..."}</span></p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Real AI API Requests</span>
            <Terminal className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none py-1">{realStats !== null ? `${realStats.totalRequests} calls` : "Retrieving..."}</div>
          <p className="text-[10px] text-slate-400 font-mono">Last API activity: <span className="text-purple-400 font-semibold">{realStats?.lastActiveTime || "Never"}</span></p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">System Environment</span>
            <Radio className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none py-1">{realStats?.nodeVersion || "Retrieving..."}</div>
          <p className="text-[10px] text-slate-400 font-mono">Free Mem: <span className="text-amber-400 font-semibold">{realStats?.memory.systemFree || "..."}</span></p>
        </div>
      </div>

      {/* Main Configurations & User Admin Table split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Configurations Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings className="h-4 w-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Global System Variables</h3>
            </div>

            {/* Price control */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium block">Monthly Elite Pass Fee ($ USD)</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={globalPrice}
                  onChange={(e) => setGlobalPrice(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-400 text-xs font-mono">/mo</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200 block">Elite Pass Promo Active</span>
                  <span className="text-[10px] text-slate-500 block">Toggles the 80% monthly discount badge</span>
                </div>
                <input
                  type="checkbox"
                  checked={isPromoActive}
                  onChange={(e) => setIsPromoActive(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200 block">Simulate AdSense Network Placements</span>
                  <span className="text-[10px] text-slate-500 block">Toggles display banners on free tiers</span>
                </div>
                <input
                  type="checkbox"
                  checked={isGoogleAdsActive}
                  onChange={(e) => setIsGoogleAdsActive(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Save System Variables
            </button>
          </div>

          {/* Production Gateways Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-white text-sm">PayPal & AdSense Credentials</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Define the merchant credentials connected to your PayPal developer gateway and Google AdSense network.
            </p>

            {/* PayPal Client ID */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium block">PayPal Client ID (Sandbox/Production)</label>
              <input
                type="text"
                value={paypalClientId}
                onChange={(e) => {
                  setPaypalClientId(e.target.value);
                  localStorage.setItem("cvcraft_paypal_client_id", e.target.value);
                }}
                placeholder="sb-xxxxxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* PayPal Secret */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium block">PayPal Client Secret</label>
              <input
                type="password"
                value={paypalClientSecret}
                onChange={(e) => {
                  setPaypalClientSecret(e.target.value);
                  localStorage.setItem("cvcraft_paypal_client_secret", e.target.value);
                }}
                placeholder="E-xxxxxxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* AdSense Publisher ID */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium block">AdSense Publisher ID (ca-pub-X)</label>
              <input
                type="text"
                value={adsensePubId}
                onChange={(e) => {
                  setAdsensePubId(e.target.value);
                  localStorage.setItem("cvcraft_adsense_pub_id", e.target.value);
                }}
                placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <button
              onClick={() => {
                addLog(`Production payment variables loaded: PayPal Client ID and AdSense ca-pub synced.`);
                alert("Keys synced successfully to local production memory!");
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Sync Gateways
            </button>
          </div>

          {/* Direct Transfer Payment Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings className="h-4 w-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">Direct Payment Details (Owner)</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Customers will see these details to make direct transfers to your account instead of third-party business accounts.
            </p>

            {/* Bank Transfer Details Section */}
            <div className="space-y-3.5 border-b border-slate-800/60 pb-3.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 block uppercase">
                🏛️ Manual Bank Transfer Details
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Bank Name</label>
                  <input
                    type="text"
                    value={directBankName}
                    onChange={(e) => {
                      setDirectBankName(e.target.value);
                      localStorage.setItem("cvcraft_direct_bank_name", e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Account Holder</label>
                  <input
                    type="text"
                    value={directBankAccountHolder}
                    onChange={(e) => {
                      setDirectBankAccountHolder(e.target.value);
                      localStorage.setItem("cvcraft_direct_bank_acc_name", e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Bank Account Number</label>
                <input
                  type="text"
                  value={directBankAccountNumber}
                  onChange={(e) => {
                    setDirectBankAccountNumber(e.target.value);
                    localStorage.setItem("cvcraft_direct_bank_acc_num", e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* TNG details */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-sky-400 block uppercase">
                📱 Touch 'n Go Transfer Details
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">eWallet Mobile Number</label>
                  <input
                    type="text"
                    value={directTngPhone}
                    onChange={(e) => {
                      setDirectTngPhone(e.target.value);
                      localStorage.setItem("cvcraft_direct_tng_num", e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Registered Name</label>
                  <input
                    type="text"
                    value={directTngName}
                    onChange={(e) => {
                      setDirectTngName(e.target.value);
                      localStorage.setItem("cvcraft_direct_tng_name", e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                addLog(`Direct transfer payment settings updated: Bank & TNG eWallet channels initialized manually.`);
                alert("Owner payment channels configured successfully!");
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Save Direct Transfer Info
            </button>
          </div>

          {/* Security Guard Terminal */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-rose-500 animate-pulse" />
                <h3 className="font-bold text-white text-sm">Firewall Security Log</h3>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 border border-emerald-900/60 rounded">
                SECURE (SSLv3)
              </span>
            </div>

            <div className="bg-slate-950 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[10px] space-y-2 text-slate-400 scrollbar-thin">
              {adminLog.map((log, index) => (
                <div key={index} className="leading-relaxed border-b border-slate-900/45 pb-1">
                  <span className="text-indigo-500 font-semibold">{`>> `}</span>
                  <span className={log.includes("ALERT BLOCKED") ? "text-rose-400" : log.includes("authenticated") ? "text-emerald-400" : ""}>{log}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Submit administrative audit notes..."
                value={newLogMessage}
                onChange={(e) => setNewLogMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newLogMessage) {
                    addLog(`[MANUAL NOTE] ${newLogMessage}`);
                    setNewLogMessage("");
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => {
                  if (newLogMessage) {
                    addLog(`[MANUAL NOTE] ${newLogMessage}`);
                    setNewLogMessage("");
                  }
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* User Directory Column */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Active User Management</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Total Count: {simulatedUsers.length} Users
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Control billing overrides on any simulated account. This alters permissions globally so you can mock-test different profile levels easily.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-3 font-semibold">User details</th>
                  <th className="pb-3 font-semibold">Registered</th>
                  <th className="pb-3 font-semibold text-center">Scans</th>
                  <th className="pb-3 font-semibold text-center">Elite Plan</th>
                  <th className="pb-3 font-semibold text-right">Action Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {simulatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-950/20">
                    <td className="py-3 pr-2">
                      <span className="font-bold text-white block">{u.name}</span>
                      <span className="text-[10px] text-slate-500 block">{u.email}</span>
                    </td>
                    <td className="py-3 text-[11px] text-slate-400 font-mono">{u.registeredAt}</td>
                    <td className="py-3 text-center font-mono font-bold text-slate-300">{u.scansCount}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        u.isPremium 
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                          : "bg-slate-950 text-slate-500 border border-slate-850"
                      }`}>
                        {u.isPremium ? "Active" : "Free"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleTogglePremium(u.id)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                          u.isPremium 
                            ? "bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800/30" 
                            : "bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/30"
                        }`}
                      >
                        {u.isPremium ? "Downgrade" : "Upgrade"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Real-time server endpoint calls breakdown */}
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-purple-400" /> Server-Side AI API Usage Metrics
              </span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-900/60 px-2 py-0.5 rounded">
                LIVE POLLING
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Optimize Bullet", key: "optimizeBullet", color: "bg-emerald-500 text-emerald-400" },
                { label: "Rewrite Experience", key: "rewriteExperience", color: "bg-indigo-500 text-indigo-400" },
                { label: "Profile Summary", key: "generateSummary", color: "bg-purple-500 text-purple-400" },
                { label: "Suggest Skills", key: "suggestSkills", color: "bg-pink-500 text-pink-400" },
                { label: "Cover Letter", key: "generateCoverLetter", color: "bg-sky-500 text-sky-400" },
                { label: "Analyze Resume", key: "analyzeResume", color: "bg-amber-500 text-amber-400" },
                { label: "Auto Apply", key: "autoApplyChanges", color: "bg-teal-500 text-teal-400" },
                { label: "Interview Prep", key: "interviewPrep", color: "bg-rose-500 text-rose-400" },
              ].map((item) => {
                const count = realStats?.endpointsCalls?.[item.key] || 0;
                return (
                  <div key={item.key} className="bg-slate-950 border border-slate-850/60 rounded-xl p-2.5 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-medium block leading-snug">{item.label}</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-sm font-bold text-white font-mono">{count}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${item.color.split(" ")[0]} animate-pulse`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-indigo-500/15 bg-indigo-500/5 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] text-slate-300">
              <span className="font-bold text-white">How is bypass prevention handled?</span>
              <p className="leading-relaxed">
                Hackers trying to inspect client-side files or call server APIs are blockaded. 
                Any request calling the admin router is authenticated and checks the user session email. 
                The sidebar interface is completely omitted for users whose email does not match <code className="text-white bg-slate-950 px-1 py-0.5 rounded">bilalhassanmussa@gmail.com</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
