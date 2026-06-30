// src/lib/vyapar-os/constants.ts
export const palette = {
  bg: "#0d0d0d",
  surface: "#161616",
  card: "#1e1e1e",
  border: "#2a2a2a",
  borderHover: "#3a3a3a",
  accent: "#22c55e",
  accentDim: "#16a34a",
  accentPale: "#052e16",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  textPri: "#f5f5f5",
  textSec: "#a3a3a3",
  textMut: "#525252",
  amz: "#ff9900",
  flipkart: "#F37521",
  meesho: "#9B5CF5",
};

export const navItems = [
  { section: "Home", label: "Home", icon: "🏠" },
  { section: "Orders", label: "Orders", icon: "📦" },
  { section: "Products", label: "Products", icon: "🏷️" },
  { section: "Customers", label: "Customers", icon: "👥" },
  { section: "Analytics", label: "Analytics", icon: "📊" },
  { section: "Discounts", label: "Discounts", icon: "💸" },
  { section: "Emails", label: "WhatsApp & Emails", icon: "💬" },
  { section: "ABTesting", label: "A/B Testing", icon: "🧪" },
  { section: "Integrations", label: "Integrations", icon: "🔌" },
];

export const platforms = [
  { name: "Amazon", color: "var(--amz)" },
  { name: "Flipkart", color: "var(--flipkart)" },
  { name: "Meesho", color: "var(--meesho)" },
];

export const initMessages = [
  { from: "ai", text: "👋 Hello! I checked today's RTO orders and found 3 high-risk orders. Would you like to hold shipment?" },
  { from: "ai", text: "📈 2 items are low in stock. Would you like to send a stock reorder request?" },
  { from: "ai", text: "💳 1 payment failed today. Would you like to retry?" },
];

export const sampleEvents = [
  { type: "order", platform: "Amazon", text: "New Order #12345", timeAgo: "2m" },
  { type: "rto", platform: "Flipkart", text: "RTO Order #54321", timeAgo: "5m" },
  { type: "payment", platform: "Meesho", text: "Payment Successful #9876", timeAgo: "10m" },
  { type: "stock", platform: "Amazon", text: "Low Stock: Product A", timeAgo: "15m" },
];
