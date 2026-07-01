# WhatsApp Agent Tool Calling & Validation

This backend implements a schema-bound tool calling pipeline using Groq for classifying merchant messages into structured actions, validating arguments, and asking for confirmation before execution of mutative actions.

## Simulated Test Flows (`/api/whatsapp/simulate`)

Below are three example flows that you can test using the simulation endpoint.

---

### Flow 1: Mutative Action (Price Update with Confirmation)
**Objective:** Update the selling price of a product SKU.

1. **Merchant Message:**
   "Update price of SKU BAN-SAR-GLD on Amazon to 549 rupees"
   - **Tool Match / Arguments:** `update_price({ sku: "BAN-SAR-GLD", platform: "Amazon", new_price: 549 })`
   - **Assistant Response:**
     `Price update: SKU *BAN-SAR-GLD* ka price *Amazon* par *₹549* set karna hai. Confirm karein (Yes/No)?`

2. **Merchant Message (Confirmation):**
   "Yes"
   - **Assistant Response (Execution):**
     `Price update successful: SKU *BAN-SAR-GLD* ka price *Amazon* par *₹549* set kar diya gaya hai.`

---

### Flow 2: Read-only Action (Instant Execution)
**Objective:** Check store earnings for the week without needing confirmation.

1. **Merchant Message:**
   "check earnings for this week"
   - **Tool Match / Arguments:** `check_earnings({ period: "week" })`
   - **Assistant Response (Immediate):**
     `Aapne is hafte total *₹45,230* kamaye hain. Top product 'Premium Silk Saree' raha.`

---

### Flow 3: Missing/Invalid Parameters (Clarification request)
**Objective:** Attempt to file a dispute without providing the platform.

1. **Merchant Message:**
   "file dispute for order OD-98273 with fee discrepancy of 150 rupees"
   - **Tool Match / Arguments:** `file_dispute({ order_id: "OD-98273", discrepancy_amount: 150 })` -> Validation fails because `platform`, `expected_fee`, and `actual_fee` are missing.
   - **Assistant Response (Clarification):**
     `Dispute kis platform ke liye hai? (Amazon, Flipkart, ya Meesho)`
