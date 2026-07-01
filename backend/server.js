import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { classifyAndRoute } from "./agent/router.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:5173",
  "https://vyapar-rho.vercel.app",
  "https://vyapar-master.vercel.app",
  "https://vyapar-a094kt2cn-chinmays-projects-c20ed5a5.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy violation"));
  }
}));

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "MOCK_KEY"
});

const supabaseUrl = process.env.SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "dummy_key";
const supabase = createClient(supabaseUrl, supabaseKey);

// Fallback DB State and Merchant Helpers
const fallbackMerchants = new Map();
const onboardingState = new Map();

const isValidUUID = (str) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const demoMerchantId = "00000000-0000-0000-0000-000000000000";
const demoMerchant = {
  id: demoMerchantId,
  phone_number: "918971772472",
  business_name: "Sharma Traders",
  language_pref: "hinglish",
  status: "active",
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
};

fallbackMerchants.set("918971772472", demoMerchant);
fallbackMerchants.set(demoMerchantId, demoMerchant);
fallbackMerchants.set("msme-001", demoMerchant);

async function getOrCreateMerchant(phoneNumber) {
  const isSupabaseConfigured = process.env.SUPABASE_URL && 
                               process.env.SUPABASE_URL !== "https://dummy.supabase.co" && 
                               process.env.SUPABASE_KEY && 
                               process.env.SUPABASE_KEY !== "dummy_key";

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("phone_number", phoneNumber)
        .maybeSingle();

      if (error) throw error;
      if (data) return data;

      const { data: newMerchant, error: insertError } = await supabase
        .from("merchants")
        .insert([{ phone_number: phoneNumber, status: "onboarding", language_pref: "hinglish" }])
        .select()
        .single();

      if (insertError) throw insertError;
      return newMerchant;
    } catch (err) {
      console.warn("⚠️ Supabase query failed. Falling back to in-memory store. Error:", err.message);
    }
  } else {
    console.warn("⚠️ Supabase is not configured. Using in-memory fallback Map.");
  }

  if (fallbackMerchants.has(phoneNumber)) {
    return fallbackMerchants.get(phoneNumber);
  }

  const newId = `temp-${Math.random().toString(36).substring(2, 15)}`;
  const newMerchant = {
    id: newId,
    phone_number: phoneNumber,
    business_name: null,
    language_pref: "hinglish",
    status: "onboarding",
    created_at: new Date().toISOString(),
    alerts: [],
    kpis: {
      todaySales: "₹0",
      orderCount: "0",
      rtoRisk: "0",
      pendingPayments: "₹0",
      lowStockCount: "0",
      todaySettlement: "₹0"
    },
    orders: []
  };

  fallbackMerchants.set(phoneNumber, newMerchant);
  fallbackMerchants.set(newId, newMerchant);
  return newMerchant;
}

let approvals = [
  { id: "A-101", type: "dispute", title: "Approve Amazon Fee Dispute", detail: "Amazon overcharged ₹1,200 commission on order OD-98273. Approve filing dispute case?", status: "Pending", requiredRole: "Owner", createdAt: new Date().toISOString() },
  { id: "A-102", type: "stock", title: "Approve Supplier Bulk Reorder", detail: "Reorder request for 100 units of Cotton Kurta (₹1,20,000) generated. Approve release?", status: "Pending", requiredRole: "Owner", createdAt: new Date().toISOString() }
];

// HTTP REST Endpoints
app.get("/api/merchant/:id", async (req, res) => {
  const reqId = req.params.id;

  const isSupabaseConfigured = process.env.SUPABASE_URL && 
                               process.env.SUPABASE_URL !== "https://dummy.supabase.co" && 
                               process.env.SUPABASE_KEY && 
                               process.env.SUPABASE_KEY !== "dummy_key";

  if (isSupabaseConfigured) {
    try {
      const targetId = reqId === "msme-001" ? demoMerchantId : reqId;

      if (isValidUUID(targetId)) {
        const { data, error } = await supabase
          .from("merchants")
          .select("*")
          .eq("id", targetId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          return res.json({
            ...data,
            businessName: data.business_name || "New Merchant",
            ownerName: data.owner_name || "Vijay Dukaandar",
            language: data.language_pref === "hinglish" ? "English/Hindi" : data.language_pref,
            alerts: data.alerts || demoMerchant.alerts,
            kpis: data.kpis || demoMerchant.kpis,
            orders: data.orders || demoMerchant.orders
          });
        }
      }
    } catch (err) {
      console.warn("⚠️ Supabase merchant fetch failed. Falling back to in-memory store. Error:", err.message);
    }
  }

  const merchant = fallbackMerchants.get(reqId);
  if (!merchant) {
    return res.status(404).json({ error: "Merchant not found" });
  }

  const formattedMerchant = {
    ...merchant,
    businessName: merchant.business_name || "New Merchant",
    ownerName: merchant.ownerName || "Vijay Dukaandar",
    language: merchant.language_pref === "hinglish" ? "English/Hindi" : merchant.language_pref,
    alerts: merchant.alerts || demoMerchant.alerts,
    kpis: merchant.kpis || demoMerchant.kpis,
    orders: merchant.orders || demoMerchant.orders
  };

  res.json(formattedMerchant);
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

// Merchant Support Chat API powered by Groq completions
app.post("/api/support/chat", async (req, res) => {
  const { message } = req.body;
  
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "") {
    let supportReply = "Namaste! I am the Vyapar OS Support Assistant. (Simulated Support Reply): ";
    const query = (message || "").toLowerCase();
    if (query.includes("reconciliation") || query.includes("recon") || query.includes("audit")) {
      supportReply += "Aap payout sheet CSV upload karke discrepancies check kar sakte hain. Amazon/Flipkart support par ticket create karne ke liye 'Draft Dispute' button use karein.";
    } else if (query.includes("integration") || query.includes("channel") || query.includes("api")) {
      supportReply += "Marketplace sync settings open karke Seller ID aur API Credentials verify karein. Agar koi disconnect issue hai toh settings update karein.";
    } else if (query.includes("subscription") || query.includes("billing") || query.includes("plan")) {
      supportReply += "Aap settings tab se Pro Plan upgrade kar sakte hain. ₹1,999/month me automatic RTO intercept aur advanced weekly P&L summaries unlocked hain.";
    } else {
      supportReply += "Bataiye main aapki kya sahayata kar sakta hoon? Aap setup settings ya reconciliation related details puch sakte hain.";
    }
    return res.json({ reply: supportReply });
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: "You are the Vyapar OS Merchant Support Specialist. Help the merchant (Vijay Dukaandar) resolve issues related to API integrations, payout reconciliation, subscriptions, COD to prepaid conversions, or A/B testing. Keep answers professional, concise, and helpful, using Hinglish (mix of Hindi & English) naturally."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 256
    });

    const reply = response.choices[0]?.message?.content || "No reply from Support AI.";
    res.json({ reply });
  } catch (err) {
    console.error("Support Chat Error:", err);
    res.status(500).json({ error: "Failed to fetch response from Support AI." });
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
// In-memory pending confirmations map
const pendingConfirmations = new Map();

// Action executors for marketplace actions
const actionExecutors = {
  create_listing: async (params) => {
    console.log("[Executor] Executing create_listing with params:", JSON.stringify(params, null, 2));
    if (!params.name || !params.sku || !params.price || !params.stock || !params.platforms) {
      const err = new Error("Validation failed in create_listing executor: missing parameters");
      console.error("[Executor Error] create_listing failed:", err);
      throw err;
    }
    return `Naya listing create ho gaya hai: *${params.name}* (SKU: ${params.sku}) @ ₹${params.price}. Stock: ${params.stock}. Platforms: ${params.platforms.join(", ")}.`;
  },
  file_dispute: async (params) => {
    console.log("[Executor] Executing file_dispute with params:", JSON.stringify(params, null, 2));
    if (!params.order_id || !params.platform || params.discrepancy_amount === undefined) {
      const err = new Error("Validation failed in file_dispute executor: missing parameters");
      console.error("[Executor Error] file_dispute failed:", err);
      throw err;
    }
    return `Order *${params.order_id}* (${params.platform}) ke liye ₹${params.discrepancy_amount} ka dispute file kar diya gaya hai. (Expected: ₹${params.expected_fee}, Actual: ₹${params.actual_fee}).`;
  },
  check_earnings: async (params) => {
    console.log("[Executor] Executing check_earnings with params:", JSON.stringify(params, null, 2));
    if (!params.period) {
      const err = new Error("Validation failed in check_earnings executor: missing period");
      console.error("[Executor Error] check_earnings failed:", err);
      throw err;
    }
    const period = params.period;
    if (period === "today") {
      return "Aapne aaj total *₹5,420* kamaye hain from 3 orders. Payout status green hai.";
    } else if (period === "month") {
      return "Aapne is mahine total *₹1,85,430* kamaye hain. Commission fees are stable.";
    } else {
      // default / week
      return "Aapne is hafte total *₹45,230* kamaye hain. Top product 'Premium Silk Saree' raha.";
    }
  },
  reorder_stock: async (params) => {
    console.log("[Executor] Executing reorder_stock with params:", JSON.stringify(params, null, 2));
    if (!params.sku || !params.quantity) {
      const err = new Error("Validation failed in reorder_stock executor: missing sku or quantity");
      console.error("[Executor Error] reorder_stock failed:", err);
      throw err;
    }
    return `Stock reorder request successfully placed for SKU *${params.sku}* with quantity *${params.quantity}* units.`;
  },
  update_price: async (params) => {
    console.log("[Executor] Executing update_price with params:", JSON.stringify(params, null, 2));
    if (!params.sku || !params.platform || !params.new_price) {
      const err = new Error("Validation failed in update_price executor: missing parameters");
      console.error("[Executor Error] update_price failed:", err);
      throw err;
    }
    return `Price update successful: SKU *${params.sku}* ka price *${params.platform}* par *₹${params.new_price}* set kar diya gaya hai.`;
  }
};

// Shared WhatsApp Message Processing Pipeline
async function handleIncomingWhatsAppMessage(fromPhone, messageText) {
  const logSteps = [];
  logSteps.push(`[Ingest] Received message from ${fromPhone}: "${messageText}"`);

  const merchant = await getOrCreateMerchant(fromPhone);

  if (merchant.status === "onboarding") {
    const cleanText = messageText.trim();
    if (onboardingState.get(fromPhone) === "awaiting_business_name") {
      merchant.business_name = cleanText;
      merchant.status = "active";

      const isSupabaseConfigured = process.env.SUPABASE_URL && 
                                   process.env.SUPABASE_URL !== "https://dummy.supabase.co" && 
                                   process.env.SUPABASE_KEY && 
                                   process.env.SUPABASE_KEY !== "dummy_key";

      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from("merchants")
            .update({ business_name: cleanText, status: "active" })
            .eq("phone_number", fromPhone);
          if (error) throw error;
        } catch (err) {
          console.warn("⚠️ Supabase update failed during onboarding. Updating in fallback memory. Error:", err.message);
          const memMerchant = fallbackMerchants.get(fromPhone);
          if (memMerchant) {
            memMerchant.business_name = cleanText;
            memMerchant.status = "active";
          }
        }
      } else {
        const memMerchant = fallbackMerchants.get(fromPhone);
        if (memMerchant) {
          memMerchant.business_name = cleanText;
          memMerchant.status = "active";
        }
      }

      onboardingState.delete(fromPhone);
      const welcomeBackMsg = `Dhanyawad! Aapka business *${cleanText}* register ho gaya hai. Ab aap Vyapar OS use kar sakte hain. Aap order status ya stock check details puch sakte hain.`;
      logSteps.push(`[Onboarding] Completed onboarding for ${fromPhone}. Business Name: ${cleanText}`);
      return { aiResponse: welcomeBackMsg, logSteps };
    } else {
      onboardingState.set(fromPhone, "awaiting_business_name");
      const welcomeMsg = `Namaste! Vyapar OS me aapka swagat hai. Kripya apne business ka naam batayein.`;
      logSteps.push(`[Onboarding] Prompted ${fromPhone} for business name.`);
      return { aiResponse: welcomeMsg, logSteps };
    }
  }

  const cleanText = messageText.trim().toLowerCase();
  const positiveAnswers = ["yes", "haan", "ha", "y", "confirm", "ok", "haanji", "han"];
  const negativeAnswers = ["no", "nahin", "n", "cancel", "nahi"];

  // Check if there is a pending confirmation for this number
  if (pendingConfirmations.has(fromPhone)) {
    const pending = pendingConfirmations.get(fromPhone);

    if (positiveAnswers.includes(cleanText)) {
      logSteps.push(`[Confirmation] Seller confirmed pending action: ${pending.action}`);
      let executionReply;
      try {
        const executor = actionExecutors[pending.action];
        if (!executor) {
          throw new Error(`Executor not found for action: ${pending.action}`);
        }
        executionReply = await executor(pending.params);
        logSteps.push(`[Executor] Action ${pending.action} executed successfully.`);
      } catch (err) {
        console.error(`[Executor Error] Action ${pending.action} failed:`, err);
        logSteps.push(`[Error] Action execution failed: ${err.message}`);
        executionReply = `Dukaandar ji, action perform karne me error aaya: ${err.message}`;
      }
      pendingConfirmations.delete(fromPhone);
      return { aiResponse: executionReply, logSteps };
    } else if (negativeAnswers.includes(cleanText)) {
      logSteps.push(`[Confirmation] Seller cancelled pending action: ${pending.action}`);
      pendingConfirmations.delete(fromPhone);
      return { aiResponse: "Theek hai, action cancel kar diya gaya hai. Main aapki kya sahayata karoon?", logSteps };
    } else {
      // Not a direct yes/no. Clear it and process the message as a new incoming query
      logSteps.push(`[Confirmation] Pending action found but received unrelated reply "${messageText}". Clearing pending confirmation.`);
      pendingConfirmations.delete(fromPhone);
    }
  }

  // Route/classify the new message
  logSteps.push("[Brain] Routing message to classifyAndRoute...");
  const routeResult = await classifyAndRoute(messageText);
  logSteps.push(`[Brain] Router classified message. Action: ${routeResult.action}`);

  let aiResponse;

  if (routeResult.action === "reply" || routeResult.action === "clarify") {
    aiResponse = routeResult.message;
  } else if (routeResult.action === "check_earnings") {
    // Read-only action: execute immediately
    try {
      aiResponse = await actionExecutors.check_earnings(routeResult.params);
      logSteps.push("[Executor] Executed check_earnings immediately.");
    } catch (err) {
      console.error("[Executor Error] Immediate check_earnings failed:", err);
      logSteps.push(`[Error] Immediate check_earnings failed: ${err.message}`);
      aiResponse = `Dukaandar ji, report load karne me error aaya: ${err.message}`;
    }
  } else {
    // Mutative actions require confirmation
    pendingConfirmations.set(fromPhone, {
      action: routeResult.action,
      params: routeResult.params
    });
    logSteps.push(`[Confirmation] Set pending confirmation for ${routeResult.action}`);

    // Format a Hinglish confirmation prompt based on action
    const params = routeResult.params;
    switch (routeResult.action) {
      case "create_listing":
        aiResponse = `New listing: Product *${params.name}* (SKU: ${params.sku}) ko ₹${params.price} ke sath platforms ${params.platforms.join(", ")} par list karna hai? Confirm karein (Yes/No)?`;
        break;
      case "file_dispute":
        aiResponse = `Dispute file: Order ID *${params.order_id}* (${params.platform}) par fee difference ₹${params.discrepancy_amount} ke liye dispute file karein? Confirm karein (Yes/No)?`;
        break;
      case "reorder_stock":
        aiResponse = `Reorder Stock: Product SKU *${params.sku}* ke liye *${params.quantity}* units ka naya stock order karein? Confirm karein (Yes/No)?`;
        break;
      case "update_price":
        aiResponse = `Price update: SKU *${params.sku}* ka price *${params.platform}* par *₹${params.new_price}* set karna hai. Confirm karein (Yes/No)?`;
        break;
      default:
        aiResponse = `Confirm update: ${routeResult.action} perform karna hai with parameters ${JSON.stringify(params)}. Confirm karein (Yes/No)?`;
    }
  }

  logSteps.push(`[Outbound] Generated outgoing reply: "${aiResponse}"`);
  return { aiResponse, logSteps };
}

// Send Outgoing WhatsApp Message via Cloud API
async function sendWhatsAppMessage(toPhone, messageText) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.error("WhatsApp Send Error: WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing.");
    return { success: false, error: "Configuration missing" };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
      type: "text",
      text: {
        preview_url: false,
        body: messageText
      }
    };

    console.log(`[Outbound] Sending WhatsApp message to ${toPhone}...`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("WhatsApp Send API Error response:", data);
      return { success: false, error: data };
    }

    console.log(`[Outbound] WhatsApp message sent successfully:`, data);
    return { success: true, data };
  } catch (error) {
    console.error("WhatsApp Send Connection/Runtime Error:", error);
    return { success: false, error: error.message };
  }
}

// Download media binary from WhatsApp Cloud API
async function downloadWhatsAppMedia(mediaId) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is missing.");
  }

  // Sanitize mediaId to protect against path traversal attacks
  if (!/^[a-zA-Z0-9_\-]+$/.test(mediaId)) {
    throw new Error("Invalid media ID format.");
  }

  // 1. Get media URL metadata
  const getUrl = `https://graph.facebook.com/v21.0/${mediaId}`;
  const getRes = await fetch(getUrl, {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });
  if (!getRes.ok) {
    const errorData = await getRes.json();
    throw new Error(`Failed to get media details: ${JSON.stringify(errorData)}`);
  }
  const mediaData = await getRes.json();
  const downloadUrl = mediaData.url;

  // 2. Download binary media file
  const downloadRes = await fetch(downloadUrl, {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });
  if (!downloadRes.ok) {
    throw new Error(`Failed to download media file from ${downloadUrl}`);
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const tempDir = path.join(__dirname, "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filePath = path.join(tempDir, `${mediaId}.ogg`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// Transcribe audio using Groq Whisper API
async function transcribeAudio(filePath) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing.");
  }
  const response = await groq.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-large-v3"
  });
  return response.text;
}

// Middleware to verify incoming WhatsApp webhook signatures
function validateWhatsAppWebhookSignature(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // Skip validation if secret is not set (e.g. during onboarding / dev before adding secrets)
  if (!appSecret) {
    console.warn("⚠️ WHATSAPP_APP_SECRET is not configured in env. Webhook signature validation skipped.");
    return next();
  }

  if (!signature) {
    console.error("❌ Webhook Signature Error: X-Hub-Signature-256 header is missing.");
    return res.status(401).send("Signature missing");
  }

  const elements = signature.split("=");
  const signatureHash = elements[1];

  const expectedHash = crypto
    .createHmac("sha256", appSecret)
    .update(req.rawBody || "")
    .digest("hex");

  if (signatureHash !== expectedHash) {
    console.error("❌ Webhook Signature Error: Signature verification failed.");
    return res.status(401).send("Invalid signature");
  }

  next();
}

// WhatsApp Message Ingestion Handler (POST) - Signature verification middleware added
app.post("/api/whatsapp", validateWhatsAppWebhookSignature, async (req, res) => {
  const body = req.body;

  if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
    const messageInfo = body.entry[0].changes[0].value.messages[0];
    const fromPhone = messageInfo.from;
    const msgType = messageInfo.type;

    if (msgType === "audio" || msgType === "voice" || messageInfo.audio || messageInfo.voice) {
      try {
        const audioInfo = messageInfo.audio || messageInfo.voice;
        const mediaId = audioInfo.id;
        console.log(`[voice message received] downloading media ID: ${mediaId}`);
        
        const filePath = await downloadWhatsAppMedia(mediaId);
        console.log(`[voice message] downloaded to ${filePath}. Transcribing...`);
        
        const transcribedText = await transcribeAudio(filePath);
        console.log(`[voice message] Transcribed text: "${transcribedText}"`);
        
        // Clean up temp file
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Failed to delete temp audio file:", err);
        }

        if (!transcribedText || transcribedText.trim() === "") {
          await sendWhatsAppMessage(fromPhone, "Aapka voice message empty tha ya clear nahi tha. Kripya fir se koshish karein.");
        } else {
          const result = await handleIncomingWhatsAppMessage(fromPhone, transcribedText);
          await sendWhatsAppMessage(fromPhone, result.aiResponse);
        }
      } catch (error) {
        console.error("Failed to process voice message:", error);
        await sendWhatsAppMessage(fromPhone, `Voice message process karne me problem aayi: ${error.message}`);
      }
    } else {
      const messageText = messageInfo.text?.body || "";
      const result = await handleIncomingWhatsAppMessage(fromPhone, messageText);
      await sendWhatsAppMessage(fromPhone, result.aiResponse);
    }
  }

  res.sendStatus(200);
});

// WhatsApp Sandbox Web Simulator Endpoint (POST)
app.post("/api/whatsapp/simulate", async (req, res) => {
  const { message, phone } = req.body;
  const senderPhone = phone || "918971772472";
  
  const result = await handleIncomingWhatsAppMessage(senderPhone, message || "Hello");
  res.json({
    success: true,
    sender: senderPhone,
    reply: result.aiResponse,
    logs: result.logSteps
  });
});

// WhatsApp Configuration Status Endpoint (GET)
app.get("/api/whatsapp/status", (req, res) => {
  res.json({
    whatsapp_configured: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    has_token: !!process.env.WHATSAPP_ACCESS_TOKEN,
    has_phone_id: !!process.env.WHATSAPP_PHONE_NUMBER_ID
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

// Phase 2: Get Approvals list
app.get("/api/approvals", (req, res) => {
  res.json({ success: true, approvals });
});

// Phase 2: Resolve Approval
app.post("/api/approvals/resolve", (req, res) => {
  const { id, action, role } = req.body; // action: "Approved" or "Rejected", role: "Owner" or "Accountant"

  if (role !== "Owner") {
    return res.status(403).json({ error: "Only the Owner role is authorized to resolve approvals." });
  }

  const approvalIdx = approvals.findIndex(a => a.id === id);
  if (approvalIdx === -1) {
    return res.status(404).json({ error: "Approval item not found." });
  }

  approvals[approvalIdx].status = action;
  res.json({ success: true, approval: approvals[approvalIdx] });
});

// Phase 2: Simulate PDF Statement parsing
app.post("/api/pdf-extract/simulate", (req, res) => {
  const { fileName } = req.body;
  
  // Return simulated payout overcharges extracted from the "PDF text"
  res.json({
    success: true,
    fileName: fileName || "settlement_june_2026.pdf",
    parsedText: "Extracting transaction logs... Amazon commission overcharges found... Flipkart shipping fee mismatch detected...",
    rows: [
      { orderId: "OD-98273", platform: "Amazon", price: 2499, actualCommission: 480, actualShipping: 120, shipmentType: "Local" },
      { orderId: "OD-47291", platform: "Flipkart", price: 1200, actualCommission: 240, actualShipping: 180, shipmentType: "National" },
      { orderId: "OD-38291", platform: "Amazon", price: 5999, actualCommission: 1100, actualShipping: 120, shipmentType: "Local" }
    ]
  });
});

// Phase 3: Login authentication endpoint
app.post("/api/session/login", (req, res) => {
  const { passcode } = req.body;
  if (String(passcode) === "1234") {
    res.json({ success: true, token: `session_token_${Math.random().toString(36).substring(2, 10)}` });
  } else {
    res.status(401).json({ success: false, error: "Invalid passcode. Please enter the default passcode '1234'." });
  }
});

// Phase 3: Release / Deploy readiness status endpoint
app.get("/api/deploy/status", (req, res) => {
  res.json({
    success: true,
    environment: process.env.VERCEL_ENV || "development",
    ready: true,
    issues: [],
    steps: [
      "Confirm merchant onboarding",
      "Verify session lock and restore",
      "Review approval queue",
      "Review connector safety",
      "Deploy preview, then production"
    ]
  });
});

// Phase 3: System observability logs endpoint
app.get("/api/observability/events", (req, res) => {
  res.json({
    success: true,
    events: [
      { ts: new Date(Date.now() - 3600 * 1000).toISOString(), type: "session-created", detail: "Session unlocked by Vijay Dukaandar (Owner)." },
      { ts: new Date(Date.now() - 1800 * 1000).toISOString(), type: "recon-audit", detail: "Settlement report checked. Commission discrepancies auto-flagged." },
      { ts: new Date(Date.now() - 600 * 1000).toISOString(), type: "ab-test", detail: "A/B variant traffic redistribution active." },
      { ts: new Date().toISOString(), type: "status-check", detail: "Observability heartbeat check successful." }
    ]
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
