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

const demoMerchant = {
  id: "00000000-0000-0000-0000-000000000000",
  phone_number: "918971772472",
  business_name: "Sharma Traders",
  language_pref: "hinglish",
  status: "active"
};

async function seed() {
  console.log("Seeding database...");
  const { data, error } = await supabase
    .from("merchants")
    .upsert([demoMerchant], { onConflict: "phone_number" })
    .select();

  if (error) {
    console.error("❌ Error seeding merchant:", error);
    process.exit(1);
  }

  console.log("✅ Seeding completed successfully:", data);
  process.exit(0);
}

seed();
