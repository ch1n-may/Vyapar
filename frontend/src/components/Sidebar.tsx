import ThemeToggle from './ThemeToggle';

interface NavItem {
  name: string;
  badge?: number;
  id: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (id: string) => void }) {
  const navigation: NavSection[] = [
    {
      title: 'AI',
      items: [{ name: 'AI Command', id: 'ai-command' }]
    },
    {
      title: 'STORE',
      items: [
        { name: 'Dashboard', id: 'dashboard' },
        { name: 'Orders', badge: 14, id: 'orders' },
        { name: 'Inventory', id: 'inventory' },
        { name: 'Returns', badge: 4, id: 'returns' },
        { name: 'RTO alerts', badge: 3, id: 'rto-alerts' }
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Settlements', id: 'settlements' },
        { name: 'Reconcile', id: 'reconcile' },
        { name: 'Disputes', badge: 2, id: 'disputes' }
      ]
    },
    {
      title: 'GROW',
      items: [
        { name: 'Listing health', id: 'listing-health' },
        { name: 'Price parity', id: 'price-parity' }
      ]
    }
  ];

  return (
    <aside className="w-[200px] min-w-[200px] h-full bg-surface border-r border-border-theme flex flex-col justify-between p-4 select-none">
      {/* Top Section */}
      <div className="flex flex-col gap-5">
        {/* Logo Block */}
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-[9px] bg-accent flex items-center justify-center text-accent-text text-xl">
            🛒
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-text-pri text-glow text-stroke-md leading-tight">
              Vyapar OS
            </span>
            <span className="text-[9px] text-text-sec font-medium leading-none">
              Your self-running store
            </span>
          </div>
        </div>

        {/* WhatsApp Live Status */}
        <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/20 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-semantic-green"></span>
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-text-pri font-bold uppercase tracking-wider text-stroke-xs">WhatsApp Live</span>
            <span className="text-[9px] text-text-mut font-medium">+91 89717 72472</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-4">
          {navigation.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-text-mut uppercase tracking-wider px-2">
                {section.title}
              </span>
              <ul className="flex flex-col gap-[2px]">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-accent/15 text-accent text-stroke-xs font-semibold'
                            : 'text-text-sec hover:bg-card/50 hover:text-text-pri'
                        }`}
                      >
                        <span className="text-stroke-xs">{item.name}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-semantic-red text-white leading-none">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="flex flex-col gap-3 pt-3 border-t border-border-theme">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-[32px] h-[32px] rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold">
              CS
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[12px] font-bold text-text-pri text-stroke-xs">Chinmay S.</span>
              <span className="text-[10px] text-text-mut">Mumbai Shop</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-card/40 p-1.5 rounded-lg border border-border-theme">
          <span className="text-[10px] text-text-mut">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
