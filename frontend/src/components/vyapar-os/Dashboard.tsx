// frontend/src/components/vyapar-os/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { PlatformChips } from "./PlatformChips";
import { KPIGrid } from "./KPIGrid";
import { AlertList } from "./AlertList";
import { OrdersTable } from "./OrdersTable";
import { LiveTicker } from "./LiveTicker";
import { AIChat } from "./AIChat";
import { StatusPill } from "./StatusPill";
import { LockScreen } from "./LockScreen";
import { getApiUrl } from "../../config";

export const Dashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState("Home");
  const [, setMerchantData] = useState<any>(null);

  // Mock states for interactive elements
  const [orders, setOrders] = useState<any[]>([
    { id: "OD-98273", platform: "Amazon", product: "Premium Silk Saree (Red)", amount: "₹2,499", status: "Delivered", date: "30 June 2026", rtoRisk: "Low" },
    { id: "OD-47291", platform: "Flipkart", product: "Cotton Kurta (Blue)", amount: "₹1,200", status: "RTO risk", date: "30 June 2026", rtoRisk: "High" },
    { id: "OD-10928", platform: "Meesho", product: "Designer Jhumka Gold", amount: "₹450", status: "Processing", date: "29 June 2026", rtoRisk: "Low" },
    { id: "OD-38291", platform: "Amazon", product: "Embroidered Lehenga", amount: "₹5,999", status: "Return", date: "28 June 2026", rtoRisk: "Medium" },
    { id: "OD-58290", platform: "Meesho", product: "Ethnic Footwear Set", amount: "₹899", status: "Delivered", date: "27 June 2026", rtoRisk: "Low" },
    { id: "OD-77291", platform: "Amazon", product: "Silk Saree (Green)", amount: "₹2,300", status: "Unfulfilled", date: "30 June 2026", rtoRisk: "High" },
    { id: "OD-66124", platform: "Flipkart", product: "Casual Kurti (White)", amount: "₹799", status: "Unpaid", date: "30 June 2026", rtoRisk: "Low" },
  ]);

  const [products, setProducts] = useState<any[]>([
    { id: "P-001", name: "Premium Silk Saree (Red)", sku: "SILK-SAR-RED", stock: 12, price: "₹2,499", platforms: ["Amazon", "Meesho"], status: "Active" },
    { id: "P-002", name: "Cotton Kurta (Blue)", sku: "COT-KUR-BLU", stock: 2, price: "₹1,200", platforms: ["Amazon", "Flipkart", "Meesho"], status: "Active" },
    { id: "P-003", name: "Designer Jhumka Gold", sku: "JHM-GLD-01", stock: 45, price: "₹450", platforms: ["Meesho"], status: "Active" },
    { id: "P-004", name: "Embroidered Lehenga", sku: "LEH-EMB-02", stock: 0, price: "₹5,999", platforms: ["Amazon"], status: "Archived" },
    { id: "P-005", name: "Casual Kurti (White)", sku: "CAS-KUR-WHT", stock: 18, price: "₹799", platforms: ["Flipkart", "Meesho"], status: "Draft" },
  ]);

  const [customers] = useState<any[]>([
    { id: "C-9918", name: "Ramesh Kumar", phone: "+91 98123 45678", orders: 12, locations: "New Delhi", rtoAlert: "None" },
    { id: "C-1204", name: "Pooja Sharma", phone: "+91 88776 55443", orders: 8, locations: "Mumbai", rtoAlert: "⚠️ 3 fake returns last 2 months" },
    { id: "C-3021", name: "Amit Patel", phone: "+91 70112 23344", orders: 15, locations: "Ahmedabad", rtoAlert: "None" },
    { id: "C-4456", name: "Suresh Gupta", phone: "+91 99887 76655", orders: 4, locations: "Jaipur", rtoAlert: "⚠️ 2 fake returns last month" },
  ]);

  const [orderFilter, setOrderFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [voiceListingOpen, setVoiceListingOpen] = useState(false);
  const [voiceListingStep, setVoiceListingStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("Add a red Banarasi saree, stock 10, price ₹3499");
  const [parsedProduct, setParsedProduct] = useState<any>({
    name: "Banarasi Saree Premium Gold",
    sku: "BAN-SAR-GLD",
    stock: 10,
    price: "₹3,499",
    platforms: ["Amazon", "Flipkart"]
  });
  const [reconResult, setReconResult] = useState<any>(null);
  const [isReconRunning, setIsReconRunning] = useState(false);
  const [activeDisputeDraft, setActiveDisputeDraft] = useState<string | null>(null);
  const [draftingOrderId, setDraftingOrderId] = useState<string | null>(null);
  const [simulatorInput, setSimulatorInput] = useState("Is hafte kitna kamaya?");
  const [simulatorLogs, setSimulatorLogs] = useState<string[]>([]);
  const [simulatorReply, setSimulatorReply] = useState<string>("");
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);
  const [weeklyPulse, setWeeklyPulse] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // A/B Testing state
  const [abTests, setAbTests] = useState<any[]>([
    { id: "ab-001", name: "COD Switch Discount Value", variantA: "₹50 Flat", variantB: "10% Flat", trafficSplit: 50, status: "Running", conversionsA: 42, conversionsB: 58, ordersA: 340, ordersB: 350, rtoA: 28, rtoB: 12 },
    { id: "ab-002", name: "Checkout Form Complexity", variantA: "Single Page Form", variantB: "3-Step Wizard", trafficSplit: 50, status: "Paused", conversionsA: 89, conversionsB: 71, ordersA: 500, ordersB: 495, rtoA: 45, rtoB: 42 }
  ]);
  const [newTestModalOpen, setNewTestModalOpen] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [newTestVarA, setNewTestVarA] = useState("");
  const [newTestVarB, setNewTestVarB] = useState("");
  const [newTestSplit, setNewTestSplit] = useState(50);

  // Smart Pricing & Promotions state
  const [discountActive, setDiscountActive] = useState(true);
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState(50);
  const [minOrderValue, setMinOrderValue] = useState(500);
  const [selectedCodOrderId, setSelectedCodOrderId] = useState<string>("OD-47291");
  const [whatsappSimStep, setWhatsappSimStep] = useState(0); // 0: Idle, 1: Offer Sent, 2: Accepted (Converted), 3: Declined

  // Integration Config State
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [activeConfigIntegration, setActiveConfigIntegration] = useState<any>(null);
  const [sellerId, setSellerId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [syncInterval, setSyncInterval] = useState("30");

  // Support Chat State
  const [supportMessages, setSupportMessages] = useState<any[]>([
    { from: "agent", text: "Namaste Vijay ji! I am your Vyapar OS Merchant Support Assistant. Setup, billing, ya reconciliation related koi query hai?", time: "Just now" }
  ]);
  const [supportInput, setSupportInput] = useState("");
  const [isSupportTyping, setIsSupportTyping] = useState(false);

  // Analytics Filter state
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<"Today" | "Weekly" | "Monthly" | "YTD">("Today");


  // Lockscreen & Session state
  const [isUnlocked, setIsUnlocked] = useState(!!localStorage.getItem("vyapar_session"));

  // Observability & System Status state
  const [deployStatus, setDeployStatus] = useState<any>(null);
  const [systemEvents, setSystemEvents] = useState<any[]>([]);

  // Role & Approvals State
  const [userRole, setUserRole] = useState<"Owner" | "Accountant">("Owner");
  const [approvals, setApprovals] = useState<any[]>([]);

  // Expanded Settings Interactive State
  const [activeSettingTab, setActiveSettingTab] = useState<"general" | "team" | "channels" | "shipping" | "keys">("general");
  const [teamMembers, setTeamMembers] = useState<any[]>([
    { id: "tm-1", name: "Vijay Dukaandar", email: "vijay@vyapaar.in", role: "Owner", status: "Active" },
    { id: "tm-2", name: "Rajesh Kumar", email: "rajesh@vyapaar.in", role: "Accountant", status: "Active" },
    { id: "tm-3", name: "Anjali Sharma", email: "anjali@vyapaar.in", role: "Manager", status: "Invited" },
  ]);
  const [shippingZones, setShippingZones] = useState<any[]>([
    { id: "sz-1", name: "Domestic Express", region: "All India", price: "₹99", transitTime: "2-4 days" },
    { id: "sz-2", name: "Local Delivery", region: "Delhi NCR", price: "₹49", transitTime: "Same day" },
  ]);
  const [returnReasons, setReturnReasons] = useState<any[]>([
    { id: "rr-1", reason: "Size did not fit", code: "SIZE_FIT", active: true },
    { id: "rr-2", reason: "Product quality is poor", code: "QUALITY_ISSUE", active: true },
    { id: "rr-3", reason: "Wrong item delivered", code: "WRONG_ITEM", active: true },
  ]);
  const [apiKeys, setApiKeys] = useState<any[]>([
    { id: "ak-1", name: "Groq Webhook Access", key: "pk_live_51Ny...a8B7", created: "15 June 2026" },
    { id: "ak-2", name: "Supabase DB Connector", key: "pk_live_51Mz...q3X9", created: "28 June 2026" },
  ]);
  const [storeName, setStoreName] = useState("Vyapar OS India");
  const [storeEmail, setStoreEmail] = useState("contact@vyapaar.in");
  const [storePhone, setStorePhone] = useState("+91 89717 72472");
  const [storeAddress, setStoreAddress] = useState("12, Chandni Chowk Road, New Delhi, 110006");
  const [storeCurrency, setStoreCurrency] = useState("INR (₹)");
  const [salesChannels, setSalesChannels] = useState<any[]>([
    { name: "Amazon India", key: "amazon", connected: true, orderCount: 342 },
    { name: "Flipkart", key: "flipkart", connected: true, orderCount: 154 },
    { name: "Meesho", key: "meesho", connected: true, orderCount: 98 },
    { name: "WhatsApp Storefront", key: "whatsapp", connected: true, orderCount: 27 },
  ]);
  
  // Temporary Form Inputs
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Manager");
  
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneRegion, setNewZoneRegion] = useState("");
  const [newZonePrice, setNewZonePrice] = useState("");
  const [newZoneTime, setNewZoneTime] = useState("");
  
  const [newReasonText, setNewReasonText] = useState("");
  const [newReasonCode, setNewReasonCode] = useState("");

  const [newKeyName, setNewKeyName] = useState("");

  useEffect(() => {
    fetch(getApiUrl("/api/merchant/msme-001"))
      .then((res) => res.json())
      .then((data) => setMerchantData(data))
      .catch((err) => console.error("Error fetching merchant data:", err));

    fetch(getApiUrl("/api/reports/weekly-pulse"))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setWeeklyPulse(data.report);
      })
      .catch((err) => console.error("Error fetching P&L report:", err));

    fetch(getApiUrl("/api/approvals"))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setApprovals(data.approvals);
      })
      .catch((err) => console.error("Error fetching approvals:", err));

    fetch(getApiUrl("/api/deploy/status"))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDeployStatus(data);
      })
      .catch((err) => console.error("Error fetching deploy status:", err));

    fetch(getApiUrl("/api/observability/events"))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSystemEvents(data.events);
      })
      .catch((err) => console.error("Error fetching observability events:", err));
  }, []);

  const handleAskAI = () => {
    const aiChatInput = document.querySelector("input[placeholder*='Ask AI']") as HTMLInputElement;
    if (aiChatInput) {
      aiChatInput.value = "How is my store doing today?";
      aiChatInput.focus();
    }
  };

  const holdOrder = (id: string) => {
    fetch(getApiUrl("/api/rto/verify-buyer"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, action: "Cancel" })
    })
      .then(res => res.json())
      .then(data => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: data.resolvedStatus } : o));
        alert(`Order ${id} RTO Shield: ${data.resolvedStatus}`);
      })
      .catch(err => {
        console.error("RTO Shield error:", err);
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "Held (RTO Shield)" } : o));
      });
  };

  const verifyCodOrder = (id: string) => {
    fetch(getApiUrl("/api/rto/verify-buyer"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, action: "Confirm" })
    })
      .then(res => res.json())
      .then(data => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: data.resolvedStatus, rtoRisk: "Low" } : o));
        alert(`Order ${id} RTO Shield: ${data.resolvedStatus}`);
      })
      .catch(err => {
        console.error("RTO Shield error:", err);
      });
  };

  const addVoiceProduct = () => {
    const newProduct = {
      id: `P-00${products.length + 1}`,
      name: parsedProduct.name || "Unnamed Product",
      sku: parsedProduct.sku || `SKU-${Date.now().toString().slice(-6)}`,
      stock: Number(parsedProduct.stock) || 0,
      price: parsedProduct.price || "₹0",
      platforms: parsedProduct.platforms || ["Amazon"],
      status: "Active"
    };
    setProducts([newProduct, ...products]);
    setVoiceListingOpen(false);
    setVoiceListingStep(0);
    alert(`New product "${newProduct.name}" successfully drafted and pushed to platforms!`);
  };

  const processVoice = () => {
    setIsRecording(true);
    fetch(getApiUrl("/api/voice-list"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: voiceText })
    })
      .then((res) => res.json())
      .then((data) => {
        setIsRecording(false);
        if (data.success && data.product) {
          setParsedProduct(data.product);
          setVoiceListingStep(1);
        } else {
          alert("Could not parse description. Please try again.");
        }
      })
      .catch((err) => {
        setIsRecording(false);
        console.error("Voice list error:", err);
        setVoiceListingStep(1);
      });
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReconRunning(true);

    if (file.name.toLowerCase().endsWith(".pdf")) {
      fetch(getApiUrl("/api/pdf-extract/simulate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name })
      })
        .then(res => res.json())
        .then(pdfData => {
          if (pdfData.success && pdfData.rows) {
            return fetch(getApiUrl("/api/recon/upload"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rows: pdfData.rows, merchantId: "msme-001" })
            });
          } else {
            throw new Error("Failed to parse PDF statement.");
          }
        })
        .then(res => res.json())
        .then(data => {
          setIsReconRunning(false);
          setReconResult(data);
          alert(`PDF Statement Ingest Complete!\nProcessed: ${data.totalProcessed} orders.\nDiscrepancies found: ${data.discrepancyCount} overcharges.\nTotal overcharges recovered: ₹${data.totalOvercharged}`);
        })
        .catch(err => {
          setIsReconRunning(false);
          console.error("PDF Ingest error:", err);
          alert("Failed to complete PDF statement reconciliation.");
        });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(",").map(c => c.trim());
        if (columns.length < 3) continue;
        rows.push({
          orderId: columns[0] || `ORD-${Math.random().toString().slice(-6)}`,
          platform: columns[1] || "Amazon",
          price: Number(columns[2]) || 0,
          actualCommission: Number(columns[3]) || 0,
          actualShipping: Number(columns[4]) || 0,
          shipmentType: columns[5] || "Local"
        });
      }

      const payloadRows = rows.length ? rows : [
        { orderId: "OD-47291", platform: "Flipkart", price: 1200, actualCommission: 160, actualShipping: 180, shipmentType: "Local" },
        { orderId: "OD-77291", platform: "Amazon", price: 2300, actualCommission: 380, actualShipping: 190, shipmentType: "National" },
        { orderId: "OD-66124", platform: "Meesho", price: 799, actualCommission: 30, actualShipping: 70, shipmentType: "Local" }
      ];

      fetch(getApiUrl("/api/recon/upload"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payloadRows, merchantId: "msme-001" })
      })
        .then(res => res.json())
        .then(data => {
          setIsReconRunning(false);
          setReconResult(data);
          alert(`Audit Complete!\nProcessed: ${data.totalProcessed} orders.\nDiscrepancies found: ${data.discrepancyCount} orders.\nTotal overcharges recovered: ₹${data.totalOvercharged}`);
        })
        .catch(err => {
          setIsReconRunning(false);
          console.error("Recon error:", err);
          alert("Failed to complete audit calculation on the server.");
        });
    };
    reader.readAsText(file);
  };

  const generateDispute = (log: any) => {
    setDraftingOrderId(log.order_id);
    setActiveDisputeDraft("Generating support ticket with Groq AI...");
    
    fetch(getApiUrl("/api/recon/dispute"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: log.order_id,
        platform: log.platform,
        discrepancy: log.discrepancy,
        expectedFee: (log.expected_commission + log.expected_shipping).toFixed(2),
        actualFee: (log.actual_commission + log.actual_shipping).toFixed(2)
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.draft) {
          setActiveDisputeDraft(data.draft);
        } else {
          setActiveDisputeDraft("Could not generate dispute draft.");
        }
      })
      .catch(err => {
        console.error("Dispute API error:", err);
        setActiveDisputeDraft("Error connecting to dispute drafting API.");
      });
  };

  const runSimulation = () => {
    setIsSimulatorRunning(true);
    setSimulatorLogs(["[Ingest] Dispatching simulated Meta webhook payload..."]);
    setSimulatorReply("");

    fetch(getApiUrl("/api/whatsapp/simulate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: simulatorInput, phone: "918971772472" })
    })
      .then(res => res.json())
      .then(data => {
        setIsSimulatorRunning(false);
        if (data.success) {
          setSimulatorReply(data.reply);
          setSimulatorLogs(data.logs || []);
        } else {
          setSimulatorReply("Failed to execute simulation.");
        }
      })
      .catch(err => {
        setIsSimulatorRunning(false);
        console.error("Simulation error:", err);
        setSimulatorReply("Error connecting to simulation endpoint.");
      });
  };

  const exportTallyCSV = () => {
    alert("Generating bookkeeping CSV...\nCSV export generated successfully. Download started for 'Vyapar_Tally_Bridge_30_June.csv'.");
  };

  const handleResolveApproval = (id: string, action: "Approved" | "Rejected") => {
    fetch(getApiUrl("/api/approvals/resolve"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, role: userRole })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
          alert(`Approval status updated: ${action}`);
        } else {
          alert(`Error: ${data.error}`);
        }
      })
      .catch(err => {
        console.error("Resolve approval error:", err);
        alert("Failed to resolve approval item on the server.");
      });
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    localStorage.removeItem("vyapar_session");
  };

  // Render sub-sections
  const renderHome = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Overview setup banner */}
      <div className="glass-panel" style={{ padding: "20px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-pri)", marginBottom: "4px" }}>Vyapar OS is running your store</h2>
          <p style={{ fontSize: "12px", color: "var(--text-sec)" }}>All 3 channels (Amazon, Flipkart, Meesho) are synced. No login required.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setActiveSection("Integrations")} style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--border)", color: "var(--text-pri)", background: "transparent", cursor: "pointer" }}>Manage Channels</button>
          <button onClick={() => setVoiceListingOpen(true)} style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "6px", background: "var(--accent)", color: "var(--accent-text)", border: "none", fontWeight: 600, cursor: "pointer" }}>⚡ List New Product</button>
        </div>
      </div>

      <PlatformChips />
      <KPIGrid />

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)", textTransform: "uppercase", marginBottom: "10px" }}>Active Task Center & Auto-Alerts</div>
          <AlertList />

          {weeklyPulse && (
            <div className="glass-panel" style={{ padding: "16px", borderRadius: "10px", marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📊</span> Weekly Profit Pulse (Hinglish WhatsApp Report)
              </div>
              <div style={{
                background: "rgba(0,0,0,0.25)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "12px",
                fontSize: "12px",
                whiteSpace: "pre-line",
                lineHeight: "1.6",
                color: "var(--text-pri)"
              }}>
                {weeklyPulse}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { navigator.clipboard.writeText(weeklyPulse); alert("Weekly P&L report copied!"); }} style={{ padding: "5px 10px", fontSize: "10px", background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: "4px", fontWeight: 600, cursor: "pointer" }}>
                  📋 Copy WhatsApp Message
                </button>
              </div>
            </div>
          )}

          {/* Role-based Approval Queue */}
          <div className="glass-panel" style={{ padding: "16px", borderRadius: "10px", marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>👑</span> Role-based Approval Queue
              </div>
              <span style={{ fontSize: "10px", padding: "2px 6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-sec)" }}>
                Active Role: {userRole}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {approvals.length === 0 ? (
                <div style={{ fontSize: "11px", color: "var(--text-mut)", textAlign: "center", padding: "10px" }}>
                  No approvals in queue.
                </div>
              ) : (
                approvals.map((appr) => (
                  <div key={appr.id} style={{ padding: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)" }}>{appr.title}</span>
                      <span style={{
                        fontSize: "9.5px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        background: appr.status === "Pending" ? "rgba(245, 158, 11, 0.1)" : appr.status === "Approved" ? "var(--accent-pale)" : "rgba(239, 68, 68, 0.15)",
                        color: appr.status === "Pending" ? "var(--amber)" : appr.status === "Approved" ? "var(--accent)" : "var(--red)"
                      }}>
                        {appr.status}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--text-sec)", margin: 0 }}>{appr.detail}</p>
                    
                    {appr.status === "Pending" && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        {userRole === "Owner" ? (
                          <>
                            <button
                              onClick={() => handleResolveApproval(appr.id, "Approved")}
                              style={{ padding: "4px 8px", fontSize: "10.5px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleResolveApproval(appr.id, "Rejected")}
                              style={{ padding: "4px 8px", fontSize: "10.5px", background: "transparent", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "4px", cursor: "pointer" }}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: "10.5px", color: "var(--amber)", fontStyle: "italic" }}>
                            🔒 Owner approval required (Read-Only for Accountant)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="glass-panel" style={{ padding: "16px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)" }}>Tally / CA Bridge</div>
            <p style={{ fontSize: "11px", color: "var(--text-sec)" }}>Download zero-jargon weekly ledger report in Hindi/English formatted for your CA.</p>
            <button onClick={exportTallyCSV} style={{ width: "100%", padding: "10px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
              📥 Export Bookkeeping CSV
            </button>
          </div>

          <div className="glass-panel" style={{ padding: "16px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)" }}>Payout Reconciliation Audit</div>
            <p style={{ fontSize: "11px", color: "var(--text-sec)" }}>Upload payout settlement CSV/PDF to auto-calculate overcharges and file disputes.</p>
            <label style={{
              width: "100%",
              padding: "10px",
              background: isReconRunning ? "var(--border)" : "var(--accent)",
              color: "var(--accent-text)",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "12px",
              textAlign: "center",
              cursor: isReconRunning ? "not-allowed" : "pointer",
              display: "block"
            }}>
              {isReconRunning ? "Calculating Slabs..." : "📁 Upload Settlement File"}
              <input type="file" accept=".csv,.pdf" onChange={handleCsvUpload} style={{ display: "none" }} disabled={isReconRunning} />
            </label>
            {reconResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-pri)", background: "var(--accent-pale)", padding: "8px", borderRadius: "4px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  📢 <strong>Result:</strong> Checked {reconResult.totalProcessed} orders. Found <strong>{reconResult.discrepancyCount} overcharged</strong> orders totaling <strong>₹{reconResult.totalOvercharged}</strong>!
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "150px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px" }}>
                  {reconResult.details?.filter((d: any) => d.discrepancy > 0).map((d: any) => (
                    <div key={d.order_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10.5px", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                      <span>{d.order_id} ({d.platform}): <strong style={{ color: "var(--red)" }}>₹{d.discrepancy}</strong></span>
                      <button
                        onClick={() => generateDispute(d)}
                        style={{ padding: "2px 6px", fontSize: "9px", background: "rgba(16, 185, 129, 0.15)", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "4px", cursor: "pointer" }}
                      >
                        {draftingOrderId === d.order_id && activeDisputeDraft?.startsWith("Generating") ? "Drafting..." : "✍️ Draft Dispute"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeDisputeDraft && (
              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-pri)" }}>📄 SUPPORT DISPUTE TICKET DRAFT</div>
                <textarea
                  readOnly
                  value={activeDisputeDraft}
                  style={{ width: "100%", height: "90px", fontSize: "11px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-pri)", padding: "6px", borderRadius: "4px", resize: "none", outline: "none" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => { navigator.clipboard.writeText(activeDisputeDraft); alert("Dispute draft copied to clipboard!"); }} style={{ padding: "4px 8px", fontSize: "9.5px", background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: "4px", fontWeight: 600, cursor: "pointer" }}>Copy Text</button>
                  <button onClick={() => setActiveDisputeDraft(null)} style={{ padding: "4px 8px", fontSize: "9.5px", background: "transparent", color: "var(--text-sec)", border: "1px solid var(--border)", borderRadius: "4px", cursor: "pointer" }}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <OrdersTable />
    </div>
  );

  const renderOrders = () => {
    const filteredOrders = orders.filter(o => {
      if (orderFilter === "All") return true;
      return o.status.toLowerCase().includes(orderFilter.toLowerCase());
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Store Orders</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            {["All", "Unfulfilled", "Unpaid", "RTO risk", "Held"].map(tab => (
              <button
                key={tab}
                onClick={() => setOrderFilter(tab)}
                style={{
                  padding: "5px 12px",
                  fontSize: "11px",
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  background: orderFilter === tab ? "var(--accent-pale)" : "transparent",
                  color: orderFilter === tab ? "var(--accent)" : "var(--text-sec)",
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>ORDER ID</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>PLATFORM</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>PRODUCT</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>AMOUNT</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>DATE</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>RTO RISK</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>STATUS</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "var(--text-pri)" }}>{order.id}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", color: order.platform === "Amazon" ? "var(--amz)" : order.platform === "Flipkart" ? "var(--flipkart)" : "var(--meesho)" }}>{order.platform}</td>
                  <td style={{ padding: "12px 16px", color: "var(--text-pri)" }}>{order.product}</td>
                  <td style={{ padding: "12px 16px", color: "var(--text-pri)" }}>{order.amount}</td>
                  <td style={{ padding: "12px 16px" }}>{order.date}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      color: order.rtoRisk === "High" ? "var(--red)" : order.rtoRisk === "Medium" ? "var(--amber)" : "var(--accent)",
                      fontSize: "11px",
                      fontWeight: 600
                    }}>
                      {order.rtoRisk}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}><StatusPill status={order.status} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    {order.status === "RTO risk" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => holdOrder(order.id)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "10px",
                            background: "var(--red)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: 600
                          }}
                        >
                          🛑 Hold
                        </button>
                        <button
                          onClick={() => verifyCodOrder(order.id)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "10px",
                            background: "var(--accent)",
                            color: "#000",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: 600
                          }}
                        >
                          ✅ Verify COD
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProducts = () => {
    const filteredProducts = products.filter(p => {
      if (productFilter === "All") return true;
      return p.status === productFilter;
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Products Catalog</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setVoiceListingOpen(true)} style={{ padding: "8px 16px", fontSize: "12px", background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>
              🎙️ Voice listing wizard
            </button>
            <div style={{ display: "flex", gap: "4px" }}>
              {["All", "Active", "Draft", "Archived"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setProductFilter(tab)}
                  style={{
                    padding: "5px 12px",
                    fontSize: "11px",
                    borderRadius: "20px",
                    border: "1px solid var(--border)",
                    background: productFilter === tab ? "var(--accent-pale)" : "transparent",
                    color: productFilter === tab ? "var(--accent)" : "var(--text-sec)",
                    cursor: "pointer",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>SKU</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>PRODUCT NAME</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>STOCK</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>PRICE</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>SYNC CHANNELS</th>
                <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(prod => (
                <tr key={prod.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{prod.sku}</td>
                  <td style={{ padding: "12px 16px", color: "var(--text-pri)" }}>{prod.name}</td>
                  <td style={{ padding: "12px 16px", color: prod.stock <= 2 ? "var(--red)" : "var(--text-pri)" }}>
                    {prod.stock} units
                  </td>
                  <td style={{ padding: "12px 16px" }}>{prod.price}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {prod.platforms.map((plat: string) => (
                        <span key={plat} style={{
                          fontSize: "9px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.05)",
                          color: plat === "Amazon" ? "var(--amz)" : plat === "Flipkart" ? "var(--flipkart)" : "var(--meesho)"
                        }}>
                          {plat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><StatusPill status={prod.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCustomers = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Customer Management</h2>

      <div className="glass-panel" style={{ borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>CUSTOMER ID</th>
              <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>NAME</th>
              <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>PHONE</th>
              <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>ORDERS</th>
              <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>LOCATION</th>
              <th style={{ padding: "12px 16px", fontSize: "10px", color: "var(--text-mut)" }}>RETURN FRAUD ALERTS (1st PARTY DATA)</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{c.id}</td>
                <td style={{ padding: "12px 16px", color: "var(--text-pri)" }}>{c.name}</td>
                <td style={{ padding: "12px 16px" }}>{c.phone}</td>
                <td style={{ padding: "12px 16px" }}>{c.orders} orders</td>
                <td style={{ padding: "12px 16px" }}>{c.locations}</td>
                <td style={{ padding: "12px 16px" }}>
                  {c.rtoAlert !== "None" ? (
                    <span style={{ color: "var(--red)", fontWeight: 600, fontSize: "11px" }}>{c.rtoAlert}</span>
                  ) : (
                    <span style={{ color: "var(--text-mut)", fontSize: "11px" }}>Clean Order History</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => {
    // Dynamic values based on selected timeframe
    const metricsMap = {
      Today: {
        revenue: "₹45,230",
        revenueCompare: "↑ 12% vs yesterday",
        disputes: "₹1,200",
        disputesCompare: "1 active dispute pending response",
        returnRate: "14.2%",
        returnCompare: "↓ 1.1% after RTO Shield",
        points: "0,120 100,110 200,80 300,90 400,50 480,20",
        circles: [{x: 0, y: 120}, {x: 100, y: 110}, {x: 200, y: 80}, {x: 300, y: 90}, {x: 400, y: 50}, {x: 480, y: 20}]
      },
      Weekly: {
        revenue: "₹2,84,500",
        revenueCompare: "↑ 18% vs last week",
        disputes: "₹14,500",
        disputesCompare: "3 active disputes pending response",
        returnRate: "12.8%",
        returnCompare: "↓ 2.4% after RTO Shield",
        points: "0,90 80,100 160,70 240,60 320,40 400,30 480,10",
        circles: [{x: 0, y: 90}, {x: 80, y: 100}, {x: 160, y: 70}, {x: 240, y: 60}, {x: 320, y: 40}, {x: 400, y: 30}, {x: 480, y: 10}]
      },
      Monthly: {
        revenue: "₹12,45,230",
        revenueCompare: "↑ 22% vs last month",
        disputes: "₹48,900",
        disputesCompare: "8 active disputes pending response",
        returnRate: "11.5%",
        returnCompare: "↓ 3.2% after RTO Shield",
        points: "0,140 80,120 160,110 240,80 320,60 400,40 480,15",
        circles: [{x: 0, y: 140}, {x: 80, y: 120}, {x: 160, y: 110}, {x: 240, y: 80}, {x: 320, y: 60}, {x: 400, y: 40}, {x: 480, y: 15}]
      },
      YTD: {
        revenue: "₹1,18,45,230",
        revenueCompare: "↑ 35% year-on-year",
        disputes: "₹3,12,000",
        disputesCompare: "14 disputes resolved in favor",
        returnRate: "10.8%",
        returnCompare: "↓ 4.5% after RTO Shield",
        points: "0,100 80,95 160,85 240,70 320,55 400,35 480,5",
        circles: [{x: 0, y: 100}, {x: 80, y: 95}, {x: 160, y: 85}, {x: 240, y: 70}, {x: 320, y: 55}, {x: 400, y: 35}, {x: 480, y: 5}]
      }
    };

    const activeMetrics = metricsMap[analyticsTimeframe];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Realtime Store Analytics</h2>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["Today", "Weekly", "Monthly", "YTD"] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setAnalyticsTimeframe(tf)}
                style={{
                  padding: "5px 12px",
                  fontSize: "11px",
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  background: analyticsTimeframe === tf ? "var(--accent-pale)" : "transparent",
                  color: analyticsTimeframe === tf ? "var(--accent)" : "var(--text-sec)",
                  cursor: "pointer",
                  fontWeight: analyticsTimeframe === tf ? 600 : 400
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          <div className="glass-panel" style={{ padding: "16px", borderRadius: "8px" }}>
            <div style={{ fontSize: "10px", color: "var(--text-mut)" }}>GROSS REVENUE</div>
            <div style={{ fontSize: "24px", color: "var(--text-pri)", fontWeight: 600, margin: "8px 0" }}>{activeMetrics.revenue}</div>
            <div style={{ fontSize: "10px", color: "var(--accent)" }}>{activeMetrics.revenueCompare}</div>
          </div>
          <div className="glass-panel" style={{ padding: "16px", borderRadius: "8px" }}>
            <div style={{ fontSize: "10px", color: "var(--text-mut)" }}>RECONCILIATION DISPUTES FILED</div>
            <div style={{ fontSize: "24px", color: "var(--text-pri)", fontWeight: 600, margin: "8px 0" }}>{activeMetrics.disputes}</div>
            <div style={{ fontSize: "10px", color: "var(--amber)" }}>{activeMetrics.disputesCompare}</div>
          </div>
          <div className="glass-panel" style={{ padding: "16px", borderRadius: "8px" }}>
            <div style={{ fontSize: "10px", color: "var(--text-mut)" }}>AVERAGE RETURN RATE</div>
            <div style={{ fontSize: "24px", color: "var(--red)", fontWeight: 600, margin: "8px 0" }}>{activeMetrics.returnRate}</div>
            <div style={{ fontSize: "10px", color: "var(--accent)" }}>{activeMetrics.returnCompare}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "20px", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-pri)", marginBottom: "15px" }}>
            {analyticsTimeframe === "Today" ? "Settlements & Revenue Hourly (₹)" : "Weekly Settlements & Revenue (₹)"}
          </div>
          <svg viewBox="0 0 500 150" style={{ width: "100%", height: "150px" }}>
            <polyline
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              points={activeMetrics.points}
            />
            {activeMetrics.circles.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r="4" fill="var(--accent)" />
            ))}
          </svg>
        </div>
      </div>
    );
  };


  const renderDiscounts = () => {
    // Find active COD/RTO risk orders
    const codOrders = orders.filter(o => o.status === "RTO risk" || o.status === "Unfulfilled");
    const selectedOrder = orders.find(o => o.id === selectedCodOrderId) || codOrders[0] || orders[0];

    const calculateDiscount = () => {
      const numericAmount = Number(selectedOrder.amount.replace(/[^0-9]/g, ""));
      if (discountType === "flat") {
        return discountValue;
      } else {
        return Math.round((numericAmount * discountValue) / 100);
      }
    };

    const handleSendSimulatedOffer = () => {
      setWhatsappSimStep(1);
    };

    const handleSimulateAccept = () => {
      setWhatsappSimStep(2);
      // Update order status in frontend state
      setOrders(prev => prev.map(o => {
        if (o.id === selectedCodOrderId) {
          return {
            ...o,
            status: "Processing",
            rtoRisk: "Low",
            amount: `₹${(Number(o.amount.replace(/[^0-9]/g, "")) - calculateDiscount()).toLocaleString("en-IN")}`
          };
        }
        return o;
      }));
    };

    const handleSimulateDecline = () => {
      setWhatsappSimStep(3);
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Smart Pricing & Promotions</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-sec)" }}>Rule Engine Status:</span>
            <button
              onClick={() => setDiscountActive(!discountActive)}
              style={{
                padding: "6px 12px",
                fontSize: "11px",
                borderRadius: "6px",
                border: "none",
                background: discountActive ? "var(--accent-pale)" : "rgba(239, 68, 68, 0.15)",
                color: discountActive ? "var(--accent)" : "var(--red)",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {discountActive ? "● ACTIVE" : "○ INACTIVE"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
          {/* Settings Panel */}
          <div className="glass-panel" style={{ padding: "20px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", color: "var(--text-pri)", fontWeight: 600 }}>Auto COD-to-Prepaid Conversion</h3>
            <p style={{ fontSize: "12px", color: "var(--text-sec)" }}>
              Automatically ping buyers of high-risk COD orders on WhatsApp, offering an instant discount to switch to prepaid, thereby lowering RTO rate.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--text-mut)" }}>DISCOUNT TYPE</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setDiscountType("flat")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: discountType === "flat" ? "rgba(255, 255, 255, 0.05)" : "transparent",
                      color: discountType === "flat" ? "var(--accent)" : "var(--text-sec)",
                      fontWeight: discountType === "flat" ? 600 : 400,
                      cursor: "pointer"
                    }}
                  >
                    Flat Discount (₹)
                  </button>
                  <button
                    onClick={() => setDiscountType("percent")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: discountType === "percent" ? "rgba(255, 255, 255, 0.05)" : "transparent",
                      color: discountType === "percent" ? "var(--accent)" : "var(--text-sec)",
                      fontWeight: discountType === "percent" ? 600 : 400,
                      cursor: "pointer"
                    }}
                  >
                    Percentage (%)
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: "var(--text-mut)" }}>DISCOUNT VALUE</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      color: "var(--text-pri)",
                      padding: "8px",
                      fontSize: "12px",
                      outline: "none"
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: "var(--text-mut)" }}>MIN ORDER VALUE (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      color: "var(--text-pri)",
                      padding: "8px",
                      fontSize: "12px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Playground */}
          <div className="glass-panel" style={{ padding: "20px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <h3 style={{ fontSize: "14px", color: "var(--text-pri)", fontWeight: 600 }}>WhatsApp simulator playground</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-mut)" }}>SELECT RISK ORDER TO TEST OFFER</label>
              <select
                value={selectedCodOrderId}
                onChange={(e) => {
                  setSelectedCodOrderId(e.target.value);
                  setWhatsappSimStep(0);
                }}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text-pri)",
                  padding: "8px",
                  fontSize: "12px",
                  outline: "none"
                }}
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.id} - {o.product} ({o.amount}) - {o.status}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "12px",
              minHeight: "150px",
              fontSize: "11.5px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              {whatsappSimStep === 0 && (
                <div style={{ color: "var(--text-mut)", textAlign: "center", margin: "auto" }}>
                  Click below to generate and send WhatsApp offer message.
                </div>
              )}

              {whatsappSimStep >= 1 && (
                <>
                  <div style={{ alignSelf: "flex-start", background: "var(--card)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", maxWidth: "85%" }}>
                    📩 *Vyapar OS Auto Offer*:<br />
                    Namaste! Aapka order *{selectedOrder?.id}* for *{selectedOrder?.product}* receive ho gaya hai. <br />
                    Agarr aap ise *Prepaid* me convert karte hain, toh aapko instantly *₹{calculateDiscount()} discount* milega! <br />
                    Total Pay: *₹{(Number(selectedOrder?.amount.replace(/[^0-9]/g, "")) - calculateDiscount())}* only.<br /><br />
                    Pay via UPI: [razorpay.com/pay](https://razorpay.com/payment/simulated-vyapar)
                  </div>
                </>
              )}

              {whatsappSimStep === 2 && (
                <div style={{ alignSelf: "flex-end", background: "var(--accent-pale)", border: "1px solid var(--accent)", padding: "6px 10px", borderRadius: "8px", maxWidth: "80%", color: "var(--text-pri)" }}>
                  ✅ Switch to prepaid option selected. Payment successful. Thank you!
                </div>
              )}

              {whatsappSimStep === 3 && (
                <div style={{ alignSelf: "flex-end", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--red)", padding: "6px 10px", borderRadius: "8px", maxWidth: "80%", color: "var(--text-pri)" }}>
                  ❌ Keep as COD.
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {whatsappSimStep === 0 ? (
                <button
                  onClick={handleSendSimulatedOffer}
                  style={{ width: "100%", padding: "8px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
                >
                  ⚡ Send Simulated WhatsApp Offer
                </button>
              ) : whatsappSimStep === 1 ? (
                <>
                  <button
                    onClick={handleSimulateAccept}
                    style={{ flex: 1, padding: "8px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "11.5px", cursor: "pointer" }}
                  >
                    Accept Offer (Simulate Buyer)
                  </button>
                  <button
                    onClick={handleSimulateDecline}
                    style={{ flex: 1, padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-sec)", borderRadius: "6px", fontSize: "11.5px", cursor: "pointer" }}
                  >
                    Keep COD (Simulate Buyer)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setWhatsappSimStep(0)}
                  style={{ width: "100%", padding: "8px", background: "rgba(255, 255, 255, 0.05)", color: "var(--text-pri)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                >
                  Reset Simulation
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderEmails = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>WhatsApp Conversational Assistant</h2>
      
      {/* Split Pane Sandbox Console */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
        
        {/* Left Side: Mock WhatsApp Chat Interface */}
        <div className="glass-panel" style={{ padding: "16px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)" }}>📲 WhatsApp Cloud API Chat Simulator</div>
          
          <div style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: "8px",
            padding: "12px",
            minHeight: "200px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            border: "1px solid var(--border)",
            justifyContent: "flex-end"
          }}>
            {/* User message */}
            <div style={{ alignSelf: "flex-end", maxWidth: "80%", background: "var(--accent-pale)", color: "var(--text-pri)", padding: "8px 12px", borderRadius: "8px", borderBottomRightRadius: "2px", fontSize: "12px" }}>
              {simulatorInput || "..."}
            </div>

            {/* AI Reply */}
            {simulatorReply && (
              <div style={{ alignSelf: "flex-start", maxWidth: "80%", background: "var(--card)", color: "var(--text-pri)", padding: "8px 12px", borderRadius: "8px", borderBottomLeftRadius: "2px", border: "1px solid var(--border)", fontSize: "12px" }}>
                {simulatorReply}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={simulatorInput}
              onChange={(e) => setSimulatorInput(e.target.value)}
              placeholder="Type simulated message..."
              style={{
                flex: 1,
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-pri)",
                padding: "8px 12px",
                fontSize: "12px",
                outline: "none"
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSimulation();
              }}
            />
            <button
              onClick={runSimulation}
              disabled={isSimulatorRunning}
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              {isSimulatorRunning ? "Sending..." : "Simulate ⚡"}
            </button>
          </div>
        </div>

        {/* Right Side: Execution Logs / Webhook Trace */}
        <div className="glass-panel" style={{ padding: "16px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)" }}>🛠️ Webhook Execution Trace Logger</div>
          <div style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: "6px",
            padding: "10px",
            fontFamily: "monospace",
            fontSize: "10.5px",
            minHeight: "220px",
            color: "var(--text-sec)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            overflowY: "auto"
          }}>
            {simulatorLogs.length === 0 ? (
              <div style={{ color: "var(--text-mut)" }}>// Logs will appear here when you simulate a message...</div>
            ) : (
              simulatorLogs.map((log, idx) => {
                let color = "var(--text-sec)";
                if (log.startsWith("[Ingest]")) color = "var(--blue)";
                if (log.startsWith("[Brain]")) color = "var(--amber)";
                if (log.startsWith("[Outbound]")) color = "var(--accent)";
                if (log.startsWith("[Error]")) color = "var(--red)";
                return (
                  <div key={idx} style={{ color }}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      <div className="glass-panel" style={{ padding: "20px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={{ fontSize: "14px", color: "var(--text-pri)" }}>Auto-Trigger Messages Status</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
            <span style={{ fontSize: "12px" }}>📦 Order Dispatch Alert</span>
            <span style={{ color: "var(--accent)", fontSize: "11px", fontWeight: 600 }}>ENABLED (14 sent today)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
            <span style={{ fontSize: "12px" }}>⚠️ High RTO Verification (Hindi/English voice call)</span>
            <span style={{ color: "var(--accent)", fontSize: "11px", fontWeight: 600 }}>ENABLED</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px" }}>
            <span style={{ fontSize: "12px" }}>🚨 Low Stock Auto-Alert to Supplier</span>
            <span style={{ color: "var(--accent)", fontSize: "11px", fontWeight: 600 }}>ENABLED</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderABTesting = () => {
    if (!isSubscribed) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>A/B Variant Testing</h2>
          <div className="glass-panel" style={{ padding: "40px", borderRadius: "10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "40px" }}>🧪</span>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-pri)" }}>Unlock conversion optimization</h3>
            <p style={{ fontSize: "12px", color: "var(--text-sec)", maxWidth: "340px", lineHeight: "1.6" }}>
              Run live experiments on checkout options, WhatsApp templates, and shipping thresholds to optimize conversion rates and minimize returns.
            </p>
            <button
              onClick={() => setIsUpgrading(true)}
              style={{
                padding: "8px 20px",
                background: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                marginTop: "8px"
              }}
            >
              Upgrade to Pro Plan
            </button>
          </div>
        </div>
      );
    }

    const handleCreateTest = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTestName) return;

      const newTest = {
        id: `ab-00${abTests.length + 1}`,
        name: newTestName,
        variantA: newTestVarA || "Variant A",
        variantB: newTestVarB || "Variant B",
        trafficSplit: newTestSplit,
        status: "Running",
        conversionsA: 0,
        conversionsB: 0,
        ordersA: 0,
        ordersB: 0,
        rtoA: 0,
        rtoB: 0
      };

      setAbTests([...abTests, newTest]);
      setNewTestName("");
      setNewTestVarA("");
      setNewTestVarB("");
      setNewTestSplit(50);
      setNewTestModalOpen(false);
    };

    const toggleStatus = (id: string) => {
      setAbTests(prev => prev.map(t => {
        if (t.id === id) {
          return { ...t, status: t.status === "Running" ? "Paused" : "Running" };
        }
        return t;
      }));
    };

    const declareWinner = (id: string, winner: "A" | "B") => {
      const test = abTests.find(t => t.id === id);
      const winnerName = winner === "A" ? test.variantA : test.variantB;
      alert(`Declared "${winnerName}" as the winner for the test "${test.name}"! Applying settings store-wide.`);
      setAbTests(prev => prev.filter(t => t.id !== id));
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>A/B Variant Testing</h2>
            <p style={{ fontSize: "11px", color: "var(--text-sec)" }}>Distribute storefront checkouts and optimize shipping templates.</p>
          </div>
          <button
            onClick={() => setNewTestModalOpen(true)}
            style={{
              padding: "8px 16px",
              background: "var(--accent)",
              color: "var(--accent-text)",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            🧪 Start New Experiment
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {abTests.map(test => {
            const totalOrders = test.ordersA + test.ordersB;
            const rateA = test.ordersA ? ((test.conversionsA / test.ordersA) * 100).toFixed(1) : "0.0";
            const rateB = test.ordersB ? ((test.conversionsB / test.ordersB) * 100).toFixed(1) : "0.0";

            return (
              <div key={test.id} className="glass-panel" style={{ padding: "20px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-pri)" }}>{test.name}</h3>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px", alignItems: "center" }}>
                      <span style={{
                        fontSize: "9px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: test.status === "Running" ? "var(--accent-pale)" : "rgba(255,255,255,0.05)",
                        color: test.status === "Running" ? "var(--accent)" : "var(--text-sec)"
                      }}>
                        {test.status}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-mut)" }}>Split: {test.trafficSplit}% / {100 - test.trafficSplit}% • Total Visitors: {totalOrders}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => toggleStatus(test.id)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--text-pri)",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      {test.status === "Running" ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => declareWinner(test.id, "A")}
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        border: "1px solid var(--accent)",
                        background: "var(--accent-pale)",
                        color: "var(--accent)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Winner: A
                    </button>
                    <button
                      onClick={() => declareWinner(test.id, "B")}
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        border: "1px solid var(--accent)",
                        background: "var(--accent-pale)",
                        color: "var(--accent)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Winner: B
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                  {/* Variant A details */}
                  <div style={{ padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-mut)" }}>VARIANT A</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-pri)", margin: "4px 0" }}>{test.variantA}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "8px" }}>
                      <div>
                        <div style={{ fontSize: "9px", color: "var(--text-mut)" }}>TRAFFIC</div>
                        <div style={{ fontSize: "11px", color: "var(--text-pri)" }}>{test.ordersA} visitors</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "9px", color: "var(--text-mut)" }}>CONV. RATE</div>
                        <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 600 }}>{rateA}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "9px", color: "var(--text-mut)" }}>RTO RATE</div>
                        <div style={{ fontSize: "11px", color: "var(--red)" }}>{test.rtoA}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Variant B details */}
                  <div style={{ padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-mut)" }}>VARIANT B</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-pri)", margin: "4px 0" }}>{test.variantB}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "8px" }}>
                      <div>
                        <div style={{ fontSize: "9px", color: "var(--text-mut)" }}>TRAFFIC</div>
                        <div style={{ fontSize: "11px", color: "var(--text-pri)" }}>{test.ordersB} visitors</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "9px", color: "var(--text-mut)" }}>CONV. RATE</div>
                        <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 600 }}>{rateB}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "9px", color: "var(--text-mut)" }}>RTO RATE</div>
                        <div style={{ fontSize: "11px", color: "var(--red)" }}>{test.rtoB}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal for creating a new experiment */}
        {newTestModalOpen && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <form onSubmit={handleCreateTest} className="glass-panel" style={{ padding: "24px", borderRadius: "12px", width: "420px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-pri)" }}>🧪 Create New Experiment</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--text-sec)" }}>EXPERIMENT NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI checkout incentive banner"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-pri)", padding: "8px", fontSize: "12px", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: "var(--text-sec)" }}>VARIANT A</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Control (No discount)"
                    value={newTestVarA}
                    onChange={(e) => setNewTestVarA(e.target.value)}
                    style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-pri)", padding: "8px", fontSize: "12px", outline: "none" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: "var(--text-sec)" }}>VARIANT B</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Treatment (₹50 discount)"
                    value={newTestVarB}
                    onChange={(e) => setNewTestVarB(e.target.value)}
                    style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-pri)", padding: "8px", fontSize: "12px", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label style={{ fontSize: "11px", color: "var(--text-sec)" }}>TRAFFIC SPLIT (VARIANT A)</label>
                  <span style={{ fontSize: "11px", color: "var(--accent)" }}>{newTestSplit}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={newTestSplit}
                  onChange={(e) => setNewTestSplit(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setNewTestModalOpen(false)}
                  style={{ flex: 1, padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-sec)", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: "8px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", fontSize: "12px" }}
                >
                  Start Experiment
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };


  const renderIntegrations = () => {
    const handleConfigure = (api: any) => {
      setActiveConfigIntegration(api);
      setSellerId(api.name.includes("CA Bookkeeping") ? "CA-BOOK-2026" : "MSME-SHARMA-001");
      setApiKey("••••••••••••••••••••••••");
      setSyncInterval("30");
      setIntegrationModalOpen(true);
    };

    const handleSaveIntegration = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Configuration for ${activeConfigIntegration?.name} saved successfully! Synchronizing catalog data...`);
      setIntegrationModalOpen(false);
    };

    const handleTestConnection = () => {
      alert(`Testing authorization tokens for ${activeConfigIntegration?.name}...\n✅ API handshake verified. Ping response latency: 142ms.`);
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Marketplace API Integrations</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {[
            { name: "Amazon Selling Partner API", status: "Connected", logo: "🛍️", color: "var(--amz)" },
            { name: "Flipkart Seller API", status: "Connected", logo: "🛒", color: "var(--flipkart)" },
            { name: "Meesho Seller Panel Sync", status: "Connected", logo: "📦", color: "var(--meesho)" },
            { name: "CA Bookkeeping CSV Bridge", status: "Active", logo: "📁", color: "var(--accent)" }
          ].map(api => (
            <div key={api.name} className="glass-panel" style={{ padding: "16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-pri)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{api.logo}</span> {api.name}
                </div>
                <div style={{ fontSize: "11px", marginTop: "4px", color: api.color }}>{api.status}</div>
              </div>
              <button
                onClick={() => handleConfigure(api)}
                style={{ padding: "4px 8px", fontSize: "10px", border: "1px solid var(--border)", color: "var(--text-pri)", background: "transparent", borderRadius: "4px", cursor: "pointer" }}
              >
                Configure
              </button>
            </div>
          ))}
        </div>

        {/* Integration Config Modal */}
        {integrationModalOpen && activeConfigIntegration && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <form onSubmit={handleSaveIntegration} className="glass-panel" style={{ padding: "24px", borderRadius: "12px", width: "420px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-pri)" }}>🔌 Configure {activeConfigIntegration.name}</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--text-sec)" }}>
                  {activeConfigIntegration.name.includes("Bookkeeping") ? "FIRM/CLIENT CODE" : "SELLER / MERCHANT ID"}
                </label>
                <input
                  type="text"
                  required
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-pri)", padding: "8px", fontSize: "12px", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--text-sec)" }}>
                  {activeConfigIntegration.name.includes("Bookkeeping") ? "CA EMAIL / BACKUP KEY" : "API AUTHENTICATION TOKEN"}
                </label>
                <input
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-pri)", padding: "8px", fontSize: "12px", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--text-sec)" }}>DATA SYNC INTERVAL</label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-pri)", padding: "8px", fontSize: "12px", outline: "none", cursor: "pointer" }}
                >
                  <option value="15">Every 15 Minutes</option>
                  <option value="30">Every 30 Minutes</option>
                  <option value="60">Hourly</option>
                  <option value="1440">Daily</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  style={{ flex: 1, padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-pri)", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                >
                  Test Connection
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIntegrationModalOpen(false)}
                  style={{ flex: 1, padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-sec)", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: "8px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", fontSize: "12px" }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };


  const renderSettings = () => {
    const handleAddTeamMember = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMemberName.trim() || !newMemberEmail.trim()) return;
      const newMember = {
        id: `tm-${Date.now()}`,
        name: newMemberName,
        email: newMemberEmail,
        role: newMemberRole,
        status: "Active"
      };
      setTeamMembers([...teamMembers, newMember]);
      setNewMemberName("");
      setNewMemberEmail("");
    };

    const handleRemoveTeamMember = (id: string) => {
      setTeamMembers(teamMembers.filter(m => m.id !== id));
    };

    const handleToggleChannel = (key: string) => {
      setSalesChannels(salesChannels.map(c => c.key === key ? { ...c, connected: !c.connected } : c));
    };

    const handleAddZone = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newZoneName.trim() || !newZonePrice.trim()) return;
      const newZone = {
        id: `sz-${Date.now()}`,
        name: newZoneName,
        region: newZoneRegion || "All Regions",
        price: newZonePrice.startsWith("₹") ? newZonePrice : `₹${newZonePrice}`,
        transitTime: newZoneTime || "3-5 days"
      };
      setShippingZones([...shippingZones, newZone]);
      setNewZoneName("");
      setNewZoneRegion("");
      setNewZonePrice("");
      setNewZoneTime("");
    };

    const handleRemoveZone = (id: string) => {
      setShippingZones(shippingZones.filter(z => z.id !== id));
    };

    const handleAddReason = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newReasonText.trim() || !newReasonCode.trim()) return;
      const newReason = {
        id: `rr-${Date.now()}`,
        reason: newReasonText,
        code: newReasonCode.toUpperCase().replace(/\s+/g, "_"),
        active: true
      };
      setReturnReasons([...returnReasons, newReason]);
      setNewReasonText("");
      setNewReasonCode("");
    };

    const handleRemoveReason = (id: string) => {
      setReturnReasons(returnReasons.filter(r => r.id !== id));
    };

    const handleGenerateKey = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newKeyName.trim()) return;
      const randomKey = `pk_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
      const newKey = {
        id: `ak-${Date.now()}`,
        name: newKeyName,
        key: randomKey,
        created: new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })
      };
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName("");
    };

    const handleRemoveKey = (id: string) => {
      setApiKeys(apiKeys.filter(k => k.id !== id));
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Header and Quick stats */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-pri)" }}>Store Configuration</h2>
            <p style={{ fontSize: "12px", color: "var(--text-sec)" }}>Manage your Vyapar OS preferences, sales integrations, team roles and policies.</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ fontSize: "11px", backgroundColor: "var(--accent-pale)", color: "var(--accent)", border: "1px solid var(--border)", padding: "4px 8px", borderRadius: "12px", fontWeight: 500 }}>
              Store Currency: {storeCurrency}
            </span>
          </div>
        </div>

        {/* Outer Settings Panel Container */}
        <div style={{ display: "flex", gap: "24px", minHeight: "560px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          {/* Tab Navigation Sidebar */}
          <div style={{ width: "220px", minWidth: "220px", borderRight: "1px solid var(--border)", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px", backgroundColor: "rgba(0,0,0,0.05)" }}>
            <button
              onClick={() => setActiveSettingTab("general")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeSettingTab === "general" ? "var(--accent-pale)" : "transparent",
                color: activeSettingTab === "general" ? "var(--accent)" : "var(--text-sec)",
                textAlign: "left",
                fontSize: "12.5px",
                fontWeight: activeSettingTab === "general" ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <span>🏪</span> General Settings
            </button>
            <button
              onClick={() => setActiveSettingTab("team")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeSettingTab === "team" ? "var(--accent-pale)" : "transparent",
                color: activeSettingTab === "team" ? "var(--accent)" : "var(--text-sec)",
                textAlign: "left",
                fontSize: "12.5px",
                fontWeight: activeSettingTab === "team" ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <span>👥</span> Team Members
            </button>
            <button
              onClick={() => setActiveSettingTab("channels")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeSettingTab === "channels" ? "var(--accent-pale)" : "transparent",
                color: activeSettingTab === "channels" ? "var(--accent)" : "var(--text-sec)",
                textAlign: "left",
                fontSize: "12.5px",
                fontWeight: activeSettingTab === "channels" ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <span>🔗</span> Sales Channels
            </button>
            <button
              onClick={() => setActiveSettingTab("shipping")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeSettingTab === "shipping" ? "var(--accent-pale)" : "transparent",
                color: activeSettingTab === "shipping" ? "var(--accent)" : "var(--text-sec)",
                textAlign: "left",
                fontSize: "12.5px",
                fontWeight: activeSettingTab === "shipping" ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <span>🚚</span> Shipping & Returns
            </button>
            <button
              onClick={() => setActiveSettingTab("keys")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeSettingTab === "keys" ? "var(--accent-pale)" : "transparent",
                color: activeSettingTab === "keys" ? "var(--accent)" : "var(--text-sec)",
                textAlign: "left",
                fontSize: "12.5px",
                fontWeight: activeSettingTab === "keys" ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <span>🔑</span> Keys & Webhooks
            </button>

            {/* Quick RBAC switch at bottom of settings sidebar */}
            <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-mut)", textTransform: "uppercase", marginBottom: "8px", paddingLeft: "8px" }}>
                Active Session Role
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                  onClick={() => setUserRole("Owner")}
                  style={{
                    padding: "6px 10px",
                    fontSize: "11px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: userRole === "Owner" ? "var(--accent-pale)" : "transparent",
                    color: userRole === "Owner" ? "var(--accent)" : "var(--text-sec)",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  👑 Owner (All Permits)
                </button>
                <button
                  onClick={() => setUserRole("Accountant")}
                  style={{
                    padding: "6px 10px",
                    fontSize: "11px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: userRole === "Accountant" ? "var(--accent-pale)" : "transparent",
                    color: userRole === "Accountant" ? "var(--accent)" : "var(--text-sec)",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  📊 Accountant Role
                </button>
              </div>
            </div>
          </div>

          {/* Active Content Area */}
          <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
            {activeSettingTab === "general" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-pri)" }}>General Settings</h3>
                  <p style={{ fontSize: "11.5px", color: "var(--text-sec)" }}>Basic details of your retail store integration and locale parameters.</p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-pri)" }}>Store Name</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text-pri)", fontSize: "12px" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-pri)" }}>Support Email</label>
                      <input
                        type="email"
                        value={storeEmail}
                        onChange={(e) => setStoreEmail(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text-pri)", fontSize: "12px" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-pri)" }}>WhatsApp Gateway</label>
                      <input
                        type="text"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text-pri)", fontSize: "12px" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-pri)" }}>Business Address</label>
                    <textarea
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      rows={3}
                      style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text-pri)", fontSize: "12px", resize: "none" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-pri)" }}>Store Currency</label>
                    <select
                      value={storeCurrency}
                      onChange={(e) => setStoreCurrency(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-pri)", fontSize: "12px" }}
                    >
                      <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                      <option value="USD ($)">USD ($) - US Dollar</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                    </select>
                  </div>
                </div>

                {/* Plan Details Card inside General tab */}
                <div style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "8px", background: "rgba(0,0,0,0.05)", marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "9px", color: "var(--text-mut)", fontWeight: 600, textTransform: "uppercase" }}>CURRENT SUBSCRIPTION PLAN</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-pri)", marginTop: "2px" }}>
                        {isSubscribed ? "🚀 Vyapar OS Pro Plan" : "🆕 Free Trial - Phase 0"}
                      </div>
                      <p style={{ fontSize: "10.5px", color: "var(--text-sec)", marginTop: "2px" }}>
                        {isSubscribed ? "Active. Success-fee billing connected (15% of recovered fees)." : "Limit reached. Upgrade to unlock all Phase 1 capabilities."}
                      </p>
                    </div>
                    {!isSubscribed && (
                      <button
                        onClick={() => setIsUpgrading(true)}
                        style={{
                          padding: "6px 12px",
                          background: "var(--accent)",
                          color: "var(--accent-text)",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: 600,
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        Upgrade to Pro
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSettingTab === "team" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-pri)" }}>Team Management</h3>
                  <p style={{ fontSize: "11.5px", color: "var(--text-sec)" }}>Add colleagues and manage permission bounds across the control panels.</p>
                </div>

                {/* Invite Team Member Form */}
                <form onSubmit={handleAddTeamMember} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 80px", gap: "10px", background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-pri)", fontSize: "12px" }}
                    required
                  />
                  <input
                    type="email"
                    placeholder="name@vyapaar.in"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-pri)", fontSize: "12px" }}
                    required
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-pri)", fontSize: "12px" }}
                  >
                    <option value="Manager">Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Shipper">Shipper</option>
                  </select>
                  <button
                    type="submit"
                    style={{
                      background: "var(--accent)",
                      color: "var(--accent-text)",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Invite
                  </button>
                </form>

                {/* Team List Table */}
                <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.15)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px", color: "var(--text-pri)" }}>Name</th>
                        <th style={{ padding: "10px 14px", color: "var(--text-pri)" }}>Email</th>
                        <th style={{ padding: "10px 14px", color: "var(--text-pri)" }}>Role</th>
                        <th style={{ padding: "10px 14px", color: "var(--text-pri)" }}>Status</th>
                        <th style={{ padding: "10px 14px", color: "var(--text-pri)", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "10px 14px", color: "var(--text-pri)", fontWeight: 500 }}>{member.name}</td>
                          <td style={{ padding: "10px 14px", color: "var(--text-sec)" }}>{member.email}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontSize: "10.5px", padding: "2px 6px", borderRadius: "4px", backgroundColor: member.role === "Owner" ? "rgba(255,149,0,0.1)" : "rgba(0,122,255,0.1)", color: member.role === "Owner" ? "var(--amber)" : "var(--blue)" }}>
                              {member.role}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: member.status === "Active" ? "var(--green)" : "var(--amber)" }}>
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: member.status === "Active" ? "var(--green)" : "var(--amber)" }}></span>
                              {member.status}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right" }}>
                            {member.role !== "Owner" ? (
                              <button
                                onClick={() => handleRemoveTeamMember(member.id)}
                                style={{ border: "none", background: "none", color: "var(--red)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                              >
                                Revoke
                              </button>
                            ) : (
                              <span style={{ fontSize: "11px", color: "var(--text-mut)" }}>Permanent</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSettingTab === "channels" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-pri)" }}>Sales Channels</h3>
                  <p style={{ fontSize: "11.5px", color: "var(--text-sec)" }}>Connect and toggle syncing behavior across multi-seller storefront networks.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {salesChannels.map((channel) => (
                    <div
                      key={channel.key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.01)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "20px" }}>
                          {channel.key === "amazon" ? "📦" : channel.key === "flipkart" ? "🛒" : channel.key === "meesho" ? "🛍️" : "💬"}
                        </span>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-pri)" }}>{channel.name}</div>
                          <div style={{ fontSize: "10.5px", color: "var(--text-mut)" }}>Synced orders: {channel.orderCount}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "11px", color: channel.connected ? "var(--green)" : "var(--text-mut)" }}>
                          {channel.connected ? "Active Hook" : "Inactive"}
                        </span>
                        <button
                          onClick={() => handleToggleChannel(channel.key)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            background: channel.connected ? "rgba(255,59,48,0.08)" : "var(--accent-pale)",
                            color: channel.connected ? "var(--red)" : "var(--accent)",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          {channel.connected ? "Disconnect" : "Connect"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSettingTab === "shipping" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-pri)" }}>Shipping Rates & Return Policies</h3>
                  <p style={{ fontSize: "11.5px", color: "var(--text-sec)" }}>Create standard rates and define return labels for AI resolution templates.</p>
                </div>

                {/* Shipping Rates */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)" }}>Shipping Zones & Flat Rates</div>
                  
                  {/* Shipping Form */}
                  <form onSubmit={handleAddZone} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 100px 70px", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Zone Name"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                      style={{ padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-pri)", fontSize: "11px" }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Region (e.g. India)"
                      value={newZoneRegion}
                      onChange={(e) => setNewZoneRegion(e.target.value)}
                      style={{ padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-pri)", fontSize: "11px" }}
                    />
                    <input
                      type="text"
                      placeholder="Price (₹)"
                      value={newZonePrice}
                      onChange={(e) => setNewZonePrice(e.target.value)}
                      style={{ padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-pri)", fontSize: "11px" }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Transit Time"
                      value={newZoneTime}
                      onChange={(e) => setNewZoneTime(e.target.value)}
                      style={{ padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-pri)", fontSize: "11px" }}
                    />
                    <button
                      type="submit"
                      style={{ background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: "5px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Add Zone
                    </button>
                  </form>

                  {/* Zones List */}
                  <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                    {shippingZones.map((zone) => (
                      <div key={zone.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.01)" }}>
                        <div>
                          <div style={{ fontSize: "12px", color: "var(--text-pri)", fontWeight: 600 }}>{zone.name} ({zone.region})</div>
                          <div style={{ fontSize: "10.5px", color: "var(--text-mut)" }}>Transit: {zone.transitTime}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-pri)", fontWeight: 700 }}>{zone.price}</span>
                          <button onClick={() => handleRemoveZone(zone.id)} style={{ border: "none", background: "none", color: "var(--red)", fontSize: "11px", cursor: "pointer" }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Return Reasons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)" }}>AI-Parsed Return Reasons</div>
                  
                  {/* Reasons Form */}
                  <form onSubmit={handleAddReason} style={{ display: "grid", gridTemplateColumns: "1fr 120px 70px", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Customer-facing Reason Label"
                      value={newReasonText}
                      onChange={(e) => setNewReasonText(e.target.value)}
                      style={{ padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-pri)", fontSize: "11px" }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="CODE (e.g. SIZE_FIT)"
                      value={newReasonCode}
                      onChange={(e) => setNewReasonCode(e.target.value)}
                      style={{ padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-pri)", fontSize: "11px" }}
                      required
                    />
                    <button
                      type="submit"
                      style={{ background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: "5px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Add Code
                    </button>
                  </form>

                  {/* Reasons List */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {returnReasons.map((reason) => (
                      <div
                        key={reason.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 12px",
                          border: "1px solid var(--border)",
                          borderRadius: "16px",
                          background: "var(--surface)",
                          fontSize: "11px"
                        }}
                      >
                        <span style={{ color: "var(--text-pri)" }}>{reason.reason}</span>
                        <span style={{ opacity: 0.5, fontStyle: "italic" }}>({reason.code})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveReason(reason.id)}
                          style={{ border: "none", background: "none", color: "var(--red)", fontSize: "12px", padding: 0, cursor: "pointer", marginLeft: "4px" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSettingTab === "keys" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-pri)" }}>API Credentials & Webhooks</h3>
                  <p style={{ fontSize: "11.5px", color: "var(--text-sec)" }}>Generate verification tokens or check inbound WhatsApp endpoint logs.</p>
                </div>

                {/* API Keys Panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)" }}>Secret Access Tokens</div>
                  
                  {/* Create Token Form */}
                  <form onSubmit={handleGenerateKey} style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Token Identifier (e.g. Vercel deployment)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      style={{ padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-pri)", fontSize: "11px" }}
                      required
                    />
                    <button
                      type="submit"
                      style={{ background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: "5px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Generate Key
                    </button>
                  </form>

                  {/* Token List */}
                  <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.01)"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", color: "var(--text-pri)", fontWeight: 600 }}>{key.name}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-mut)", fontFamily: "monospace" }}>{key.key}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "10px", color: "var(--text-mut)" }}>Created: {key.created}</span>
                          <button
                            onClick={() => handleRemoveKey(key.id)}
                            style={{ border: "none", background: "none", color: "var(--red)", fontSize: "11px", cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Webhooks Endpoint Observer */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-pri)" }}>Inbound Webhook Handlers</div>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", background: "rgba(0,0,0,0.1)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "10.5px", color: "var(--text-mut)", fontWeight: 500 }}>WHATSAPP WEBHOOK ENDPOINT (POST)</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <code style={{ flex: 1, padding: "8px", borderRadius: "5px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--accent)", fontSize: "11.5px", fontFamily: "monospace" }}>
                          https://vyapaar.my-backend.sh/api/webhook/whatsapp
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText("https://vyapaar.my-backend.sh/api/webhook/whatsapp")}
                          style={{ padding: "6px 12px", fontSize: "11px", borderRadius: "5px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-pri)", cursor: "pointer" }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "10.5px", color: "var(--text-mut)", fontWeight: 500 }}>STORE INTEGRATION HOOK (POST)</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <code style={{ flex: 1, padding: "8px", borderRadius: "5px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--accent)", fontSize: "11.5px", fontFamily: "monospace" }}>
                          https://vyapaar.my-backend.sh/api/webhook/store-events
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText("https://vyapaar.my-backend.sh/api/webhook/store-events")}
                          style={{ padding: "6px 12px", fontSize: "11px", borderRadius: "5px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-pri)", cursor: "pointer" }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSupport = () => {
    const handleSendSupportMessage = () => {
      if (!supportInput.trim()) return;

      const userMsg = { from: "user", text: supportInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setSupportMessages(prev => [...prev, userMsg]);
      const currentInput = supportInput;
      setSupportInput("");
      setIsSupportTyping(true);

      fetch(getApiUrl("/api/support/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput })
      })
        .then(res => res.json())
        .then(data => {
          setIsSupportTyping(false);
          const agentMsg = {
            from: "agent",
            text: data.reply || "Aapke inquiry ke liye shukriya. Main ispe check kar raha hoon.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setSupportMessages(prev => [...prev, agentMsg]);
        })
        .catch(err => {
          setIsSupportTyping(false);
          console.error("Support API error:", err);
          const errorMsg = {
            from: "agent",
            text: "Connection error. Please try again or check your local server settings.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setSupportMessages(prev => [...prev, errorMsg]);
        });
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "calc(100vh - 120px)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Support Center</h2>
        
        <div className="glass-panel" style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          flex: 1,
          overflow: "hidden"
        }}>
          {/* Support Chat Messages Log */}
          <div style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            {supportMessages.map((msg, idx) => {
              const isAgent = msg.from === "agent";
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isAgent ? "flex-start" : "flex-end",
                    maxWidth: "75%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px"
                  }}
                >
                  <div style={{
                    fontSize: "9px",
                    color: "var(--text-mut)",
                    alignSelf: isAgent ? "flex-start" : "flex-end"
                  }}>
                    {isAgent ? "Support Agent" : "You"} • {msg.time}
                  </div>
                  <div style={{
                    background: isAgent ? "var(--card)" : "var(--accent-pale)",
                    color: "var(--text-pri)",
                    border: isAgent ? "1px solid var(--border)" : "1px solid var(--accent)",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    borderTopLeftRadius: isAgent ? "2px" : "10px",
                    borderTopRightRadius: isAgent ? "10px" : "2px",
                    fontSize: "12.5px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-line"
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isSupportTyping && (
              <div style={{ alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "9px", color: "var(--text-mut)" }}>Support Agent is typing...</span>
                <div style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "var(--text-sec)",
                  fontStyle: "italic"
                }}>
                  Analyzing issue...
                </div>
              </div>
            )}
          </div>

          {/* Support Input Bar */}
          <div style={{
            padding: "16px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "10px",
            backgroundColor: "rgba(0,0,0,0.15)"
          }}>
            <input
              type="text"
              value={supportInput}
              onChange={(e) => setSupportInput(e.target.value)}
              placeholder="Ask support about settlements, integrations, or subscription..."
              style={{
                flex: 1,
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-pri)",
                padding: "10px 14px",
                fontSize: "12px",
                outline: "none"
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendSupportMessage();
              }}
            />
            <button
              onClick={handleSendSupportMessage}
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                borderRadius: "6px",
                padding: "0 20px",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderObservability = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>System Status & Observability Hub</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
          {/* Release Readiness Checklist */}
          <div className="glass-panel" style={{ padding: "20px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-pri)" }}>🚀 Deployment Readiness Checklist</h3>
            <p style={{ fontSize: "11px", color: "var(--text-sec)" }}>Check the readiness state of Vyapar OS background sync nodes and webhooks.</p>
            
            {deployStatus ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-mut)" }}>ENVIRONMENT</span>
                  <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600 }}>{deployStatus.environment.toUpperCase()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-mut)" }}>STATUS</span>
                  <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600 }}>READY</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  {deployStatus.steps?.map((step: string, idx: number) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                      <span style={{ color: "var(--accent)" }}>✓</span>
                      <span style={{ color: "var(--text-pri)" }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "var(--text-mut)" }}>Loading deployment status...</div>
            )}
          </div>

          {/* System Timeline Logs */}
          <div className="glass-panel" style={{ padding: "20px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-pri)" }}>🛠️ Background Event Heartbeats</h3>
            <p style={{ fontSize: "11px", color: "var(--text-sec)" }}>Heartbeats and webhook sync reports collected from platform endpoints.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto" }}>
              {systemEvents.length === 0 ? (
                <div style={{ fontSize: "11px", color: "var(--text-mut)" }}>No events recorded.</div>
              ) : (
                systemEvents.map((evt: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "2px solid var(--accent)", paddingLeft: "10px", marginLeft: "4px" }}>
                    <div style={{ fontSize: "9px", color: "var(--text-mut)" }}>
                      {new Date(evt.ts).toLocaleString()}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-pri)" }}>
                      <strong>[{evt.type.toUpperCase()}]</strong> {evt.detail}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };


  const getContent = () => {
    switch (activeSection) {
      case "Home": return renderHome();
      case "Orders": return renderOrders();
      case "Products": return renderProducts();
      case "Customers": return renderCustomers();
      case "Analytics": return renderAnalytics();
      case "Discounts": return renderDiscounts();
      case "Emails": return renderEmails();
      case "ABTesting": return renderABTesting();
      case "Integrations": return renderIntegrations();
      case "Settings": return renderSettings();
      case "Support": return renderSupport();
      case "Status": return renderObservability();
      default: return renderHome();
    }
  };

  if (!isUnlocked) {
    return <LockScreen onUnlock={(token) => { setIsUnlocked(true); localStorage.setItem("vyapar_session", token); }} />;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} onLogout={handleLogout} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Topbar onAskAI={handleAskAI} />

        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <div
            className="scrollable-content"
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
            }}
          >
            {getContent()}
          </div>

          {/* Collapsible right panel for Amboras business assistant */}
          <div
            className="right-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid var(--border)",
              height: "100%",
              width: "360px",
              minWidth: "360px",
            }}
          >
            <LiveTicker />
            <AIChat />
          </div>
        </div>
      </div>

      {/* Voice Listing Wizard Modal overlay */}
      {voiceListingOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div className="glass-panel" style={{ padding: "24px", borderRadius: "10px", width: "450px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--text-pri)" }}>AI Voice Listing Assistant</h3>
            {voiceListingStep === 0 && (
              <>
                <p style={{ fontSize: "12px", color: "var(--text-sec)" }}>Describe your product in Hindi or English, or type details below:</p>
                <textarea
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  style={{
                    width: "100%",
                    height: "60px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    color: "var(--text-pri)",
                    fontSize: "12px",
                    padding: "8px",
                    outline: "none",
                    resize: "none"
                  }}
                />
                <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
                  <button
                    onClick={processVoice}
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "50%",
                      background: isRecording ? "var(--red)" : "var(--accent)",
                      border: "none",
                      color: "#fff",
                      fontSize: "20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: isRecording ? "pulse-green 1.5s infinite" : "none"
                    }}
                  >
                    🎙️
                  </button>
                </div>
                <div style={{ textAlign: "center", fontSize: "11px", color: isRecording ? "var(--red)" : "var(--text-mut)" }}>
                  {isRecording ? "Analyzing with Groq..." : "Click mic or edit text above & click mic to parse"}
                </div>
              </>
            )}

            {voiceListingStep === 1 && (
              <>
                <div style={{ fontSize: "12px", color: "var(--text-sec)" }}>Extracted Details (Groq AI Parsed):</div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "6px", fontSize: "12.5px", color: "var(--text-pri)", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div><strong>Name:</strong> {parsedProduct.name}</div>
                  <div><strong>SKU:</strong> {parsedProduct.sku}</div>
                  <div><strong>Stock:</strong> {parsedProduct.stock} units</div>
                  <div><strong>Price:</strong> {parsedProduct.price}</div>
                  <div><strong>Channels:</strong> {parsedProduct.platforms?.join(", ")}</div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button onClick={() => setVoiceListingStep(0)} style={{ flex: 1, padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-sec)", borderRadius: "6px", cursor: "pointer" }}>Retry</button>
                  <button onClick={addVoiceProduct} style={{ flex: 1, padding: "8px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Confirm & List Product</button>
                </div>
              </>
            )}

            <button onClick={() => { setVoiceListingOpen(false); setVoiceListingStep(0); }} style={{ position: "absolute", top: "15px", right: "15px", border: "none", background: "none", color: "var(--text-sec)", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        </div>
      )}

      {/* Razorpay Subscription Checkout Modal Overlay */}
      {isUpgrading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div className="glass-panel text-stroke-xs" style={{ padding: "24px", borderRadius: "12px", width: "420px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid var(--border)", position: "relative" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-pri)" }}>💳 Razorpay Checkout (Simulated)</h3>
            <p style={{ fontSize: "12px", color: "var(--text-sec)" }}>You are upgrading to the **Vyapar OS Pro Plan**.</p>
            
            <div style={{ border: "1px dashed var(--border)", padding: "12px", borderRadius: "6px", fontSize: "12px", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Sub-Total:</span>
                <span>₹1,999.00 / month</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "var(--text-pri)" }}>
                <span>Amount Payable:</span>
                <span>₹1,999.00</span>
              </div>
            </div>

            <button
              onClick={() => {
                fetch(getApiUrl("/api/billing/create-subscription"), {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ planId: "plan-pro-001", merchantId: "msme-001" })
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      setIsSubscribed(true);
                      setIsUpgrading(false);
                      alert(`Payment Successful!\nSubscription Active: ${data.subscriptionId}\nAll Phase 1 features unlocked.`);
                    }
                  })
                  .catch(err => {
                    console.error("Billing error:", err);
                    alert("Simulated transaction connection error.");
                  });
              }}
              style={{
                width: "100%",
                padding: "10px",
                background: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Pay ₹1,999 via Razorpay Sandbox
            </button>

            <button
              onClick={() => setIsUpgrading(false)}
              style={{
                width: "100%",
                padding: "8px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-sec)",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: "pointer"
              }}
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
