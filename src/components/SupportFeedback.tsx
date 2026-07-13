import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Star, Send, ShieldAlert, Sparkles, AlertCircle,
  ThumbsUp, CheckCircle, RefreshCw, UserCheck, Users, Search, 
  Paperclip, Trash2, Image, Video, Eye, X, ChevronRight, UserPlus, FileText,
  Download
} from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  collection, query, where, onSnapshot, setDoc, doc, updateDoc, getDocs
} from "firebase/firestore";
import { UserSession, DirectMessage } from "../types";

interface SupportFeedbackProps {
  user: UserSession;
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
  mediaUrl?: string;
  mediaType?: string;
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

export default function SupportFeedback({ user }: SupportFeedbackProps) {
  const firebaseUser = auth.currentUser;
  
  // Top level Tabs: "admin" (Admin Support & Reviews) | "peer" (Peer Messaging)
  const [activeMainTab, setActiveMainTab] = useState<"admin" | "peer">("admin");

  // Admin Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Review States
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [myReviews, setMyReviews] = useState<UserReview[]>([]);

  // Attached File States (for Admin & Peer Chats)
  const [adminAttachedFile, setAdminAttachedFile] = useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null);
  const [peerAttachedFile, setPeerAttachedFile] = useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const peerFileInputRef = useRef<HTMLInputElement>(null);

  // Peer to Peer Chat States
  const [peerSearchQuery, setPeerSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activePeerChat, setActivePeerChat] = useState<SearchUser | null>(null);
  const [peerMessageText, setPeerMessageText] = useState("");
  const [isSendingPeerMsg, setIsSendingPeerMsg] = useState(false);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [conversations, setConversations] = useState<ActiveConversation[]>([]);
  const [peerChatLoading, setPeerChatLoading] = useState(false);
  
  // Fullscreen Image Lightbox Preview
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const peerMessagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToPeerBottom = () => {
    peerMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // File Upload base64 helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, chatType: "admin" | "peer") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 700 KB to fit Firestore document 1MB limit
    if (file.size > 720 * 1024) {
      alert(`Attachment size too large (${(file.size / 1024).toFixed(0)} KB). Please compress or select an image/video under 700 KB so it saves securely to our database.`);
      if (e.target) e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultData = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string
      };
      if (chatType === "admin") {
        setAdminAttachedFile(resultData);
      } else {
        setPeerAttachedFile(resultData);
      }
    };
    reader.onerror = () => {
      alert("Failed to read media file. Please try another file.");
    };
    reader.readAsDataURL(file);
  };

  // 1. Listen to user-specific Admin chat messages in real time
  useEffect(() => {
    if (!firebaseUser) return;

    const pathStr = "admin_chats";
    const q = query(
      collection(db, pathStr),
      where("userId", "==", firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ChatMessage, "id">),
        }));
        
        msgs.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        setMessages(msgs);
        setChatLoading(false);
        setTimeout(scrollToBottom, 100);

        // Mark unread messages from Admin as Read if Admin Chat is active
        if (activeMainTab === "admin") {
          msgs.forEach((msg) => {
            if (msg.senderId !== firebaseUser.uid && !msg.read) {
              updateDoc(doc(db, "admin_chats", msg.id), { read: true }).catch(err => 
                console.error("Failed to mark admin chat read:", err)
              );
            }
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathStr);
        setChatLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, activeMainTab]);

  // Mark admin chat as read when switching to the Admin tab
  useEffect(() => {
    if (activeMainTab === "admin" && firebaseUser && messages.length > 0) {
      messages.forEach((msg) => {
        if (msg.senderId !== firebaseUser.uid && !msg.read) {
          updateDoc(doc(db, "admin_chats", msg.id), { read: true }).catch(err => 
            console.error("Failed to mark admin chat read on tab focus:", err)
          );
        }
      });
    }
  }, [activeMainTab, firebaseUser, messages]);

  // 2. Fetch my existing reviews
  useEffect(() => {
    if (!firebaseUser) return;

    const pathStr = "reviews";
    const q = query(
      collection(db, pathStr),
      where("userId", "==", firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reviews: UserReview[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<UserReview, "id">),
        }));
        
        reviews.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setMyReviews(reviews);
      },
      (error) => {
        console.error("Error fetching my reviews:", error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  // 3. Listen to Direct Messages (two separate queries to merge for OR senderId / recipientId)
  useEffect(() => {
    if (!firebaseUser) return;

    const q1 = query(
      collection(db, "direct_messages"),
      where("senderId", "==", firebaseUser.uid)
    );
    const q2 = query(
      collection(db, "direct_messages"),
      where("recipientId", "==", firebaseUser.uid)
    );

    let msgs1: DirectMessage[] = [];
    let msgs2: DirectMessage[] = [];

    const handleMessagesMerge = () => {
      // Merge & Deduplicate
      const mergedMap = new Map<string, DirectMessage>();
      [...msgs1, ...msgs2].forEach(m => mergedMap.set(m.id, m));
      const allDMs = Array.from(mergedMap.values());
      
      // Sort DMs chronological
      allDMs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setDirectMessages(allDMs);

      // Group into conversations list
      const groups: Record<string, { partnerId: string; partnerName: string; partnerEmail: string; partnerPhoto?: string; lastMsg: DirectMessage; unreadCount: number }> = {};
      
      allDMs.forEach(msg => {
        const isSender = msg.senderId === firebaseUser.uid;
        const partnerId = isSender ? msg.recipientId : msg.senderId;
        const partnerName = isSender ? msg.recipientName : msg.senderName;
        const partnerEmail = isSender ? msg.recipientEmail : msg.senderEmail;
        const isUnread = !isSender && !msg.read;

        const existing = groups[partnerId];
        groups[partnerId] = {
          partnerId,
          partnerName,
          partnerEmail,
          lastMsg: msg, // Chronological iteration ensures last message dominates
          unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0)
        };
      });

      // Convert to array sorted by last message time desc
      const sortedConvs = Object.values(groups).map(g => ({
        userId: g.partnerId,
        userName: g.partnerName,
        userEmail: g.partnerEmail,
        userPhoto: g.partnerPhoto,
        lastMessage: g.lastMsg,
        unreadCount: g.unreadCount
      })).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

      setConversations(sortedConvs);
      setTimeout(scrollToPeerBottom, 100);
    };

    const unsub1 = onSnapshot(q1, (snapshot) => {
      msgs1 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DirectMessage);
      handleMessagesMerge();
    }, err => console.error("Error direct messages sender listener:", err));

    const unsub2 = onSnapshot(q2, (snapshot) => {
      msgs2 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DirectMessage);
      handleMessagesMerge();
    }, err => console.error("Error direct messages recipient listener:", err));

    return () => {
      unsub1();
      unsub2();
    };
  }, [firebaseUser]);

  // Mark direct messages as read when a peer chat is active
  useEffect(() => {
    if (!firebaseUser || !activePeerChat) return;

    // Filter messages for active chat that are unread and sent to ME
    const unreadReceived = directMessages.filter(
      msg => msg.senderId === activePeerChat.id && msg.recipientId === firebaseUser.uid && !msg.read
    );

    unreadReceived.forEach(msg => {
      updateDoc(doc(db, "direct_messages", msg.id), { read: true }).catch(err => 
        console.error("Error marking direct message as read:", err)
      );
    });
  }, [activePeerChat, directMessages, firebaseUser]);

  // Send message to admin
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !adminAttachedFile) return;

    setIsSendingMsg(true);
    const textToSend = newMessage.trim();
    const mediaToUpload = adminAttachedFile;
    setNewMessage("");
    setAdminAttachedFile(null);

    try {
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const isVideo = mediaToUpload?.type.startsWith("video/");
      
      const msgData = {
        userId: firebaseUser.uid,
        senderId: firebaseUser.uid,
        senderEmail: firebaseUser.email || user.email,
        senderName: firebaseUser.displayName || user.displayName || user.email.split("@")[0],
        message: textToSend || (mediaToUpload ? `Sent a ${isVideo ? "video" : "photo"}` : ""),
        createdAt: new Date().toISOString(),
        read: false,
        ...(mediaToUpload ? {
          mediaUrl: mediaToUpload.dataUrl,
          mediaType: isVideo ? "video" : "image"
        } : {})
      };

      await setDoc(doc(db, "admin_chats", msgId), msgData);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Error sending chat message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim() || !firebaseUser) return;

    setIsSubmittingReview(true);
    setReviewStatus(null);

    try {
      const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const reviewData = {
        userId: firebaseUser.uid,
        userEmail: firebaseUser.email || user.email,
        userName: firebaseUser.displayName || user.displayName || user.email.split("@")[0],
        rating: rating,
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "reviews", reviewId), reviewData);
      setReviewComment("");
      setReviewStatus({
        type: "success",
        message: "Thank you for your feedback! Your review has been submitted to our administrative team."
      });
    } catch (err) {
      console.error("Error submitting review:", err);
      setReviewStatus({
        type: "error",
        message: "Failed to submit review. Please try again later."
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Search peer users in real-time as the user types
  useEffect(() => {
    const trimmed = peerSearchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const delayTimer = setTimeout(async () => {
      try {
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        const allUsers: SearchUser[] = [];
        snapshot.forEach(doc => {
          if (doc.id !== firebaseUser?.uid) { // exclude self
            allUsers.push({ id: doc.id, ...doc.data() } as SearchUser);
          }
        });

        // Filter locally for name/email
        const filtered = allUsers.filter(u => 
          (u.displayName?.toLowerCase() || "").includes(trimmed.toLowerCase()) ||
          (u.email?.toLowerCase() || "").includes(trimmed.toLowerCase())
        );

        setSearchResults(filtered);
      } catch (err) {
        console.error("Error searching users dynamically:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200); // Debounced query delay

    return () => clearTimeout(delayTimer);
  }, [peerSearchQuery, firebaseUser]);

  const handlePeerSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Send Direct Message to Peer
  const handleSendPeerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePeerChat || (!peerMessageText.trim() && !peerAttachedFile) || !firebaseUser) return;

    setIsSendingPeerMsg(true);
    const textToSend = peerMessageText.trim();
    const mediaToUpload = peerAttachedFile;
    setPeerMessageText("");
    setPeerAttachedFile(null);

    try {
      const msgId = `dm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sortedIds = [firebaseUser.uid, activePeerChat.id].sort();
      const chatId = sortedIds.join("_");
      const isVideo = mediaToUpload?.type.startsWith("video/");

      const msgData = {
        chatId,
        senderId: firebaseUser.uid,
        senderEmail: firebaseUser.email || user.email,
        senderName: firebaseUser.displayName || user.displayName || user.email.split("@")[0],
        recipientId: activePeerChat.id,
        recipientEmail: activePeerChat.email,
        recipientName: activePeerChat.displayName || "User",
        message: textToSend || (mediaToUpload ? `Sent a ${isVideo ? "video" : "photo"}` : ""),
        createdAt: new Date().toISOString(),
        read: false,
        ...(mediaToUpload ? {
          mediaUrl: mediaToUpload.dataUrl,
          mediaType: isVideo ? "video" : "image"
        } : {})
      };

      await setDoc(doc(db, "direct_messages", msgId), msgData);
      setTimeout(scrollToPeerBottom, 50);
    } catch (err) {
      console.error("Error sending peer message:", err);
      alert("Failed to send direct message. Please try again.");
    } finally {
      setIsSendingPeerMsg(false);
    }
  };

  // Active Peer Chat Messages
  const activePeerChatMessages = directMessages.filter(msg => {
    if (!activePeerChat) return false;
    const sortedIds = [firebaseUser?.uid, activePeerChat.id].sort();
    return msg.chatId === sortedIds.join("_");
  });

  return (
    <div id="support-feedback-page" className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Lightbox Modal */}
      {lightboxImg && (
        <div 
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
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

      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-indigo-400" />
            <h2 className="text-2xl font-bold font-display text-white">Help, Support & Messages</h2>
          </div>
          {/* Main Mode Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1">
            <button
              onClick={() => setActiveMainTab("admin")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeMainTab === "admin"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <ShieldAlert className="h-4 w-4" /> Support & Reviews
            </button>
            <button
              onClick={() => setActiveMainTab("peer")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 relative ${
                activeMainTab === "peer"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Users className="h-4 w-4" /> Direct Messages
              {conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white font-mono font-black text-[9px] h-4 min-w-[16px] px-1 rounded-full border-2 border-slate-900 flex items-center justify-center animate-bounce">
                  {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {activeMainTab === "admin" 
            ? "Chat directly with the site administrator and leave reviews to help us improve CVCraft AI." 
            : "Search and direct message with other registered members of CVCraft AI. Attach photos & videos up to 700 KB."}
        </p>
      </div>

      {activeMainTab === "admin" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Left Column: Review & Feedback form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Star className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Review & Share Your Feedback</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                We highly appreciate your reviews. Rate your experience and send suggestions directly to the admin.
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Star Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 hover:scale-110 transition cursor-pointer"
                      >
                        <Star 
                          className={`h-7 w-7 transition-all ${
                            star <= (hoverRating ?? rating)
                              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                              : "text-slate-600 hover:text-slate-400"
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-400 font-mono ml-2">
                      ({rating}/5)
                    </span>
                  </div>
                </div>

                {/* Feedback Text */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">Detailed Feedback / Review</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us what you love, or where we can improve..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition leading-relaxed resize-none"
                  />
                </div>

                {/* Feedback status messages */}
                {reviewStatus && (
                  <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs leading-relaxed ${
                    reviewStatus.type === "success"
                      ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400"
                      : "bg-rose-950/40 border-rose-500/20 text-rose-400"
                  }`}>
                    {reviewStatus.type === "success" ? (
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <span>{reviewStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingReview || !reviewComment.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {isSubmittingReview ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  Submit Review
                </button>
              </form>
            </div>

            {/* User's Submitted Reviews list */}
            {myReviews.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl max-h-80 overflow-y-auto">
                <span className="text-[10px] font-mono tracking-wider text-slate-500 block uppercase font-bold">
                  My Reviews & Feedback ({myReviews.length})
                </span>
                <div className="space-y-3 divide-y divide-slate-800/50">
                  {myReviews.map((rev) => (
                    <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-3 w-3 ${star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} 
                            />
                          ))}
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 italic font-mono leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-850/60">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Chat with Admin */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col h-[550px] shadow-xl relative overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-indigo-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Chat with CVCraft Admin</h4>
                  <p className="text-[10px] text-slate-400">Ask support questions or interact with Bilal</p>
                </div>
              </div>
              <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/50 px-2.5 py-0.5 border border-indigo-900/60 rounded-full">
                SUPPORT CLIENT
              </span>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-4 scrollbar-thin">
              {chatLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-500 font-mono">Loading conversation...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                  <div className="p-3 bg-indigo-500/5 rounded-full text-indigo-500 border border-indigo-500/10">
                    <MessageSquare className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">No messages yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Say hello to start chatting with the Admin! They will be notified and can reply to you directly.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center py-1 bg-slate-950/40 border border-slate-850/60 rounded-xl text-[10px] text-slate-500 font-mono max-w-sm mx-auto">
                    🛡️ Chat session locked to you & Bilal Hassan Mussa
                  </div>
                  
                  {messages.map((msg) => {
                    const isAdminMsg = msg.senderId !== firebaseUser.uid;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isAdminMsg ? "items-start" : "items-end"} space-y-1`}
                      >
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                          <span>{isAdminMsg ? "Admin (Bilal)" : "You"}</span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-md ${
                          isAdminMsg 
                            ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-755" 
                            : "bg-indigo-600 text-white rounded-tr-none"
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          
                          {/* Attachment Rendering with Download capability */}
                          {msg.mediaUrl && (
                            <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-950 shadow-inner bg-slate-950/40 p-1 relative group/attachment">
                              {msg.mediaType === "video" ? (
                                <video src={msg.mediaUrl} controls className="max-h-56 max-w-full rounded-lg" />
                              ) : (
                                <img 
                                  src={msg.mediaUrl} 
                                  alt="Chat Attachment" 
                                  onClick={() => setLightboxImg(msg.mediaUrl || null)}
                                  className="max-h-56 max-w-full rounded-lg object-cover cursor-zoom-in hover:opacity-90 transition" 
                                />
                              )}
                              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/attachment:opacity-100 transition-opacity flex gap-1 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-2xl">
                                <a 
                                  href={msg.mediaUrl} 
                                  download={`support_media_${msg.id}.${msg.mediaType === "video" ? "mp4" : "png"}`}
                                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Download this attachment"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="h-4 w-4" />
                                  <span className="text-[10px] font-bold font-mono px-0.5">DL</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Thumbnail preview of Attached File */}
            {adminAttachedFile && (
              <div className="p-2.5 bg-slate-950 border border-indigo-900/30 rounded-xl mb-2 flex items-center justify-between gap-3 animate-fade-in shrink-0">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {adminAttachedFile.type.startsWith("video/") ? (
                    <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
                      <Video className="h-4 w-4" />
                    </div>
                  ) : (
                    <img src={adminAttachedFile.dataUrl} className="h-8 w-8 object-cover rounded-lg border border-slate-800 shrink-0" />
                  )}
                  <div className="truncate text-left">
                    <p className="text-[11px] font-bold text-white truncate max-w-[200px]">{adminAttachedFile.name}</p>
                    <p className="text-[9px] text-slate-500 font-mono">{(adminAttachedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAdminAttachedFile(null)}
                  className="p-1 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="mt-auto pt-3 border-t border-slate-800 shrink-0 flex items-center gap-2">
              <input 
                type="file"
                ref={adminFileInputRef}
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "admin")}
              />
              <button
                type="button"
                onClick={() => adminFileInputRef.current?.click()}
                disabled={chatLoading || isSendingMsg}
                className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
                title="Attach Photo or Video (<700KB)"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={chatLoading || isSendingMsg}
                placeholder={adminAttachedFile ? "Add a caption, or send now..." : "Type your message to the administrator..."}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={(!newMessage.trim() && !adminAttachedFile) || chatLoading || isSendingMsg}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Direct Peer to Peer Messaging bento structure */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl h-[580px] animate-fade-in relative overflow-hidden">
          {/* Left panel: Inbox & Search (col-4) */}
          <div className="md:col-span-4 border-r border-slate-800 pr-4 flex flex-col h-full overflow-hidden">
            {/* Search Bar */}
            <form onSubmit={handlePeerSearch} className="mb-4 shrink-0 flex items-center gap-1.5 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl focus-within:border-indigo-500 transition">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={peerSearchQuery}
                onChange={(e) => setPeerSearchQuery(e.target.value)}
                placeholder="Find members by name or email..."
                className="bg-transparent flex-1 focus:outline-none text-xs text-slate-200 placeholder-slate-600 font-medium"
              />
              {peerSearchQuery && (
                <button 
                  type="button" 
                  onClick={() => { setPeerSearchQuery(""); setSearchResults([]); }}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </form>

            {/* Dynamic Results / Conversations roster */}
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
              {peerSearchQuery.trim() !== "" ? (
                /* Search Results Panel */
                <div className="space-y-2">
                  <span className="text-[9px] font-mono tracking-wider text-indigo-400 block uppercase font-black">
                    Search Results ({searchResults.length})
                  </span>
                  {isSearching ? (
                    <div className="py-6 text-center text-xs font-mono text-slate-500 flex items-center justify-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Querying profiles...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-6 text-center text-[11px] font-mono text-slate-600 leading-relaxed bg-slate-950/25 p-3 rounded-xl border border-slate-850">
                      No matching members found.
                    </div>
                  ) : (
                    searchResults.map(pUser => (
                      <button
                        key={pUser.id}
                        onClick={() => {
                          setActivePeerChat(pUser);
                          setPeerSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full text-left p-3 bg-slate-950/50 hover:bg-indigo-950/20 border border-slate-850 hover:border-indigo-500/25 rounded-xl transition flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="font-bold text-xs text-white block truncate">{pUser.displayName || "CVCraft User"}</span>
                          <span className="text-[10px] text-slate-500 block font-mono truncate">{pUser.email}</span>
                        </div>
                        <UserPlus className="h-4 w-4 text-indigo-400 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Conversation lists roster */
                <div className="space-y-2">
                  <span className="text-[9px] font-mono tracking-wider text-slate-500 block uppercase font-bold mb-1.5">
                    Recent Private Chats ({conversations.length})
                  </span>
                  
                  {conversations.length === 0 ? (
                    <div className="py-12 text-center text-slate-600 text-[11px] leading-relaxed max-w-xs mx-auto space-y-3 p-3 bg-slate-950/15 border border-slate-850 rounded-2xl">
                      <Users className="h-6 w-6 text-slate-700 mx-auto animate-pulse" />
                      <p>No direct active conversations. Search above by name or email to start a private chat with any member!</p>
                    </div>
                  ) : (
                    conversations.map(conv => {
                      const isActive = activePeerChat?.id === conv.userId;
                      return (
                        <button
                          key={conv.userId}
                          onClick={() => setActivePeerChat({ id: conv.userId, displayName: conv.userName, email: conv.userEmail })}
                          className={`w-full text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                            isActive
                              ? "bg-indigo-950/25 border-indigo-500/30 text-white"
                              : "bg-slate-950/30 border-slate-850 hover:bg-slate-850 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs truncate max-w-[75%] block">
                              {conv.userName}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span className="bg-indigo-500 text-white font-mono font-bold text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center min-w-[18px]">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 block font-mono truncate mb-1">{conv.userEmail}</span>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {conv.lastMessage.message}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Active direct chat room (col-8) */}
          <div className="md:col-span-8 flex flex-col h-full overflow-hidden">
            {activePeerChat ? (
              <div className="flex flex-col h-full">
                {/* Peer Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-indigo-400">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{activePeerChat.displayName || "CVCraft User"}</h4>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        {activePeerChat.email}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePeerChat(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Direct Messages Body */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
                  {activePeerChatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-full text-indigo-500">
                        <MessageSquare className="h-6 w-6 animate-bounce" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">No messages yet</p>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                          Your conversation with {activePeerChat.displayName} is encrypted. Send a message or photo/video under 700 KB to say hello!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activePeerChatMessages.map(msg => {
                        const isFromMe = msg.senderId === firebaseUser.uid;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col ${isFromMe ? "items-end" : "items-start"} space-y-1`}
                          >
                            <span className="text-[9px] text-slate-500 font-mono">
                              {isFromMe ? "You" : msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-md ${
                              isFromMe 
                                ? "bg-indigo-600 text-white rounded-tr-none" 
                                : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-750"
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                              
                              {/* Attachment Rendering with Download capability */}
                              {msg.mediaUrl && (
                                <div className="mt-2 rounded-xl overflow-hidden border border-slate-950 shadow-inner bg-slate-950/40 p-1 relative group/attachment">
                                  {msg.mediaType === "video" ? (
                                    <video src={msg.mediaUrl} controls className="max-h-56 max-w-full rounded-lg" />
                                  ) : (
                                    <img 
                                      src={msg.mediaUrl} 
                                      alt="Peer Attachment" 
                                      onClick={() => setLightboxImg(msg.mediaUrl || null)}
                                      className="max-h-56 max-w-full rounded-lg object-cover cursor-zoom-in hover:opacity-90 transition" 
                                    />
                                  )}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover/attachment:opacity-100 transition-opacity flex gap-1 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-2xl">
                                    <a 
                                      href={msg.mediaUrl} 
                                      download={`chat_media_${msg.id}.${msg.mediaType === "video" ? "mp4" : "png"}`}
                                      className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Download this attachment"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="h-4 w-4" />
                                      <span className="text-[10px] font-bold font-mono px-0.5">DL</span>
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={peerMessagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Thumbnail preview of Attached Peer File */}
                {peerAttachedFile && (
                  <div className="p-2.5 bg-slate-950 border border-indigo-900/30 rounded-xl mb-2 flex items-center justify-between gap-3 animate-fade-in shrink-0">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {peerAttachedFile.type.startsWith("video/") ? (
                        <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
                          <Video className="h-4 w-4" />
                        </div>
                      ) : (
                        <img src={peerAttachedFile.dataUrl} className="h-8 w-8 object-cover rounded-lg border border-slate-800 shrink-0" />
                      )}
                      <div className="truncate text-left">
                        <p className="text-[11px] font-bold text-white truncate max-w-[200px]">{peerAttachedFile.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{(peerAttachedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPeerAttachedFile(null)}
                      className="p-1 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-300 animate-pulse"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Send Peer Message Form */}
                <form onSubmit={handleSendPeerMessage} className="pt-3 border-t border-slate-800 flex items-center gap-2 shrink-0">
                  <input 
                    type="file"
                    ref={peerFileInputRef}
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "peer")}
                  />
                  <button
                    type="button"
                    onClick={() => peerFileInputRef.current?.click()}
                    disabled={isSendingPeerMsg}
                    className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
                    title="Attach Photo or Video (<700KB)"
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </button>

                  <input
                    type="text"
                    required={!peerAttachedFile}
                    value={peerMessageText}
                    onChange={(e) => setPeerMessageText(e.target.value)}
                    placeholder={peerAttachedFile ? "Add a caption, or send now..." : "Type your direct message here..."}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={(!peerMessageText.trim() && !peerAttachedFile) || isSendingPeerMsg}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-full text-slate-600">
                  <Users className="h-8 w-8 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">No active peer chat session</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Select a conversation from the Private Chats roster on the left, or use the search bar to find and connect with registered members instantly!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
