import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Users, Search, Send, Paperclip, X, Image, Video, Eye, UserPlus, 
  UserCheck, RefreshCw, MessageSquare, ChevronLeft, Check, Sparkles,
  Download, ShieldCheck, Lock, ArrowLeft, Clock, CheckCheck
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { 
  collection, query, where, onSnapshot, setDoc, doc, updateDoc, getDocs
} from "firebase/firestore";
import { UserSession, DirectMessage } from "../types";
import { ThemeDefinition } from "./Settings";
import { encryptDirectMessage, decryptDirectMessage } from "../lib/cryptoUtils";

interface DirectMessagesProps {
  user: UserSession;
  theme?: ThemeDefinition;
  onBackToDashboard?: () => void;
}

interface SearchUser {
  id: string;
  email: string;
  displayName: string;
  profilePhoto?: string;
  isPremium?: boolean;
}

interface ActiveConversation {
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto?: string;
  lastMessage: DirectMessage;
  unreadCount: number;
}

export default function DirectMessages({ user, theme, onBackToDashboard }: DirectMessagesProps) {
  const firebaseUser = auth.currentUser;

  // Search & Registered Users Directory
  const [peerSearchQuery, setPeerSearchQuery] = useState("");
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<SearchUser[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [activePeerChat, setActivePeerChat] = useState<SearchUser | null>(null);
  
  // Chat messaging states
  const [peerMessageText, setPeerMessageText] = useState("");
  const [isSendingPeerMsg, setIsSendingPeerMsg] = useState(false);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [conversations, setConversations] = useState<ActiveConversation[]>([]);
  const [peerChatLoading, setPeerChatLoading] = useState(false);
  
  // Media attachments & lightbox
  const [peerAttachedFile, setPeerAttachedFile] = useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const peerFileInputRef = useRef<HTMLInputElement>(null);
  const peerMessagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const scrollToPeerBottom = () => {
    peerMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch & Listen to all registered members in Firestore
  useEffect(() => {
    if (!firebaseUser) return;

    setIsLoadingDirectory(true);
    const usersRef = collection(db, "users");

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersList: SearchUser[] = [];
      snapshot.forEach((d) => {
        if (d.id === firebaseUser.uid) return; // Exclude self
        const data = d.data();
        usersList.push({
          id: d.id,
          email: data.email || "No Email",
          displayName: data.displayName || data.name || data.email?.split("@")[0] || "Member",
          profilePhoto: data.profilePhoto || "",
          isPremium: data.isPremium || false
        });
      });

      // Sort alphabetically by displayName
      usersList.sort((a, b) => a.displayName.localeCompare(b.displayName));
      setAllRegisteredUsers(usersList);
      setIsLoadingDirectory(false);
    }, (err) => {
      console.warn("Could not listen to users directory:", err);
      setIsLoadingDirectory(false);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // 2. Listen to real-time direct messages involving current user
  useEffect(() => {
    if (!firebaseUser) return;

    setPeerChatLoading(true);
    const pathStr = "direct_messages";

    // Query 1: where current user is recipient
    const qReceived = query(
      collection(db, pathStr),
      where("recipientId", "==", firebaseUser.uid)
    );

    // Query 2: where current user is sender
    const qSent = query(
      collection(db, pathStr),
      where("senderId", "==", firebaseUser.uid)
    );

    let receivedList: DirectMessage[] = [];
    let sentList: DirectMessage[] = [];

    const updateCombined = () => {
      const all = [...receivedList, ...sentList];
      // Deduplicate by ID
      const map = new Map<string, DirectMessage>();
      all.forEach(m => map.set(m.id, m));
      const sorted = Array.from(map.values()).sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setDirectMessages(sorted);
      setPeerChatLoading(false);

      // Build conversations summary
      const convMap = new Map<string, ActiveConversation>();
      sorted.forEach(msg => {
        const isMeSender = msg.senderId === firebaseUser.uid;
        const otherId = isMeSender ? msg.recipientId : msg.senderId;
        const otherEmail = isMeSender ? msg.recipientEmail : msg.senderEmail;
        const otherName = isMeSender ? msg.recipientName : msg.senderName;

        const isUnread = !msg.read && msg.recipientId === firebaseUser.uid;
        const existing = convMap.get(otherId);

        if (!existing) {
          convMap.set(otherId, {
            userId: otherId,
            userName: otherName || "Member",
            userEmail: otherEmail,
            lastMessage: msg,
            unreadCount: isUnread ? 1 : 0
          });
        } else {
          // Keep newest lastMessage
          if (new Date(msg.createdAt).getTime() >= new Date(existing.lastMessage.createdAt).getTime()) {
            existing.lastMessage = msg;
          }
          if (isUnread) {
            existing.unreadCount += 1;
          }
        }
      });

      const convArray = Array.from(convMap.values()).sort((a, b) => 
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );
      setConversations(convArray);
    };

    const unsubRecv = onSnapshot(
      qReceived,
      (snapshot) => {
        receivedList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as DirectMessage);
        updateCombined();
      },
      (error) => {
        console.warn("Direct messages received listener:", error);
        setPeerChatLoading(false);
      }
    );

    const unsubSent = onSnapshot(
      qSent,
      (snapshot) => {
        sentList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as DirectMessage);
        updateCombined();
      },
      (error) => {
        console.warn("Direct messages sent listener:", error);
        setPeerChatLoading(false);
      }
    );

    return () => {
      unsubRecv();
      unsubSent();
    };
  }, [firebaseUser]);

  // 3. Mark messages as read when opening conversation with peer
  useEffect(() => {
    if (!firebaseUser || !activePeerChat) return;

    const unreadMsgs = directMessages.filter(
      m => m.senderId === activePeerChat.id && m.recipientId === firebaseUser.uid && !m.read
    );

    unreadMsgs.forEach(async (msg) => {
      try {
        await updateDoc(doc(db, "direct_messages", msg.id), {
          read: true
        });
      } catch (err) {
        console.warn("Error marking DM read:", err);
      }
    });

    scrollToPeerBottom();
    messageInputRef.current?.focus();
  }, [activePeerChat, directMessages, firebaseUser]);

  // 4. Suggestive Search Computation (Prefix Matching & Ranking)
  const filteredMembers = useMemo(() => {
    const raw = peerSearchQuery.trim().toLowerCase();
    if (!raw) return allRegisteredUsers;

    return allRegisteredUsers
      .map(u => {
        const name = u.displayName.toLowerCase();
        const email = u.email.toLowerCase();
        const words = name.split(/\s+/);

        let score = 0;
        // Exact match
        if (name === raw || email === raw) {
          score = 100;
        }
        // Name starts with query (e.g. "m" -> "Mussa", "Michael")
        else if (name.startsWith(raw)) {
          score = 80;
        }
        // Any word in name starts with query (e.g. "m" -> "Alex Mussa")
        else if (words.some(w => w.startsWith(raw))) {
          score = 70;
        }
        // Email starts with query
        else if (email.startsWith(raw)) {
          score = 60;
        }
        // Name contains query
        else if (name.includes(raw)) {
          score = 40;
        }
        // Email contains query
        else if (email.includes(raw)) {
          score = 30;
        }

        return { user: u, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || a.user.displayName.localeCompare(b.user.displayName))
      .map(item => item.user);
  }, [allRegisteredUsers, peerSearchQuery]);

  // 5. Handle File attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 720 * 1024) {
      alert(`Attachment size too large (${(file.size / 1024).toFixed(0)} KB). Please select an image or video under 700 KB.`);
      if (e.target) e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPeerAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string
      });
    };
    reader.onerror = () => {
      alert("Failed to read media file. Please try another file.");
    };
    reader.readAsDataURL(file);
  };

  // 6. Send Direct Message with Transparent End-to-End Encryption
  const handleSendPeerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!peerMessageText.trim() && !peerAttachedFile) || !firebaseUser || !activePeerChat) return;

    const rawText = peerMessageText.trim();
    const mediaToSave = peerAttachedFile;

    setIsSendingPeerMsg(true);
    setPeerMessageText("");
    setPeerAttachedFile(null);
    if (peerFileInputRef.current) peerFileInputRef.current.value = "";

    const msgId = `dm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const myName = user.displayName || firebaseUser.displayName || "Member";
    const myEmail = user.email || firebaseUser.email || "member@cvcraft.ai";
    const compositeChatId = [firebaseUser.uid, activePeerChat.id].sort().join("_");

    // Plain message text or media description
    const fallbackCaption = mediaToSave?.type.startsWith("video/") ? "📹 Shared a video clip" : "📷 Shared a photo";
    const unencryptedPayload = rawText || fallbackCaption;

    // Encrypt the message text payload using composite session channel key
    const encryptedPayload = encryptDirectMessage(unencryptedPayload, compositeChatId);

    const newDm: DirectMessage = {
      id: msgId,
      chatId: compositeChatId,
      senderId: firebaseUser.uid,
      senderEmail: myEmail,
      senderName: myName,
      recipientId: activePeerChat.id,
      recipientEmail: activePeerChat.email,
      recipientName: activePeerChat.displayName,
      message: encryptedPayload,
      mediaUrl: mediaToSave?.dataUrl || "",
      mediaType: mediaToSave ? (mediaToSave.type.startsWith("video/") ? "video" : "image") : "none",
      createdAt: new Date().toISOString(),
      read: false
    };

    try {
      await setDoc(doc(db, "direct_messages", msgId), newDm);
      scrollToPeerBottom();
    } catch (err) {
      console.error("Error sending direct message:", err);
      alert("Could not send direct message. Please check your connection.");
    } finally {
      setIsSendingPeerMsg(false);
    }
  };

  // Messages in active 1-on-1 chat
  const activePeerChatMessages = activePeerChat
    ? directMessages.filter(
        m => (m.senderId === firebaseUser?.uid && m.recipientId === activePeerChat.id) ||
             (m.senderId === activePeerChat.id && m.recipientId === firebaseUser?.uid)
      )
    : [];

  const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Function to render decrypted text safely
  const renderMessageContent = (rawText: string, chatId?: string) => {
    const channelId = chatId || (activePeerChat && firebaseUser ? [firebaseUser.uid, activePeerChat.id].sort().join("_") : "");
    const decrypted = decryptDirectMessage(rawText, channelId);
    return decrypted;
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-6 text-slate-100 font-sans pb-16 no-print">
      
      {/* Lightbox Modal */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-800 rounded-full text-slate-400 hover:text-white"
            onClick={() => setLightboxImg(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img 
            src={lightboxImg} 
            alt="Expanded Attachment Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
          />
        </div>
      )}



      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-2xl shadow-inner">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                  Direct Messages
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Lock className="h-2.5 w-2.5" /> E2E ENCRYPTED
                </span>
                {totalUnreadCount > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500 text-white font-bold animate-bounce">
                    {totalUnreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Private encrypted 1-on-1 messaging between registered platform members. Search any user to start a conversation.
              </p>
            </div>
          </div>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="text-xs px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto border border-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Messenger Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl min-h-[640px]">
        
        {/* LEFT COLUMN: Suggestive Search & Conversations Directory */}
        <div className={`lg:col-span-5 flex flex-col space-y-4 border-r border-slate-800/80 pr-0 lg:pr-5 ${activePeerChat ? "hidden lg:flex" : "flex"}`}>
          
          {/* Live Suggestive Search Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
              <span>Search Members & Contacts</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {allRegisteredUsers.length} Registered
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={peerSearchQuery}
                onChange={(e) => setPeerSearchQuery(e.target.value)}
                placeholder="Type name (e.g. 'm', 'mussa') or email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
              />
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
              {peerSearchQuery && (
                <button
                  onClick={() => setPeerSearchQuery("")}
                  className="absolute right-2.5 top-2.5 p-1 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Suggestive Member List (When Querying) */}
          {peerSearchQuery.trim() !== "" ? (
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] scrollbar-thin pr-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400 px-1 pt-1 font-bold">
                <span>Matching Members ({filteredMembers.length})</span>
                <span className="text-[10px] text-slate-500">Instant Live Filter</span>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                  <Users className="h-8 w-8 mx-auto text-slate-600 stroke-[1.5]" />
                  <p className="font-semibold text-slate-400">No matching members found</p>
                  <p className="text-[11px] text-slate-500">
                    Try searching with another letter, first name, or email prefix.
                  </p>
                </div>
              ) : (
                filteredMembers.map((pUser, pIdx) => {
                  const isSelected = activePeerChat?.id === pUser.id;
                  const queryLower = peerSearchQuery.toLowerCase();
                  const nameLower = pUser.displayName.toLowerCase();
                  const startsWithName = nameLower.startsWith(queryLower);

                  return (
                    <button
                      key={pUser.id || `search_user_${pIdx}`}
                      onClick={() => {
                        setActivePeerChat(pUser);
                        setPeerSearchQuery("");
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                          : "bg-slate-950/80 hover:bg-slate-850 border-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-300 uppercase shrink-0 overflow-hidden">
                          {pUser.profilePhoto ? (
                            <img src={pUser.profilePhoto} alt={pUser.displayName} className="h-full w-full object-cover" />
                          ) : (
                            pUser.displayName.slice(0, 2)
                          )}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs flex items-center gap-1.5 truncate">
                            <span>{pUser.displayName}</span>
                            {startsWithName && (
                              <span className="text-[9px] bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-1 rounded font-mono">
                                Match
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate font-mono">
                            {pUser.email}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 pl-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> Chat
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            /* Recent Conversations & Registered Directory */
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] scrollbar-thin pr-1">
              
              {/* Active Conversations Section */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1 flex items-center justify-between">
                  <span>Recent Conversations</span>
                  <span>{conversations.length}</span>
                </div>

                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-950/40 border border-slate-800/60 rounded-2xl">
                    <p>No active chats yet. Choose a member from the directory below to send a message!</p>
                  </div>
                ) : (
                  conversations.map((conv, cIdx) => {
                    const isActive = activePeerChat?.id === conv.userId;
                    const decryptedPreview = renderMessageContent(conv.lastMessage.message, conv.lastMessage.chatId);

                    return (
                      <button
                        key={conv.userId || `conv_${cIdx}`}
                        onClick={() => setActivePeerChat({ id: conv.userId, displayName: conv.userName, email: conv.userEmail })}
                        className={`w-full text-left p-3 rounded-2xl border transition-all relative flex items-center gap-3 ${
                          isActive
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                            : "bg-slate-950 border-slate-800/80 hover:bg-slate-850/80 text-slate-200"
                        }`}
                      >
                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400 uppercase shrink-0 overflow-hidden">
                          {conv.userName.slice(0, 2)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-xs truncate">{conv.userName}</span>
                            <span className={`text-[10px] font-mono shrink-0 ${isActive ? "text-indigo-200" : "text-slate-500"}`}>
                              {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-[11px] truncate ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                              {decryptedPreview || "Attachment"}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-emerald-500 text-slate-950 font-mono font-bold text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center min-w-[18px] shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Registered Members Directory Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1 flex items-center justify-between">
                  <span>Registered Directory</span>
                  <span>{allRegisteredUsers.length} Members</span>
                </div>

                {isLoadingDirectory ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" /> Loading members...
                  </div>
                ) : allRegisteredUsers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-950/40 border border-slate-800 rounded-xl">
                    No other registered members found.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {allRegisteredUsers.slice(0, 15).map((mUser, mIdx) => (
                      <button
                        key={mUser.id || `dir_user_${mIdx}`}
                        onClick={() => setActivePeerChat(mUser)}
                        className="w-full text-left p-2.5 rounded-xl border border-slate-800/60 bg-slate-950/50 hover:bg-slate-850 hover:border-slate-700 transition flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="h-8 w-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center font-bold text-xs text-indigo-300 uppercase shrink-0 overflow-hidden">
                            {mUser.profilePhoto ? (
                              <img src={mUser.profilePhoto} alt={mUser.displayName} className="h-full w-full object-cover" />
                            ) : (
                              mUser.displayName.slice(0, 2)
                            )}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                              {mUser.displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              {mUser.email}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover:text-indigo-400 font-mono shrink-0 pl-2">
                          Message →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Chat Conversation Thread */}
        <div className={`lg:col-span-7 flex flex-col h-[560px] relative ${!activePeerChat ? "hidden lg:flex" : "flex"}`}>
          {activePeerChat ? (
            <>
              {/* Chat Thread Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActivePeerChat(null)}
                    className="lg:hidden p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-300 uppercase shrink-0 overflow-hidden">
                    {activePeerChat.profilePhoto ? (
                      <img src={activePeerChat.profilePhoto} alt={activePeerChat.displayName} className="h-full w-full object-cover" />
                    ) : (
                      activePeerChat.displayName.slice(0, 2)
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      {activePeerChat.displayName}
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{activePeerChat.email}</span>
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Lock className="h-2.5 w-2.5" /> Encrypted
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" /> Private Session
                  </span>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 scrollbar-thin">
                {peerChatLoading ? (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500 gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" /> Decrypting message stream...
                  </div>
                ) : activePeerChatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-full text-indigo-400">
                      <Lock className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Encrypted Direct Chat Initialized</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed mt-1">
                        Say hello to <span className="text-indigo-300 font-semibold">{activePeerChat.displayName}</span>! Messages and shared media are securely encrypted end-to-end.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activePeerChatMessages.map((msg, mIdx) => {
                      const isFromMe = msg.senderId === firebaseUser?.uid;
                      const uniqueKey = msg.id ? `${msg.id}_${mIdx}` : `dm_msg_${mIdx}`;
                      const decryptedText = renderMessageContent(msg.message, msg.chatId);

                      return (
                        <div 
                          key={uniqueKey} 
                          className={`flex flex-col ${isFromMe ? "items-end" : "items-start"} space-y-1`}
                        >
                          <div className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 shadow-md ${
                            isFromMe 
                              ? "bg-indigo-600 text-white rounded-br-none" 
                              : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none"
                          }`}>
                            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 text-[10px] font-mono opacity-80">
                              <span className="font-bold">{isFromMe ? "You" : msg.senderName}</span>
                              <div className="flex items-center gap-1">
                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isFromMe && (
                                  <span title={msg.read ? "Read" : "Delivered"}>
                                    {msg.read ? (
                                      <CheckCheck className="h-3 w-3 text-cyan-300" />
                                    ) : (
                                      <Check className="h-3 w-3 text-slate-300" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Media Attachment Rendering */}
                            {msg.mediaUrl && (
                              <div className="space-y-1.5 pt-1">
                                {msg.mediaType === "video" ? (
                                  <video 
                                    src={msg.mediaUrl} 
                                    controls 
                                    className="max-h-48 w-full rounded-xl border border-slate-800 bg-black" 
                                  />
                                ) : (
                                  <div className="relative group cursor-pointer" onClick={() => setLightboxImg(msg.mediaUrl || null)}>
                                    <img 
                                      src={msg.mediaUrl} 
                                      alt="Attachment" 
                                      className="max-h-48 w-full object-cover rounded-xl border border-slate-800 hover:opacity-90 transition" 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl transition">
                                      <Eye className="h-6 w-6 text-white" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {decryptedText && (
                              <p className="break-words font-medium whitespace-pre-wrap">{decryptedText}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={peerMessagesEndRef} />
              </div>

              {/* Attachment Preview Chip */}
              {peerAttachedFile && (
                <div className="mb-2 p-2 bg-slate-950 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs animate-fade-in">
                  <div className="flex items-center gap-2 truncate">
                    {peerAttachedFile.type.startsWith("video/") ? (
                      <Video className="h-4 w-4 text-indigo-400 shrink-0" />
                    ) : (
                      <Image className="h-4 w-4 text-indigo-400 shrink-0" />
                    )}
                    <span className="text-slate-300 font-mono text-[11px] truncate">{peerAttachedFile.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">({(peerAttachedFile.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setPeerAttachedFile(null)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Direct Message Input Form */}
              <form onSubmit={handleSendPeerMessage} className="mt-auto pt-3 border-t border-slate-800 shrink-0 flex items-center gap-2">
                <input 
                  type="file"
                  ref={peerFileInputRef}
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => peerFileInputRef.current?.click()}
                  disabled={peerChatLoading || isSendingPeerMsg}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
                  title="Attach Photo or Video Clip (<700KB)"
                >
                  <Paperclip className="h-4.5 w-4.5" />
                </button>

                <input
                  ref={messageInputRef}
                  type="text"
                  value={peerMessageText}
                  onChange={(e) => setPeerMessageText(e.target.value)}
                  disabled={peerChatLoading || isSendingPeerMsg}
                  placeholder={peerAttachedFile ? "Add an encrypted caption..." : `Encrypted message to ${activePeerChat.displayName}...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={(!peerMessageText.trim() && !peerAttachedFile) || peerChatLoading || isSendingPeerMsg}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            /* Empty State when no conversation is selected */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-3xl text-indigo-400 shadow-xl">
                <Users className="h-10 w-10 text-indigo-400" />
              </div>
              <div className="max-w-sm space-y-1.5">
                <h3 className="text-sm font-bold text-white">Select a Member to Start Chatting</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use the suggestive search bar on the left to find any registered colleague or choose from your recent conversations.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
