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
  { section: "AI", label: "AI", icon: "🤖" },
  { section: "Store", label: "Store", icon: "🏬" },
  { section: "Finance", label: "Finance", icon: "💰" },
  { section: "Grow", label: "Grow", icon: "📈" },
];

export const platforms = [
  { name: "Amazon", color: "var(--amz)" },
  { name: "Flipkart", color: "var(--flipkart)" },
  { name: "Meesho", color: "var(--meesho)" },
];

export const initMessages = [
  { from: "ai", text: "👋 नमस्ते! मैंने आज के RTO ऑर्डर्स की जाँच की और 3 जोखिम भरे ऑर्डर्स पाए हैं। आप इनको रिटर्न या रिफंड कर देना चाहते हैं?" },
  { from: "ai", text: "📈 स्टॉक्स में 2 आइटम कम हैं। क्या आप स्टॉक रीक्वेस्ट भेजना चाहते हैं?" },
  { from: "ai", text: "💳 आज के पेमेंट्स में 1 भुगतान विफल हुआ है। इसे रीट्राई करें?" },
];

export const sampleEvents = [
  { type: "order", platform: "Amazon", text: "नया ऑर्डर #12345", timeAgo: "2m" },
  { type: "rto", platform: "Flipkart", text: "RTO ऑर्डर #54321", timeAgo: "5m" },
  { type: "payment", platform: "Meesho", text: "पेमेंट सफल #9876", timeAgo: "10m" },
  { type: "stock", platform: "Amazon", text: "स्टॉक कम: प्रोडक्ट A", timeAgo: "15m" },
];
