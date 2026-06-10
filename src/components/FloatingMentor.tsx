import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Sparkles, Send, Bot, RefreshCw, X, HelpCircle, FileCode } from "lucide-react";
import { ChatMessage } from "../types";

export default function FloatingMentor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      text: "안녕 친구! 🌟 나는 너의 발명 도우미 로봇 **'반짝이'**란다! 🤖✨\n혹시 발명품을 직접 움직이거나 소프트웨어 코딩, 센서 조종하는 방법이 궁금하니?\n아니면 특별한 아이디어를 더 빛나게 만들고 싶어?\n편하게 물어보면 내 목소리 마법 블록을 통해 가르쳐줄게!",
      createdAt: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Quick suggestions for elementary school children
  const SUGGESTIONS = [
    "센서로 밤에 불 켜지는 아파트 고치기 💡",
    "마이크로비트로 움직이는 양말 수거함 만들기 🧦",
    "스마트 자동 배식기의 블록 코드를 그려줘 🐕"
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Append user query
    const userMsg: ChatMessage = {
      id: "msg-" + Math.random().toString(36).substring(7),
      role: "user",
      text: textToSend,
      createdAt: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // Package conversation log in correct template for servers
      const chatHistory = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/ai/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, chatHistory })
      });
      const data = await res.json();
      
      const assistantMsg: ChatMessage = {
        id: "msg-" + Math.random().toString(36).substring(7),
        role: "assistant",
        text: data.text || "반짝이 시스템 충전 중입니다. 다시 한 번 물어주세요! 🍒",
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: "msg-err",
        role: "assistant",
        text: "앗! 정전이 되었나봐요! 다시 질문해주면 번개같은 아이디어를 알려줄게요! ⚡",
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.85 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[90vw] sm:w-[380px] h-[500px] bg-white rounded-custom shadow-2xl border-4 border-[#1e293b] vibrant-shadow overflow-hidden mb-4 flex flex-col"
            id="mentor-chat-panel"
          >
            {/* Header */}
            <div className="bg-[#ffeae0] p-4 flex justify-between items-center border-b-4 border-[#1e293b]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border-2 border-[#1e293b] animate-bounce">
                  <span className="text-lg">🤖</span>
                </div>
                <div>
                  <h4 className="font-sans font-black text-sm text-[#1e293b]">반짝이 발명 멘토</h4>
                  <p className="text-[11px] text-[#1e293b] font-bold">궁금한 걸 무엇이든 물어봐!</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white hover:bg-slate-100 border-2 border-[#1e293b] rounded-full flex items-center justify-center text-slate-850 font-black transition-transform hover:scale-105 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdfbf7]">
              {messages.map((m) => {
                const isAssistant = m.role === "assistant";
                return (
                  <div key={m.id} className={`flex gap-2 ${isAssistant ? "justify-start" : "justify-end"}`}>
                    {isAssistant && (
                      <div className="w-8 h-8 rounded-xl bg-[#ebd1ff] border-2 border-[#1e293b] flex items-center justify-center shadow-xs shrink-0 select-none text-xs">
                        🤖
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed font-sans border-2 border-[#1e293b] font-bold ${
                      isAssistant 
                        ? "bg-white text-slate-800 rounded-tl-none" 
                        : "bg-[#ebd1ff] text-slate-850 rounded-tr-none"
                    }`}>
                      {/* Message Content Rendered Simply */}
                      <div className="whitespace-pre-wrap break-words">
                        {m.text.split("\n").map((line, idx) => {
                          // Recognize Scratch Block Indicators to highlight visually
                          if (line.includes("[") && line.includes("]")) {
                            return (
                              <div key={idx} className="my-1.5 py-1.5 px-2.5 bg-emerald-100 text-emerald-900 border-2 border-[#1e293b] font-mono text-[11px] rounded-xl font-bold flex items-center gap-1.5">
                                <FileCode className="w-4 h-4 shrink-0 text-[#1e293b]" />
                                {line}
                              </div>
                            );
                          }
                          return <div key={idx} className="mb-0.5">{line}</div>;
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 border-2 border-[#1e293b] flex items-center justify-center shadow-xs shrink-0 select-none text-xs animate-spin" />
                  <div className="bg-white text-slate-500 rounded-2xl rounded-tl-none p-3 border-2 border-[#1e293b] text-xs font-bold font-sans">
                    생각 전구 충전하는 중... ⚡💡
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Suggestions Cards */}
            <div className="px-3 py-2 bg-slate-50 border-t-2 border-[#1e293b] flex gap-1.5 overflow-x-auto whitespace-nowrap min-h-11">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="px-3 py-1 bg-white hover:bg-orange-50 border-2 border-[#1e293b] text-xs text-slate-700 font-bold font-sans rounded-full transition-all hover:scale-102 shrink-0 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="p-3 bg-white border-t-2 border-[#1e293b] flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="궁금한 걸 속 시원하게 물어보세요!"
                className="flex-1 bg-slate-50 border-2 border-[#1e293b] rounded-xl px-4 py-2 text-xs text-slate-700 font-sans font-bold focus:outline-none focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={isTyping || !inputText.trim()}
                className="w-10 h-10 bg-[#ffeae0] hover:bg-orange-100 border-2 border-[#1e293b] text-slate-800 rounded-xl flex items-center justify-center transition-all hover:scale-105 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-[#1e293b]" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button Orbit Star */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-[#e2f9e1] hover:bg-[#d4f8d3] text-indigo-700 w-16 h-16 rounded-full flex items-center justify-center border-4 border-[#1e293b] vibrant-shadow select-none transition-all cursor-pointer group"
        id="floating-mentor-trigger-button"
      >
        <Bot className="w-8 h-8 text-[#1e293b] group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#ebd1ff] justify-content flex items-center justify-center text-[8px] text-[#1e293b] font-bold font-sans border border-[#1e293b]">⭐</span>
        </span>
      </motion.button>
    </div>
  );
}
