import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Trash2,
  Zap,
  Cpu,
  BrainCircuit,
  ChefHat,
  ShoppingBag,
  Coins,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Language, ChatMessage, GeminiModelId, ChatRolePersona } from '../types';

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  cartCount?: number;
  cartSummary?: string;
  onAddToCartByName?: (productName: string) => void;
}

const STARTER_PROMPTS: Record<Language, Record<ChatRolePersona, string[]>> = {
  en: {
    shopper: [
      "What are the best fresh deals in D-mart today?",
      "Can you suggest ingredients for a family of 4 dinner?",
      "Which items can I combine to qualify for free delivery (RM60)?",
    ],
    chef: [
      "How to cook authentic Malaysian Ayam Masak Merah?",
      "Give me a 15-minute quick dinner recipe using cabbage & chicken.",
      "What fresh seafood dishes can I prepare with Siakap fish?",
    ],
    budget: [
      "Plan a RM 50 weekly groceries list for 2 people.",
      "How do I use vouchers DMART10 and FREEDEL?",
      "What are the best value staple foods to stock up on?",
    ],
    halal: [
      "Are all fresh meats and poultry 100% Halal certified?",
      "What are high-protein healthy breakfast options available?",
      "Recommend vegetarian alternatives for daily cooking.",
    ],
  },
  ms: {
    shopper: [
      "Apakah tawaran barangan segar terbaik di D-mart hari ini?",
      "Cadangkan senarai bahan dapur untuk makan malam keluarga 4 orang.",
      "Barangan apa yang sesuai ditambah untuk dapatkan penghantaran percuma (RM60)?",
    ],
    chef: [
      "Bagaimana cara memasak Ayam Masak Merah asli yang sedap?",
      "Berikan resepi pantas 15 minit menggunakan kobis dan ayam segar.",
      "Apakah hidangan laut yang sesuai dimasak dengan Ikan Siakap segar?",
    ],
    budget: [
      "Rancangkan senarai barangan dapur bajet RM 50 untuk 2 orang.",
      "Bagaimana cara gunakan baucar DMART10 dan FREEDEL hari ini?",
      "Apakah barangan asas paling jimat untuk dibeli secara pukal?",
    ],
    halal: [
      "Adakah semua daging ayam dan lembu dijamin 100% Halal?",
      "Apakah pilihan sarapan berkhasiat tinggi protein yang ada?",
      "Cadangkan bahan masakan sihat untuk hidangan harian.",
    ],
  },
};

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  language,
  cartSummary = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('dmart_gemini_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'msg-welcome',
        role: 'model',
        text:
          language === 'ms'
            ? 'Salam mesra! Saya Pembantu AI D-mart Pasaraya. Anda boleh tanya saya tentang resepi lazat, barangan dapur segar, petua jimat, atau padanan baucar!'
            : 'Hello! I am your D-mart Pasaraya AI Assistant. Ask me anything about fresh ingredients, recipe ideas, budget shopping, or how to save with vouchers!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash',
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<ChatRolePersona>('shopper');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-save chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dmart_gemini_chat', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-usr`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Multi-turn message history passed to server API
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
          roleId: selectedRole,
          language,
          cartSummary,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'model',
        text: data.reply || (language === 'ms' ? 'Maaf, tiada jawapan diterima.' : 'Sorry, no response received.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
        isDemoFallback: Boolean(data.isDemoFallback),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'model',
        text:
          language === 'ms'
            ? '⚠️ Maaf, berlaku gangguan semasa menghubungi pelayan AI Gemini. Sila pastikan sambungan internet aktif dan cuba sebentar lagi.'
            : '⚠️ Apologies, encountered an issue communicating with the Gemini AI service. Please check your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleClearChat = () => {
    const initial: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'model',
      text:
        language === 'ms'
          ? 'Perbualan telah dibersihkan. Bagaimana saya boleh bantu anda membeli-belah di D-mart hari ini?'
          : 'Conversation cleared. How can I help with your D-mart groceries shopping today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: selectedModel,
    };
    setMessages([initial]);
    localStorage.removeItem('dmart_gemini_chat');
  };

  const rolesInfo: Record<
    ChatRolePersona,
    { title: string; icon: React.ReactNode; desc: string }
  > = {
    shopper: {
      title: language === 'ms' ? 'Pembantu Belanja' : 'Personal Shopper',
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
      desc: language === 'ms' ? 'Cadangan produk & barang dapur' : 'Grocery recommendations & picks',
    },
    chef: {
      title: language === 'ms' ? 'Chef Resepi' : 'Chef & Recipes',
      icon: <ChefHat className="w-3.5 h-3.5" />,
      desc: language === 'ms' ? 'Idea masakan & bahan segera' : 'Cooking instructions & meals',
    },
    budget: {
      title: language === 'ms' ? 'Penjimat Bajet' : 'Budget Saver',
      icon: <Coins className="w-3.5 h-3.5" />,
      desc: language === 'ms' ? 'Jimat belanja & baucar diskaun' : 'Deals, vouchers & max savings',
    },
    halal: {
      title: language === 'ms' ? 'Pakar Halal & Diet' : 'Halal & Dietary',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      desc: language === 'ms' ? 'Daging 100% halal & makanan sihat' : '100% Halal certified & nutrition',
    },
  };

  const modelsInfo: Record<
    GeminiModelId,
    { label: string; tag: string; icon: React.ReactNode }
  > = {
    'gemini-3.5-flash': {
      label: 'Gemini 3.5 Flash',
      tag: language === 'ms' ? 'Umum & Seimbang' : 'General & Balanced',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-600" />,
    },
    'gemini-3.1-flash-lite': {
      label: 'Gemini 3.1 Flash Lite',
      tag: language === 'ms' ? 'Super Pantas' : 'Ultra Fast',
      icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
    },
    'gemini-3.1-pro-preview': {
      label: 'Gemini 3.1 Pro',
      tag: language === 'ms' ? 'Penaakulan Mendalam' : 'Complex Reasoning',
      icon: <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />,
    },
    'gemini-3.8-flash': {
      label: 'Gemini 3.8 Flash',
      tag: language === 'ms' ? 'Terkini' : 'Latest',
      icon: <Cpu className="w-3.5 h-3.5 text-teal-600" />,
    },
  };

  const currentPrompts = STARTER_PROMPTS[language][selectedRole] || [];

  return (
    <div
      id="gemini-chatbot-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemini-modal-title"
    >
      <div
        id="gemini-chatbot-card"
        className="bg-white w-full sm:max-w-xl md:max-w-2xl h-[92vh] sm:h-[650px] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-emerald-100 animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <header className="px-4 py-3 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 id="gemini-modal-title" className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                  {language === 'ms' ? 'Pembantu Pintar D-mart' : 'D-mart AI Assistant'}
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 truncate flex items-center gap-1">
                <span>{rolesInfo[selectedRole].title}</span>
                <span>•</span>
                <span className="text-emerald-200">{modelsInfo[selectedModel].label}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Role & Model selector dropdown toggle */}
            <button
              type="button"
              onClick={() => setShowSettingsDropdown((prev) => !prev)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title={language === 'ms' ? 'Tukar Model & Peranan' : 'Change Model & Role'}
              aria-label="Settings"
            >
              {rolesInfo[selectedRole].icon}
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Clear chat history */}
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 rounded-lg hover:bg-white/15 text-emerald-100 hover:text-white transition-colors cursor-pointer"
              title={language === 'ms' ? 'Bersihkan Sembang' : 'Clear Chat History'}
              aria-label="Clear Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer ml-1"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Collapsible Settings Drawer: Model & System Role Persona Selection */}
        {showSettingsDropdown && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 animate-in slide-in-from-top-2 duration-150 shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Role Persona selector */}
              <div>
                <label className="text-[11px] font-bold text-emerald-900 block mb-1">
                  {language === 'ms' ? 'Peranan Pembantu (System Role):' : 'Assistant Persona (System Role):'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(rolesInfo) as ChatRolePersona[]).map((rKey) => (
                    <button
                      key={rKey}
                      type="button"
                      onClick={() => {
                        setSelectedRole(rKey);
                        setShowSettingsDropdown(false);
                      }}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left text-[11px] font-semibold transition-all cursor-pointer ${
                        selectedRole === rKey
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                          : 'border-emerald-200 bg-white text-emerald-950 hover:bg-emerald-100/60'
                      }`}
                    >
                      {rolesInfo[rKey].icon}
                      <span className="truncate">{rolesInfo[rKey].title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gemini Model selector */}
              <div>
                <label className="text-[11px] font-bold text-emerald-900 block mb-1">
                  {language === 'ms' ? 'Model Gemini:' : 'Gemini Model:'}
                </label>
                <div className="space-y-1">
                  {(Object.keys(modelsInfo) as GeminiModelId[]).map((mKey) => (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => {
                        setSelectedModel(mKey);
                        setShowSettingsDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                        selectedModel === mKey
                          ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'border-emerald-200 bg-white text-gray-800 hover:bg-emerald-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {modelsInfo[mKey].icon}
                        <span className="truncate font-bold">{modelsInfo[mKey].label}</span>
                      </div>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                          selectedModel === mKey
                            ? 'bg-emerald-800 text-emerald-100'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {modelsInfo[mKey].tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Thread (Scrollable) */}
        <div
          id="gemini-chat-scroll-container"
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50/70"
        >
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-start ${isModel ? 'justify-start' : 'justify-end'}`}
              >
                {isModel && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isModel
                      ? 'bg-white text-gray-900 border border-emerald-100/80 rounded-tl-xs'
                      : 'bg-emerald-600 text-white rounded-tr-xs'
                  }`}
                >
                  {isModel ? (
                    <div className="markdown-body space-y-2 prose prose-xs sm:prose-sm max-w-none prose-p:my-1 prose-headings:font-bold prose-headings:my-1.5 prose-ul:my-1 prose-li:my-0.5">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}

                  <div
                    className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${
                      isModel ? 'text-gray-400' : 'text-emerald-100'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && isModel && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{msg.modelUsed}</span>
                      </>
                    )}
                  </div>
                </div>

                {!isModel && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Assistant Loading Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 items-start justify-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-emerald-100 rounded-2xl rounded-tl-xs p-3 shadow-2xs flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>
                  {language === 'ms' ? 'Sedang berfikir & menyediakan jawapan...' : 'Consulting D-mart AI...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            {language === 'ms' ? 'Cuba ini:' : 'Quick:'}
          </span>
          {currentPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-200 text-emerald-900 border border-emerald-200 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0 font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-2.5 sm:p-3 bg-white border-t border-gray-200/80 flex items-center gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={
              language === 'ms'
                ? 'Tanya tentang resepi, barangan segar, atau diskaun...'
                : 'Ask about recipes, fresh produce, or discounts...'
            }
            className="flex-1 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 active:bg-emerald-800 text-white disabled:text-gray-400 p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'ms' ? 'Hantar' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
