import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Star, Send, ShieldAlert, Sparkles, AlertCircle,
  ThumbsUp, CheckCircle, RefreshCw, UserCheck
} from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  collection, addDoc, query, where, onSnapshot, setDoc, doc 
} from "firebase/firestore";
import { UserSession } from "../types";

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

export default function SupportFeedback({ user }: SupportFeedbackProps) {
  const firebaseUser = auth.currentUser;
  
  // Chat States
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

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Listen to user-specific chat messages in real time
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
        
        // Sort in memory to avoid needing Firestore composite index
        msgs.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        setMessages(msgs);
        setChatLoading(false);
        setTimeout(scrollToBottom, 100);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathStr);
        setChatLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

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

  // 3. Send message to admin
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !firebaseUser) return;

    setIsSendingMsg(true);
    const textToSend = newMessage.trim();
    setNewMessage("");

    try {
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const msgData = {
        userId: firebaseUser.uid,
        senderId: firebaseUser.uid,
        senderEmail: firebaseUser.email || user.email,
        senderName: firebaseUser.displayName || user.displayName || user.email.split("@")[0],
        message: textToSend,
        createdAt: new Date().toISOString(),
        read: false
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

  // 4. Submit review
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

  return (
    <div id="support-feedback-page" className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-6 w-6 text-indigo-400" />
          <h2 className="text-2xl font-bold font-display text-white">Help, Support & Reviews</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Chat directly with the site administrator and leave reviews to help us improve CVCraft AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                {/* Intro banner */}
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
                          ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-750" 
                          : "bg-indigo-600 text-white rounded-tr-none"
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="mt-auto pt-3 border-t border-slate-800 shrink-0 flex items-center gap-2">
            <input
              type="text"
              required
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={chatLoading || isSendingMsg}
              placeholder="Type your message to the administrator..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || chatLoading || isSendingMsg}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition flex items-center justify-center shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
