import { useEffect, useState } from 'react';

export default function Topbar({ onAIChatClick }: { onAIChatClick: () => void }) {
  const [greeting, setGreeting] = useState('Namaste 👋');
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting('Shubh Prabhat ☀️');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Shubh Dopahar 🌤️');
      } else if (hour >= 17 && hour < 22) {
        setGreeting('Shubh Sandhya 🌇');
      } else {
        setGreeting('Shubh Ratri 🌙');
      }

      setTimeStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-[50px] min-h-[50px] bg-surface border-b border-border-theme flex items-center justify-between px-5 select-none">
      {/* Time-based Hindi Greeting */}
      <h1 className="text-[18px] font-bold text-text-pri text-glow text-stroke-md flex items-center gap-2">
        {greeting}
      </h1>

      {/* Right aligned section */}
      <div className="flex items-center gap-4">
        <span className="text-[12px] text-text-sec font-medium text-stroke-xs">
          {timeStr}
        </span>
        <button
          onClick={onAIChatClick}
          className="px-3.5 py-1.5 bg-accent text-accent-text text-[12px] font-bold rounded-lg border border-transparent hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm text-stroke-xs flex items-center gap-1.5"
        >
          <span>💬</span>
          <span>Vyapar AI se poochho</span>
        </button>
      </div>
    </header>
  );
}
