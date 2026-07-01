import { classifyAndRoute } from "./router.js";
import dotenv from "dotenv";
dotenv.config();

// Stub handleIncomingWhatsAppMessage locally to simulate how server.js uses it
// Let's import the file directly or just test the server endpoints.
// Since the server.js is running, we can use fetch/axios to test the /api/whatsapp/simulate endpoint!
// Yes, let's write a script that sends HTTP requests to the running backend on port 3001!

async function testSimulator() {
  const url = "http://localhost:3001/api/whatsapp/simulate";
  const phone = "919999999999";

  console.log("=== Testing WhatsApp Pipeline via Web Simulator Endpoint ===");

  // 1. Send price update message (Mutative, should prompt for confirmation)
  console.log("\n--- Step 1: Requesting Price Update ---");
  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "daam price update SKU-A12", phone })
  });
  let data = await res.json();
  console.log("Response:", data.reply);
  console.log("Logs:", data.logs);

  // 2. Reply "Yes" to confirm (should execute update_price)
  console.log("\n--- Step 2: Confirming with 'Yes' ---");
  res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Yes", phone })
  });
  data = await res.json();
  console.log("Response:", data.reply);
  console.log("Logs:", data.logs);

  // 3. Send check earnings request (Read-only, should execute immediately)
  console.log("\n--- Step 3: Checking Earnings (Read-Only) ---");
  res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "kamaya check earnings today", phone })
  });
  data = await res.json();
  console.log("Response:", data.reply);
  console.log("Logs:", data.logs);

  // 4. Send stock reorder request (Mutative, should prompt for confirmation)
  console.log("\n--- Step 4: Requesting Stock Reorder ---");
  res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "stock inventory reorder", phone })
  });
  data = await res.json();
  console.log("Response:", data.reply);
  console.log("Logs:", data.logs);

  // 5. Reply "No" to cancel (should cancel the pending action)
  console.log("\n--- Step 5: Cancelling with 'No' ---");
  res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "No", phone })
  });
  data = await res.json();
  console.log("Response:", data.reply);
  console.log("Logs:", data.logs);
}

testSimulator().catch(err => console.error("Pipeline test failed:", err));
