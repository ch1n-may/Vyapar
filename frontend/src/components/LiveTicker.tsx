import { useEffect, useState } from 'react';

interface EventItem {
  id: string;
  type: 'order' | 'rto' | 'settlement' | 'stock' | 'dispute';
  label: string;
  detail: string;
  platform: 'Amazon' | 'Flipkart' | 'Meesho' | 'System';
  time: string;
}

export default function LiveTicker() {
  const [events, setEvents] = useState<EventItem[]>([
    { id: 'E1', type: 'order', label: 'Naya Order aaya 🎉', detail: 'Silk Kurti - Blue', platform: 'Amazon', time: 'Abhi abhi' },
    { id: 'E2', type: 'rto', label: 'RTO Risk Flagged ⚠️', detail: 'COD verification failed', platform: 'Meesho', time: '2m ago' },
    { id: 'E3', type: 'settlement', label: 'Settlement Initiated 💸', detail: '₹48,250 dispatched', platform: 'Amazon', time: '12m ago' },
    { id: 'E4', type: 'stock', label: 'Low Stock Alert 📦', detail: 'Cotton Jhumka < 10 units', platform: 'Flipkart', time: '30m ago' },
    { id: 'E5', type: 'dispute', label: 'Dispute Approved ✅', detail: '₹1,250 refund recovered', platform: 'System', time: '1h ago' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Rotate events array by moving the last event to the front
      setEvents((prev) => {
        const next = [...prev];
        const last = next.pop();
        if (last) {
          // update time slightly to feel "live"
          last.time = 'Abhi abhi';
          // update previous first item to '1m ago'
          next[0] = { ...next[0], time: '1m ago' };
          return [last, ...next];
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getDotColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-semantic-green';
      case 'rto':
        return 'bg-semantic-red animate-pulse';
      case 'settlement':
        return 'bg-semantic-blue';
      case 'stock':
        return 'bg-semantic-amber';
      default:
        return 'bg-accent';
    }
  };

  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case 'Amazon':
        return 'text-brand-amz';
      case 'Flipkart':
        return 'text-brand-flipkart';
      case 'Meesho':
        return 'text-brand-meesho';
      default:
        return 'text-text-mut';
    }
  };

  return (
    <div className="bg-card/50 border border-border-theme p-3 rounded-lg flex flex-col gap-2 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-border-theme/40">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-red opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-semantic-red"></span>
          </span>
          <span className="text-[11px] font-bold text-text-pri uppercase tracking-wider text-stroke-xs">
            Live Store Feed
          </span>
        </div>
        <span className="text-[9px] text-text-mut font-semibold">Consolidated</span>
      </div>

      {/* Events List */}
      <div className="flex flex-col gap-1.5 max-h-[190px] overflow-hidden transition-all duration-500">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex items-start justify-between gap-2 p-1.5 hover:bg-surface/30 rounded transition-colors text-[11px]"
          >
            <div className="flex items-start gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getDotColor(ev.type)}`}></span>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-text-pri font-bold text-stroke-xs truncate">{ev.label}</span>
                <span className="text-text-mut text-[10px] truncate">{ev.detail}</span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 text-right leading-none">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${getPlatformStyle(ev.platform)}`}>
                {ev.platform}
              </span>
              <span className="text-[8px] text-text-mut mt-0.5">{ev.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
