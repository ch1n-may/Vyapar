import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "MOCK_KEY"
});

const supabaseUrl = process.env.SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "dummy_key";
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock DB State
let merchants = [
  {
    id: "msme-001",
    businessName: "Sharma Traders",
    ownerName: "Aman Sharma",
    language: "English",
    status: "Active",
    alerts: [
      { id: 1, type: "rto", message: "High RTO Risk: Order #1294 on Amazon has a high likelihood of return. Stop shipment?", ctaText: "Stop Shipment" },
      { id: 2, type: "stock", message: "Stock Warning: Only 2 units of 'Premium Silk Saree' left. Reorder immediately.", ctaText: "Reorder Now" },
      { id: 3, type: "price", message: "Price Parity Alert: Your price on Meesho is ₹40 higher than Flipkart. Correct parity.", ctaText: "Correct Parity" },
    ],
    kpis: {
      todaySales: "₹45,230",
      orderCount: "14",
      rtoRisk: "3",
      pendingPayments: "₹12,450",
      lowStockCount: "2",
      todaySettlement: "₹32,180"
    },
    orders: [
      { id: "OD-98273", platform: "Amazon", product: "Premium Silk Saree (Red)", amount: "₹2,499", status: "Delivered" },
      { id: "OD-47291", platform: "Flipkart", product: "Cotton Kurta (Blue)", amount: "₹1,200", status: "RTO risk" },
      { id: "OD-10928", platform: "Meesho", product: "Designer Jhumka Gold", amount: "₹450", status: "Processing" },
      { id: "OD-38291", platform: "Amazon", product: "Embroidered Lehenga", amount: "₹5,999", status: "Return" },
      { id: "OD-58290", platform: "Meesho", product: "Ethnic Footwear Set", amount: "₹899", status: "Delivered" },
    ]
  }
];

// HTTP REST Endpoints
app.get("/api/merchant/:id", (req, res) => {
  const merchant = merchants.find((m) => m.id === req.params.id);
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });
  res.json(merchant);
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "") {
    // Fallback if GROQ_API_KEY is not defined yet
    let botReply = "Please configure your GROQ_API_KEY in backend/.env to enable live Groq AI answers! (Showing fallback response): ";
    const query = (message || "").toLowerCase();
    if (query.includes("order")) {
      botReply += "✅ All your pending orders have been dispatched for shipment.";
    } else if (query.includes("stock")) {
      botReply += "📦 Stock reorder request has been successfully sent to the supplier.";
    } else {
      botReply += "🚨 High RTO risk orders have been held and customer verification has been initiated.";
    }
    return res.json({ reply: botReply });
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: "You are the Vyapar OS Business Assistant. You help small/medium businesses (MSMEs) in India manage their store orders, inventory, and refunds. Keep your responses short, professional, and helpful. Use a friendly Mix of Hindi and English (Hinglish) where natural."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 256
    });

    const reply = response.choices[0]?.message?.content || "No reply from AI.";
    res.json({ reply });
  } catch (err) {
    console.error("Groq Chat Error:", err);
    res.status(500).json({ error: "Failed to fetch response from Groq." });
  }
});

// AI Voice List structuring API
app.post("/api/voice-list", async (req, res) => {
  const { transcript } = req.body;

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "") {
    return res.json({
      success: true,
      product: {
        name: "Banarasi Saree Premium Gold (Mock)",
        sku: "BAN-SAR-GLD",
        stock: 10,
        price: "₹3,499",
        platforms: ["Amazon", "Flipkart"]
      }
    });
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: "You are an assistant that extracts product catalog listings from voice transcripts. Return ONLY a valid JSON object matching this schema: { name: string, sku: string, stock: number, price: string, platforms: string[] }. Do not write any preamble or code blocks."
        },
        {
          role: "user",
          content: `Extract product listing details from: "${transcript}"`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    res.json({ success: true, product: parsed });
  } catch (err) {
    console.error("Groq Voice Parsing Error:", err);
    res.status(500).json({ error: "Failed to parse listing with Groq." });
  }
});

// Reconciliation Overcharge Calculation Endpoint
app.post("/api/recon/upload", async (req, res) => {
  const { rows, merchantId } = req.body;

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: "Invalid data format. Expected an array of rows." });
  }

  // Rate slabs
  const commissionRates = { Amazon: 0.12, Flipkart: 0.10, Meesho: 0.02 };
  const standardShipping = { Local: 60, National: 120 };

  const processedLogs = [];
  let totalOvercharged = 0;
  let discrepancyCount = 0;

  for (const row of rows) {
    const platform = row.platform || "Amazon";
    const price = Number(row.price) || 0;
    const actualCommission = Number(row.actualCommission) || 0;
    const actualShipping = Number(row.actualShipping) || 0;
    const shipmentType = row.shipmentType || "Local"; // Local or National

    const rate = commissionRates[platform] || 0.10;
    const expectedCommission = price * rate;
    const expectedShipping = standardShipping[shipmentType] || 60;

    const expectedPayout = price - expectedCommission - expectedShipping;
    const actualPayout = price - actualCommission - actualShipping;

    // Discrepancy (marketplace paid us less than expected)
    const discrepancy = actualPayout < expectedPayout ? Number((expectedPayout - actualPayout).toFixed(2)) : 0;

    if (discrepancy > 0) {
      totalOvercharged += discrepancy;
      discrepancyCount++;
    }

    const logEntry = {
      merchant_id: merchantId || "msme-001",
      order_id: row.orderId || `ORD-${Math.random().toString().slice(-6)}`,
      platform,
      price,
      actual_commission: actualCommission,
      expected_commission: expectedCommission,
      actual_shipping: actualShipping,
      expected_shipping: expectedShipping,
      discrepancy,
      status: discrepancy > 0 ? "Discrepancy" : "Matched"
    };

    processedLogs.push(logEntry);

    // Save to Supabase if configured
    if (process.env.SUPABASE_URL && process.env.SUPABASE_URL !== "https://dummy.supabase.co") {
      try {
        await supabase.from("recon_logs").insert([logEntry]);
      } catch (err) {
        console.error("Supabase insert error for order:", logEntry.order_id, err);
      }
    }
  }

  res.json({
    success: true,
    totalProcessed: rows.length,
    discrepancyCount,
    totalOvercharged: Number(totalOvercharged.toFixed(2)),
    details: processedLogs
  });
});

// Dispute drafting API powered by Groq completions
app.post("/api/recon/dispute", async (req, res) => {
  const { orderId, platform, discrepancy, expectedFee, actualFee } = req.body;

  const mockDraft = `Dear Seller Support,

I am writing regarding Order ID: ${orderId || "OD-47291"} on ${platform || "Amazon"}. 
According to my calculations, there is a commission/shipping charge discrepancy.
Expected Fee: ${expectedFee || "₹60.00"}
Actual Fee Charged: ${actualFee || "₹180.00"}
Overcharged Amount: ₹${discrepancy || "120.00"}

Please review this transaction weight slab/rate and refund the difference.
Thanks,
Sharma Traders`;

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "") {
    return res.json({ success: true, draft: mockDraft });
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: "You are the Vyapar OS Assistant. The merchant wants to write a support case to the marketplace (Amazon/Flipkart/Meesho) disputing overcharges. Write a short, professional, and clear support message/email in Hinglish. State the Order ID, the overcharged amount, the expected charges, and ask them to verify and refund the difference. Do not write any markdown wrappers or preamble; output the template directly."
        },
        {
          role: "user",
          content: `Write a dispute ticket for Order ID: ${orderId}, Platform: ${platform}, Overcharged Amount: ₹${discrepancy}, Expected Fee Slabs: ₹${expectedFee}, Actual Fees Charged: ₹${actualFee}.`
        }
      ],
      temperature: 0.7,
      max_tokens: 256
    });

    const draft = response.choices[0]?.message?.content || mockDraft;
    res.json({ success: true, draft });
  } catch (err) {
    console.error("Dispute drafting error:", err);
    res.status(500).json({ error: "Failed to generate dispute draft." });
  }
});

// WhatsApp Business API Webhook Verification (GET)
app.get("/api/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "VYAPAR_OS";

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp Webhook verified successfully.");
      return res.status(200).send(challenge);
    }
  }
  res.sendStatus(403);
});

// Shared WhatsApp Message Processing Pipeline
async function handleIncomingWhatsAppMessage(fromPhone, messageText) {
  const logSteps = [];
  logSteps.push(`[Ingest] Received message from ${fromPhone}: "${messageText}"`);

  let aiResponse = "Haa ji, aapka message mil gaya. (Simulated response)";
  
  // 1. Intent Classification / Processing via Groq
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "") {
    logSteps.push("[Brain] Querying Groq API for intent classification and response...");
    try {
      const response = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are the Vyapar OS WhatsApp Assistant. You help Indian MSME merchants run their store over WhatsApp. Respond in a short, polite Hinglish sentence. If they ask about earnings, confirm you will check their P&L report."
          },
          {
            role: "user",
            content: messageText
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });
      aiResponse = response.choices[0]?.message?.content || aiResponse;
      logSteps.push("[Brain] Groq completion successfully generated.");
    } catch (err) {
      console.error("Groq WhatsApp Error:", err);
      logSteps.push(`[Error] Groq request failed: ${err.message}`);
    }
  } else {
    logSteps.push("[Mock] No Groq API Key found. Falling back to local pattern parser.");
    const query = messageText.toLowerCase();
    if (query.includes("earning") || query.includes("kamaya")) {
      aiResponse = "Aapne is hafte total ₹45,230 kamaye hai. Top product 'Premium Silk Saree' raha.";
    } else if (query.includes("stock") || query.includes("inventory")) {
      aiResponse = "Kurti SKU-A12 ka stock kam hai (only 2 units left). supplier ko reorder order bheju?";
    }
  }

  logSteps.push(`[Outbound] Generated outgoing reply: "${aiResponse}"`);
  return { aiResponse, logSteps };
}

// WhatsApp Message Ingestion Handler (POST)
app.post("/api/whatsapp", async (req, res) => {
  const body = req.body;

  if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
    const messageInfo = body.entry[0].changes[0].value.messages[0];
    const fromPhone = messageInfo.from;
    const messageText = messageInfo.text?.body || "";

    await handleIncomingWhatsAppMessage(fromPhone, messageText);
  }

  res.sendStatus(200);
});

// WhatsApp Sandbox Web Simulator Endpoint (POST)
app.post("/api/whatsapp/simulate", async (req, res) => {
  const { message, phone } = req.body;
  const senderPhone = phone || "919876543210";
  
  const result = await handleIncomingWhatsAppMessage(senderPhone, message || "Hello");
  res.json({
    success: true,
    sender: senderPhone,
    reply: result.aiResponse,
    logs: result.logSteps
  });
});

// Phase 1: Razorpay Subscription Simulator Endpoint
app.post("/api/billing/create-subscription", (req, res) => {
  const { planId, merchantId } = req.body;
  
  res.json({
    success: true,
    subscriptionId: `sub_${Math.random().toString(36).substring(2, 10)}`,
    checkoutUrl: "https://razorpay.com/payment/simulated-vyapar",
    amount: 199900, // ₹1,999 in paise
    currency: "INR",
    merchantId: merchantId || "msme-001"
  });
});

// Phase 1: Weekly P&L Pulse Report Generator Endpoint
app.get("/api/reports/weekly-pulse", async (req, res) => {
  const mockPnlData = {
    revenue: 45230,
    orders: 14,
    shippingFee: 1440,
    commissions: 4320,
    returns: 2499,
    netProfit: 36971
  };

  const defaultHindiPulse = `*Vyapar OS - Weekly Profit Report (P&L Pulse)* 📊

Aapka is hafte ka report taiyar hai:
💰 *Total Revenue*: ₹45,230 (14 Orders)
🚚 *Shipping Charged*: ₹1,440
🏷️ *Commissions Paid*: ₹4,320
🔄 *Returns Deductions*: ₹2,499
✅ *Net Margin*: *₹36,971* (Profit rate: 81.7%)

*Top product*: Premium Silk Saree (Red) - 6 orders.
Aapka stock control active hai, Kurti stock low hai reorder karein.`;

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "") {
    return res.json({ success: true, report: defaultHindiPulse, data: mockPnlData });
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: "You are the Vyapar OS Financial Assistant. Write a weekly store P&L summary for the merchant on WhatsApp. Write in clear Hinglish (Hindi + English) with emojis. State the Revenue (₹45,230), Orders (14), Shipping (₹1,440), Commissions (₹4,320), Returns (₹2,499), and Net Profit (₹36,971). Use bullet points, bold key figures, and keep the tone encouraging."
        },
        {
          role: "user",
          content: "Generate my weekly P&L pulse message."
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const report = response.choices[0]?.message?.content || defaultHindiPulse;
    res.json({ success: true, report, data: mockPnlData });
  } catch (err) {
    console.error("Weekly pulse report error:", err);
    res.status(500).json({ error: "Failed to generate weekly pulse report." });
  }
});

// Phase 2: RTO order interceptor & risk scoring endpoint
app.post("/api/rto/intercept", (req, res) => {
  const { orderId, pincode, paymentMethod, value } = req.body;

  let riskScore = 15; // default low
  let riskLevel = "Low";

  if (paymentMethod === "COD") {
    riskScore += 30; // base COD markup
    
    // High-risk pincodes (simulated remote slabs)
    if (pincode && (pincode.startsWith("7") || pincode.startsWith("8"))) {
      riskScore += 35;
    }
    
    // Higher order value increases risk
    if (Number(value) > 2000) {
      riskScore += 15;
    }
  }

  if (riskScore >= 75) {
    riskLevel = "High";
  } else if (riskScore >= 40) {
    riskLevel = "Medium";
  }

  res.json({
    success: true,
    orderId: orderId || `OD-${Math.floor(10000 + Math.random() * 90000)}`,
    riskScore,
    riskLevel,
    actionRequired: riskLevel === "High" ? "WhatsApp confirmation trigger fired" : "Auto-release to shipping",
    timestamp: new Date().toISOString()
  });
});

// Phase 2: WhatsApp buyer verification mock responder
app.post("/api/rto/verify-buyer", (req, res) => {
  const { orderId, action } = req.body; // action: "Confirm" or "Cancel"

  res.json({
    success: true,
    orderId,
    buyerResponse: action || "Confirm",
    resolvedStatus: action === "Confirm" ? "Approved for Shipment" : "Cancelled before Dispatch",
    updatedTimestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Serve frontend build static files
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

// Fallback all non-API GET requests to index.html for React Router
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"));
  } else {
    next();
  }
});

// Setup Server & WebSocket
const server = createServer(app);

if (!process.env.VERCEL) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected to Vyapar OS Stream");

    // Send regular mock activity events
    const interval = setInterval(() => {
      const mockEvents = [
        { type: "order", platform: "Amazon", text: `New Order #${Math.floor(10000 + Math.random() * 90000)}`, timeAgo: "1s ago" },
        { type: "rto", platform: "Flipkart", text: "RTO Risk Detected", timeAgo: "Just now" },
        { type: "payment", platform: "Meesho", text: "Payment Settlement Successful", timeAgo: "Just now" }
      ];
      const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
      ws.send(JSON.stringify(randomEvent));
    }, 10000);

    ws.on("close", () => clearInterval(interval));
  });
}

// Only listen locally, not in Vercel
if (!process.env.VERCEL) {
  server.listen(port, () => {
    console.log(`Vyapar OS Backend server running on port ${port}`);
  });
}

export default app;
