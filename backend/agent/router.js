import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "MOCK_KEY"
});

export const tools = [
  {
    type: "function",
    function: {
      name: "create_listing",
      description: "Create a new product listing on specified platforms",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the product/listing" },
          sku: { type: "string", description: "Stock Keeping Unit (SKU) identifier" },
          price: { type: "number", description: "Price of the product in INR" },
          stock: { type: "number", description: "Initial stock quantity" },
          platforms: {
            type: "array",
            items: { type: "string" },
            description: "E-commerce platforms to list on (e.g. Amazon, Flipkart, Meesho)"
          }
        },
        required: ["name", "sku", "price", "stock", "platforms"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "file_dispute",
      description: "File a payout dispute for an order due to fee discrepancy",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "The unique order ID" },
          platform: { type: "string", enum: ["Amazon", "Flipkart", "Meesho"], description: "The e-commerce platform name" },
          discrepancy_amount: { type: "number", description: "The discrepancy amount in INR" },
          expected_fee: { type: "number", description: "The expected fee in INR" },
          actual_fee: { type: "number", description: "The actual fee charged in INR" }
        },
        required: ["order_id", "platform", "discrepancy_amount", "expected_fee", "actual_fee"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_earnings",
      description: "Check the earnings summary for today, week, or month",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["today", "week", "month"], description: "The time period to check" }
        },
        required: ["period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "reorder_stock",
      description: "Reorder stock/inventory for a specific product SKU",
      parameters: {
        type: "object",
        properties: {
          sku: { type: "string", description: "The product SKU" },
          quantity: { type: "number", description: "Quantity of units to reorder" }
        },
        required: ["sku", "quantity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_price",
      description: "Update the price of a product SKU on a specific platform",
      parameters: {
        type: "object",
        properties: {
          sku: { type: "string", description: "The product SKU" },
          platform: { type: "string", enum: ["Amazon", "Flipkart", "Meesho"], description: "The e-commerce platform" },
          new_price: { type: "number", description: "The new price in INR" }
        },
        required: ["sku", "platform", "new_price"]
      }
    }
  }
];

// Helper to validate parameters based on the schemas
function validateArguments(name, args) {
  if (!args) {
    return { valid: false, message: "Arguments object is missing." };
  }

  const platformsEnum = ["Amazon", "Flipkart", "Meesho"];
  const periodsEnum = ["today", "week", "month"];

  switch (name) {
    case "create_listing": {
      if (typeof args.name !== "string" || args.name.trim() === "") return { valid: false, field: "name", error: "Product name text required" };
      if (typeof args.sku !== "string" || args.sku.trim() === "") return { valid: false, field: "sku", error: "SKU required" };
      if (typeof args.price !== "number" || isNaN(args.price) || args.price <= 0) return { valid: false, field: "price", error: "Price must be a positive number" };
      if (typeof args.stock !== "number" || isNaN(args.stock) || args.stock < 0) return { valid: false, field: "stock", error: "Stock must be a non-negative number" };
      if (!Array.isArray(args.platforms) || args.platforms.length === 0 || !args.platforms.every(p => typeof p === "string" && p.trim() !== "")) {
        return { valid: false, field: "platforms", error: "Platforms must be a non-empty array of strings" };
      }
      return { valid: true };
    }
    case "file_dispute": {
      if (typeof args.order_id !== "string" || args.order_id.trim() === "") return { valid: false, field: "order_id", error: "Order ID required" };
      if (!platformsEnum.includes(args.platform)) return { valid: false, field: "platform", error: "Platform must be one of Amazon, Flipkart, Meesho" };
      if (typeof args.discrepancy_amount !== "number" || isNaN(args.discrepancy_amount)) return { valid: false, field: "discrepancy_amount", error: "Discrepancy amount number required" };
      if (typeof args.expected_fee !== "number" || isNaN(args.expected_fee)) return { valid: false, field: "expected_fee", error: "Expected fee number required" };
      if (typeof args.actual_fee !== "number" || isNaN(args.actual_fee)) return { valid: false, field: "actual_fee", error: "Actual fee number required" };
      return { valid: true };
    }
    case "check_earnings": {
      if (!periodsEnum.includes(args.period)) return { valid: false, field: "period", error: "Period must be one of today, week, month" };
      return { valid: true };
    }
    case "reorder_stock": {
      if (typeof args.sku !== "string" || args.sku.trim() === "") return { valid: false, field: "sku", error: "SKU required" };
      if (typeof args.quantity !== "number" || isNaN(args.quantity) || args.quantity <= 0) return { valid: false, field: "quantity", error: "Quantity must be a positive number" };
      return { valid: true };
    }
    case "update_price": {
      if (typeof args.sku !== "string" || args.sku.trim() === "") return { valid: false, field: "sku", error: "SKU required" };
      if (!platformsEnum.includes(args.platform)) return { valid: false, field: "platform", error: "Platform must be one of Amazon, Flipkart, Meesho" };
      if (typeof args.new_price !== "number" || isNaN(args.new_price) || args.new_price <= 0) return { valid: false, field: "new_price", error: "New price must be a positive number" };
      return { valid: true };
    }
    default:
      return { valid: false, message: `Unknown tool name: ${name}` };
  }
}

// Fallback template messages for clarification if Groq isn't available
function getClarificationFallback(name, field) {
  const messages = {
    create_listing: {
      name: "Product ka name kya rakhna hai? Kripya batayein.",
      sku: "Product ka SKU code kya hai? Kripya specify karein.",
      price: "Product ka price (INR me) kya hoga? Kripya batayein.",
      stock: "Initial stock quantity kitni rakhni hai?",
      platforms: "Kaunse platforms par list karna hai? (e.g. Amazon, Flipkart, Meesho)"
    },
    file_dispute: {
      order_id: "Dispute file karne ke liye order ID kya hai?",
      platform: "Dispute kis platform ke liye hai? (Amazon, Flipkart, ya Meesho)",
      discrepancy_amount: "Discrepancy amount kitna hai?",
      expected_fee: "Expected fee kitni honi chahiye thi?",
      actual_fee: "Actual fee kitni charge ki gayi hai?"
    },
    check_earnings: {
      period: "Aap kis period ki earnings dekhna chahte hain? (today, week, or month)"
    },
    reorder_stock: {
      sku: "Kis product SKU ka stock reorder karna hai?",
      quantity: "Reorder quantity kitni honi chahiye?"
    },
    update_price: {
      sku: "Kis product SKU ka price update karna hai?",
      platform: "Price kis platform par update karna hai? (Amazon, Flipkart, ya Meesho)",
      new_price: "Naya price kya rakhna hai?"
    }
  };
  return messages[name]?.[field] || `Kripya ${field} ki details specify karein.`;
}

// Ask Groq for clarification message in Hinglish
async function getClarificationMessage(name, field, invalidDetails = "") {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "") {
    return getClarificationFallback(name, field);
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are the Vyapar OS WhatsApp Assistant. The merchant wanted to perform an action, but a parameter was missing or invalid. Ask the merchant for this missing/correct info in a short, polite Hinglish sentence."
        },
        {
          role: "user",
          content: `Action: ${name}. Missing or invalid field: ${field}. Validation info: ${invalidDetails}. Please ask for it.`
        }
      ],
      temperature: 0.5,
      max_tokens: 100
    });
    return response.choices[0]?.message?.content || getClarificationFallback(name, field);
  } catch (err) {
    console.error("Groq Clarification Generation Error:", err);
    return getClarificationFallback(name, field);
  }
}

// Local mock pattern classifier for when GROQ_API_KEY is missing
function localMockClassifier(userMessage) {
  const query = userMessage.toLowerCase();
  
  if (query.includes("earning") || query.includes("kamaya")) {
    return {
      action: "check_earnings",
      params: { period: "week" },
      requiresConfirmation: false
    };
  }

  if (query.includes("price") || query.includes("daam") || query.includes("kimat")) {
    // Try to extract price and SKU, or use default mock values
    return {
      action: "update_price",
      params: { sku: "KURTI-S-BLU", platform: "Amazon", new_price: 499 },
      requiresConfirmation: true
    };
  }

  if (query.includes("dispute") || query.includes("refund") || query.includes("lafda")) {
    return {
      action: "file_dispute",
      params: { order_id: "OD-12345", platform: "Amazon", discrepancy_amount: 150, expected_fee: 100, actual_fee: 250 },
      requiresConfirmation: true
    };
  }

  if (query.includes("stock") || query.includes("quantity") || query.includes("maal")) {
    return {
      action: "reorder_stock",
      params: { sku: "KURTI-S-BLU", quantity: 50 },
      requiresConfirmation: true
    };
  }

  if (query.includes("create") || query.includes("listing") || query.includes("list")) {
    return {
      action: "create_listing",
      params: { name: "Silk Saree", sku: "SILK-SAR-GLD", price: 1299, stock: 20, platforms: ["Amazon", "Flipkart"] },
      requiresConfirmation: true
    };
  }

  return {
    action: "reply",
    message: "Haa ji, aapka message mil gaya. (Simulated response)"
  };
}

export async function classifyAndRoute(userMessage) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "") {
    return localMockClassifier(userMessage);
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are the Vyapar OS WhatsApp Assistant. You help Indian MSME merchants run their store over WhatsApp. Understand their intent and invoke the appropriate tool/function. If their query is just general conversation, respond in a short, polite Hinglish sentence."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      tools: tools,
      tool_choice: "auto",
      temperature: 0.3
    });

    const choice = response.choices[0];
    const message = choice?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const toolName = toolCall.function.name;
      let args;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (parseError) {
        console.error(`Failed to parse tool arguments: ${toolCall.function.arguments}`, parseError);
        return {
          action: "clarify",
          message: "Aapke message ki details sahi nahi hain. Kripya naye sirey se details bhejein."
        };
      }

      // Validate the arguments
      const validation = validateArguments(toolName, args);
      if (!validation.valid) {
        const clarifyMsg = await getClarificationMessage(toolName, validation.field, validation.error);
        return {
          action: "clarify",
          message: clarifyMsg
        };
      }

      // Check if it's read-only or mutative
      const mutativeActions = ["create_listing", "file_dispute", "reorder_stock", "update_price"];
      const requiresConfirmation = mutativeActions.includes(toolName);

      return {
        action: toolName,
        params: args,
        requiresConfirmation
      };
    } else {
      // Just normal conversational reply
      return {
        action: "reply",
        message: message?.content || "Haa ji, main aapki sahayata kar sakta hoon."
      };
    }
  } catch (err) {
    console.error("Groq classifyAndRoute Error:", err);
    // Fallback to local mock parser if Groq API throws an error
    return localMockClassifier(userMessage);
  }
}
