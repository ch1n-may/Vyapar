interface AlertItem {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  desc: string;
  ctaText: string;
  ctaLink: string;
}

export default function AlertList() {
  const alerts: AlertItem[] = [
    {
      id: 'A1',
      type: 'danger',
      title: 'High RTO Risk Detected (Order #AMZ-9382)',
      desc: 'Customer "Rahul Sharma" ne pichle 3 orders reject kiye hain. Is COD dispatch ko WhatsApp re-verify karein.',
      ctaText: 'Re-verify call karein',
      ctaLink: '#verify'
    },
    {
      id: 'A2',
      type: 'warning',
      title: 'Inventory Alert (Low Stock warning)',
      desc: 'Top Selling Product "Silk Kurti - Indigo Blue" ka stock 8 units bacha hai. Flipkart listing block hone se bachayein.',
      ctaText: 'Supplier order generate karein',
      ctaLink: '#supplier'
    },
    {
      id: 'A3',
      type: 'info',
      title: 'Price Parity Gap (Meesho vs Amazon)',
      desc: 'Aapki Meesho listing "Cotton Jhumka Set" ₹200 sasti hai Amazon se. Amazon Buybox loose hone ka risk hai.',
      ctaText: 'Price match karein',
      ctaLink: '#price-match'
    },
    {
      id: 'A4',
      type: 'danger',
      title: 'Dispute Deadline Approaching (₹4,200 Leak)',
      desc: 'Flipkart returned order #FK-3829 ka window kal dopehar 3 baje khatam ho raha hai. Proof docs upload karein.',
      ctaText: 'Dispute file karein',
      ctaLink: '#dispute'
    }
  ];

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-semantic-red/10 border-semantic-red/20',
          iconBg: 'bg-semantic-red/20 text-semantic-red',
          text: 'text-semantic-red',
          icon: '⚠️'
        };
      case 'warning':
        return {
          bg: 'bg-semantic-amber/10 border-semantic-amber/20',
          iconBg: 'bg-semantic-amber/20 text-semantic-amber',
          text: 'text-semantic-amber',
          icon: '📦'
        };
      case 'info':
        return {
          bg: 'bg-semantic-blue/10 border-semantic-blue/20',
          iconBg: 'bg-semantic-blue/20 text-semantic-blue',
          text: 'text-semantic-blue',
          icon: 'ℹ️'
        };
      default:
        return {
          bg: 'bg-semantic-green/10 border-semantic-green/20',
          iconBg: 'bg-semantic-green/20 text-semantic-green',
          text: 'text-semantic-green',
          icon: '✓'
        };
    }
  };

  return (
    <div className="flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-[12px] uppercase font-bold text-text-pri text-stroke-xs tracking-wider">
          Critical Store Alerts (तुरंत ध्यान दें)
        </h2>
        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-semantic-red text-white">
          {alerts.length} Urgent
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {alerts.map((alert) => {
          const classes = getColorClasses(alert.type);
          return (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border flex gap-3 items-start transition-all hover:scale-[1.005] ${classes.bg}`}
            >
              {/* Icon Container */}
              <div className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold shrink-0 ${classes.iconBg}`}>
                {classes.icon}
              </div>

              {/* Text / Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[12px] font-bold text-text-pri text-stroke-xs truncate">
                    {alert.title}
                  </h3>
                </div>
                <p className="text-[11px] text-text-sec mt-0.5 leading-normal">
                  {alert.desc}
                </p>
                <div className="mt-1.5 flex items-center">
                  <a
                    href={alert.ctaLink}
                    className={`text-[10px] font-bold flex items-center gap-1 hover:underline text-stroke-xs ${classes.text}`}
                  >
                    <span>{alert.ctaText}</span>
                    <span className="text-[8px]">➔</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
