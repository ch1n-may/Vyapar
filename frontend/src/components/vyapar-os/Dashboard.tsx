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
      body: JSON.stringify({ message: simulatorInput, phone: "919876543210" })
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
              <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: "none" }} disabled={isReconRunning} />
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

  const renderAnalytics = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Realtime Store Analytics</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        <div className="glass-panel" style={{ padding: "16px", borderRadius: "8px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-mut)" }}>GROSS REVENUE (MTD)</div>
          <div style={{ fontSize: "24px", color: "var(--text-pri)", fontWeight: 600, margin: "8px 0" }}>₹1,45,230</div>
          <div style={{ fontSize: "10px", color: "var(--accent)" }}>↑ 18% vs last month</div>
        </div>
        <div className="glass-panel" style={{ padding: "16px", borderRadius: "8px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-mut)" }}>RECONCILIATION DISPUTES FILED</div>
          <div style={{ fontSize: "24px", color: "var(--text-pri)", fontWeight: 600, margin: "8px 0" }}>₹14,500</div>
          <div style={{ fontSize: "10px", color: "var(--amber)" }}>3 active disputes pending response</div>
        </div>
        <div className="glass-panel" style={{ padding: "16px", borderRadius: "8px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-mut)" }}>AVERAGE RETURN RATE</div>
          <div style={{ fontSize: "24px", color: "var(--red)", fontWeight: 600, margin: "8px 0" }}>14.2%</div>
          <div style={{ fontSize: "10px", color: "var(--accent)" }}>↓ 2.4% after RTO Shield</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "20px", borderRadius: "8px" }}>
        <div style={{ fontSize: "12px", color: "var(--text-pri)", marginBottom: "15px" }}>Weekly Settlements & Revenue (₹)</div>
        <svg viewBox="0 0 500 150" style={{ width: "100%", height: "150px" }}>
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            points="0,120 80,110 160,80 240,90 320,50 400,60 480,20"
          />
          <circle cx="0" cy="120" r="4" fill="var(--accent)" />
          <circle cx="80" cy="110" r="4" fill="var(--accent)" />
          <circle cx="160" cy="80" r="4" fill="var(--accent)" />
          <circle cx="240" cy="90" r="4" fill="var(--accent)" />
          <circle cx="320" cy="50" r="4" fill="var(--accent)" />
          <circle cx="400" cy="60" r="4" fill="var(--accent)" />
          <circle cx="480" cy="20" r="4" fill="var(--accent)" />
        </svg>
      </div>
    </div>
  );

  const renderDiscounts = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Smart Pricing & Promotions</h2>
      <div className="glass-panel" style={{ padding: "20px", borderRadius: "8px" }}>
        <h3 style={{ fontSize: "14px", color: "var(--text-pri)", marginBottom: "8px" }}>Auto COD-to-Prepaid Conversion Discount</h3>
        <p style={{ fontSize: "12px", color: "var(--text-sec)", marginBottom: "16px" }}>Reduce returns by offering a small discount (e.g. ₹50) if the customer switches to prepaid on WhatsApp checkout.</p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px" }}>Status: </span>
          <span style={{ padding: "4px 8px", background: "var(--accent-pale)", color: "var(--accent)", fontSize: "11px", fontWeight: 600, borderRadius: "4px" }}>ACTIVE</span>
        </div>
      </div>
    </div>
  );

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

  const renderABTesting = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>A/B Variant Testing</h2>
      <div className="glass-panel" style={{ padding: "20px", borderRadius: "8px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-sec)" }}>Upgrade to **Grow Plan** to distribute storefront checkout options and optimize shipping configurations.</p>
      </div>
    </div>
  );

  const renderIntegrations = () => (
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
            <button style={{ padding: "4px 8px", fontSize: "10px", border: "1px solid var(--border)", color: "var(--text-pri)", background: "transparent", borderRadius: "4px", cursor: "pointer" }}>Configure</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Settings</h2>
      
      {/* Plan Details Card */}
      <div className="glass-panel" style={{ padding: "20px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "10px", color: "var(--text-mut)" }}>CURRENT SUBSCRIPTION PLAN</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-pri)", marginTop: "4px" }}>
            {isSubscribed ? "🚀 Vyapar OS Pro Plan" : "🆕 Free Trial - Phase 0"}
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-sec)", marginTop: "2px" }}>
            {isSubscribed ? "Active. Success-fee billing connected (15% of recovered fees)." : "Limit reached. Upgrade to unlock all Phase 1 capabilities."}
          </p>
        </div>
        {!isSubscribed && (
          <button
            onClick={() => setIsUpgrading(true)}
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
            Upgrade to Pro
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: "20px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ fontSize: "12px", color: "var(--text-pri)" }}>Store Currency: **INR (₹)**</div>
        <div style={{ fontSize: "12px", color: "var(--text-pri)" }}>Primary Language: **Hindi / English Bilingual**</div>
        <div style={{ fontSize: "12px", color: "var(--text-pri)" }}>Connected Mobile: **+91 98765 43210**</div>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-pri)" }}>Support Center</h2>
      <div className="glass-panel" style={{ padding: "20px", borderRadius: "8px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-sec)" }}>Facing any issue with API connection or settlements? Chat with us instantly.</p>
        <button style={{ marginTop: "12px", padding: "8px 16px", background: "var(--accent)", color: "var(--accent-text)", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>
          💬 Start Live Support Chat
        </button>
      </div>
    </div>
  );

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
      default: return renderHome();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

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
