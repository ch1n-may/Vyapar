import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  chips?: string[];
  timestamp: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: 'Namaste Chinmay ji! 🙏 Maine aapki store inventory aur sales reports scan kar li hain.',
      timestamp: '20:05'
    },
    {
      id: 'm2',
      sender: 'bot',
      text: '⚠️ 2 critical warnings hain:\n1. *Silk Kurti - Indigo Blue* (Flipkart) stock me sirf 8 units hain. 2 din me listing close ho sakti hai.\n2. Order #AMZ-9382 ke customer ka RTO probability *89%* hai. Phone response nahi mil raha.',
      timestamp: '20:05'
    },
    {
      id: 'm3',
      sender: 'bot',
      text: 'Aap kya action lena chahte hain? Main automatic call verify kar sakta hoon ya stock re-order email bhej sakta hoon.',
      chips: [
        '📞 RTO order verify call karo',
        '📦 Supplier ko stock re-order karo',
        '💵 Aaj ka settlement status dikhao'
      ],
      timestamp: '20:06'
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    // Simulated Bot Reply
    setTimeout(() => {
      let replyText = 'Theek hai, main ispe kaam kar raha hoon.';
      let replyChips: string[] = [];

      if (text.includes('verify') || text.includes('RTO')) {
        replyText = '📞 Customer "Rahul Sharma" ko WhatsApp automatic interactive template bhej diya gaya hai. Verification response aate hi main update karunga.';
        replyChips = ['Check status', 'Cancel order'];
      } else if (text.includes('re-order') || text.includes('Supplier')) {
        replyText = '📦 Supplier "Raj Textile Mills" ko 50 units "Silk Kurti - Indigo Blue" ka Draft PO email draft ready hai. Approve karne par dispatch initiate hoga.';
        replyChips = ['Email PO send karo', 'Edit PO Quantity'];
      } else if (text.includes('settlement') || text.includes('status')) {
        replyText = '💵 Aapka Amazon settlement amount ₹84,200 kal dopahar tak bank me transfer ho jayega. Flipkart due ₹40,600 reconcile ho chuka hai.';
      } else {
        replyText = `Aapne poocha: "${text}". Main check karke batata hoon. Vyapar OS automation ready hai.`;
      }

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        chips: replyChips.length > 0 ? replyChips : undefined,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card rounded-lg border border-border-theme overflow-hidden select-none">
      {/* Header */}
      <div className="p-3 bg-surface border-b border-border-theme flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></div>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-text-pri text-glow text-stroke-xs leading-tight">
              Vyapar AI
            </span>
            <span className="text-[9px] text-text-mut leading-none">
              Hindi / Hinglish Co-pilot
            </span>
          </div>
        </div>
        <span className="text-[9px] text-text-sec font-semibold">Active</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollable-content">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div key={msg.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 text-[12px] leading-relaxed shadow-sm ${
                  isBot
                    ? 'bg-surface text-text-pri rounded-2xl rounded-bl-none border border-border-theme/40'
                    : 'bg-accent text-accent-text rounded-2xl rounded-br-none font-medium'
                }`}
                style={{ whiteSpace: 'pre-line' }}
              >
                {/* Text stroking if needed for headers in chat, but plain text is generally cleaner. We stick to styling tags if any */}
                <span className={!isBot ? 'text-stroke-xs font-semibold' : ''}>
                  {msg.text}
                </span>
                <div className="text-[8px] text-right mt-1 opacity-60">
                  {msg.timestamp}
                </div>
              </div>

              {/* Quick Reply Chips */}
              {isBot && msg.chips && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.chips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip)}
                      className="px-2.5 py-1 text-[10px] font-medium border border-accent/30 rounded-full bg-accent/5 text-text-pri hover:bg-accent/15 cursor-pointer transition-colors text-left"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputVal);
        }}
        className="p-2 border-t border-border-theme bg-surface flex gap-1.5 items-center shrink-0"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Hindi/English me likhein... (e.g. RTO check karo)"
          className="flex-1 px-3 py-1.5 text-[12px] rounded-lg bg-card border border-border-theme focus:outline-none focus:border-accent text-text-pri"
        />
        <button
          type="submit"
          className="p-1.5 rounded-lg bg-accent text-accent-text flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
}
