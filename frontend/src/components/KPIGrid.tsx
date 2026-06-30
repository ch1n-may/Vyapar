interface KPICardProps {
  label: string;
  value: string;
  delta: string;
  deltaType: 'up' | 'down' | 'neutral';
  subText: string;
}

export default function KPIGrid() {
  const cards: KPICardProps[] = [
    {
      label: 'Aaj ki Bikri (Today\'s Sales)',
      value: '₹48,250',
      delta: '+12.4%',
      deltaType: 'up',
      subText: 'vs. kal isi samay'
    },
    {
      label: 'Orders Dispatched',
      value: '184',
      delta: '94% timely',
      deltaType: 'up',
      subText: '32 packing queue me'
    },
    {
      label: 'RTO Risk (Return to Origin)',
      value: '8.2%',
      delta: '+1.5% high risk',
      deltaType: 'down',
      subText: '12 high risk orders flag'
    },
    {
      label: 'Settlement Due',
      value: '₹1,24,800',
      delta: 'Next: 2 days',
      deltaType: 'neutral',
      subText: 'Amazon & Flipkart consolidated'
    },
    {
      label: 'Listing Health',
      value: '96%',
      delta: '2 warnings',
      deltaType: 'down',
      subText: 'OOS warning on 2 top SKUs'
    },
    {
      label: 'Open Disputes',
      value: '4',
      delta: '₹8,450 recovery',
      deltaType: 'up',
      subText: 'Flipkart response awaited'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-card p-3.5 rounded-[10px] flex flex-col justify-between min-h-[95px] select-none"
        >
          {/* Label */}
          <span className="text-[10px] text-text-mut uppercase font-semibold tracking-wider text-stroke-xs">
            {card.label}
          </span>

          {/* Value */}
          <span className="text-[24px] font-extrabold text-text-pri text-glow text-stroke-md leading-none py-1.5">
            {card.value}
          </span>

          {/* Delta / Info Line */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`font-bold text-stroke-xs ${
                card.deltaType === 'up'
                  ? 'text-semantic-green'
                  : card.deltaType === 'down'
                  ? 'text-semantic-red'
                  : 'text-semantic-blue'
              }`}
            >
              {card.delta}
            </span>
            <span className="text-text-mut">|</span>
            <span className="text-text-mut text-[10px] truncate">{card.subText}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
