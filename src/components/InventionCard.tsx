import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageSquare, Send, Check, ShieldAlert, Sparkle, Compass, User, RefreshCw } from "lucide-react";
import { Invention, Comment } from "../types";
import { toggleLikeInvention, fetchCommentsList, createCommentDoc } from "../firebase";

interface InventionCardProps {
  key?: string;
  invention: Invention;
  currentUser: { uid: string; displayName: string; photoURL: string };
  onUpdateInvention: (updated: Invention) => void;
}

export default function InventionCard({ invention, currentUser, onUpdateInvention }: InventionCardProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  
  // Comments loading & submission helper
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentWarning, setCommentWarning] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Load comments when drawer is opened
  useEffect(() => {
    if (showComments) {
      loadInventionComments();
    }
  }, [showComments, invention.id]);

  const loadInventionComments = async () => {
    setIsLoadingComments(true);
    try {
      const list = await fetchCommentsList(invention.id);
      setComments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Toggle Like Action (Cheering)
  const handleLikeToggle = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const updated = await toggleLikeInvention(invention.id, currentUser.uid);
      onUpdateInvention(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  // Write comment action with safety guard check!
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    setCommentWarning(null);

    try {
      // 1. Safety check
      const safetyRes = await fetch("/api/ai/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newCommentText })
      });
      const safetyData = await safetyRes.json();

      if (!safetyData.isSafe) {
        setCommentWarning(safetyData.reason || "우리 서로 이쁜 말만 사용해요! 다시 작성해 볼까요? ✨");
        setIsSubmittingComment(false);
        return;
      }

      // 2. Write comment doc
      const created = await createCommentDoc(
        invention.id,
        newCommentText,
        currentUser.uid,
        currentUser.displayName,
        currentUser.photoURL
      );

      setComments(prev => [...prev, created]);
      setNewCommentText("");
    } catch (err: any) {
      console.error(err);
      setCommentWarning("댓글 등록 중 실패했어요: " + err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const isLikedByMe = invention.likedBy?.includes(currentUser.uid) || false;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-custom overflow-hidden border-4 border-[#1e293b] vibrant-shadow flex flex-col h-full"
    >
      {/* Top Author Meta */}
      <div className="flex items-center gap-3 p-4 bg-[#ffeae0] border-b-4 border-[#1e293b]">
        <img 
          src={invention.authorPhoto} 
          alt={invention.authorName}
          className="w-10 h-10 rounded-full border-2 border-[#1e293b] bg-white bg-no-repeat"
          referrePolicy="no-referrer"
        />
        <div>
          <h4 className="font-sans text-md font-bold text-slate-800 leading-tight">{invention.authorName} 어린이 발명가</h4>
          <p className="text-[11px] text-slate-500 font-mono font-bold">
            {new Date(invention.createdAt).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric"
            })}
          </p>
        </div>
      </div>

      {/* Invention Showcase Visual */}
      <div className="relative h-48 md:h-52 overflow-hidden bg-slate-100 border-b-4 border-[#1e293b]">
        <img 
          src={invention.imageUrl} 
          alt={invention.title}
          className="w-full h-full object-cover"
          referrePolicy="no-referrer"
        />
        {/* Slogan Badge Pill */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 pointer-events-none">
          <span className="bg-white text-slate-800 text-xs font-bold font-sans py-1 px-3 rounded-full border-2 border-[#1e293b] shadow-sm max-w-full truncate">
            {invention.slogan}
          </span>
        </div>

        {/* Target tag bottom label */}
        <div className="absolute bottom-3 right-3 pointer-events-none">
          <span className="bg-[#e2f9e1] text-emerald-900 text-xs font-bold font-sans py-1 px-3 rounded-xl border-2 border-[#1e293b] shadow-sm flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-emerald-800" />
            {invention.targetAudience}
          </span>
        </div>
      </div>

      {/* Content description area */}
      <div className="p-5 flex-1 space-y-4">
        {/* Heading */}
        <h3 className="font-sans text-xl font-extrabold text-[#1e293b] flex items-center gap-1.5">
          <Sparkle className="w-5 h-5 text-indigo-500 fill-indigo-200" />
          {invention.title}
        </h3>

        {/* Short mess logic */}
        <div className="bg-[#ffeae0]/40 rounded-2xl p-3.5 border-2 border-[#1e293b]">
          <p className="text-xs font-bold text-[#1e293b] mb-1">💡 나의 반짝 발상 메모</p>
          <p className="text-sm text-slate-700 font-sans font-bold leading-relaxed">
            "{invention.shortIdea}"
          </p>
        </div>

        {/* Polished descriptive logic */}
        <div className="text-md font-sans text-slate-700 leading-relaxed font-bold bg-[#ebd1ff]/20 p-3 rounded-2xl border-2 border-dashed border-[#ebd1ff]">
          {invention.description}
        </div>
      </div>

      {/* Core Actions Bar */}
      <div className="px-5 py-4 bg-slate-50 border-t-4 border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={handleLikeToggle}
            className={`flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-all border-2 border-[#1e293b] hover:translate-y-[-2px] active:translate-y-1 ${
              isLikedByMe 
                ? "bg-[#ffeae0] text-rose-500 vibrant-shadow-sm" 
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLikedByMe ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
            응원하기 {invention.likesCount > 0 ? invention.likesCount : "0"}
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer border-2 border-[#1e293b] transition-all hover:translate-y-[-2px] active:translate-y-1 ${
              showComments
                ? "bg-[#ebd1ff] text-indigo-800 vibrant-shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            협동 댓글 {comments.length > 0 ? comments.length : ""}
          </button>
        </div>
      </div>

      {/* Expandable Comments list */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t-4 border-[#1e293b] bg-[#fdfbf7] flex flex-col"
          >
            {/* Feed Comments lists */}
            <div className="max-h-60 overflow-y-auto p-4 space-y-3">
              {isLoadingComments ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <RefreshCw className="w-4 h-4 text-[#1e293b] animate-spin" />
                  <span className="text-xs font-sans text-slate-600 font-bold">친구들의 조언 불러오는 중...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-xs font-bold text-slate-500">아직 응원 댓글이 없어요. 🧸</p>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">첫 조언을 건네 우정을 쌓아보세요!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 text-xs font-sans items-start">
                    <img 
                      src={comment.authorPhoto} 
                      alt={comment.authorName}
                      className="w-8 h-8 rounded-full border-2 border-[#1e293b] shrink-0 mt-0.5"
                      referrePolicy="no-referrer"
                    />
                    <div className="flex-1 bg-white p-2.5 rounded-xl border-2 border-[#1e293b] relative">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-indigo-800">{comment.authorName}</span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {new Date(comment.createdAt).toLocaleDateString("ko-KR", { hour: "numeric", minute: "numeric" })}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-sans font-bold">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Warnings */}
            {commentWarning && (
              <div className="mx-4 mb-2 bg-amber-50 border-2 border-amber-300 rounded-xl p-2.5 flex items-start gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-xs text-amber-900 font-bold font-sans" id="comment-warning-text-box">
                  {commentWarning}
                </span>
              </div>
            )}

            {/* Input Form area */}
            <form onSubmit={handleAddComment} className="p-3 border-t-2 border-[#1e293b] bg-white flex gap-2">
              <input 
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="어려운 점을 도와주거나 상상력을 더해보세요!"
                className="flex-1 bg-slate-50 border-2 border-[#1e293b] rounded-xl py-2 px-3 focus:outline-none focus:bg-white text-xs text-slate-700 font-sans font-bold transition-all"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newCommentText.trim()}
                className="bg-[#ebd1ff] hover:bg-[#ffeae0] border-2 border-[#1e293b] text-slate-700 rounded-xl px-4 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-[#1e293b]" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
