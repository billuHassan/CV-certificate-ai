import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, Users, MessageSquare, Star, RefreshCw, Check, 
  X, AlertTriangle, Cpu, Terminal, Radio, Ban, Send, UserCheck, Inbox
} from "lucide-react";
import { UserSession } from "../types";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  collection, onSnapshot, doc, updateDoc, setDoc, query, orderBy
} from "firebase/firestore";

interface AdminPanelProps {
  user: UserSession;
  onClose: () => void;
}

interface RealUser {
  id: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  creationsCount: number;
  adViews: number;
  profilePhoto?: string;
}

interface UserReview {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

export default function AdminPanel({ user, onClose }: AdminPanelProps) {
  const isAuthorized = user.email === "bilalhassanmussa@gmail.com";
  const firebaseAdminUser = auth.currentUser;

  // Tabs: "users" | "reviews" | "chats"
  const [activeTab, setActiveTab] = useState<"users" | "reviews" | "chats">("users");

  // Database Data States
  const [realUsers, setRealUsers] = useState<RealUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [allChatMessages, setAllChatMessages] = useState<ChatMessage[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  // Selected User Chat ID
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Diagnostic Server Logs / Info
  const [adminLog, setAdminLog] = useState<string[]>([
    "System Initialized: Admin authorization validated.",
    "Firewall Status: ACTIVE.",
    "Real database listener attached to collections: [users, reviews, admin_chats]"
  ]);

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

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAdminLog(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // 1. Listen to real users
  useEffect(() => {
    if (!isAuthorized) return;

    const pathStr = "users";
    const unsubscribe = onSnapshot(
      collection(db, pathStr),
      (snapshot) => {
        const usersList: RealUser[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RealUser[];
        setRealUsers(usersList);
        setUsersLoading(false);
        addLog(`Synchronized ${usersList.length} real user records from Firestore.`);
      },
      (err) => {
        console.error("Error listening to users:", err);
        handleFirestoreError(err, OperationType.GET, pathStr);
        setUsersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  // 2. Listen to all reviews
  useEffect(() => {
    if (!isAuthorized) return;

    const pathStr = "reviews";
    const unsubscribe = onSnapshot(
      collection(db, pathStr),
      (snapshot) => {
        const reviewsList: UserReview[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserReview[];

        // Sort by date desc
        reviewsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(reviewsList);
        setReviewsLoading(false);
      },
      (err) => {
        console.error("Error listening to reviews:", err);
        setReviewsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  // 3. Listen to all chat messages
  useEffect(() => {
    if (!isAuthorized) return;

    const pathStr = "admin_chats";
    const unsubscribe = onSnapshot(
      collection(db, pathStr),
      (snapshot) => {
        const chatList: ChatMessage[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChatMessage[];

        setAllChatMessages(chatList);
        setChatsLoading(false);
      },
      (err) => {
        console.error("Error listening to chats:", err);
        setChatsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  // 4. Fetch diagnostic statistics
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
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [isAuthorized, user.email]);

  // Helper to scroll active chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatUserId, allChatMessages]);

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

  // Toggle Premium helper for real users in Firestore database
  const handleTogglePremiumReal = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { isPremium: !currentStatus });
      addLog(`User privileges toggled for uid [${userId}]: Set isPremium = ${!currentStatus}`);
    } catch (err) {
      console.error("Error toggling premium:", err);
      alert("Failed to modify premium status. Check console logs.");
    }
  };

  // Chat message groups (distinct conversations list)
  const conversationGroups = allChatMessages.reduce<Record<string, { lastMessage: ChatMessage; name: string; email: string; unreadCount: number }>>((acc, msg) => {
    const isFromAdmin = msg.senderId === firebaseAdminUser?.uid;
    const key = msg.userId;
    
    const existingGroup = acc[key];
    const isNewer = !existingGroup || new Date(msg.createdAt).getTime() > new Date(existingGroup.lastMessage.createdAt).getTime();
    
    let otherName = msg.senderName;
    let otherEmail = msg.senderEmail;
    if (isFromAdmin && existingGroup) {
      otherName = existingGroup.name;
      otherEmail = existingGroup.email;
    }

    const isUnread = !isFromAdmin && !msg.read;

    acc[key] = {
      lastMessage: isNewer ? msg : (existingGroup?.lastMessage || msg),
      name: otherName || otherEmail?.split("@")[0] || "User",
      email: otherEmail || "No Email",
      unreadCount: (existingGroup?.unreadCount || 0) + (isUnread ? 1 : 0)
    };
    return acc;
  }, {});

  // Convert conversations group map into array sorted by last activity desc
  const conversationsList = Object.keys(conversationGroups).map(uid => ({
    userId: uid,
    ...conversationGroups[uid]
  })).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

  // Filter messages for current active user chat
  const activeChatMessages = allChatMessages
    .filter(m => m.userId === activeChatUserId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Send Admin message handler
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !activeChatUserId || !firebaseAdminUser) return;

    setIsSendingReply(true);
    const textToSend = adminReplyText.trim();
    setAdminReplyText("");

    try {
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const activeUserRecord = realUsers.find(u => u.id === activeChatUserId);
      const activeUserName = activeUserRecord?.displayName || activeUserRecord?.email?.split("@")[0] || "User";

      const msgData = {
        userId: activeChatUserId,
        senderId: firebaseAdminUser.uid,
        senderEmail: firebaseAdminUser.email || user.email,
        senderName: "Admin (Bilal)",
        message: textToSend,
        createdAt: new Date().toISOString(),
        read: true
      };

      await setDoc(doc(db, "admin_chats", msgId), msgData);
      addLog(`Replied to user ${activeUserName}: "${textToSend.substring(0, 25)}..."`);
    } catch (err) {
      console.error("Error sending admin reply:", err);
      alert("Failed to send reply. Please try again.");
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div id="admin-panel-container" className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Admin header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-rose-400 bg-rose-950 border border-rose-900/60 px-2.5 py-0.5 rounded-full font-bold uppercase">
            AUTHORITATIVE OVERLORD SESSION
          </span>
          <h2 className="text-2xl font-bold font-display text-white mt-1.5 flex items-center gap-2">
            <Shield className="h-6 w-6 text-rose-500 animate-pulse" /> Admin Command Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management panel connected to database project: <span className="text-rose-400 font-bold">{user.email}</span>
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
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Live Registrations</span>
            <Users className="h-4 w-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none py-1">{realUsers.length} Users</div>
          <p className="text-[10px] text-slate-400 font-mono">Real-time DB synced status</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Active Support Chats</span>
            <MessageSquare className="h-4 w-4 text-indigo-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none py-1">{conversationsList.length} Chats</div>
          <p className="text-[10px] text-slate-400 font-mono">Distinct customer conversations</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Reviews & Feedback</span>
            <Star className="h-4 w-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none py-1">{reviews.length} Ratings</div>
          <p className="text-[10px] text-slate-400 font-mono">Average Rating: {(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)} / 5</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">ATS Scans Run</span>
            <Terminal className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono leading-none py-1">
            {realUsers.reduce((sum, u) => sum + (u.creationsCount || 0), 0)} Scans
          </div>
          <p className="text-[10px] text-slate-400 font-mono">Total creations across DB</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 gap-2 shrink-0">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "users"
              ? "border-rose-500 text-rose-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" /> User Directory ({realUsers.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab("chats")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "chats"
              ? "border-rose-500 text-rose-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Inbox className="h-4 w-4" /> Support Inbox ({conversationsList.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "reviews"
              ? "border-rose-500 text-rose-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4" /> Reviews & Feedback ({reviews.length})
          </div>
        </button>
      </div>

      {/* Content Columns split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main interactive directory tab */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === "users" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Users className="h-4.5 w-4.5 text-rose-400" /> Database User Directory
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  Real Firestore Records
                </span>
              </div>

              {usersLoading ? (
                <div className="h-48 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-6 w-6 text-rose-400 animate-spin" />
                  <span className="text-xs text-slate-500 font-mono">Polling user records...</span>
                </div>
              ) : realUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  No registered users found in the database.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="pb-3 font-semibold">User Details</th>
                        <th className="pb-3 font-semibold text-center">Creations</th>
                        <th className="pb-3 font-semibold text-center">Ad Views</th>
                        <th className="pb-3 font-semibold text-center">Elite Plan</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {realUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-950/20">
                          <td className="py-3.5 pr-2">
                            <span className="font-bold text-white block">{u.displayName || "Anonymous User"}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">{u.email || `uid: ${u.id}`}</span>
                          </td>
                          <td className="py-3.5 text-center font-mono font-bold text-slate-300">{u.creationsCount ?? 0}</td>
                          <td className="py-3.5 text-center font-mono text-slate-400">{u.adViews ?? 0}</td>
                          <td className="py-3.5 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              u.isPremium 
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                                : "bg-slate-950 text-slate-500 border border-slate-850"
                            }`}>
                              {u.isPremium ? "Elite" : "Free"}
                            </span>
                          </td>
                          <td className="py-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setActiveChatUserId(u.id);
                                setActiveTab("chats");
                              }}
                              className="px-2 py-1 text-[10px] font-bold rounded-lg transition bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            >
                              Message
                            </button>
                            <button
                              onClick={() => handleTogglePremiumReal(u.id, u.isPremium)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
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
              )}
            </div>
          )}

          {/* Support Chats Tab */}
          {activeTab === "chats" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-[580px]">
              {/* Inbox list (col-4) */}
              <div className="md:col-span-4 border-r border-slate-800 pr-4 flex flex-col h-full overflow-hidden">
                <span className="text-[10px] font-mono tracking-wider text-slate-500 block uppercase font-bold mb-3">
                  Conversations ({conversationsList.length})
                </span>
                
                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
                  {chatsLoading ? (
                    <div className="py-8 text-center text-slate-600 font-mono text-xs">Loading conversations...</div>
                  ) : conversationsList.length === 0 ? (
                    <div className="py-8 text-center text-slate-600 font-mono text-[11px] leading-relaxed">
                      No customer chat messages found in the database.
                    </div>
                  ) : (
                    conversationsList.map((chat) => (
                      <button
                        key={chat.userId}
                        onClick={() => setActiveChatUserId(chat.userId)}
                        className={`w-full text-left p-3 rounded-xl border transition-all relative ${
                          activeChatUserId === chat.userId
                            ? "bg-rose-950/20 border-rose-500/30 text-white"
                            : "bg-slate-950/30 border-slate-850 hover:bg-slate-850 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate max-w-[80%]">
                            {chat.name}
                          </span>
                          {chat.unreadCount > 0 && (
                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 block font-mono truncate mb-1.5">{chat.email}</span>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          {chat.lastMessage.message}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat View (col-8) */}
              <div className="md:col-span-8 flex flex-col h-full justify-between overflow-hidden">
                {activeChatUserId ? (
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          Chatting with {
                            realUsers.find(u => u.id === activeChatUserId)?.displayName || 
                            conversationGroups[activeChatUserId]?.name || 
                            "User"
                          }
                        </h4>
                        <span className="text-[9px] text-slate-500 font-mono block">
                          User ID: {activeChatUserId}
                        </span>
                      </div>
                      <button 
                        onClick={() => setActiveChatUserId(null)}
                        className="p-1 hover:bg-slate-800 rounded"
                      >
                        <X className="h-4 w-4 text-slate-400 hover:text-white" />
                      </button>
                    </div>

                    {/* Messages list */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
                      {activeChatMessages.map((msg) => {
                        const isFromAdmin = msg.senderId === firebaseAdminUser?.uid;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col ${isFromAdmin ? "items-end" : "items-start"} space-y-1`}
                          >
                            <span className="text-[9px] text-slate-500 font-mono">
                              {isFromAdmin ? "You (Admin)" : msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-md ${
                              isFromAdmin 
                                ? "bg-rose-600 text-white rounded-tr-none" 
                                : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-750"
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Reply Form */}
                    <form onSubmit={handleSendAdminReply} className="pt-3 border-t border-slate-800 flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        required
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder="Type reply here..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="submit"
                        disabled={!adminReplyText.trim() || isSendingReply}
                        className="p-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl transition flex items-center justify-center shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-full text-slate-600">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">No active conversation</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Select a chat from the Support Inbox roster, or click "Message" next to any user in the directory to begin chatting with them.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl max-h-[580px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Star className="h-4.5 w-4.5 text-amber-400" /> Customer Reviews & Ratings
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  Submitted Feedback Records
                </span>
              </div>

              {reviewsLoading ? (
                <div className="h-32 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-6 w-6 text-amber-400 animate-spin" />
                  <span className="text-xs text-slate-500 font-mono">Loading reviews...</span>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  No customer reviews have been submitted yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 shadow-md flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white truncate max-w-[60%]">
                            {rev.userName}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono shrink-0">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-3 w-3 ${star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-800"}`} 
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-300 italic font-mono leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-850/60 break-words">
                          "{rev.comment}"
                        </p>
                      </div>
                      <div className="border-t border-slate-900/60 pt-2 flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 font-mono truncate max-w-[65%]">
                          {rev.userEmail}
                        </span>
                        <button
                          onClick={() => {
                            setActiveChatUserId(rev.userId);
                            setActiveTab("chats");
                          }}
                          className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-400 text-[9px] font-bold rounded border border-rose-800/30 transition"
                        >
                          Chat Support
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Diagnostic Information & Logs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Security Guard Terminal */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-rose-500 animate-pulse" />
                <h3 className="font-bold text-white text-sm">System Operations Terminal</h3>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 border border-emerald-900/60 rounded">
                SECURE
              </span>
            </div>

            <div className="bg-slate-950 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[10px] space-y-2 text-slate-400 scrollbar-thin">
              {adminLog.map((log, index) => (
                <div key={index} className="leading-relaxed border-b border-slate-900/45 pb-1">
                  <span className="text-rose-500 font-semibold">{`>> `}</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Help Tip */}
          <div className="border border-rose-500/10 bg-rose-500/5 rounded-2xl p-5 flex items-start gap-3 shadow-md">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] text-slate-300">
              <span className="font-bold text-white">Administrative Authority Rules</span>
              <p className="leading-relaxed text-slate-400">
                You are authenticated as the primary administrator. You have authoritative control to downgrade or upgrade premium accounts and chat with all site users directly. All payments/PayPal configurations have been removed from the platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
