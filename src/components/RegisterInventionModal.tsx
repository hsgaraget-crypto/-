import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trash2, Image as ImageIcon, School, AlertCircle, Sparkle, Target, CheckCircle } from "lucide-react";
import { Invention } from "../types";
import { createInventionDoc } from "../firebase";

const PRESET_SKETCHES = [
  { name: "레고 조립도 🧱", url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop" },
  { name: "과학 로봇 설계 🤖", url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&auto=format&fit=crop" },
  { name: "빛나는 발상 전구 💡", url: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=400&auto=format&fit=crop" },
  { name: "우주 왕복선 스푼 🚀", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop" },
  { name: "친환경 그린 보틀 🌱", url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=400&auto=format&fit=crop" },
  { name: "점토 촉감 모형 🪁", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop" }
];

interface RegisterInventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInvention: Invention) => void;
  currentUser: { uid: string; displayName: string; photoURL: string };
}

export default function RegisterInventionModal({ isOpen, onClose, onSuccess, currentUser }: RegisterInventionModalProps) {
  const [title, setTitle] = useState("");
  const [shortIdea, setShortIdea] = useState("");
  const [description, setDescription] = useState("");
  const [slogan, setSlogan] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [imageUrl, setImageUrl] = useState(PRESET_SKETCHES[2].url); // Default to lightbulb

  // UI Flow Status
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isPolishComplete, setIsPolishComplete] = useState(false);

  // File to Base64 hander
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Sparkle helper call
  const handleAISparkleHelper = async () => {
    if (!shortIdea.trim()) {
      setWarningMessage("먼저 '한 줄 아이디어'에 간단하게라도 생각을 적어주세요! ✨");
      return;
    }
    setIsPolishing(true);
    setWarningMessage(null);
    setIsPolishComplete(false);

    try {
      const res = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, shortIdea })
      });
      const data = await res.json();
      if (res.ok) {
        setDescription(data.description);
        setSlogan(data.slogan);
        setTargetAudience(data.targetAudience);
        setIsPolishComplete(true);
      } else {
        setWarningMessage(data.error || "AI 도우미가 피로해요. 잠시만 기다렸다 다시 눌러줘요!");
      }
    } catch (err) {
      console.error(err);
      setWarningMessage("서버 연결에 실패했어요. 인터넷 상태를 확인해 주세요!");
    } finally {
      setIsPolishing(false);
    }
  };

  // Main Submit handler (Safety Guard scans here!)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shortIdea.trim()) {
      setWarningMessage("발명품 이름과 아이디어를 모두 채워주세요! 🎒");
      return;
    }

    setIsSubmitting(true);
    setWarningMessage(null);

    try {
      // 1. Safety verification
      const fullTextToScan = `${title} ${shortIdea} ${description} ${slogan}`;
      const safetyRes = await fetch("/api/ai/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullTextToScan })
      });
      const safetyData = await safetyRes.json();

      if (!safetyData.isSafe) {
        // Flagged! Show elegant kid friendly pop-up alert
        setWarningMessage(safetyData.reason || "우리 서로 이쁜 말만 사용해요! 다시 작성해 볼까요? ✨");
        setIsSubmitting(false);
        return;
      }

      // If description hasn't been polished, fill-in with simple defaults safely
      const finalDesc = description.trim() || `우리의 소중한 창의적 첫 디딤돌! 친구들, 이 멋진 "${title}" 발명품에 소중한 응원과 창의적인 피드백 한 마디씩 가득 남겨주세요!`;
      const finalSlogan = slogan.trim() || `✨ 상상이 현실이 되는, ${title}! ✨`;
      const finalTarget = targetAudience.trim() || "세상을 즐겁게 할 모든 초등학생 친구들!";

      // 2. Add to database
      const newDoc = await createInventionDoc({
        title,
        shortIdea,
        description: finalDesc,
        slogan: finalSlogan,
        targetAudience: finalTarget,
        imageUrl,
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorPhoto: currentUser.photoURL
      });

      onSuccess(newDoc);
      // Reset State
      setTitle("");
      setShortIdea("");
      setDescription("");
      setSlogan("");
      setTargetAudience("");
      setImageUrl(PRESET_SKETCHES[2].url);
      setIsPolishComplete(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setWarningMessage("발명품 등록 도중 에러가 발생했어요: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl bg-[#fdfbf7] rounded-custom overflow-hidden shadow-2xl border-4 border-[#1e293b] vibrant-shadow max-h-[90vh] flex flex-col"
        id="register-invention-modal-container"
      >
        {/* Modal Top Header */}
        <div className="bg-[#ffeae0] py-4 px-6 flex justify-between items-center border-b-4 border-[#1e293b]">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">💡</span>
            <h3 className="font-sans text-2xl font-black text-[#1e293b]">나만의 반짝이는 발명품 자랑하기</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-[#1e293b] hover:bg-[#ebd1ff] font-sans text-sm font-black bg-white border-2 border-[#1e293b] rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#fdfbf7]">
          {/* Warning Banner */}
          <AnimatePresence>
            {warningMessage && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-amber-100 border-2 border-[#1e293b] text-amber-900 rounded-2xl p-4 flex gap-2 items-start"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <span className="text-sm font-sans font-bold" id="warning-text-container">{warningMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title input */}
          <div className="space-y-1">
            <label className="block text-md font-bold text-[#1e293b]">1. 멋진 발명품 이름 ✨</label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 물이 안 새어 나오는 슬라임 미끄럼틀"
              className="w-full bg-white border-2 border-[#1e293b] rounded-xl py-3 px-4 focus:outline-none focus:bg-[#ebd1ff]/10 transition-all text-slate-850 text-sm font-sans font-bold shadow-sm"
            />
          </div>

          {/* Short idea + Sparkle tool side of build */}
          <div className="space-y-1">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-2">
              <label className="block text-md font-bold text-[#1e293b]">2. 한 줄 아이디어 설명 📝</label>
              
              <button
                type="button"
                onClick={handleAISparkleHelper}
                disabled={isPolishing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ebd1ff] hover:bg-[#d8b4fe] text-[#1e293b] border-2 border-[#1e293b] rounded-full text-xs font-bold transition-all hover:scale-105 shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-indigo-700 ${isPolishing ? 'animate-spin' : ''}`} />
                AI 반짝반짝 도우미로 다듬기
              </button>
            </div>
            
            <textarea
              required
              rows={2}
              value={shortIdea}
              onChange={(e) => setShortIdea(e.target.value)}
              placeholder="예: 슬라임을 넣어 노는데 주머니 모양이라 뒤집어도 절대 떨어지거나 주변에 안 묻게 만든 장난감틀"
              className="w-full bg-white border-2 border-[#1e293b] rounded-xl py-2 px-4 focus:outline-none focus:bg-[#ebd1ff]/10 transition-all text-slate-850 text-sm font-sans font-bold shadow-sm"
            />
            <p className="text-xs text-slate-500 font-sans pl-1 font-bold">✨ 간단한 생각만 적고 우측의 AI 버튼을 누르면 멋지게 변신해요!</p>
          </div>

          {/* Polished Box Result */}
          <AnimatePresence>
            {(isPolishing || description) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-2xl p-4 border-2 border-[#1e293b] space-y-3 shadow-md"
              >
                <div className="flex items-center gap-1.5 text-[#1e293b]">
                  <span className="text-md font-black">🪄 AI 반짝반짝 도우미가 완성한 고품격 설명</span>
                  {isPolishing && <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />}
                </div>

                {isPolishing ? (
                  <div className="space-y-2 py-2">
                    <div className="h-3 w-5/6 bg-indigo-100 animate-pulse rounded" />
                    <div className="h-3 w-full bg-indigo-100 animate-pulse rounded" />
                    <div className="h-3 w-2/3 bg-indigo-100 animate-pulse rounded" />
                  </div>
                ) : (
                  <div className="space-y-3 font-sans text-sm">
                    <div className="bg-[#ebd1ff]/20 rounded-xl p-3 border-2 border-dashed border-[#ebd1ff] text-slate-800 leading-relaxed font-bold">
                      {description}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-[#ffeae0]/40 p-2.5 rounded-xl border-2 border-[#1e293b] flex gap-1.5 items-start">
                        <Sparkle className="w-4 h-4 text-orange-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[11px] text-slate-500 font-bold">제품 슬로건</p>
                          <p className="text-xs font-black text-[#1e293b]">{slogan}</p>
                        </div>
                      </div>
                      <div className="bg-[#e2f9e1]/40 p-2.5 rounded-xl border-2 border-[#1e293b] flex gap-1.5 items-start">
                        <Target className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[11px] text-slate-500 font-bold">추천 대상 친구들</p>
                          <p className="text-xs font-black text-[#1e293b]">{targetAudience}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Model / Photo Upload */}
          <div className="space-y-2">
            <label className="block text-md font-bold text-[#1e293b]">3. 상상 스케치 또는 작품 사진 선택 🎨</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Preview Box with Upload Button Overlay */}
              <div className="col-span-1 border-4 border-dashed border-[#1e293b] rounded-2xl h-36 flex flex-col justify-center items-center relative overflow-hidden bg-white group">
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" referrePolicy="no-referrer" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <label className="px-3 py-1.5 bg-white text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-100 shadow border-2 border-[#1e293b]">
                        사진 바꾸기
                        <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 text-slate-400 mb-1" />
                    <label className="px-2.5 py-1 bg-white text-[11px] border-2 border-[#1e293b] rounded-md shadow cursor-pointer font-bold hover:bg-slate-50">
                      직접 업로드
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* Presets picker */}
              <div className="md:col-span-2 border-2 border-[#1e293b] rounded-2xl p-3 bg-white">
                <p className="text-xs text-slate-500 font-sans mb-2 font-bold pl-1">💡 그릴 스케치가 없다면 아래 추천 이미지를 콕 눌러보세요!</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_SKETCHES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(p.url)}
                      className={`relative rounded-xl overflow-hidden h-12 border-2 transition-all cursor-pointer ${imageUrl === p.url ? 'border-[#1e293b] ring-2 ring-[#ebd1ff]' : 'border-transparent hover:scale-105'}`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover grayscale-10" referrePolicy="no-referrer" />
                      <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold bg-slate-900/50 py-0.5 px-1.5 rounded-full">{p.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Area */}
        <div className="p-4 bg-white border-t-4 border-[#1e293b] flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-slate-700 font-sans text-sm font-black bg-white border-2 border-[#1e293b] hover:bg-slate-150 transition-all cursor-pointer hover:translate-y-[-1px]"
          >
            취소할래요
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isPolishing}
            className="px-6 py-2.5 rounded-2xl bg-[#ebd1ff] hover:bg-[#ffeae0] text-[#1e293b] font-sans font-black text-sm border-2 border-[#1e293b] shadow-md transition-all cursor-pointer active:translate-y-1 hover:translate-y-[-2px] disabled:opacity-50"
          >
            {isSubmitting ? "아틀리에 등록 중... ✨" : "아틀리에에 자랑하기! 🚀"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
