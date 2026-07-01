import { classifyAndRoute } from "./router.js";
import dotenv from "dotenv";
dotenv.config();

async function runTest() {
  console.log("=== Starting Router Integration Tests ===");
  
  // Test case 1: Mutative action with correct params (should match update_price)
  console.log("\n1. Testing: Update price of SKU BAN-SAR-GLD on Amazon to 549 rupees");
  const res1 = await classifyAndRoute("Update price of SKU BAN-SAR-GLD on Amazon to 549 rupees");
  console.log("Result:", JSON.stringify(res1, null, 2));

  // Test case 2: Read-only action (should match check_earnings)
  console.log("\n2. Testing: check earnings for this week");
  const res2 = await classifyAndRoute("check earnings for this week");
  console.log("Result:", JSON.stringify(res2, null, 2));

  // Test case 3: Missing parameters (update_price missing platform)
  console.log("\n3. Testing: update price of SKU BAN-SAR-GLD to 549");
  const res3 = await classifyAndRoute("update price of SKU BAN-SAR-GLD to 549");
  console.log("Result:", JSON.stringify(res3, null, 2));

  // Test case 4: Conversational message
  console.log("\n4. Testing: Hello, how are you?");
  const res4 = await classifyAndRoute("Hello, how are you?");
  console.log("Result:", JSON.stringify(res4, null, 2));
}

runTest().catch(err => console.error("Test error:", err));
