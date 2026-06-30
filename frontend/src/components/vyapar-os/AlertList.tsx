// src/components/vyapar-os/AlertList.tsx
import React from "react";

interface AlertItem {
  id: number;
  type: "rto" | "stock" | "price" | string;
  message: string;
  ctaText: string;
}

export const AlertList: React.FC = () => {
  const alerts: AlertItem[] = [
    {
      id: 1,
      type: "rto",
      message: "High RTO Risk: Order #1294 on Amazon has a high likelihood of return. Stop shipment?",
      ctaText: "Stop Shipment",
    },
    {
      id: 2,
      type: "stock",
      message: "Stock Warning: Only 2 units of 'Premium Silk Saree' left. Reorder immediately.",
      ctaText: "Reorder Now",
    },
    {
      id: 3,
      type: "price",
      message: "Price Parity Alert: Your price on Meesho is ₹40 higher than Flipkart. Correct parity.",
      ctaText: "Correct Parity",
    },
  ];

  const getSemanticStyles = (type: string) => {
    switch (type) {
      case "rto":
        return {
          bg: "#1c0a0a",
          border: "#7f1d1d",
        };
      case "stock":
        return {
          bg: "#1c1400",
          border: "#78350f",
        };
      case "price":
      default:
        return {
          bg: "#0a0d17",
          border: "#1e3a5f",
        };
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "rto":
        return "🚨";
      case "stock":
        return "📦";
      case "price":
      default:
        return "🏷️";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "16px",
      }}
    >
      {alerts.map((alert) => {
        const colors = getSemanticStyles(alert.type);
        return (
          <div
            key={alert.id}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px",
            }}
          >
            {/* Semantic Icon block */}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              {getIcon(alert.type)}
            </div>

            {/* Content text */}
            <div style={{ flex: 1, fontSize: "11px", color: "var(--text-pri)" }}>
              {alert.message}
            </div>

            {/* Action CTA */}
            <button
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px 8px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              {alert.ctaText} <span style={{ fontSize: "9px" }}>→</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
