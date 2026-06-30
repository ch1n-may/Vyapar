import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import KPIGrid from './components/KPIGrid';
import AlertList from './components/AlertList';
import OrdersTable from './components/OrdersTable';
import LiveTicker from './components/LiveTicker';
import AIChat from './components/AIChat';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [triggerChatFocus, setTriggerChatFocus] = useState(0);

  const handleAIChatClick = () => {
    // Incrementing this triggers a focus effect or highlights chat
    setTriggerChatFocus((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text-sec select-none">
      {/* Sidebar - fixed 200px */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Topbar - fixed 50px */}
        <Topbar onAIChatClick={handleAIChatClick} />

        {/* Workspace Body */}
        <div className="flex-1 flex min-h-0 w-full overflow-hidden">
          {/* Left panel - scrollable main workspace content */}
          <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollable-content">
            {/* Header / Platform status chips */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-pri text-glow text-stroke-md">
                  Dukaan Dashboard
                </h2>
                <p className="text-[11px] text-text-mut mt-0.5">
                  Live metrics and store synchronization status.
                </p>
              </div>

              {/* Platform chips */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card rounded-md border border-border-theme/40 text-[11px] font-semibold text-text-pri">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-amz animate-pulse"></span>
                  <span>Amazon</span>
                  <span className="text-[9px] text-text-mut">Active</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card rounded-md border border-border-theme/40 text-[11px] font-semibold text-text-pri">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-flipkart animate-pulse"></span>
                  <span>Flipkart</span>
                  <span className="text-[9px] text-text-mut">Active</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card rounded-md border border-border-theme/40 text-[11px] font-semibold text-text-pri">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-meesho animate-pulse"></span>
                  <span>Meesho</span>
                  <span className="text-[9px] text-text-mut">Active</span>
                </div>
              </div>
            </div>

            {/* KPI grid (3-col) */}
            <KPIGrid />

            {/* Alerts List */}
            <AlertList />

            {/* Orders Table */}
            <OrdersTable />
          </main>

          {/* Right panel - fixed 300px containing Live Event Feed + Docked AI Chat */}
          <aside className="w-[300px] min-w-[300px] bg-surface border-l border-border-theme p-4 flex flex-col gap-4 h-full min-h-0">
            {/* Live Feed Ticker */}
            <LiveTicker />

            {/* AI Chat (docked, filling the remaining space) */}
            <AIChat key={triggerChatFocus} />
          </aside>
        </div>
      </div>
    </div>
  );
}
