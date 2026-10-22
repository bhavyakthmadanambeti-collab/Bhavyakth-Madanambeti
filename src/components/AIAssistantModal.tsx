import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Upload, X, Bot, User, Gem, ShieldCheck, Scale, Award } from 'lucide-react';
import { api } from '../services/api.ts';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToShop?: (category?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  imagePreview?: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateToShop,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Namaste! I am "Ratna Vidya", your personal Master Gemologist and Royal Jewellery Consultant at MPR JEWELLERY. How may I assist you today? I can guide you on 22K BIS 916 Gold purity & hallmarking, Certified VVS Diamonds, 925 Silver puja articles, bridal muhurtham styling, or analyze your outfit photo to recommend matching jewellery!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Explain 22K (916) vs 18K Gold purity & HUID',
    'How do I choose a certified solitaire diamond?',
    'Recommend wedding bridal jewellery within ₹5 Lakhs',
    'What are the auspicious Navratna gemstones?',
    'Care guide for 925 sterling silver payals',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text || 'Please analyze this photo for jewellery matching recommendations.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: selectedImage || undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      let reply = '';
      if (selectedImage) {
        reply = await api.appraiseImage(selectedImage, text);
        setSelectedImage(null);
      } else {
        reply = await api.askAiConsultant(text);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Namaste! I encountered a momentary connection issue. All MPR collections are 100% BIS 916 Hallmarked and certified. Please feel free to ask your question again or connect with our master karigar on WhatsApp.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#C69A39]/40 flex flex-col h-[90vh] max-h-[750px] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#23140C] via-[#2F1A0F] to-[#23140C] text-[#FDFBF7] px-6 py-4 flex items-center justify-between border-b border-[#C69A39]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] flex items-center justify-center text-[#170B05] shadow-lg border border-[#E7C979]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-[#FDFBF7] tracking-wide">
                  Ratna Vidya AI
                </h3>
                <span className="text-[10px] bg-[#C69A39]/30 text-[#E7C979] border border-[#C69A39]/50 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Gold & Diamond Expert
                </span>
              </div>
              <p className="text-xs text-[#E7C979]/80 font-sans">
                MPR Royal Jewellery & Gemological Styling Concierge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#FDFBF7] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Badges Bar */}
        <div className="bg-[#F8F3EA] px-6 py-2 border-b border-[#C69A39]/20 flex items-center justify-between text-[11px] text-[#3D2214] overflow-x-auto gap-4">
          <div className="flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C69A39]" />
            <span>BIS 916 Hallmarking</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Award className="w-3.5 h-3.5 text-[#C69A39]" />
            <span>IGI Certified Diamonds</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Gem className="w-3.5 h-3.5 text-[#C69A39]" />
            <span>Vedic Navratna Advisory</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Scale className="w-3.5 h-3.5 text-[#C69A39]" />
            <span>Live Rate Valuation</span>
          </div>
        </div>

        {/* Chat Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans bg-[#FDFBF7]">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-[#23140C] border border-[#C69A39] flex items-center justify-center text-[#E7C979] shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-[#23140C] text-[#FDFBF7] rounded-tr-none border border-[#C69A39]/30'
                    : 'bg-[#F7F2E9] text-[#23140C] rounded-tl-none border border-[#C69A39]/20'
                }`}
              >
                {msg.imagePreview && (
                  <div className="mb-2.5 rounded-lg overflow-hidden border border-white/20 max-w-[200px]">
                    <img
                      src={msg.imagePreview}
                      alt="Uploaded outfit/jewellery"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-line font-normal">
                  {msg.text}
                </div>
                <div
                  className={`text-[10px] mt-1.5 ${
                    msg.sender === 'user' ? 'text-[#E7C979]/70 text-right' : 'text-[#3D2214]/60 text-left'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#C69A39] text-[#170B05] flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-[#23140C] border border-[#C69A39] flex items-center justify-center text-[#E7C979] shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#F7F2E9] border border-[#C69A39]/20 rounded-2xl px-4 py-3 text-xs text-[#3D2214] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C69A39] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#C69A39] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#C69A39] animate-bounce [animation-delay:0.4s]" />
                <span className="text-stone-600 ml-1">Ratna Vidya is consulting gemological records...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-[#F8F3EA] border-t border-[#C69A39]/20 overflow-x-auto flex gap-2">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-xs bg-white hover:bg-[#FDFBF7] text-[#23140C] border border-[#C69A39]/40 hover:border-[#C69A39] px-3 py-1.5 rounded-full shrink-0 transition shadow-sm cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Upload Preview if image selected */}
        {selectedImage && (
          <div className="px-6 py-2 bg-[#F4EFE6] flex items-center justify-between border-t border-[#C69A39]/30">
            <div className="flex items-center gap-3">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-10 h-10 object-cover rounded-lg border border-[#C69A39]"
              />
              <span className="text-xs text-[#23140C] font-medium">
                Photo selected for jewellery styling & appraisal
              </span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-stone-500 hover:text-red-700 text-xs p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#C69A39]/30 flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl border border-[#C69A39]/40 text-[#23140C] hover:bg-[#F8F3EA] transition cursor-pointer"
            title="Upload outfit photo or jewellery for AI matching"
          >
            <Upload className="w-5 h-5 text-[#C69A39]" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about gold purity, 4Cs diamonds, bridal pairings..."
            className="flex-1 bg-[#FDFBF7] border border-[#C69A39]/40 rounded-xl px-4 py-2.5 text-sm text-[#23140C] placeholder:text-stone-400 focus:outline-none focus:border-[#C69A39] focus:ring-1 focus:ring-[#C69A39]"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
            className="bg-gradient-to-r from-[#C69A39] to-[#9A7420] text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-1.5 shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
