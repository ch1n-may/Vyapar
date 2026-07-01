import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv from parent folder (backend/.env)
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("dummy.supabase.co")) {
  console.warn("⚠️ Supabase credentials not configured in env. Skipping real DB seed.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const demoMerchantId = "00000000-0000-0000-0000-000000000000";
const demoMerchant = {
  id: demoMerchantId,
  phone_number: "918971772472",
  business_name: "Sharma Traders",
  language_pref: "hinglish",
  status: "active"
};

const demoOrders = [
  { id: "OD-98273", merchant_id: demoMerchantId, platform: "Amazon", product: "Premium Silk Saree (Red)", amount: "₹2,499", status: "Delivered", rto_risk: "Low" },
  { id: "OD-47291", merchant_id: demoMerchantId, platform: "Flipkart", product: "Cotton Kurta (Blue)", amount: "₹1,200", status: "RTO risk", rto_risk: "High" },
  { id: "OD-10928", merchant_id: demoMerchantId, platform: "Meesho", product: "Designer Jhumka Gold", amount: "₹450", status: "Processing", rto_risk: "Low" },
  { id: "OD-38291", merchant_id: demoMerchantId, platform: "Amazon", product: "Embroidered Lehenga", amount: "₹5,999", status: "Return", rto_risk: "Medium" },
  { id: "OD-58290", merchant_id: demoMerchantId, platform: "Meesho", product: "Ethnic Footwear Set", amount: "₹899", status: "Delivered", rto_risk: "Low" }
];

const demoProducts = [
  { id: "P-001", merchant_id: demoMerchantId, name: "Premium Silk Saree (Red)", sku: "SILK-SAR-RED", stock: 12, price: "₹2,499", platforms: ["Amazon", "Meesho"], status: "Active" },
  { id: "P-002", merchant_id: demoMerchantId, name: "Cotton Kurta (Blue)", sku: "COT-KUR-BLU", stock: 2, price: "₹1,200", platforms: ["Amazon", "Flipkart", "Meesho"], status: "Active" },
  { id: "P-003", merchant_id: demoMerchantId, name: "Designer Jhumka Gold", sku: "JHM-GLD-01", stock: 45, price: "₹450", platforms: ["Meesho"], status: "Active" }
];

const demoAlerts = [
  { merchant_id: demoMerchantId, type: "rto", message: "High RTO Risk: Order #1294 on Amazon has a high likelihood of return. Stop shipment?", cta_text: "Stop Shipment" },
  { merchant_id: demoMerchantId, type: "stock", message: "Stock Warning: Only 2 units of 'Premium Silk Saree' left. Reorder immediately.", cta_text: "Reorder Now" },
  { merchant_id: demoMerchantId, type: "price", message: "Price Parity Alert: Your price on Meesho is ₹40 higher than Flipkart. Correct parity.", cta_text: "Correct Parity" }
];

const demoApprovals = [
  { id: "A-101", merchant_id: demoMerchantId, type: "dispute", title: "Approve Amazon Fee Dispute", detail: "Amazon overcharged ₹1,200 commission on order OD-98273. Approve filing dispute case?", status: "Pending", required_role: "Owner" },
  { id: "A-102", merchant_id: demoMerchantId, type: "stock", title: "Approve Supplier Bulk Reorder", detail: "Reorder request for 100 units of Cotton Kurta (₹1,20,000) generated. Approve release?", status: "Pending", required_role: "Owner" }
];

async function seed() {
  console.log("Seeding database...");
  
  // Seed merchant
  const { data: merchantData, error: merchantError } = await supabase
    .from("merchants")
    .upsert([demoMerchant], { onConflict: "phone_number" })
    .select();
  if (merchantError) {
    console.error("❌ Error seeding merchant:", merchantError);
    process.exit(1);
  }
  console.log("✅ Seeding merchant completed.");

  // Seed orders
  const { error: ordersError } = await supabase.from("orders").upsert(demoOrders, { onConflict: "id" });
  if (ordersError) console.error("❌ Error seeding orders:", ordersError);
  else console.log("✅ Seeding orders completed.");

  // Seed products
  const { error: productsError } = await supabase.from("products").upsert(demoProducts, { onConflict: "sku" });
  if (productsError) console.error("❌ Error seeding products:", productsError);
  else console.log("✅ Seeding products completed.");

  // Seed alerts (clear old ones and insert new to prevent accumulation)
  await supabase.from("alerts").delete().eq("merchant_id", demoMerchantId);
  const { error: alertsError } = await supabase.from("alerts").insert(demoAlerts);
  if (alertsError) console.error("❌ Error seeding alerts:", alertsError);
  else console.log("✅ Seeding alerts completed.");

  // Seed approvals
  const { error: approvalsError } = await supabase.from("approvals").upsert(demoApprovals, { onConflict: "id" });
  if (approvalsError) console.error("❌ Error seeding approvals:", approvalsError);
  else console.log("✅ Seeding approvals completed.");

  console.log("🎉 Seeding finished!");
  process.exit(0);
}

seed();
