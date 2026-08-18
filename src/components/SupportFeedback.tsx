import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Star, Send, ShieldAlert, Sparkles, AlertCircle,
  ThumbsUp, CheckCircle, RefreshCw, Paperclip, Trash2, Image, Video, 
  Eye, X, Users, ArrowRight
} from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  collection, query, where, onSnapshot, setDoc, doc, updateDoc, getDocs
} from "firebase/firestore";
import { UserSession } from "../types";

interface SupportFeedbackProps {
  user: UserSession;
  onOpenDirectMessages?: () => void;
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

export default function SupportFeedback({ user, onOpenDirectMessages }: SupportFeedbackProps) {
  const firebaseUser = auth.currentUser;

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

  // Attached File State for Admin Chat
  const [adminAttachedFile, setAdminAttachedFile] = useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen Image Lightbox Preview
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // File Upload helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 720 * 1024) {
      alert(`Attachment size too large (${(file.size / 1024).toFixed(0)} KB). Please select an image/video under 700 KB.`);
      if (e.target) e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAdminAttachedFile({
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
        const msgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });

        msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(msgs);
        setChatLoading(false);
        setTimeout(scrollToBottom, 100);
      },
      (error) => {
        console.warn("Could not listen to real-time chat messages:", error);
        setChatLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  // 2. Fetch User's existing reviews
  useEffect(() => {
    if (!firebaseUser) return;

    const pathStr = "user_reviews";
    const q = query(
      collection(db, pathStr),
      where("userId", "==", firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const revs: UserReview[] = [];
        snapshot.forEach((doc) => {
          revs.push(doc.data() as UserReview);
        });
        revs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMyReviews(revs);
      },
      (error) => {
        console.warn("Could not fetch user reviews:", error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  // Handle Review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!reviewComment.trim()) {
      setReviewStatus({ type: "error", message: "Please enter a comment for your review." });
      return;
    }

    setIsSubmittingReview(true);
    setReviewStatus(null);

    const reviewId = `review_${firebaseUser.uid}_${Date.now()}`;
    const newReview: UserReview = {
      id: reviewId,
      userId: firebaseUser.uid,
      userEmail: firebaseUser.email || user.email,
      userName: user.displayName || firebaseUser.displayName || "CVCraft User",
      rating,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "user_reviews", reviewId), newReview);
      setReviewStatus({ type: "success", message: "Thank you! Your feedback has been submitted successfully." });
      setReviewComment("");
      setRating(5);
    } catch (error) {
      setReviewStatus({ type: "error", message: "Failed to submit review. Please try again." });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle send message to Administrator
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !adminAttachedFile) || !firebaseUser) return;

    const msgContent = newMessage.trim();
    const mediaToSave = adminAttachedFile;

    setIsSendingMsg(true);
    setNewMessage("");
    setAdminAttachedFile(null);
    if (adminFileInputRef.current) adminFileInputRef.current.value = "";

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newMsg: ChatMessage = {
      id: msgId,
      userId: firebaseUser.uid,
      senderId: firebaseUser.uid,
      senderEmail: firebaseUser.email || user.email,
      senderName: user.displayName || firebaseUser.displayName || "User",
      message: msgContent || (mediaToSave?.type.startsWith("video/") ? "📹 Shared a video clip" : "📷 Shared a photo"),
      mediaUrl: mediaToSave?.dataUrl || "",
      mediaType: mediaToSave ? (mediaToSave.type.startsWith("video/") ? "video" : "image") : "none",
      createdAt: new Date().toISOString(),
      read: false
    };

    try {
      await setDoc(doc(db, "admin_chats", msgId), newMsg);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending support message:", error);
      alert("Failed to send message. Please check connection.");
    } finally {
      setIsSendingMsg(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 font-sans pb-16 no-print">
      
      {/* Lightbox Modal */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
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

      {/* Page Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display flex items-center gap-2">
                Help, Support & Reviews
              </h1>
              <p className="text-xs text-slate-400">
                Connect directly with the system administrator, get technical assistance, and leave rating reviews.
              </p>
            </div>
          </div>

          {onOpenDirectMessages && (
            <button
              onClick={onOpenDirectMessages}
              className="text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 self-start sm:self-auto"
            >
              <Users className="h-4 w-4" /> Open Direct Messages <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Review & Feedback form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
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

              {/* Review Text */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium block">Your Comments & Suggestions</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What do you love about the platform? Any templates, tools or features you'd like added?"
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition resize-none"
                />
              </div>

              {reviewStatus && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  reviewStatus.type === "success" 
                    ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/60 border border-rose-500/30 text-rose-300"
                }`}>
                  {reviewStatus.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{reviewStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingReview || !reviewComment.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {isSubmittingReview ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                Submit Review
              </button>
            </form>
          </div>

          {/* User's Previous Reviews Roster */}
          {myReviews.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Your Past Reviews</h4>
              <div className="space-y-2.5">
                {myReviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`h-3 w-3 ${s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Chat with Administrator */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col h-[580px] relative overflow-hidden">
          {/* Support Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                <ShieldAlert className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  Admin Live Support
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Official Support Representative: bilalhassanmussa@gmail.com
                </span>
              </div>
            </div>
          </div>

          {/* Support Chat Messages Body */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
            {chatLoading ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500 gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" /> Connecting to Support Server...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-full text-indigo-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">How can we help you today?</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed mt-1">
                    Send a question, report an issue, or attach screenshots under 700 KB. Our administrator responds promptly.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, mIdx) => {
                const isAdmin = msg.senderEmail === "bilalhassanmussa@gmail.com";
                const isFromMe = msg.senderId === firebaseUser?.uid && !isAdmin;
                const uniqueKey = msg.id ? `${msg.id}_${mIdx}` : `admin_msg_${mIdx}`;

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
                        <span className="font-bold flex items-center gap-1">
                          {isAdmin && <ShieldAlert className="h-3 w-3 text-amber-400" />}
                          {isAdmin ? "Admin (Bilal)" : msg.senderName}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Media preview */}
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

                      {msg.message && (
                        <p className="break-words font-medium whitespace-pre-wrap">{msg.message}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Chip */}
          {adminAttachedFile && (
            <div className="mb-2 p-2 bg-slate-950 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 truncate">
                {adminAttachedFile.type.startsWith("video/") ? (
                  <Video className="h-4 w-4 text-indigo-400 shrink-0" />
                ) : (
                  <Image className="h-4 w-4 text-indigo-400 shrink-0" />
                )}
                <span className="text-slate-300 font-mono text-[11px] truncate">{adminAttachedFile.name}</span>
                <span className="text-[9px] text-slate-500 font-mono">({(adminAttachedFile.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button 
                type="button" 
                onClick={() => setAdminAttachedFile(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
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
              onChange={handleFileChange}
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
    </div>
  );
}
