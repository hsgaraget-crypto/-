import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Plus, LogOut, Lightbulb, Compass, Award, Star, BookOpen, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { Invention } from "./types";
import { subscribeToAuth, handleLoginWithGoogle, handleLogoutCurrent, fetchInventionsList, isRealFirebase } from "./firebase";
import RegisterInventionModal from "./components/RegisterInventionModal";
import InventionCard from "./components/InventionCard";
import FloatingMentor from "./components/FloatingMentor";

export default function App() {
  // Authentication status
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Inventions list state
  const [inventions, setInventions] = useState<Invention[]>([]);
  const [isFeeding, setIsFeeding] = useState(false);

  // Modal display control
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Banner announcement rotating list
  const ANNOUNCEMENTS = [
    "이번 주 협동 테마: 🌿 초록 환경과 지구를 소중히 지키는 스마트 기계 만들기!",
    "친구들의 새로운 발명품에 '응원하기' ❤️를 꾹 눌러 힘을 돋워주세요!",
    "반짝이 멘토 🤖봇이 오른쪽 아래에서 여러분을 기쁘게 기다리고 있대요!",
    "더 기발해지고 싶다구요? 'AI 반짝반짝 도우미'로 내 설명글을 업그레이드해요!"
  ];
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  // Rotate banner texts
  useEffect(() => {
    const inter = setInterval(() => {
      setAnnouncementIndex(prev => (prev + 1) % ANNOUNCEMENTS.length);
    }, 6000);
    return () => clearInterval(inter);
  }, []);

  // Listen to Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        loadAllInventions();
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch feed list
  const loadAllInventions = async () => {
    setIsFeeding(true);
    setErrorMessage(null);
    try {
      const feed = await fetchInventionsList();
      setInventions(feed);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("발명품 피드를 가져오지 못했어요. 잠시 후 새로고침해 주세요!");
    } finally {
      setIsFeeding(false);
    }
  };

  // Auth Button handler
  const handleSignIn = async () => {
    try {
      setErrorMessage(null);
      const user = await handleLoginWithGoogle();
      setCurrentUser(user);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("로그인 도중 에러가 생겼어요. 다시 한 번 버튼을 클릭해 주시겠어요?");
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      await handleLogoutCurrent();
      setCurrentUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for model updates
  const handleRegisterSuccess = (newInvention: Invention) => {
    setInventions(prev => [newInvention, ...prev]);
  };

  const handleInventionUpdate = (updated: Invention) => {
    setInventions(prev => prev.map(x => x.id === updated.id ? updated : x));
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-stretch relative font-sans text-[#1e293b]">
      
      {/* ----------------------------------------------------------------- */}
      {/* LANDING SCREEN (If student is not logged in) */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {!currentUser && !isAuthLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-center items-center py-12 px-4 bg-[#fdfbf7] min-h-screen"
          >
            <motion.div 
              initial={{ y: 20, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              className="w-full max-w-lg bg-white p-8 rounded-custom border-4 border-[#1e293b] vibrant-shadow text-center space-y-6 relative"
              id="landing-card"
            >
              {/* Crown Decorative badge */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#ffeae0] py-1.5 px-6 rounded-full border-3 border-[#1e293b] shadow-md text-xs font-bold font-sans text-[#1e293b] flex items-center gap-1.5 animate-pulse">
                <Star className="w-4 h-4 text-[#1e293b] fill-[#1e293b]" />
                창의력이 쑥쑥 크는 과학 놀이터 ✨
              </div>

              {/* Title Section */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-[#ebd1ff] rounded-full flex items-center justify-center border-3 border-[#1e293b] shadow-sm animate-spin-slow">
                    <span className="text-4xl">💡</span>
                  </div>
                </div>
                <h1 className="font-sans text-3xl font-black text-[#1e293b] tracking-tight">반짝반짝 발명 아틀리에</h1>
                <p className="text-md text-slate-705 font-bold leading-relaxed">
                  친구들의 상상력을 더해 세상을 놀라게 할<br/>
                  나만의 기발한 아이디어를 자랑해 볼까요?
                </p>
              </div>

              {/* Character illustrations info */}
              <div className="bg-[#e2f9e1] rounded-2xl p-4 border-2 border-[#1e293b] text-left space-y-3 font-sans">
                <div className="flex gap-2.5 items-start">
                  <div className="bg-white p-2 rounded-xl border border-[#1e293b] shrink-0 text-md">🎨</div>
                  <div>
                    <h4 className="text-sm font-black text-[#1e293b]">발명품 기록하고 보정하기</h4>
                    <p className="text-xs text-slate-800 font-bold">한 줄 간단 메모를 AI가 멋진 과학 제품 형태로 꾸며줘요!</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="bg-white p-2 rounded-xl border border-[#1e293b] shrink-0 text-md">💬</div>
                  <div>
                    <h4 className="text-sm font-black text-[#1e293b]">서로 칭찬하며 협업 소통</h4>
                    <p className="text-xs text-slate-800 font-bold">바퀴 달기, 날개 얹기 등 더 훌륭하게 자라도록 조언을 더해줘요.</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="bg-[#ebd1ff] p-2 rounded-xl border border-[#1e293b] shrink-0 text-md">🤖</div>
                  <div>
                    <h4 className="text-sm font-black text-[#1e293b]">귀여운 반짝이 AI 멘토</h4>
                    <p className="text-xs text-slate-800 font-bold">아두이노 센서와 코딩 원리를 스크래치 조립형 블록으로 배워요!</p>
                  </div>
                </div>
              </div>

              {/* Google Login button */}
              <div className="space-y-3">
                <button
                  onClick={handleSignIn}
                  className="w-full py-4 px-6 bg-[#ffeae0] hover:bg-[#ffd1c0] rounded-2xl font-black text-[#1e293b] shadow-md transition-all border-4 border-[#1e293b] hover:translate-y-[-2px] active:translate-y-1 text-md flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  <Sparkles className="w-5 h-5 text-indigo-700 animate-pulse" />
                  아틀리에 로그인하기
                </button>
                <div className="text-[11px] text-slate-500 font-bold">
                  * 가입 시 임의의 귀여운 가상 동물 아바타 프로필이 탄생합니다! 🦄🦥
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* AUTH STATUS LOADER */}
      {/* ----------------------------------------------------------------- */}
      {isAuthLoading && (
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen text-[#1e293b] gap-2 bg-[#fdfbf7]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1e293b]" />
          <p className="text-md font-sans font-black animate-pulse">아틀리에 문을 활짝 여는 중... 🚪✨</p>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MAIN APPLICATION CONSOLE (Authorized Student Workspace) */}
      {/* ----------------------------------------------------------------- */}
      {currentUser && !isAuthLoading && (
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <header className="sticky top-0 z-40 bg-white border-b-4 border-[#1e293b] px-4 py-4 shadow-sm">
            <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-2.5">
              
              {/* Logo / Brand Title */}
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2.5 rounded-full border-2 border-[#1e293b]">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#1e293b] leading-none">반짝반짝 발명 아틀리에</h1>
                  <p className="text-[11px] text-[#1e293b]/70 font-sans font-extrabold mt-1">Creative Elementary Idea Atelier</p>
                </div>
              </div>

              {/* Search Info bar / Status */}
              <div className="flex items-center gap-3">
                {/* Fallback Badge if Firebase not configured */}
                {!isRealFirebase && (
                  <span className="text-xs bg-[#e2f9e1] text-[#1e293b] rounded-full py-1 px-3 border-2 border-[#1e293b] font-bold hidden sm:inline-block shadow-xs">
                    🏠 로컬 탐사 보드 모드
                  </span>
                )}

                {/* Profile Widget */}
                <div className="flex items-center space-x-3 text-right">
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-[#1e293b] opacity-80 leading-none">어서오세요!</p>
                    <p className="text-sm font-black text-[#1e293b] mt-0.5">{currentUser.displayName} 어린이 발명가님</p>
                  </div>
                  <div className="w-11 h-11 rounded-full border-2 border-[#1e293b] overflow-hidden bg-[#ebd1ff] shadow-sm">
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Sign-out button */}
                <button 
                  onClick={handleLogout}
                  title="외출하기"
                  className="p-2 border-2 border-[#1e293b] bg-white hover:bg-[#ffeae0] rounded-xl transition-all font-black text-[#1e293b] cursor-pointer flex items-center justify-center active:translate-y-0.5 hover:translate-y-[-1px] shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          </header>

          {/* Core Body Layout */}
          <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1 flex flex-col lg:flex-row gap-8 items-start bg-[#fdfbf7]">
            
            {/* Left Column (Hall of fame & Interactive side panel widgets) */}
            <aside className="w-full lg:w-72 shrink-0 flex flex-col space-y-6">
              
              {/* Register Callout button widget */}
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-4 px-6 bg-[#ffeae0] hover:bg-[#ffd1c0] text-[#1e293b] border-4 border-[#1e293b] rounded-custom text-xl font-bold vibrant-shadow flex items-center justify-center space-x-2 transition-transform hover:scale-102 active:translate-y-1 cursor-pointer"
              >
                <span>➕</span> <span>발명품 자랑하기</span>
              </button>

              {/* Hall of Fame Custom Box */}
              <div className="bg-[#e2f9e1] border-4 border-[#1e293b] p-5 rounded-custom vibrant-shadow w-full">
                <h2 className="text-2xl font-black mb-4 flex items-center gap-1.5"><span className="text-2xl">🏆</span> 명예의 전당</h2>
                <ul className="space-y-3 font-bold text-md">
                  <li className="flex items-center justify-between bg-white/70 border-2 border-[#1e293b] p-2.5 rounded-xl shadow-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-rose-500">1위</span>
                      <span>하늘을 나는 신발</span>
                    </div>
                    <span className="text-xs">❤️ 52</span>
                  </li>
                  <li className="flex items-center justify-between bg-white/40 p-2.5 rounded-xl shadow-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-indigo-700">2위</span>
                      <span>자동 양치 로봇</span>
                    </div>
                    <span className="text-xs">❤️ 41</span>
                  </li>
                  <li className="flex items-center justify-between bg-white/40 p-2.5 rounded-xl shadow-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-amber-600">3위</span>
                      <span>말하는 화분</span>
                    </div>
                    <span className="text-xs">❤️ 28</span>
                  </li>
                </ul>
                <button 
                  onClick={() => alert("🎉 나의 꼬마 발명가 랭킹은 공동 1위입니다! 앞으로도 기발한 생각들을 많이 들려주세요!")}
                  className="mt-5 w-full py-2.5 bg-[#ebd1ff] hover:bg-[#d8b4fe] border-2 border-[#1e293b] rounded-2xl font-bold transition-all hover:translate-y-[-1px] active:translate-y-0.5 cursor-pointer text-xs"
                >
                  내 랭킹 확인하기
                </button>
              </div>

              {/* Today's challenge widget */}
              <div className="bg-[#1e293b] text-white p-5 rounded-custom vibrant-shadow w-full">
                <p className="text-xs text-[#e2f9e1] mb-1 font-bold tracking-wider">오늘의 발명 미션 💡</p>
                <p className="text-lg leading-snug font-black text-white">
                  "비 오는 날에도 가방이 절대 젖지 않도록 막아주는 새로운 가방을 상상해 볼까요?"
                </p>
              </div>

            </aside>

            {/* Right Main Feed Section */}
            <section className="flex-1 w-full flex flex-col space-y-6">
              
              {/* 1. Rotating Announcement Banner */}
              <motion.div 
                key={announcementIndex}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#ffeae0] rounded-custom p-4 border-4 border-[#1e293b] flex gap-3 items-center justify-between vibrant-shadow sm:flex-row flex-col text-center sm:text-left gap-y-3"
              >
                <div className="flex items-center gap-2.5 text-[#1e293b]">
                  <Award className="w-6 h-6 text-indigo-700 fill-indigo-100 shrink-0" />
                  <span className="text-sm font-black leading-snug">{ANNOUNCEMENTS[announcementIndex]}</span>
                </div>
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="bg-white hover:bg-slate-50 text-[#1e293b] border-2 border-[#1e293b] px-4 py-1.5 rounded-full text-xs font-bold transition-transform hover:scale-105 active:translate-y-0.5 cursor-pointer shrink-0"
                >
                  나도 아이디어 기부하기! ✨
                </button>
              </motion.div>

              {/* Error messages banner if present */}
              {errorMessage && (
                <div className="bg-rose-100 border-2 border-[#1e293b] rounded-2xl p-4 flex gap-2 text-rose-955 text-sm font-bold items-center">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-700" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Header Titles for Content Section */}
              <div className="flex justify-between items-end flex-wrap gap-3 pb-2">
                <div className="space-y-1">
                  <h3 className="font-sans text-3xl font-black text-[#1e293b] flex items-center gap-1.5 leading-none">
                    <Lightbulb className="w-7 h-7 text-amber-500 fill-amber-100" />
                    친구들의 반짝이는 아이디어 ✨
                  </h3>
                  <p className="text-sm text-slate-600 font-bold pl-8">초등학교 과학 공작교실 발명 아바타 친구들이 모였어요.</p>
                </div>

                {/* Refresher Action Box */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadAllInventions}
                    disabled={isFeeding}
                    className="flex items-center justify-center p-2 bg-white border-2 border-[#1e293b] hover:bg-slate-50 text-[#1e293b] rounded-xl cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0.5"
                    title="피드 새로고침"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFeeding ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#ebd1ff] hover:bg-[#d8b4fe] border-2 border-[#1e293b] text-[#1e293b] rounded-xl text-xs font-bold transition-transform hover:scale-102 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3px]" />
                    새 발명 자랑하기
                  </button>
                </div>
              </div>

              {/* Feed Card Grid Container */}
              {isFeeding && inventions.length === 0 ? (
                <div className="flex-1 min-h-60 flex flex-col justify-center items-center text-[#1e293b] gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#ebd1ff]" />
                  <p className="text-sm font-black">친구들의 상상력을 신나게 물뿌려 자라게 하는 중... 🌱</p>
                </div>
              ) : inventions.length === 0 ? (
                <div className="flex-1 bg-white border-4 border-dashed border-[#1e293b] rounded-custom py-16 text-center text-slate-500 space-y-3 vibrant-shadow">
                  <p className="text-lg font-black text-[#1e293b]">아틀리에에 첫 번째 자랑꾼이 되어보세요! 🚀</p>
                  <p className="text-xs font-bold">오른쪽 위의 '새 발명품 등록' 버튼이나 아래 반짝이 멘토 버튼을 눌러보세요.</p>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="px-6 py-3 bg-[#ebd1ff] hover:bg-[#d8b4fe] border-2 border-[#1e293b] font-black text-sm rounded-full cursor-pointer "
                    >
                      내 발명 아이디어 뽐내기 💡
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 pb-8" id="invention-feed-grid">
                  {inventions.map((item) => (
                    <InventionCard 
                      key={item.id}
                      invention={item}
                      currentUser={currentUser}
                      onUpdateInvention={handleInventionUpdate}
                    />
                  ))}
                </div>
              )}

              {/* Workspace disclaimer footer */}
              <footer className="pt-8 pb-4 text-center text-xs text-slate-500 font-bold space-y-1">
                <p>🌱 반짝반짝 발명 아틀리에는 초등학생 친구들의 긍정적인 말과 기발한 창의성을 열렬히 응원합니다!</p>
                <p>© 2026 Bright Inventors Atelier. All rights reserved.</p>
              </footer>

            </section>

          </main>

          {/* Floating Register triggering modal and Floating AI Star chatbot widget */}
          <RegisterInventionModal 
            isOpen={isRegisterOpen}
            onClose={() => setIsRegisterOpen(false)}
            onSuccess={handleRegisterSuccess}
            currentUser={currentUser}
          />

          {/* Star Mentor floating widget */}
          <FloatingMentor />

        </div>
      )}
    </div>
  );
}
